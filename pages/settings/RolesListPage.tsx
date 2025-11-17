

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    App,
    Button,
    Card,
    Input,
    Table,
    Space,
    Typography,
    Pagination,
    Tooltip,
    Popover,
    Checkbox,
    Form,
    Select,
    DatePicker,
    Tag,
    Modal,
} from 'antd';
import {
    PlusOutlined,
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    FilterOutlined,
    SettingOutlined,
    ExclamationCircleFilled,
} from '@ant-design/icons';
import { supabase } from '../../lib/supabase';
import { useDebounce } from '../../hooks/useDebounce';
import Can from '../../components/auth/Can';
import dayjs from 'dayjs';
import StatusTag from '../../components/shared/StatusTag';
import { TablePaginationConfig } from 'antd/lib/table';
import { SorterResult } from 'antd/lib/table/interface';

const { RangePicker } = DatePicker;
const { confirm } = Modal;

// Type for the data from the 'v_roles_list' view
type RoleViewData = {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
  is_system: boolean;
  user_count: number;
  description: string | null;
  created_at: string;
  created_by_name: string | null;
  updated_at: string;
  updated_by_name: string | null;
};

const RolesListPage: React.FC = () => {
    const navigate = useNavigate();
    const { notification } = App.useApp();
    const [filterForm] = Form.useForm();
    const [createForm] = Form.useForm();

    const [roles, setRoles] = useState<RoleViewData[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
    const [sorter, setSorter] = useState<SorterResult<RoleViewData> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const [advancedFilters, setAdvancedFilters] = useState<any>({});
    const [filterPopoverVisible, setFilterPopoverVisible] = useState(false);
    const [columnPopoverVisible, setColumnPopoverVisible] = useState(false);

    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [isSubmittingModal, setIsSubmittingModal] = useState(false);

    const defaultColumns = ['code', 'name', 'is_active', 'is_system', 'user_count', 'created_at', 'actions'];
    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns);

    const fetchRoles = useCallback(async () => {
        setLoading(true);
        try {
            const { current, pageSize } = pagination;
            const params = {
                p_page_number: current,
                p_page_size: pageSize,
                p_search_text: debouncedSearchTerm || null,
                p_sort_by: sorter?.field as string || 'created_at',
                p_sort_order: sorter?.order === 'ascend' ? 'asc' : 'desc',
                p_is_active: advancedFilters.is_active,
                p_is_system: advancedFilters.is_system,
                p_date_range: advancedFilters.date_range ? { 
                    start: dayjs(advancedFilters.date_range[0]).startOf('day').toISOString(), 
                    end: dayjs(advancedFilters.date_range[1]).endOf('day').toISOString()
                } : null,
            };

            const { data, error } = await supabase.rpc('get_roles_list', params);

            if (error) throw error;
            
            const result = data as { data: RoleViewData[], total_count: number };
            setRoles(result.data || []);
            setTotalCount(result.total_count || 0);

        } catch (error: any) {
            notification.error({
                message: 'Error fetching roles',
                description: `RPC Error: ${error.message}.`,
            });
        } finally {
            setLoading(false);
        }
    }, [pagination, sorter, debouncedSearchTerm, advancedFilters, notification]);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    const handleCreateModalCancel = () => {
        setIsCreateModalVisible(false);
        createForm.resetFields();
    };

    const handleCreateModalOk = async () => {
        try {
            const values = await createForm.validateFields();
            setIsSubmittingModal(true);
            const { error } = await supabase
                .from('roles')
                .insert({ 
                    code: values.code,
                    name: values.name, 
                    description: values.description,
                    is_active: true,
                    is_system: false,
                });
            
            if (error) {
                if (error.code === '23505') { 
                    throw new Error(`Role with code "${values.code}" already exists.`);
                }
                throw error;
            }
    
            notification.success({ message: 'Role created successfully' });
            handleCreateModalCancel();
            fetchRoles(); // Refresh data
        } catch (error: any) {
            notification.error({ message: 'Failed to create role', description: error.message });
        } finally {
            setIsSubmittingModal(false);
        }
    };

    const handleDelete = (role: RoleViewData) => {
        if (role.is_system) {
            notification.warning({ message: "Cannot delete a system role."});
            return;
        }
        if (role.user_count > 0) {
            notification.warning({ message: "Cannot delete role", description: `This role is currently assigned to ${role.user_count} user(s).`});
            return;
        }

        confirm({
            title: `Are you sure you want to delete the role "${role.name}"?`,
            icon: <ExclamationCircleFilled />,
            content: 'This action cannot be undone.',
            okText: 'Yes, delete it',
            okType: 'danger',
            cancelText: 'No',
            onOk: async () => {
                const { error } = await supabase.from('roles').delete().eq('id', role.id);
                if (error) {
                    notification.error({ message: 'Error deleting role', description: error.message });
                } else {
                    notification.success({ message: `Role "${role.name}" deleted successfully` });
                    fetchRoles(); // Refresh the list
                }
            },
        });
    };

    const handleTableChange = (
        pagination: TablePaginationConfig, 
        filters: any, 
        sorter: SorterResult<RoleViewData> | SorterResult<RoleViewData>[]
    ) => {
        setPagination(prev => ({ ...prev, current: pagination.current || 1 }));
        const currentSorter = Array.isArray(sorter) ? sorter[0] : sorter;
        setSorter(currentSorter.field && currentSorter.order ? currentSorter : null);
    };

    const handleFilterFinish = (values: any) => {
        setAdvancedFilters(values);
        setFilterPopoverVisible(false);
    };

    const handleFilterReset = () => {
        filterForm.resetFields();
        setAdvancedFilters({});
        setFilterPopoverVisible(false);
    };

    const allColumns = useMemo(() => [
        { title: 'Mã Vai trò', dataIndex: 'code', key: 'code', sorter: true },
        { title: 'Tên Vai trò', dataIndex: 'name', key: 'name', sorter: true },
        { title: 'Trạng thái', dataIndex: 'is_active', key: 'is_active', sorter: true, render: (isActive: boolean) => <StatusTag status={isActive} /> },
        { title: 'Là hệ thống', dataIndex: 'is_system', key: 'is_system', sorter: true, render: (isSystem: boolean) => <Tag color={isSystem ? 'red' : 'default'}>{isSystem ? 'Yes' : 'No'}</Tag> },
        { title: 'Số người dùng', dataIndex: 'user_count', key: 'user_count', sorter: true, render: (count: number) => <Tag>{count}</Tag> },
        { title: 'Mô tả', dataIndex: 'description', key: 'description' },
        { title: 'Ngày tạo', dataIndex: 'created_at', key: 'created_at', sorter: true, render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY') : '-' },
        { title: 'Người tạo', dataIndex: 'created_by_name', key: 'created_by_name', render: (text: string | null) => text || 'N/A' },
        { title: 'Ngày cập nhật', dataIndex: 'updated_at', key: 'updated_at', sorter: true, render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY HH:mm') : '-' },
        { title: 'Người cập nhật', dataIndex: 'updated_by_name', key: 'updated_by_name', render: (text: string | null) => text || 'N/A' },
        {
            title: 'Hành động',
            key: 'actions',
            align: 'center' as const,
            fixed: 'right' as const,
            width: 120,
            render: (_: any, record: RoleViewData) => (
                 <Space size="small">
                    <Can module="settings" action="manageUsers">
                        <>
                            <Tooltip title="Edit Details & Permissions">
                                <button className="table-action-button" onClick={() => navigate(`/settings/roles/${record.id}/permissions`)}>
                                    <EditOutlined />
                                </button>
                            </Tooltip>
                            {!record.is_system && (
                                <Tooltip title="Delete Role">
                                    <button className="table-action-button" onClick={() => handleDelete(record)}>
                                        <DeleteOutlined />
                                    </button>
                                </Tooltip>
                            )}
                        </>
                    </Can>
                </Space>
            ),
        },
    ], [navigate]);

    const columnToggler = (
        <div style={{ padding: 8, width: 200 }}>
            <Typography.Title level={5}>Tùy chỉnh cột</Typography.Title>
            <Checkbox.Group
                className="flex flex-col space-y-2"
                options={allColumns.filter(c => c.key !== 'actions').map(c => ({ label: c.title, value: c.key as string }))}
                value={visibleColumns}
                onChange={(checkedValues) => setVisibleColumns([...checkedValues, 'actions'])}
            />
        </div>
    );
    
    const advancedFilterForm = (
        <div style={{ padding: 16, width: 350 }}>
            <Typography.Title level={5}>Bộ lọc nâng cao</Typography.Title>
            <Form form={filterForm} layout="vertical" onFinish={handleFilterFinish}>
                <Form.Item name="is_active" label="Trạng thái">
                    <Select placeholder="Chọn trạng thái" allowClear>
                        <Select.Option value={true}>Active</Select.Option>
                        <Select.Option value={false}>Inactive</Select.Option>
                    </Select>
                </Form.Item>
                <Form.Item name="is_system" label="Là hệ thống">
                    <Select placeholder="Chọn loại" allowClear>
                        <Select.Option value={true}>Yes</Select.Option>
                        <Select.Option value={false}>No</Select.Option>
                    </Select>
                </Form.Item>
                 <Form.Item name="date_range" label="Khoảng ngày tạo">
                    <RangePicker style={{ width: '100%' }} />
                </Form.Item>
                <Space>
                    <Button onClick={handleFilterReset}>Đặt lại</Button>
                    <Button type="primary" htmlType="submit">Xác nhận</Button>
                </Space>
            </Form>
        </div>
    );

    return (
        <>
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <Typography.Title level={4} style={{ margin: 0 }}>Roles Management</Typography.Title>
                    <Can module="settings" action="manageUsers">
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalVisible(true)} style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}>
                            Tạo Mới
                        </Button>
                    </Can>
                </div>
                <div className="flex justify-between items-center mb-4">
                    <Space>
                        <Popover content={columnToggler} trigger="click" placement="bottomLeft" visible={columnPopoverVisible} onVisibleChange={setColumnPopoverVisible}>
                            <Button icon={<SettingOutlined />} />
                        </Popover>
                        <Popover content={advancedFilterForm} trigger="click" placement="bottomLeft" visible={filterPopoverVisible} onVisibleChange={setFilterPopoverVisible}>
                            <Button icon={<FilterOutlined />} />
                        </Popover>
                        <Input
                            placeholder="Tìm kiếm theo Mã, Tên..."
                            prefix={<SearchOutlined />}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: 250 }}
                            allowClear
                        />
                    </Space>
                </div>

                <div className="modern-table-container">
                    <Table
                        rowKey="id"
                        columns={allColumns.filter(c => visibleColumns.includes(c.key as string))}
                        dataSource={roles}
                        loading={loading}
                        pagination={false}
                        onChange={handleTableChange}
                        scroll={{ x: 'max-content' }}
                        className="custom-scrollbar"
                        onRow={(record) => ({
                            onDoubleClick: () => {
                                navigate(`/settings/roles/${record.id}/permissions`);
                            },
                        })}
                    />
                     <div className="table-footer">
                        <div>
                            {totalCount > 0 && <Typography.Text>Tổng: {totalCount}</Typography.Text>}
                        </div>
                        <Pagination
                            current={pagination.current}
                            pageSize={pagination.pageSize}
                            total={totalCount}
                            showSizeChanger
                            onChange={(page, pageSize) => setPagination({ current: page, pageSize })}
                            onShowSizeChange={(_, size) => setPagination({ current: 1, pageSize: size })}
                            pageSizeOptions={['10', '20', '50']}
                        />
                    </div>
                </div>
            </Card>

            {/* Create Modal */}
            <Modal
                title="Create New Role"
                visible={isCreateModalVisible}
                onCancel={handleCreateModalCancel}
                destroyOnClose
                footer={[
                    <Button key="back" onClick={handleCreateModalCancel}>Cancel</Button>,
                    <Button key="submit" type="primary" loading={isSubmittingModal} onClick={handleCreateModalOk}>Create</Button>,
                ]}
            >
                <Form form={createForm} layout="vertical" name="create_role_form" className="mt-6">
                    <Form.Item
                        name="code"
                        label="Role Code"
                        rules={[{ required: true, message: 'Please input a unique role code!' }]}
                    >
                        <Input placeholder="e.g., WAREHOUSE_VIEWER" />
                    </Form.Item>
                    <Form.Item
                        name="name"
                        label="Role Name"
                        rules={[{ required: true, message: 'Please input the role name!' }]}
                    >
                        <Input placeholder="e.g., Warehouse Viewer" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={3} placeholder="Describe the purpose of this role" />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

const RolesListPageWrapper: React.FC = () => (
    <App>
        <RolesListPage />
    </App>
);

export default RolesListPageWrapper;