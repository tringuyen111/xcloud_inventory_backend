import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { GoodsType } from '../../../types/supabase';
import {
    Button, Table, Tag, Space, App, Card, Row, Col, Input, Select, Modal, Form, Dropdown, Menu, Typography, DatePicker, Checkbox
} from 'antd';
import { useNavigate } from 'react-router-dom';
import {
    PlusOutlined, ExportOutlined, ProfileOutlined, EllipsisOutlined, EyeOutlined, EditOutlined, DeleteOutlined, DownOutlined
} from '@ant-design/icons';
import useAuthStore from '../../../stores/authStore';
import type { TableProps } from 'antd';
import type { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const defaultColumns: TableProps<GoodsType>['columns'] = [
    { title: 'Code', dataIndex: 'code', key: 'code', sorter: (a, b) => a.code.localeCompare(b.code) },
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: 'Status', dataIndex: 'is_active', key: 'is_active', render: (isActive: boolean) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Tag> },
    {
        title: 'Actions',
        key: 'action',
        align: 'center' as const,
        render: () => <EllipsisOutlined />,
    },
];

const GoodsTypesListPage: React.FC = () => {
    const [goodsTypes, setGoodsTypes] = useState<GoodsType[]>([]);
    const [loading, setLoading] = useState(true);
    const { notification, modal } = App.useApp();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const user = useAuthStore((state) => state.user);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns.map(c => c.key as string));

    const fetchData = useCallback(async (page: number, pageSize: number) => {
        setLoading(true);
        try {
            let query = supabase.from('goods_types').select('*', { count: 'exact' });
            if (searchTerm) query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`);
            if (statusFilter !== 'all') query = query.eq('is_active', statusFilter === 'active');
            if (dateRange && dateRange[0]) query = query.gte('updated_at', dateRange[0].startOf('day').toISOString());
            if (dateRange && dateRange[1]) query = query.lte('updated_at', dateRange[1].endOf('day').toISOString());
            
            const { data, error, count } = await query
                .order('name', { ascending: true })
                .range((page - 1) * pageSize, page * pageSize - 1);

            if (error) throw error;
            setGoodsTypes(data || []);
            setPagination(prev => ({ ...prev, total: count || 0 }));
        } catch (error: any) {
            notification.error({ message: "Error fetching goods types", description: error.message });
        } finally {
            setLoading(false);
        }
    }, [notification, searchTerm, statusFilter, dateRange]);

    useEffect(() => {
        fetchData(pagination.current, pagination.pageSize);
    }, [fetchData, pagination.current, pagination.pageSize]);

    const handleTableChange = (paginationConfig: any) => {
        setPagination(prev => ({ ...prev, ...paginationConfig }));
    };

    const handleCreate = () => {
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleCancel = () => setIsModalOpen(false);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const values = await form.validateFields();
            const { error } = await supabase.from('goods_types').insert({ ...values, created_by: user?.id, updated_by: user?.id }).select();
            if (error) throw error;
            notification.success({ message: "Goods Type created successfully" });
            setIsModalOpen(false);
            fetchData(1, pagination.pageSize);
            setPagination(p => ({...p, current: 1}));
        } catch (error: any) {
            notification.error({ message: "Failed to create Goods Type", description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (id: number) => {
        modal.confirm({
            title: 'Are you sure you want to delete this goods type?',
            content: 'This action cannot be undone.',
            okText: 'Yes, delete it',
            okType: 'danger',
            onOk: async () => {
                try {
                    const { error } = await supabase.from('goods_types').delete().eq('id', id);
                    if (error) throw error;
                    notification.success({ message: 'Goods Type deleted successfully' });
                    fetchData(pagination.current, pagination.pageSize);
                } catch (error: any) {
                    notification.error({ message: 'Failed to delete Goods Type', description: error.message });
                }
            },
        });
    };
    
    const exportToCsv = (filename: string, data: GoodsType[]) => {
        const visibleCols = defaultColumns.filter(c => visibleColumns.includes(c.key as string) && c.key !== 'action');
        const header = visibleCols.map(c => c.title).join(',');
        const rows = data.map(row => 
            visibleCols.map(col => {
                const value = row[col.dataIndex as keyof GoodsType];
                if (value === null || value === undefined) return '';
                if (typeof value === 'boolean') return value ? 'Active' : 'Inactive';
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
            {defaultColumns
                .filter(c => c.key !== 'action')
                .map(col => {
                    const key = col.key as string;
                    return (
                        <Menu.Item key={key} onClick={(e) => e.domEvent.stopPropagation()}>
                            <Checkbox
                                checked={visibleColumns.includes(key)}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    if (checked) {
                                        setVisibleColumns(prev => [...prev, key]);
                                    } else {
                                        if (visibleColumns.filter(k => k !== 'action').length > 1) {
                                            setVisibleColumns(prev => prev.filter(k => k !== key));
                                        } else {
                                            notification.warning({ message: "At least one column must be visible."});
                                        }
                                    }
                                }}
                            >
                                {col.title as string}
                            </Checkbox>
                        </Menu.Item>
                    )
                })
            }
        </Menu>
    );

    const getColumns = () => {
        const actionMenu = (record: GoodsType) => (
            <Menu>
                <Menu.Item key="1" icon={<EyeOutlined />} onClick={() => navigate(`/master-data/goods-types/${record.id}`)}>View</Menu.Item>
                <Menu.Item key="2" icon={<EditOutlined />} onClick={() => navigate(`/master-data/goods-types/${record.id}`)}>Edit</Menu.Item>
                <Menu.Divider />
                <Menu.Item key="3" icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)}>Delete</Menu.Item>
            </Menu>
        );
        const cols = [...defaultColumns];
        const actionCol = cols.find(c => c.key === 'action');
        if (actionCol) {
            actionCol.render = (_: any, record: GoodsType) => (
                <Dropdown overlay={actionMenu(record)} trigger={['click']}>
                    <Button type="text" icon={<EllipsisOutlined />} />
                </Dropdown>
            );
        }
        return cols.filter(c => visibleColumns.includes(c.key as string));
    };

    return (
        <Card>
            <Row justify="space-between" align="middle" className="mb-4">
                 <Col>
                    <Title level={4} style={{ margin: 0 }}>Goods Types</Title>
                    <Text type="secondary">Manage all goods types in the system.</Text>
                 </Col>
                <Col>
                    <Space>
                        <Button icon={<ExportOutlined />} onClick={() => exportToCsv('goods_types.csv', goodsTypes)}>Export</Button>
                        <Dropdown overlay={columnsMenu} trigger={['click']}>
                            <Button icon={<ProfileOutlined />}>
                                Columns <DownOutlined />
                            </Button>
                        </Dropdown>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>Add New</Button>
                    </Space>
                </Col>
            </Row>

            <div className="p-4 mb-6 bg-gray-50 rounded-lg">
                <Row gutter={[16,16]} align="bottom">
                    <Col>
                        <Form.Item label="Search" style={{ marginBottom: 0 }}>
                            <Input.Search placeholder="Search by name or code..." onSearch={val=>{setSearchTerm(val); setPagination(p=>({...p, current:1}));}} allowClear style={{width: 250}} />
                        </Form.Item>
                    </Col>
                    <Col>
                        <Form.Item label="Status" style={{ marginBottom: 0 }}>
                            <Select value={statusFilter} onChange={val=>{setStatusFilter(val); setPagination(p=>({...p, current:1}));}} style={{ width: 120 }}>
                                <Select.Option value="all">All</Select.Option>
                                <Select.Option value="active">Active</Select.Option>
                                <Select.Option value="inactive">Inactive</Select.Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col><Form.Item label="Updated At" style={{ marginBottom: 0 }}><RangePicker onChange={dates=>{setDateRange(dates); setPagination(p=>({...p, current:1}));}} /></Form.Item></Col>
                </Row>
            </div>

            <Table
                columns={getColumns()}
                dataSource={goodsTypes}
                rowKey="id"
                loading={loading}
                pagination={{...pagination, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'], showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`}}
                onChange={handleTableChange}
                onRow={(record) => ({ onDoubleClick: () => navigate(`/master-data/goods-types/${record.id}`)})}
            />

            <Modal
                title="Create Goods Type"
                open={isModalOpen}
                onOk={handleSave}
                onCancel={handleCancel}
                confirmLoading={isSaving}
                okText="Save"
            >
                <Form form={form} layout="vertical" name="create_goods_type_form" className="mt-6">
                    <Form.Item name="code" label="Code" rules={[{ required: true, message: 'Please input the code!' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please input the name!' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="Notes">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item name="is_active" label="Status" initialValue={true}>
                        <Select>
                            <Select.Option value={true}>Active</Select.Option>
                            <Select.Option value={false}>Inactive</Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

const GoodsTypesListPageWrapper: React.FC = () => (
    <App><GoodsTypesListPage /></App>
);

export default GoodsTypesListPageWrapper;
