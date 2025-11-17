

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
    SearchOutlined,
    EyeOutlined,
    FilterOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import { supabase } from '../../../lib/supabase';
import { useDebounce } from '../../../hooks/useDebounce';
import dayjs from 'dayjs';
import { TablePaginationConfig } from 'antd/lib/table';
import { SorterResult } from 'antd/lib/table/interface';
import { Database } from '../../../types/supabase';

// --- Types ---
type StockSummaryViewData = {
  id: number;
  product_name: string;
  product_code: string;
  warehouse_name: string;
  location_code: string;
  lot_number: string | null;
  serial_number: string | null;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  last_updated_at: string;
  warehouse_id: number; // for detail link
  product_id: number; // for detail link
};

type FilterData = {
    id: number | string;
    name: string;
};

// --- Main Page Component ---
const OnhandListPage: React.FC = () => {
    const navigate = useNavigate();
    const { notification } = App.useApp();
    const [form] = Form.useForm();

    const [data, setData] = useState<StockSummaryViewData[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
    const [sorter, setSorter] = useState<SorterResult<StockSummaryViewData> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const [advancedFilters, setAdvancedFilters] = useState<any>({});
    const [filterPopoverVisible, setFilterPopoverVisible] = useState(false);
    const [columnPopoverVisible, setColumnPopoverVisible] = useState(false);
    
    const [warehouses, setWarehouses] = useState<FilterData[]>([]);
    const [locations, setLocations] = useState<FilterData[]>([]);
    const [products, setProducts] = useState<FilterData[]>([]);
    const [lots, setLots] = useState<FilterData[]>([]);

    const defaultColumns = ['product_name', 'warehouse_name', 'location_code', 'lot_number', 'quantity_on_hand', 'quantity_reserved', 'quantity_available', 'last_updated_at', 'actions'];
    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns);

    // Fetch data for filters
    useEffect(() => {
        const fetchFilterData = async () => {
            const [whData, locData, prodData, lotData] = await Promise.all([
                supabase.from('warehouses').select('id, name').order('name'),
                supabase.from('locations').select('id, name').order('name'),
                supabase.from('products').select('id, name').order('name'),
                supabase.from('lots').select('id, lot_number').order('lot_number'),
            ]);

            if (whData.error) notification.error({ message: 'Lỗi tải danh sách kho', description: whData.error.message });
            else setWarehouses(whData.data);

            if (locData.error) notification.error({ message: 'Lỗi tải danh sách vị trí', description: locData.error.message });
            else setLocations(locData.data);

            if (prodData.error) notification.error({ message: 'Lỗi tải danh sách sản phẩm', description: prodData.error.message });
            else setProducts(prodData.data);

            if (lotData.error) notification.error({ message: 'Lỗi tải danh sách lô', description: lotData.error.message });
            else setLots(lotData.data.map(l => ({ id: l.id, name: l.lot_number })));
        };
        fetchFilterData();
    }, [notification]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { current, pageSize } = pagination;
            const params = {
                p_page_number: current,
                p_page_size: pageSize,
                p_search_text: debouncedSearchTerm || null,
                p_sort_by: sorter?.field as string || 'last_updated_at',
                p_sort_order: sorter?.order === 'ascend' ? 'asc' : 'desc',
                p_warehouse_id: advancedFilters.warehouse_id,
                p_location_id: advancedFilters.location_id,
                p_product_id: advancedFilters.product_id,
                p_lot_id: advancedFilters.lot_id,
                p_positive_stock_only: advancedFilters.positive_stock_only,
            };

            const { data, error } = await supabase.rpc('get_stock_summary_list', params);

            if (error) throw error;
            
            const result = data as { data: StockSummaryViewData[], total_count: number };
            setData(result.data || []);
            setTotalCount(result.total_count || 0);

        } catch (error: any) {
            notification.error({
                message: 'Lỗi tải danh sách tồn kho',
                description: `RPC Error: ${error.message}.`,
            });
        } finally {
            setLoading(false);
        }
    }, [pagination, sorter, debouncedSearchTerm, advancedFilters, notification]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleTableChange = (
        newPagination: TablePaginationConfig, 
        filters: any, 
        newSorter: SorterResult<StockSummaryViewData> | SorterResult<StockSummaryViewData>[]
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
            title: 'Sản phẩm',
            dataIndex: 'product_name',
            key: 'product_name',
            sorter: true,
            render: (text: string, record: StockSummaryViewData) => (
                <Link to={`/operations/onhand/${record.warehouse_id}/${record.product_id}`}>{text}</Link>
            )
        },
        { title: 'Mã SP', dataIndex: 'product_code', key: 'product_code', sorter: true },
        { title: 'Kho', dataIndex: 'warehouse_name', key: 'warehouse_name', sorter: true },
        { title: 'Vị trí', dataIndex: 'location_code', key: 'location_code', sorter: true },
        { title: 'Lô', dataIndex: 'lot_number', key: 'lot_number', sorter: true, render: (text: string) => text || 'N/A' },
        { title: 'Serial', dataIndex: 'serial_number', key: 'serial_number', sorter: true, render: (text: string) => text || 'N/A' },
        { title: 'SL Tồn', dataIndex: 'quantity_on_hand', key: 'quantity_on_hand', sorter: true },
        { title: 'SL Giữ', dataIndex: 'quantity_reserved', key: 'quantity_reserved', sorter: true },
        { title: 'SL Khả dụng', dataIndex: 'quantity_available', key: 'quantity_available', sorter: true },
        { title: 'Cập nhật lần cuối', dataIndex: 'last_updated_at', key: 'last_updated_at', sorter: true, render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY HH:mm') : '-' },
        {
            title: 'Hành động',
            key: 'actions',
            align: 'center' as const,
            fixed: 'right' as const,
            width: 100,
            render: (_: any, record: StockSummaryViewData) => (
                <Space size="small">
                    <Tooltip title="Xem Lịch sử dịch chuyển">
                        <button className="table-action-button" onClick={() => navigate(`/operations/onhand/${record.warehouse_id}/${record.product_id}`)}>
                            <EyeOutlined />
                        </button>
                    </Tooltip>
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
                <Form.Item name="warehouse_id" label="Kho">
                    <Select
                        showSearch placeholder="Chọn kho" optionFilterProp="children"
                        filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                        options={warehouses.map(wh => ({ value: wh.id, label: wh.name }))} allowClear
                    />
                </Form.Item>
                <Form.Item name="location_id" label="Vị trí">
                    <Select
                        showSearch placeholder="Chọn vị trí" optionFilterProp="children"
                        filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                        options={locations.map(loc => ({ value: loc.id, label: loc.name }))} allowClear
                    />
                </Form.Item>
                <Form.Item name="product_id" label="Sản phẩm">
                    <Select
                        showSearch placeholder="Chọn sản phẩm" optionFilterProp="children"
                        filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                        options={products.map(p => ({ value: p.id, label: p.name }))} allowClear
                    />
                </Form.Item>
                <Form.Item name="lot_id" label="Lô">
                    <Select
                        showSearch placeholder="Chọn lô" optionFilterProp="children"
                        filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                        options={lots.map(l => ({ value: l.id, label: l.name }))} allowClear
                    />
                </Form.Item>
                <Form.Item name="positive_stock_only" valuePropName="checked">
                    <Checkbox>Chỉ hiển thị hàng tồn &gt; 0</Checkbox>
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
                <Typography.Title level={4} style={{ margin: 0 }}>Tồn kho</Typography.Title>
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
                        placeholder="Tìm theo SP, SKU, Lô, Serial..."
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
                    dataSource={data}
                    loading={loading}
                    pagination={false}
                    onChange={handleTableChange}
                    scroll={{ x: 'max-content' }}
                    className="custom-scrollbar"
                    onRow={(record) => ({
                        onDoubleClick: () => {
                            navigate(`/operations/onhand/${record.warehouse_id}/${record.product_id}`);
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

const OnhandListPageWrapper: React.FC = () => (
    <App>
        <OnhandListPage />
    </App>
);

export default OnhandListPageWrapper;