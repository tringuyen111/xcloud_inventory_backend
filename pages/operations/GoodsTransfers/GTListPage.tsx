

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
import { TablePaginationConfig } from 'antd/lib/table';
import { SorterResult } from 'antd/lib/table/interface';
import { Database } from '../../../types/supabase';

const { RangePicker } = DatePicker;

// --- Types ---
type GoodsTransferViewData = {
  id: number;
  code: string;
  status: Database['public']['Enums']['doc_status_enum'];
  from_warehouse_name: string;
  to_warehouse_name: string;
  expected_date: string;
  transferred_date: string | null;
  created_at: string;
  created_by_name: string | null;
  updated_at: string;
  updated_by_name: string | null;
};

type FilterData = {
    id: number;
    name: string;
};

const DOC_STATUSES: Database['public']['Enums']['doc_status_enum'][] = ['DRAFT', 'CREATED', 'IN_PROGRESS', 'WAITING_APPROVAL', 'APPROVED', 'COMPLETED', 'CANCELLED'];

// --- Shared Components ---
const statusTag = (status: Database['public']['Enums']['doc_status_enum']) => {
    const colorMap: Record<Database['public']['Enums']['doc_status_enum'], string> = {
        DRAFT: 'default',
        CREATED: 'cyan',
        IN_PROGRESS: 'processing',
        WAITING_APPROVAL: 'warning',
        APPROVED: 'purple',
        COMPLETED: 'success',
        CANCELLED: 'error',
    };
    return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
};

