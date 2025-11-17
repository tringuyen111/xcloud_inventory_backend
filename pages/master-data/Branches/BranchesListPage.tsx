

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

// Type for the data returned by v_branches_list view / get_branches_list RPC
type BranchViewData = {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
  organization_name: string;
  address: string | null;
  created_at: string;
  created_by_name: string | null;
};

// Type for organization data for filter dropdown
type OrganizationFilterData = {
    id: number;
    name: string;
};

const BranchesListPage: React.FC = () => {
    const navigate = useNavigate();
    const { notification } = App.useApp();
    const [form] = Form.useForm();

    const [branches, setBranches] = useState<BranchViewData[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
    const [sorter, setSorter] = useState<SorterResult<BranchViewData> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const [advancedFilters, setAdvancedFilters] = useState<any>({});
    const [filterPopoverVisible, setFilterPopoverVisible] = useState(false);
    const [columnPopoverVisible, setColumnPopoverVisible] = useState(false);
    const [organizations, setOrganizations] = useState<OrganizationFilterData[]>([]);

    const defaultColumns = ['code', 'name', 'is_active', 'organization_name', 'created_at', 'created_by_name', 'actions'];
    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns);

    // Fetch organizations for the filter dropdown
    useEffect(() => {
        const fetchOrganizations = async () => {
            const { data, error } = await supabase.from('organizations').select('id, name').order('name');
            if (error) {
                notification.error({ message: 'Error fetching organizations', description: error.message });
            } else {
                setOrganizations(data);
            }
        };
        fetchOrganizations();
    }, [notification]);

    const fetchBranches = useCallback(async () => {
        setLoading(true);
        try {
            const { current, pageSize } = pagination;
            const params = {
                p_page_number: current,
                p_page_size: pageSize,
                p_search_text: debouncedSearchTerm || null,
                p_sort_by: sorter?.field as string || 'created_at',
                p_sort_order: sorter?.order === 'ascend' ? 'asc' : 'desc',
                p_organization_id: advancedFilters.organization_id,
                p_status: advancedFilters.status,
            };

            const { data, error } = await supabase.rpc('get_branches_list', params);

            if (error) throw error;
            
            // RPC is expected to return a single object with data and total_count properties
            const result = data as { data: BranchViewData[], total_count: number };
            setBranches(result.data || []);
            setTotalCount(result.total_count || 0);

        } catch (error: any) {
            notification.error({
                message: 'Error fetching branches',
                description: `RPC Error: ${error.message}. Ensure the 'get_branches_list' function exists and accepts all required parameters, including advanced filters.`,
            });
        } finally {
            setLoading(false);
        }
    }, [pagination, sorter, debouncedSearchTerm, advancedFilters, notification]);

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    const handleTableChange = (
        pagination: TablePaginationConfig, 
        filters: any, 
        sorter: SorterResult<BranchViewData> | SorterResult<BranchViewData>[]
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
        { title: 'Mã Chi nhánh', dataIndex: 'code', key: 'code', sorter: true },
        { 
          title: 'Tên Chi nhánh',
          dataIndex: 'name',
          key: 'name',
          sorter: true,
          render: (text: string, record: BranchViewData) => <Link to={`/master-data/branches/${record.id}`}>{text}</Link>
        },
        { title: 'Trạng thái', dataIndex: 'is_active', key: 'is_active', sorter: false, render: (isActive: boolean) => <StatusTag status={isActive} /> },
        { title: 'Tổ chức', dataIndex: 'organization_name', key: 'organization_name', sorter: true },
        { title: 'Địa chỉ', dataIndex: 'address', key: 'address' },
        { title: 'Ngày tạo', dataIndex: 'created_at', key: 'created_at', sorter: true, render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY') : '-' },
        { title: 'Người tạo', dataIndex: 'created_by_name', key: 'created_by_name' },
        {
            title: 'Hành động',
            key: 'actions',
            align: 'center' as const,
            fixed: 'right' as const,
            width: 100,
            render: (_: any, record: BranchViewData) => (
                <Space size="small">
                     <Tooltip title="Xem chi tiết">
                        <button className="table-action-button" onClick={() => navigate(`/master-data/branches/${record.id}`)}>
                            <EyeOutlined />
                        </button>
                    </Tooltip>
                    <Can module="masterData" action="edit">
                        <Tooltip title="Chỉnh sửa">
                            <button className="table-action-button" onClick={() => navigate(`/master-data/branches/${record.id}/edit`)}>
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
                <Form.Item name="organization_id" label="Tổ chức">
                    <Select
                        showSearch
                        placeholder="Chọn tổ chức"
                        optionFilterProp="children"
                        filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                        options={organizations.map(org => ({ value: org.id, label: org.name }))}
                        allowClear
                    />
                </Form.Item>
                <Form.Item name="status" label="Trạng thái">
                    <Select placeholder="Chọn trạng thái" allowClear>
                        <Select.Option value={true}>Active</Select.Option>
                        <Select.Option value={false}>Inactive</Select.Option>
                    </Select>
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
                <Typography.Title level={4} style={{ margin: 0 }}>Branches</Typography.Title>
                <Can module="masterData" action="create">
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/master-data/branches/create')} style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}>
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
                    dataSource={branches}
                    loading={loading}
                    pagination={false}
                    onChange={handleTableChange}
                    scroll={{ x: 'max-content' }}
                    className="custom-scrollbar"
                    onRow={(record) => ({
                        onDoubleClick: () => {
                            navigate(`/master-data/branches/${record.id}`);
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

const BranchesListPageWrapper: React.FC = () => (
    <App>
        <BranchesListPage />
    </App>
);

export default BranchesListPageWrapper;