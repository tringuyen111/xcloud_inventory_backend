import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Warehouse } from '../../types/supabase';
import {
    Button, Table, Tag, Space, App, Card, Row, Col, Input, Select, Form, Dropdown, Menu, Typography
} from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import {
    PlusOutlined, SearchOutlined, ClearOutlined, EllipsisOutlined, EyeOutlined, EditOutlined, DeleteOutlined,
    ExportOutlined
} from '@ant-design/icons';
import type { TableProps } from 'antd';
import { format } from 'date-fns';

const { Title, Text } = Typography;

// Matches the return type of the get_gi_list RPC function
type GoodsIssueRow = {
    id: number;
    reference_number: string;
    issue_date: string;
    issue_mode: string;
    status: 'DRAFT' | 'CREATED' | 'PICKING' | 'PICKED' | 'COMPLETED' | 'CANCELLED';
    warehouse_name: string;
    destination_name: string;
    total_lines: number;
    total_required_qty: number;
    total_allocated_qty: number;
    total_count: number;
};

const GI_STATUSES: GoodsIssueRow['status'][] = ['DRAFT', 'CREATED', 'PICKING', 'PICKED', 'COMPLETED', 'CANCELLED'];

const STATUS_COLOR_MAP: Record<GoodsIssueRow['status'], string> = {
    DRAFT: 'gold',
    CREATED: 'blue',
    PICKING: 'orange',
    PICKED: 'purple',
    COMPLETED: 'green',
    CANCELLED: 'red',
};

const GoodsIssueListPage: React.FC = () => {
    const [goodsIssues, setGoodsIssues] = useState<GoodsIssueRow[]>([]);
    const [loading, setLoading] = useState(true);
    const { notification, modal } = App.useApp();
    const navigate = useNavigate();
    const [filterForm] = Form.useForm();
    
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [filters, setFilters] = useState<any>({});
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    const fetchData = useCallback(async (page: number, pageSize: number, currentFilters: any) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_gi_list', {
                page_index: page,
                page_size: pageSize,
                filter_warehouse_id: currentFilters.warehouse_id || null,
                filter_status: currentFilters.status || null,
                filter_ref_no: currentFilters.reference_number || null,
            });

            if (error) throw error;

            const resultData = data || [];
            setGoodsIssues(resultData);
            setPagination(prev => ({ ...prev, total: resultData.length > 0 ? resultData[0].total_count : 0, current: page, pageSize: pageSize }));

        } catch (error: any) {
            notification.error({ message: "Error fetching goods issues", description: error.message });
            console.error(error);
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
        setPagination(prev => ({ ...prev, current: paginationConfig.current, pageSize: paginationConfig.pageSize }));
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
            content: 'This will delete the goods issue and all its lines. This action cannot be undone.',
            okText: 'Yes, delete it',
            okType: 'danger',
            onOk: async () => {
                try {
                    const { error } = await supabase.from('goods_issues').delete().eq('id', id);
                    if (error) throw error;
                    notification.success({ message: 'Goods Issue deleted successfully' });
                    fetchData(pagination.current, pagination.pageSize, filters);
                } catch (error: any) {
                    notification.error({ message: 'Failed to delete', description: error.message });
                }
            },
        });
    };
    
    const columns: TableProps<GoodsIssueRow>['columns'] = [
        { title: 'Reference No.', dataIndex: 'reference_number', key: 'reference_number', render: (text, record) => <Link to={`/operations/gi/${record.id}`}>{text || `GI-${record.id}`}</Link> },
        { title: 'Warehouse', dataIndex: 'warehouse_name', key: 'warehouse_name' },
        { title: 'Destination', dataIndex: 'destination_name', key: 'destination_name' },
        { title: 'Mode', dataIndex: 'issue_mode', key: 'issue_mode', align: 'center', render: (mode) => <Tag>{mode}</Tag> },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (status: GoodsIssueRow['status']) => <Tag color={STATUS_COLOR_MAP[status]}>{status}</Tag> },
        { title: 'Lines', dataIndex: 'total_lines', key: 'total_lines', align: 'center' },
        { title: 'Required Qty', dataIndex: 'total_required_qty', key: 'total_required_qty', align: 'right' },
        { title: 'Allocated Qty', dataIndex: 'total_allocated_qty', key: 'total_allocated_qty', align: 'right' },
        { title: 'Issue Date', dataIndex: 'issue_date', key: 'issue_date', render: (text) => text ? format(new Date(text), 'yyyy-MM-dd') : '-' },
        { title: 'Actions', key: 'action', align: 'center' as const, render: (_, record) => (
            <Dropdown overlay={
                <Menu>
                    <Menu.Item key="1" icon={<EyeOutlined />} onClick={() => navigate(`/operations/gi/${record.id}`)}>View</Menu.Item>
                    <Menu.Item key="2" icon={<EditOutlined />} onClick={() => navigate(`/operations/gi/${record.id}/edit`)}>Edit</Menu.Item>
                    <Menu.Divider />
                    <Menu.Item key="3" icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)}>Delete</Menu.Item>
                </Menu>
            } trigger={['click']}>
                <Button type="text" icon={<EllipsisOutlined />} />
            </Dropdown>
        )},
    ];

    return (
        <Card>
            <Row justify="space-between" align="middle" className="mb-4">
                <Col>
                    <Title level={4} style={{ margin: 0 }}>🚚 Goods Issue List</Title>
                    <Text type="secondary">Manage outgoing inventory shipments.</Text>
                </Col>
                <Col>
                    <Space>
                        <Button icon={<ExportOutlined />} disabled>Export</Button>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/operations/gi/create')}>Create</Button>
                    </Space>
                </Col>
            </Row>

            <div className="p-4 mb-6 bg-gray-50 rounded-lg">
                <Form form={filterForm} onFinish={handleFilterSubmit} layout="inline" style={{ flexWrap: 'wrap', gap: '16px' }}>
                    <Form.Item name="warehouse_id" label="Warehouse" className="flex-1 min-w-[200px] mb-0">
                        <Select allowClear placeholder="Select Warehouse" options={warehouses.map(w => ({label: w.name, value: w.id}))} />
                    </Form.Item>
                    <Form.Item name="status" label="Status" className="flex-1 min-w-[150px] mb-0">
                        <Select allowClear placeholder="Select Status" options={GI_STATUSES.map(s => ({label: s, value: s}))} />
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
                columns={columns}
                dataSource={goodsIssues}
                rowKey="id"
                loading={loading}
                pagination={{...pagination, showSizeChanger: true, pageSizeOptions: ['10', '25', '50'], showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`}}
                onChange={handleTableChange}
                onRow={(record) => ({ onDoubleClick: () => navigate(`/operations/gi/${record.id}`)})}
                scroll={{ x: 'max-content' }}
            />
        </Card>
    );
};

const GoodsIssueListPageWrapper: React.FC = () => (
    <App><GoodsIssueListPage /></App>
);

export default GoodsIssueListPageWrapper;