// --- Main Page Component ---
const GTListPage: React.FC = () => {
    const navigate = useNavigate();
    const { notification } = App.useApp();
    const [form] = Form.useForm();

    const [goodsTransfers, setGoodsTransfers] = useState<GoodsTransferViewData[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
    const [sorter, setSorter] = useState<SorterResult<GoodsTransferViewData> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const [advancedFilters, setAdvancedFilters] = useState<any>({});
    const [filterPopoverVisible, setFilterPopoverVisible] = useState(false);
    const [columnPopoverVisible, setColumnPopoverVisible] = useState(false);
    
    const [warehouses, setWarehouses] = useState<FilterData[]>([]);

    const defaultColumns = ['code', 'status', 'from_warehouse_name', 'to_warehouse_name', 'expected_date', 'created_at', 'actions'];
    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns);

    // Fetch data for filters
    useEffect(() => {
        const fetchFilterData = async () => {
            const { data, error } = await supabase.from('warehouses').select('id, name').order('name');
            if (error) notification.error({ message: 'Lỗi tải danh sách kho', description: error.message });
            else setWarehouses(data);
        };
        fetchFilterData();
    }, [notification]);

    const fetchGoodsTransfers = useCallback(async () => {
        setLoading(true);
        try {
            const { current, pageSize } = pagination;
            const params = {
                p_page_number: current,
                p_page_size: pageSize,
                p_search_text: debouncedSearchTerm || null,
                p_sort_by: sorter?.field as string || 'created_at',
                p_sort_order: sorter?.order === 'ascend' ? 'asc' : 'desc',
                p_from_warehouse_id: advancedFilters.from_warehouse_id,
                p_to_warehouse_id: advancedFilters.to_warehouse_id,
                p_status: advancedFilters.status,
                p_date_range: advancedFilters.expected_date_range ? { 
                    start: dayjs(advancedFilters.expected_date_range[0]).startOf('day').toISOString(), 
                    end: dayjs(advancedFilters.expected_date_range[1]).endOf('day').toISOString()
                } : null,
            };

            const { data, error } = await supabase.rpc('get_goods_transfers_list', params);

            if (error) throw error;
            
            const result = data as { data: GoodsTransferViewData[], total_count: number };
            setGoodsTransfers(result.data || []);
            setTotalCount(result.total_count || 0);

        } catch (error: any) {
            notification.error({
                message: 'Lỗi tải danh sách phiếu chuyển',
                description: `RPC Error: ${error.message}.`,
            });
        } finally {
            setLoading(false);
        }
    }, [pagination, sorter, debouncedSearchTerm, advancedFilters, notification]);

    useEffect(() => {
        fetchGoodsTransfers();
    }, [fetchGoodsTransfers]);

    const handleTableChange = (
        newPagination: TablePaginationConfig, 
        filters: any, 
        newSorter: SorterResult<GoodsTransferViewData> | SorterResult<GoodsTransferViewData>[]
    ) => {
        setPagination(prev => ({ ...prev, current: newPagination.current || 1 }));
        const currentSorter = Array.isArray(newSorter) ? newSorter[0] : newSorter;
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
            title: 'Mã Phiếu chuyển',
            dataIndex: 'code',
            key: 'code',
            sorter: true,
            render: (text: string, record: GoodsTransferViewData) => <Link to={`/operations/gt/${record.id}`}>{text}</Link>
        },
        { title: 'Trạng thái', dataIndex: 'status', key: 'status', sorter: true, render: statusTag },
        { title: 'Kho đi', dataIndex: 'from_warehouse_name', key: 'from_warehouse_name', sorter: true },
        { title: 'Kho đến', dataIndex: 'to_warehouse_name', key: 'to_warehouse_name', sorter: true },
        { title: 'Ngày dự kiến', dataIndex: 'expected_date', key: 'expected_date', sorter: true, render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY') : '-' },
        { title: 'Ngày chuyển', dataIndex: 'transferred_date', key: 'transferred_date', sorter: true, render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY') : '-' },
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
            render: (_: any, record: GoodsTransferViewData) => (
                <Space size="small">
                    <Tooltip title="Xem chi tiết">
                        <button className="table-action-button" onClick={() => navigate(`/operations/gt/${record.id}`)}>
                            <EyeOutlined />
                        </button>
                    </Tooltip>
                    {record.status === 'DRAFT' && (
                        <Can module="operations" action="execute">
                            <Tooltip title="Chỉnh sửa">
                                <button className="table-action-button" onClick={() => navigate(`/operations/gt/${record.id}/edit`)}>
                                    <EditOutlined />
                                </button>
                            </Tooltip>
                        </Can>
                    )}
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
                <Form.Item name="from_warehouse_id" label="Kho đi">
                    <Select
                        showSearch placeholder="Chọn kho đi" optionFilterProp="children"
                        filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                        options={warehouses.map(wh => ({ value: wh.id, label: wh.name }))} allowClear
                    />
                </Form.Item>
                 <Form.Item name="to_warehouse_id" label="Kho đến">
                    <Select
                        showSearch placeholder="Chọn kho đến" optionFilterProp="children"
                        filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                        options={warehouses.map(wh => ({ value: wh.id, label: wh.name }))} allowClear
                    />
                </Form.Item>
                <Form.Item name="status" label="Trạng thái">
                    <Select placeholder="Chọn trạng thái" mode="multiple" allowClear>
                        {DOC_STATUSES.map(status => <Select.Option key={status} value={status}>{status}</Select.Option>)}
                    </Select>
                </Form.Item>
                <Form.Item name="expected_date_range" label="Khoảng ngày dự kiến">
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
                <Typography.Title level={4} style={{ margin: 0 }}>Danh sách Phiếu chuyển</Typography.Title>
                <Can module="operations" action="create">
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/operations/gt/create')} style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}>
                        Tạo Mới
                    </Button>
                </Can>
            </div>
            <div className="flex justify-between items-center mb-4">
                <Space>
                    <Popover content={columnToggler} trigger="click" placement="bottomLeft" visible={columnPopoverVisible} onVisibleChange={setColumnPopoverVisible}>
                        <Button icon={<SettingOutlined />} aria-label="Tùy chỉnh cột" />
                    </Popover>
                    <Popover content={advancedFilterForm} trigger="click" placement="bottomLeft" visible={filterPopoverVisible} onVisibleChange={setFilterPopoverVisible}>
                        <Button icon={<FilterOutlined />} aria-label="Bộ lọc nâng cao" />
                    </Popover>
                    <Input
                        placeholder="Tìm kiếm theo Mã phiếu, Kho đi/đến..."
                        prefix={<SearchOutlined />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: 300 }}
                        allowClear
                    />
                </Space>
            </div>

            <div className="modern-table-container">
                <Table
                    rowKey="id"
                    columns={allColumns.filter(c => visibleColumns.includes(c.key as string))}
                    dataSource={goodsTransfers}
                    loading={loading}
                    pagination={false}
                    onChange={handleTableChange}
                    scroll={{ x: 'max-content' }}
                    className="custom-scrollbar"
                    onRow={(record) => ({
                        onDoubleClick: () => {
                            navigate(`/operations/gt/${record.id}`);
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

const GTListPageWrapper: React.FC = () => (
    <App>
        <GTListPage />
    </App>
);

export default GTListPageWrapper;