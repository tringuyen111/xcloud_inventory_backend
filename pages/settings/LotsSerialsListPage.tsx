

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
    Tabs,
    Tag,
} from 'antd';
import {
    SearchOutlined,
    EyeOutlined,
    FilterOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import { supabase } from '../../lib/supabase';
import { useDebounce } from '../../hooks/useDebounce';
import dayjs from 'dayjs';
import { TablePaginationConfig } from 'antd/lib/table';
import { SorterResult } from 'antd/lib/table/interface';
import { Database } from '../../types/supabase';

const { RangePicker } = DatePicker;

// --- Types ---
type LotViewData = {
    id: number;
    lot_number: string;
    product_name: string;
    status: Database['public']['Enums']['serial_lot_status_enum'];
    current_quantity: number;
    expiry_date: string | null;
    manufacture_date: string | null;
    product_code: string;
    created_at: string;
};

type SerialViewData = {
    id: number;
    serial_number: string;
    product_name: string;
    lot_number: string | null;
    status: Database['public']['Enums']['serial_lot_status_enum'];
    expiry_date: string | null;
    manufacture_date: string | null;
    product_code: string;
    created_at: string;
};

type ProductFilterData = {
    id: number;
    name: string;
};

type TabKey = 'lots' | 'serials';

// --- Shared Components ---
const statusTag = (status: Database['public']['Enums']['serial_lot_status_enum']) => {
    const colorMap: Record<Database['public']['Enums']['serial_lot_status_enum'], string> = {
        AVAILABLE: 'green',
        IN_STOCK: 'blue',
        EMPTY: 'default',
        EXPIRED: 'red',
        LOST: 'gold',
        USED: 'geekblue',
        PARTIAL: 'cyan',
        IMPORTED: 'purple',
        CREATED: 'volcano',
    };
    return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
};

// FIX: Define a runtime array for the enum values, as the Supabase-generated type is not available at runtime.
const SERIAL_LOT_STATUSES: Database['public']['Enums']['serial_lot_status_enum'][] = [
    'CREATED',
    'IMPORTED',
    'AVAILABLE',
    'IN_STOCK',
    'PARTIAL',
    'EMPTY',
    'USED',
    'LOST',
    'EXPIRED',
];


// --- Main Page Component ---
const LotsSerialsListPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabKey>('lots');

    return (
        <Card>
            <Typography.Title level={4} style={{ margin: 0, marginBottom: 24 }}>Lots & Serials</Typography.Title>
            <Tabs defaultActiveKey="lots" onChange={(key) => setActiveTab(key as TabKey)}>
                <Tabs.TabPane tab="Quản lý Lô" key="lots">
                    <TabContent tabKey="lots" />
                </Tabs.TabPane>
                <Tabs.TabPane tab="Quản lý Serial" key="serials">
                    <TabContent tabKey="serials" />
                </Tabs.TabPane>
            </Tabs>
        </Card>
    );
};

