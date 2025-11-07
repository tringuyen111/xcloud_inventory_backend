import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { GoodsReceipt, Warehouse } from '../../types/supabase';
import {
    Button, Table, Tag, Space, App, Card, Row, Col, Input, Select, Form, Dropdown, Menu, Typography, DatePicker, Checkbox
} from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import {
    PlusOutlined, SearchOutlined, ClearOutlined, EllipsisOutlined, EyeOutlined, EditOutlined, DeleteOutlined,
    ExportOutlined, ProfileOutlined, DownOutlined
} from '@ant-design/icons';
import type { TableProps } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import { format } from 'date-fns';

const { Title, Text } = Typography;

type GoodsReceiptWithDetails = GoodsReceipt & {
    warehouse: { id: number; name: string } | null;
    gr_lines: { count: number }[];
};

const GR_STATUSES: GoodsReceipt['status'][] = ['DRAFT', 'CREATED', 'RECEIVING', 'PARTIAL_RECEIVED', 'APPROVED', 'COMPLETED'];

const STATUS_COLOR_MAP: Record<GoodsReceipt['status'], string> = {
    DRAFT: '#FFC107',
    CREATED: '#2196F3',
    RECEIVING: '#FF9800',
    PARTIAL_RECEIVED: '#9C27B0',
    APPROVED: '#009688',
    COMPLETED: '#4CAF50',
};

