
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
import { Database } from '../../../types/supabase';

const { RangePicker } = DatePicker;

// Type for the data returned by v_products_list view / get_products_list RPC
type ProductViewData = {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
  product_type_name: string;
  tracking_type: Database['public']['Enums']['tracking_type_enum'];
  base_uom_name: string;
  sku: string | null;
  barcode: string | null;
  created_at: string;
};

// Type for product type data for filter dropdown
type ProductTypeFilterData = {
    id: number;
    name: string;
};

const GoodsModelsListPage: React.FC = () => {
    const navigate = useNavigate();
    const { notification } = App.useApp();
    const [form] = Form.useForm();

    const [products, setProducts] = useState<ProductViewData[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
    const [sorter, setSorter] = useState<SorterResult<ProductViewData> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const [advancedFilters, setAdvancedFilters] = useState<any>({});
    const [filterPopoverVisible, setFilterPopoverVisible] = useState(false);
    const [columnPopoverVisible, setColumnPopoverVisible] = useState(false);
    const [productTypes, setProductTypes] = useState<ProductTypeFilterData[]>([]);

    const defaultColumns = ['code', 'name', 'is_active', 'product_type_name', 'tracking_type', 'base_uom_name', 'created_at', 'actions'];
    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns);

    // Fetch product types for the filter dropdown
    useEffect(() => {
        const fetchProductTypes = async () => {
            const { data, error } = await supabase.from('product_types').select('id, name').order('name');
            if (error) {
                notification.error({ message: 'Error fetching product types', description: error.message });
            } else {
                setProductTypes(data);
            }
        };
        fetchProductTypes();
    }, [notification]);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const { current, pageSize } = pagination;
            const params = {
                p_page_number: current,
                p_page_size: pageSize,
                p_search_text: debouncedSearchTerm || null,
                p_sort_by: sorter?.field as string || 'created_at',
                p_sort_order: sorter?.order === 'ascend' ? 'asc' : 'desc',
                p_product_type_id: advancedFilters.product_type_id,
                p_tracking_type: advancedFilters.tracking_type,
                p_status: advancedFilters.status,
                p_date_range: advancedFilters.date_range ? { 
                    start: dayjs(advancedFilters.date_range[0]).startOf('day').toISOString(), 
                    end: dayjs(advancedFilters.date_range[1]).endOf('day').toISOString()
                } : null,
            };

            const { data, error } = await supabase.rpc('get_products_list', params);

            if (error) throw error;
            
            const result = data as { data: ProductViewData[], total_count: number };
            setProducts(result.data || []);
            setTotalCount(result.total_count || 0);

        } catch (error: any) {
            notification.error({
                message: 'Error fetching products',
                description: `RPC Error: ${error.message}. Ensure the 'get_products_list' function exists and accepts all required parameters.`,
            });
        } finally {
            setLoading(false);
        }
    }, [pagination, sorter, debouncedSearchTerm, advancedFilters, notification]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleTableChange = (
        pagination: TablePaginationConfig, 
        filters: any, 
        sorter: SorterResult<ProductViewData> | SorterResult<ProductViewData>[]
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

    const trackingTypeTag = (type: Database['public']['Enums']['tracking_type_enum']) => {
        const color = type === 'LOT' ? 'geekblue' : type === 'SERIAL' ? 'volcano' : 'default';
        return <Tag color={color}>{type}</Tag>;
    }

    const allColumns = useMemo(() => [
        { title: 'Mã', dataIndex: 'code', key: 'code', sorter: true },
        { 
          title: 'Tên Sản phẩm',
          dataIndex: 'name',
          key: 'name',
          sorter: true,
          render: (text: string, record: ProductViewData) => <Link to={`/master-data/goods-models/${record.id}`}>{text}</Link>
        },
        { title: 'Trạng thái', dataIndex: 'is_active', key: 'is_active', sorter: true, render: (isActive: boolean) => <StatusTag status={isActive} /> },
        { title: 'Loại sản phẩm', dataIndex: 'product_type_name', key: 'product_type_name', sorter: true },
        { title: 'Loại tracking', dataIndex: 'tracking_type', key: 'tracking_type', sorter: true, render: trackingTypeTag },
        { title: 'ĐVT Cơ bản', dataIndex: 'base_uom_name', key: 'base_uom_name' },
        { title: 'SKU', dataIndex: 'sku', key: 'sku', sorter: true },
        { title: 'Barcode', dataIndex: 'barcode', key: 'barcode' },
        { title: 'Ngày tạo', dataIndex: 'created_at', key: 'created_at', sorter: true, render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY') : '-' },
        {
            title: 'Hành động',
            key: 'actions',
            align: 'center' as const,
            fixed: 'right' as const,
            width: 100,
            render: (_: any, record: ProductViewData) => (
                <Space size="small">
                     <Tooltip title="Xem chi tiết">
                        <button className="table-action-button" onClick={() => navigate(`/master-data/goods-models/${record.id}`)}>
                            <EyeOutlined />
                        </button>
                    </Tooltip>
                    <Can module="masterData" action="edit">
                        <Tooltip title="Chỉnh sửa">
                            <button className="table-action-button" onClick={() => navigate(`/master-data/goods-models/${record.id}/edit`)}>
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
                <Form.Item name="product_type_id" label="Loại sản phẩm">
                    <Select
                        showSearch
                        placeholder="Chọn loại sản phẩm"
                        optionFilterProp="children"
                        filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                        options={productTypes.map(pt => ({ value: pt.id, label: pt.name }))}
                        allowClear
                    />
                </Form.Item>
                <Form.Item name="tracking_type" label="Loại tracking">
                     <Select placeholder="Chọn loại tracking" allowClear>
                        <Select.Option value="NONE">None</Select.Option>
                        <Select.Option value="LOT">Lot</Select.Option>
                        <Select.Option value="SERIAL">Serial</Select.Option>
                    </Select>
                </Form.Item>
                <Form.Item name="status" label="Trạng thái">
                    <Select placeholder="Chọn trạng thái" allowClear>
                        <Select.Option value={true}>Active</Select.Option>
                        <Select.Option value={false}>Inactive</Select.Option>
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
        <Card>
            <div className="flex justify-between items-center mb-6">
                <Typography.Title level={4} style={{ margin: 0 }}>Products</Typography.Title>
                <Can module="masterData" action="create">
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/master-data/goods-models/create')} style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}>
                        Thêm mới Sản phẩm
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
                        placeholder="Tìm kiếm theo Tên, Mã, SKU, Barcode..."
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
                    dataSource={products}
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

const GoodsModelsListPageWrapper: React.FC = () => (
    <App>
        <GoodsModelsListPage />
    </App>
);

export default GoodsModelsListPageWrapper;