// --- Tab Content Component (Handles Logic for each tab) ---
const TabContent: React.FC<{ tabKey: TabKey }> = ({ tabKey }) => {
    const navigate = useNavigate();
    const { notification } = App.useApp();
    const [form] = Form.useForm();

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
    const [sorter, setSorter] = useState<SorterResult<any> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const [advancedFilters, setAdvancedFilters] = useState<any>({});
    const [filterPopoverVisible, setFilterPopoverVisible] = useState(false);
    const [columnPopoverVisible, setColumnPopoverVisible] = useState(false);
    const [products, setProducts] = useState<ProductFilterData[]>([]);

    const isLotsTab = tabKey === 'lots';

    const defaultColumns = isLotsTab 
        ? ['lot_number', 'product_name', 'status', 'current_quantity', 'expiry_date', 'created_at', 'actions']
        : ['serial_number', 'product_name', 'lot_number', 'status', 'expiry_date', 'created_at', 'actions'];
    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns);

    // Fetch products for the filter dropdown
    useEffect(() => {
        const fetchFilterData = async () => {
            const { data, error } = await supabase.from('products').select('id, name').order('name');
            if (error) {
                notification.error({ message: 'Error fetching products for filter', description: error.message });
            } else {
                setProducts(data);
            }
        };
        fetchFilterData();
    }, [notification]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { current, pageSize } = pagination;
            const rpcName = isLotsTab ? 'get_lots_list' : 'get_serials_list';
            const params = {
                p_page_number: current,
                p_page_size: pageSize,
                p_search_text: debouncedSearchTerm || null,
                p_sort_by: sorter?.field as string || 'created_at',
                p_sort_order: sorter?.order === 'ascend' ? 'asc' : 'desc',
                p_product_id: advancedFilters.product_id,
                p_status: advancedFilters.status,
                p_date_range: advancedFilters.expiry_date_range ? { 
                    start: dayjs(advancedFilters.expiry_date_range[0]).startOf('day').toISOString(), 
                    end: dayjs(advancedFilters.expiry_date_range[1]).endOf('day').toISOString()
                } : null,
            };

            const { data: rpcData, error } = await supabase.rpc(rpcName, params);

            if (error) throw error;
            
            const result = rpcData as { data: any[], total_count: number };
            setData(result.data || []);
            setTotalCount(result.total_count || 0);

        } catch (error: any) {
            notification.error({
                message: `Error fetching ${isLotsTab ? 'lots' : 'serials'}`,
                description: `RPC Error: ${error.message}.`,
            });
        } finally {
            setLoading(false);
        }
    }, [pagination, sorter, debouncedSearchTerm, advancedFilters, notification, isLotsTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleTableChange = (
        newPagination: TablePaginationConfig, 
        filters: any, 
        newSorter: SorterResult<any> | SorterResult<any>[]
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

    const allColumns = useMemo(() => {
        const baseColumns = [
            { title: 'Sản phẩm', dataIndex: 'product_name', key: 'product_name', sorter: true },
            { title: 'Trạng thái', dataIndex: 'status', key: 'status', sorter: true, render: statusTag },
            { title: 'Ngày hết hạn', dataIndex: 'expiry_date', key: 'expiry_date', sorter: true, render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY') : '-' },
            { title: 'Ngày sản xuất', dataIndex: 'manufacture_date', key: 'manufacture_date', sorter: true, render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY') : '-' },
            { title: 'Mã Sản phẩm', dataIndex: 'product_code', key: 'product_code' },
            { title: 'Ngày tạo', dataIndex: 'created_at', key: 'created_at', sorter: true, render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY') : '-' },
            {
                title: 'Hành động',
                key: 'actions',
                align: 'center' as const,
                fixed: 'right' as const,
                width: 100,
                render: (_: any, record: any) => (
                    <Space size="small">
                         <Tooltip title="Xem chi tiết">
                            <button className="table-action-button" onClick={() => navigate('#')}>
                                <EyeOutlined />
                            </button>
                        </Tooltip>
                    </Space>
                ),
            },
        ];

        if (isLotsTab) {
            return [
                { title: 'Số Lô', dataIndex: 'lot_number', key: 'lot_number', sorter: true },
                { title: 'Số lượng hiện tại', dataIndex: 'current_quantity', key: 'current_quantity', sorter: true },
                ...baseColumns,
            ];
        } else {
            return [
                { title: 'Số Serial', dataIndex: 'serial_number', key: 'serial_number', sorter: true },
                { title: 'Thuộc Lô', dataIndex: 'lot_number', key: 'lot_number', sorter: true },
                ...baseColumns,
            ];
        }
    }, [isLotsTab, navigate]);

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
                <Form.Item name="product_id" label="Sản phẩm">
                    <Select
                        showSearch
                        placeholder="Chọn sản phẩm"
                        optionFilterProp="children"
                        filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                        options={products.map(p => ({ value: p.id, label: p.name }))}
                        allowClear
                    />
                </Form.Item>
                <Form.Item name="status" label="Trạng thái">
                    <Select placeholder="Chọn trạng thái" mode="multiple" allowClear>
                        {/* FIX: Use the runtime array of statuses instead of trying to get keys from a type. */}
                        {SERIAL_LOT_STATUSES.map(status => (
                           <Select.Option key={status} value={status}>{status}</Select.Option>
                        ))}
                    </Select>
                </Form.Item>
                 <Form.Item name="expiry_date_range" label="Khoảng ngày hết hạn">
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
        <div>
             <div className="flex justify-between items-center my-4">
                <Space>
                    <Popover content={columnToggler} trigger="click" placement="bottomLeft" visible={columnPopoverVisible} onVisibleChange={setColumnPopoverVisible}>
                        <Button icon={<SettingOutlined />} />
                    </Popover>
                    <Popover content={advancedFilterForm} trigger="click" placement="bottomLeft" visible={filterPopoverVisible} onVisibleChange={setFilterPopoverVisible}>
                        <Button icon={<FilterOutlined />} />
                    </Popover>
                    <Input
                        placeholder="Tìm kiếm..."
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
                    dataSource={data}
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
        </div>
    );
};

const LotsSerialsListPageWrapper: React.FC = () => (
    <App>
        <LotsSerialsListPage />
    </App>
);

export default LotsSerialsListPageWrapper;
