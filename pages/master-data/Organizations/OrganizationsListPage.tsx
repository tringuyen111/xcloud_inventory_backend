

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
    EyeOutlined,
    FilterOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import { supabase } from '../../../lib/supabase';
import { useDebounce } from '../../../hooks/useDebounce';
import Can from '../../../components/auth/Can';
import dayjs from 'dayjs';
import StatusTag from '../../../components/shared/StatusTag';
import { TablePaginationConfig } from 'antd/lib/table';
import { SorterResult } from 'antd/lib/table/interface';

const { RangePicker } = DatePicker;

// Type for the data returned by v_organizations_list view / get_organizations_list RPC
type OrganizationViewData = {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
  branch_count: number;
  notes: string | null;
  created_at: string;
  created_by_name: string | null;
  updated_at: string;
  updated_by_name: string | null;
};

// Type for user data for filter dropdown
type UserFilterData = {
    id: string;
    full_name: string;
};

const OrganizationsListPage: React.FC = () => {
    const navigate = useNavigate();
    const { notification } = App.useApp();
    const [form] = Form.useForm();

    const [organizations, setOrganizations] = useState<OrganizationViewData[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
    const [sorter, setSorter] = useState<SorterResult<OrganizationViewData> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const [advancedFilters, setAdvancedFilters] = useState<any>({});
    const [filterPopoverVisible, setFilterPopoverVisible] = useState(false);
    const [columnPopoverVisible, setColumnPopoverVisible] = useState(false);
    const [users, setUsers] = useState<UserFilterData[]>([]);

    const defaultColumns = ['code', 'name', 'is_active', 'created_at', 'created_by_name', 'actions'];
    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns);

    // Fetch users for the filter dropdown
    useEffect(() => {
        const fetchUsers = async () => {
            const { data, error } = await supabase.from('users').select('id, full_name').order('full_name');
            if (error) {
                notification.error({ message: 'Error fetching users', description: error.message });
            } else {
                setUsers(data);
            }
        };
        fetchUsers();
    }, [notification]);

    const fetchOrganizations = useCallback(async () => {
        setLoading(true);
        try {
            const { current, pageSize } = pagination;
            const params = {
                p_page_number: current,
                p_page_size: pageSize,
                p_search_text: debouncedSearchTerm || null,
                p_sort_by: sorter?.field as string || 'created_at',
                p_sort_order: sorter?.order === 'ascend' ? 'asc' : 'desc',
                p_status: advancedFilters.status,
                p_created_by: advancedFilters.created_by,
                p_date_range: advancedFilters.date_range ? { 
                    start: dayjs(advancedFilters.date_range[0]).startOf('day').toISOString(), 
                    end: dayjs(advancedFilters.date_range[1]).endOf('day').toISOString()
                } : null,
            };

            const { data, error } = await supabase.rpc('get_organizations_list', params);

            if (error) throw error;
            
            // RPC is expected to return a single object with data and total_count properties
            const result = data as { data: OrganizationViewData[], total_count: number };
            setOrganizations(result.data || []);
            setTotalCount(result.total_count || 0);

        } catch (error: any) {
            notification.error({
                message: 'Error fetching organizations',
                description: `RPC Error: ${error.message}. Ensure the 'get_organizations_list' function exists and accepts all required parameters, including advanced filters.`,
            });
        } finally {
            setLoading(false);
        }
    }, [pagination, sorter, debouncedSearchTerm, advancedFilters, notification]);

    useEffect(() => {
        fetchOrganizations();
    }, [fetchOrganizations]);

    const handleTableChange = (
        pagination: TablePaginationConfig, 
        filters: any, 
        sorter: SorterResult<OrganizationViewData> | SorterResult<OrganizationViewData>[]
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
        { title: 'Mã', dataIndex: 'code', key: 'code', sorter: true },
        { 
          title: 'Tên Organization',
          dataIndex: 'name',
          key: 'name',
          sorter: true,
          render: (text: string, record: OrganizationViewData) => <Link to={`/master-data/organizations/${record.id}`}>{text}</Link>
        },
        { title: 'Trạng thái', dataIndex: 'is_active', key: 'is_active', sorter: true, render: (isActive: boolean) => <StatusTag status={isActive} /> },
        { title: 'Số chi nhánh', dataIndex: 'branch_count', key: 'branch_count', render: (count: number) => <Tag>{count}</Tag> },
        { title: 'Ghi chú', dataIndex: 'notes', key: 'notes' },
        { title: 'Ngày tạo', dataIndex: 'created_at', key: 'created_at', sorter: true, render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY') : '-' },
        { title: 'Người tạo', dataIndex: 'created_by_name', key: 'created_by_name' },
        { title: 'Ngày cập nhật', dataIndex: 'updated_at', key: 'updated_at', sorter: true, render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY HH:mm') : '-' },
        { title: 'Người cập nhật', dataIndex: 'updated_by_name', key: 'updated_by_name' },
        {
            title: 'Hành động',
            key: 'actions',
            align: 'center' as const,
            fixed: 'right' as const,
            width: 100,
            render: (_: any, record: OrganizationViewData) => (
                <Space size="small">
                     <Tooltip title="Xem chi tiết">
                        <button className="table-action-button" onClick={() => navigate(`/master-data/organizations/${record.id}`)}>
                            <EyeOutlined />
                        </button>
                    </Tooltip>
                    <Can module="masterData" action="edit">
                        <Tooltip title="Chỉnh sửa">
                            <button className="table-action-button" onClick={() => navigate(`/master-data/organizations/${record.id}/edit`)}>
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
                <Form.Item name="status" label="Trạng thái">
                    <Select placeholder="Chọn trạng thái" allowClear>
                        <Select.Option value={true}>Active</Select.Option>
                        <Select.Option value={false}>Inactive</Select.Option>
                    </Select>
                </Form.Item>
                <Form.Item name="created_by" label="Người tạo">
                    <Select
                        showSearch
                        placeholder="Chọn người tạo"
                        optionFilterProp="children"
                        filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                        options={users.map(user => ({ value: user.id, label: user.full_name }))}
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
                <Typography.Title level={4} style={{ margin: 0 }}>Organizations</Typography.Title>
                <Can module="masterData" action="create">
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/master-data/organizations/create')} style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}>
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
                    dataSource={organizations}
                    loading={loading}
                    pagination={false}
                    onChange={handleTableChange}
                    scroll={{ x: 'max-content' }}
                    className="custom-scrollbar"
                    onRow={(record) => ({
                        onDoubleClick: () => {
                            navigate(`/master-data/organizations/${record.id}`);
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
    );
};

const OrganizationsListPageWrapper: React.FC = () => (
    <App>
        <OrganizationsListPage />
    </App>
);

export default OrganizationsListPageWrapper;