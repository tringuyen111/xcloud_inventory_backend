
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

// Type for the data returned by v_uom_categories_list view / get_uom_categories_list RPC
type UomCategoryViewData = {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
  description: string | null;
  created_at: string;
  created_by_name: string | null;
};

const UomCategoriesListPage: React.FC = () => {
    const navigate = useNavigate();
    const { notification } = App.useApp();
    const [form] = Form.useForm();

    const [uomCategories, setUomCategories] = useState<UomCategoryViewData[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
    const [sorter, setSorter] = useState<SorterResult<UomCategoryViewData> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const [advancedFilters, setAdvancedFilters] = useState<any>({});
    const [filterPopoverVisible, setFilterPopoverVisible] = useState(false);
    const [columnPopoverVisible, setColumnPopoverVisible] = useState(false);

    const defaultColumns = ['code', 'name', 'is_active', 'created_at', 'created_by_name', 'actions'];
    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns);

    const fetchUomCategories = useCallback(async () => {
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
                p_date_range: advancedFilters.date_range ? { 
                    start: dayjs(advancedFilters.date_range[0]).startOf('day').toISOString(), 
                    end: dayjs(advancedFilters.date_range[1]).endOf('day').toISOString()
                } : null,
            };

            const { data, error } = await supabase.rpc('get_uom_categories_list', params);

            if (error) throw error;
            
            const result = data as { data: UomCategoryViewData[], total_count: number };
            setUomCategories(result.data || []);
            setTotalCount(result.total_count || 0);

        } catch (error: any) {
            notification.error({
                message: 'Error fetching UOM categories',
                description: `RPC Error: ${error.message}. Ensure the 'get_uom_categories_list' function exists and accepts all required parameters.`,
            });
        } finally {
            setLoading(false);
        }
    }, [pagination, sorter, debouncedSearchTerm, advancedFilters, notification]);

    useEffect(() => {
        fetchUomCategories();
    }, [fetchUomCategories]);

    const handleTableChange = (
        pagination: TablePaginationConfig, 
        filters: any, 
        sorter: SorterResult<UomCategoryViewData> | SorterResult<UomCategoryViewData>[]
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
          title: 'Tên Nhóm ĐV',
          dataIndex: 'name',
          key: 'name',
          sorter: true,
          render: (text: string, record: UomCategoryViewData) => <Link to={`/master-data/uom-categories/${record.id}`}>{text}</Link>
        },
        { title: 'Trạng thái', dataIndex: 'is_active', key: 'is_active', sorter: true, render: (isActive: boolean) => <StatusTag status={isActive} /> },
        { title: 'Mô tả', dataIndex: 'description', key: 'description' },
        { title: 'Ngày tạo', dataIndex: 'created_at', key: 'created_at', sorter: true, render: (text: string) => text ? dayjs(text).format('DD/MM/YYYY') : '-' },
        { title: 'Người tạo', dataIndex: 'created_by_name', key: 'created_by_name' },
        {
            title: 'Hành động',
            key: 'actions',
            align: 'center' as const,
            fixed: 'right' as const,
            width: 100,
            render: (_: any, record: UomCategoryViewData) => (
                <Space size="small">
                     <Tooltip title="Xem chi tiết">
                        <button className="table-action-button" onClick={() => navigate(`/master-data/uom-categories/${record.id}`)}>
                            <EyeOutlined />
                        </button>
                    </Tooltip>
                    <Can module="masterData" action="edit">
                        <Tooltip title="Chỉnh sửa">
                            <button className="table-action-button" onClick={() => navigate(`/master-data/uom-categories/${record.id}/edit`)}>
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
                <Typography.Title level={4} style={{ margin: 0 }}>UOM Categories</Typography.Title>
                <Can module="masterData" action="create">
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/master-data/uom-categories/create')} style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}>
                        Thêm mới Nhóm ĐV
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
                        placeholder="Tìm kiếm theo Tên, Mã..."
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
                    dataSource={uomCategories}
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

const UomCategoriesListPageWrapper: React.FC = () => (
    <App>
        <UomCategoriesListPage />
    </App>
);

export default UomCategoriesListPageWrapper;