const defaultColumns: TableProps<GoodsReceiptWithDetails>['columns'] = [
    { title: 'Reference No.', dataIndex: 'reference_number', key: 'reference_number' },
    { title: 'Warehouse', dataIndex: ['warehouse', 'name'], key: 'warehouse' },
    { title: 'Partner', dataIndex: 'partner_name', key: 'partner_name' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    { title: 'Total Lines', dataIndex: 'gr_lines', key: 'total_lines', align: 'center' },
    { title: 'Created At', dataIndex: 'created_at', key: 'created_at' },
    { title: 'Actions', key: 'action', align: 'center' as const },
];

const GoodsReceiptListPage: React.FC = () => {
    const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceiptWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const { notification, modal } = App.useApp();
    const navigate = useNavigate();
    const [filterForm] = Form.useForm();
    
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [filters, setFilters] = useState<any>({});
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns.map(c => c.key as string));

    const fetchData = useCallback(async (page: number, pageSize: number, currentFilters: any) => {
        setLoading(true);
        try {
            let query = supabase
                .from('goods_receipts')
                .select('*, warehouse:warehouses(id, name), gr_lines(count)', { count: 'exact' });

            if (currentFilters.warehouse_id) query = query.eq('warehouse_id', currentFilters.warehouse_id);
            if (currentFilters.status) query = query.eq('status', currentFilters.status);
            if (currentFilters.reference_number) query = query.ilike('reference_number', `%${currentFilters.reference_number}%`);
            
            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range((page - 1) * pageSize, page * pageSize - 1);

            if (error) throw error;
            setGoodsReceipts(data as GoodsReceiptWithDetails[] || []);
            setPagination(prev => ({ ...prev, total: count || 0 }));
        } catch (error: any) {
            notification.error({ message: "Error fetching goods receipts", description: error.message });
        } finally {
            setLoading(false);
        }
    }, [notification]);

    const fetchDropdownData = useCallback(async () => {
        try {
            const { data, error } = await supabase.from('warehouses').select('id, name').eq('is_active', true);
            if (error) throw error;
            setWarehouses(data || []);
        } catch (error: any) {
            notification.error({ message: "Error fetching warehouses", description: error.message });
        }
    }, [notification]);

    useEffect(() => {
        fetchData(pagination.current, pagination.pageSize, filters);
    }, [fetchData, pagination.current, pagination.pageSize, filters]);

    useEffect(() => {
        fetchDropdownData();
    }, [fetchDropdownData]);

    const handleTableChange = (paginationConfig: any) => {
        setPagination(prev => ({ ...prev, ...paginationConfig }));
    };

    const handleFilterSubmit = (values: any) => {
        setPagination(p => ({ ...p, current: 1 }));
        setFilters(values);
    };

    const handleFilterClear = () => {
        filterForm.resetFields();
        setPagination(p => ({ ...p, current: 1 }));
        setFilters({});
    };

    const handleDelete = (id: number) => {
        modal.confirm({
            title: 'Are you sure?',
            content: 'This will delete the goods receipt and all its lines. This action cannot be undone.',
            okText: 'Yes, delete it',
            okType: 'danger',
            onOk: async () => {
                try {
                    const { error } = await supabase.from('goods_receipts').delete().eq('id', id);
                    if (error) throw error;
                    notification.success({ message: 'Goods Receipt deleted successfully' });
                    fetchData(pagination.current, pagination.pageSize, filters);
                } catch (error: any) {
                    notification.error({ message: 'Failed to delete', description: error.message });
                }
            },
        });
    };
    
    const exportToCsv = (filename: string, data: GoodsReceiptWithDetails[]) => {
        const visibleCols = defaultColumns.filter(c => visibleColumns.includes(c.key as string) && c.key !== 'action');
        const header = visibleCols.map(c => c.title).join(',');
        const rows = data.map(row => 
            visibleCols.map(col => {
                let value;
                if (Array.isArray(col.dataIndex)) {
                    value = col.dataIndex.reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : '', row as any);
                } else if (col.key === 'total_lines') {
                    value = row.gr_lines[0]?.count ?? 0;
                } else if (col.key === 'created_at') {
                    value = format(new Date(row.created_at), 'yyyy-MM-dd HH:mm');
                } else {
                    value = row[col.dataIndex as keyof GoodsReceiptWithDetails];
                }
                if (value === null || value === undefined) return '';
                return `"${String(value).replace(/"/g, '""')}"`;
            }).join(',')
        );
        const csv = [header, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const columnsMenu = (
        <Menu>
            {defaultColumns.filter(c => c.key !== 'action').map(col => {
                const key = col.key as string;
                return (
                    <Menu.Item key={key} onClick={(e) => e.domEvent.stopPropagation()}>
                        <Checkbox
                            checked={visibleColumns.includes(key)}
                            onChange={(e: CheckboxChangeEvent) => {
                                const checked = e.target.checked;
                                if (checked) {
                                    setVisibleColumns(prev => [...prev, key]);
                                } else {
                                    if (visibleColumns.filter(k => k !== 'action').length > 1) {
                                        setVisibleColumns(prev => prev.filter(k => k !== key));
                                    } else {
                                        notification.warning({ message: "At least one column must be visible." });
                                    }
                                }
                            }}
                        >
                            {col.title as string}
                        </Checkbox>
                    </Menu.Item>
                )
            })}
        </Menu>
    );

    const getColumns = (): TableProps<GoodsReceiptWithDetails>['columns'] => {
        const actionMenu = (record: GoodsReceiptWithDetails) => (
            <Menu>
                <Menu.Item key="1" icon={<EyeOutlined />} onClick={() => navigate(`/operations/gr/${record.id}`)}>View</Menu.Item>
                <Menu.Item key="2" icon={<EditOutlined />} onClick={() => navigate(`/operations/gr/${record.id}/edit`)}>Edit</Menu.Item>
                <Menu.Divider />
                <Menu.Item key="3" icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)}>Delete</Menu.Item>
            </Menu>
        );

        const cols = defaultColumns.map(col => {
            const newCol = { ...col };
            switch (newCol.key) {
                case 'reference_number':
                    newCol.render = (text, record) => <Link to={`/operations/gr/${record.id}`}>{text || `GR-${record.id}`}</Link>;
                    break;
                case 'created_at':
                    newCol.render = (text) => text ? format(new Date(text), 'yyyy-MM-dd HH:mm') : '-';
                    break;
                case 'status':
                    newCol.render = (status: GoodsReceipt['status']) => <Tag color={STATUS_COLOR_MAP[status]}>{status}</Tag>;
                    break;
                case 'total_lines':
                    newCol.render = (_, record) => record.gr_lines[0]?.count ?? 0;
                    break;
                case 'action':
                    newCol.render = (_, record) => (
                        <Dropdown overlay={actionMenu(record)} trigger={['click']}>
                            <Button type="text" icon={<EllipsisOutlined />} />
                        </Dropdown>
                    );
                    break;
                default:
                    break;
            }
            return newCol;
        });

        return cols.filter(c => visibleColumns.includes(c.key as string));
    };

    return (
        <Card>
            <Row justify="space-between" align="middle" className="mb-4">
                <Col>
                    <Title level={4} style={{ margin: 0 }}>📋 Goods Receipt List</Title>
                    <Text type="secondary">Manage incoming inventory shipments.</Text>
                </Col>
                <Col>
                    <Space>
                        <Button icon={<ExportOutlined />} onClick={() => exportToCsv('goods_receipts.csv', goodsReceipts)}>Export</Button>
                        <Dropdown overlay={columnsMenu} trigger={['click']}>
                            <Button icon={<ProfileOutlined />}>Columns <DownOutlined /></Button>
                        </Dropdown>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/operations/gr/new')}>Create</Button>
                    </Space>
                </Col>
            </Row>

            <div className="p-4 mb-6 bg-gray-50 rounded-lg">
                <Form form={filterForm} onFinish={handleFilterSubmit} layout="inline" style={{ flexWrap: 'wrap', gap: '16px' }}>
                    <Form.Item name="warehouse_id" label="Warehouse" className="flex-1 min-w-[200px] mb-0">
                        <Select allowClear placeholder="Select Warehouse">
                            {warehouses.map(w => <Select.Option key={w.id} value={w.id}>{w.name}</Select.Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="status" label="Status" className="flex-1 min-w-[150px] mb-0">
                        <Select allowClear placeholder="Select Status">
                            {GR_STATUSES.map(s => <Select.Option key={s} value={s}>{s}</Select.Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="reference_number" label="Reference" className="flex-1 min-w-[200px] mb-0">
                        <Input placeholder="Enter reference number..." />
                    </Form.Item>
                    <Form.Item className="mb-0">
                        <Space>
                            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>Search</Button>
                            <Button onClick={handleFilterClear} icon={<ClearOutlined />}>Clear</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </div>

            <Table
                columns={getColumns()}
                dataSource={goodsReceipts}
                rowKey="id"
                loading={loading}
                pagination={{...pagination, showSizeChanger: true, pageSizeOptions: ['10', '25', '50'], showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`}}
                onChange={handleTableChange}
                onRow={(record) => ({ onDoubleClick: () => navigate(`/operations/gr/${record.id}`)})}
                scroll={{ x: 'max-content' }}
            />
        </Card>
    );
};

const GoodsReceiptListPageWrapper: React.FC = () => (
    <App><GoodsReceiptListPage /></App>
);

export default GoodsReceiptListPageWrapper;