

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
} from 'antd';
import {
    PlusOutlined,
    SearchOutlined,
    EditOutlined,
    FilterOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import { supabase } from '../../lib/supabase';
import { useDebounce } from '../../hooks/useDebounce';
import Can from '../../components/auth/Can';
import dayjs from 'dayjs';
import StatusTag from '../../components/shared/StatusTag';
import { TablePaginationConfig } from 'antd/lib/table';
import { SorterResult } from 'antd/lib/table/interface';

const { RangePicker } = DatePicker;

// Type for the data from the 'v_users_list' view
type UserViewData = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  role_names: string[] | string | null;
  created_at: string;
  created_by_name: string | null;
  updated_at: string;
  updated_by_name: string | null;
};

type RoleFilterData = {
    id: number;
    name: string;
};

const UserListPage: React.FC = () => {
    const navigate = useNavigate();
    const { notification } = App.useApp();
    const [form] = Form.useForm();

    const [users, setUsers] = useState<UserViewData[]>([]);
    const [roles, setRoles] = useState<RoleFilterData[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
    const [sorter, setSorter] = useState<SorterResult<UserViewData> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const [advancedFilters, setAdvancedFilters] = useState<any>({});
    const [filterPopoverVisible, setFilterPopoverVisible] = useState(false);
    const [columnPopoverVisible, setColumnPopoverVisible] = useState(false);

    const defaultColumns = ['full_name', 'email', 'role_names', 'is_active', 'created_at', 'actions'];
    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns);

    // Fetch roles for the filter dropdown
    useEffect(() => {
        const fetchRoles = async () => {
            const { data, error } = await supabase.from('roles').select('id, name').order('name');
            if (error) {
                notification.error({ message: 'Error fetching roles for filter', description: error.message });
            } else {
                setRoles(data);
            }
        };
        fetchRoles();
    }, [notification]);

    const fetchUsers = useCallback(async () => {
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
                p_role_id: advancedFilters.role_id,
                p_date_range: advancedFilters.date_range ? { 
                    start: dayjs(advancedFilters.date_range[0]).startOf('day').toISOString(), 
                    end: dayjs(advancedFilters.date_range[1]).endOf('day').toISOString()
                } : null,
            };

            const { data, error } = await supabase.rpc('get_users_list', params);

            if (error) throw error;
            
            const result = data as { data: UserViewData[], total_count: number };
            setUsers(result.data || []);
            setTotalCount(result.total_count || 0);

        } catch (error: any) {
            notification.error({
                message: 'Error fetching users',
                description: `RPC Error: ${error.message}.`,
            });
        } finally {
            setLoading(false);
        }
    }, [pagination, sorter, debouncedSearchTerm, advancedFilters, notification]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleTableChange = (
        pagination: TablePaginationConfig, 
        filters: any, 
        sorter: SorterResult<UserViewData> | SorterResult<UserViewData>[]
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
        form.resetFields();
        setAdvancedFilters({});
        setFilterPopoverVisible(false);
    };

    const allColumns = useMemo(() => [
        { 
          title: 'Tên đầy đủ',
          dataIndex: 'full_name',
          key: 'full_name',
          sorter: true,
          render: (text: string, record: UserViewData) => <Link to={`/settings/users/${record.id}/edit`}>{text}</Link>
        },
        { title: 'Email', dataIndex: 'email', key: 'email', sorter: true },
        { title: 'Số điện thoại', dataIndex: 'phone', key: 'phone', render: (text: string | null) => text || 'N/A' },
        { 
            title: 'Vai trò', 
            dataIndex: 'role_names', 
            key: 'role_names',
            render: (roles: string[] | string | null) => {
                // Ensure roles is an array of non-empty strings before mapping
                const rolesArray = Array.isArray(roles)
                    ? roles
                    : typeof roles === 'string' && roles.length > 0
                    ? roles.split(',').map(r => r.trim()).filter(Boolean)
                    : [];

                if (rolesArray.length === 0) {
                    return null; // Don't render anything if there are no roles
                }
                
                return (
                    <Space wrap size={[0, 8]}>
                        {rolesArray.map(role => <Tag color="blue" key={role}>{role}</Tag>)}
                    </Space>
                )
            }
        },
        { title: 'Trạng thái', dataIndex: 'is_active', key: 'is_active', sorter: true, render: (isActive: boolean) => <StatusTag status={isActive} /> },
        { title: 'Ngày tạo', dataIndex: 'created_at', key: 'created_at', sorter: true, render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY') : '-' },
        { title: 'Người tạo', dataIndex: 'created_by_name', key: 'created_by_name', render: (text: string | null) => text || 'N/A' },
        { title: 'Ngày cập nhật', dataIndex: 'updated_at', key: 'updated_at', sorter: true, render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY HH:mm') : '-' },
        { title: 'Người cập nhật', dataIndex: 'updated_by_name', key: 'updated_by_name', render: (text: string | null) => text || 'N/A' },
        {
            title: 'Hành động',
            key: 'actions',
            align: 'center' as const,
            fixed: 'right' as const,
            width: 100,
            render: (_: any, record: UserViewData) => (
                <Space size="small">
                     <Can module="settings" action="manageUsers">
                        <Tooltip title="Chỉnh sửa & Gán vai trò">
                            <button className="table-action-button" onClick={() => navigate(`/settings/users/${record.id}/edit`)}>
                                <EditOutlined />
                            </button>
                        </Tooltip>
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
            <Form form={form} layout="vertical" onFinish={handleFilterFinish}>
                <Form.Item name="is_active" label="Trạng thái">
                    <Select placeholder="Chọn trạng thái" allowClear>
                        <Select.Option value={true}>Active</Select.Option>
                        <Select.Option value={false}>Inactive</Select.Option>
                    </Select>
                </Form.Item>
                <Form.Item name="role_id" label="Vai trò">
                    <Select
                        showSearch
                        placeholder="Chọn vai trò"
                        optionFilterProp="children"
                        filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                        options={roles.map(role => ({ value: role.id, label: role.name }))}
                        allowClear
                    />
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
        <Card>
            <div className="flex justify-between items-center mb-6">
                <Typography.Title level={4} style={{ margin: 0 }}>User Management</Typography.Title>
                <Can module="settings" action="manageUsers">
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/settings/users/create')} style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}>
                        Thêm mới Người dùng
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
                        placeholder="Tìm kiếm theo Tên, Email, SĐT..."
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
                    dataSource={users}
                    loading={loading}
                    pagination={false}
                    onChange={handleTableChange}
                    scroll={{ x: 'max-content' }}
                    className="custom-scrollbar"
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
    );
};

const UserListPageWrapper: React.FC = () => (
    <App>
        <UserListPage />
    </App>
);

export default UserListPageWrapper;