import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { GoodsType } from '../../types/supabase';
import {
    Button, Table, Tag, Space, App, Card, Row, Col, Input, Select, Modal, Form, Dropdown, Menu, Typography
} from 'antd';
import { useNavigate } from 'react-router-dom';
import {
    PlusOutlined, ExportOutlined, ProfileOutlined, EllipsisOutlined, EyeOutlined, EditOutlined, DeleteOutlined
} from '@ant-design/icons';
import useAuthStore from '../../stores/authStore';

const { Title, Text } = Typography;

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

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase.from('goods_types').select('*');
            if (searchTerm) query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`);
            if (statusFilter !== 'all') query = query.eq('is_active', statusFilter === 'active');
            const { data, error } = await query.order('name', { ascending: true });
            if (error) throw error;
            setGoodsTypes(data || []);
        } catch (error: any) {
            notification.error({ message: "Error fetching goods types", description: error.message });
        } finally {
            setLoading(false);
        }
    }, [notification, searchTerm, statusFilter]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
            fetchData();
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
                    fetchData();
                } catch (error: any) {
                    notification.error({ message: 'Failed to delete Goods Type', description: error.message });
                }
            },
        });
    };

    const actionMenu = (record: GoodsType) => (
        <Menu>
            <Menu.Item key="1" icon={<EyeOutlined />} onClick={() => navigate(`/goods/types/${record.id}`)}>View</Menu.Item>
            <Menu.Item key="2" icon={<EditOutlined />} onClick={() => navigate(`/goods/types/${record.id}`)}>Edit</Menu.Item>
            <Menu.Divider />
            <Menu.Item key="3" icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)}>Delete</Menu.Item>
        </Menu>
    );

    const columns = [
        { title: 'Code', dataIndex: 'code', key: 'code', sorter: (a: GoodsType, b: GoodsType) => a.code.localeCompare(b.code) },
        { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a: GoodsType, b: GoodsType) => a.name.localeCompare(b.name) },
        { title: 'Status', dataIndex: 'is_active', key: 'is_active', render: (isActive: boolean) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Tag> },
        {
            title: 'Actions',
            key: 'action',
            align: 'center' as const,
            render: (_: any, record: GoodsType) => (
                <Dropdown overlay={actionMenu(record)} trigger={['click']}>
                    <Button type="text" icon={<EllipsisOutlined />} />
                </Dropdown>
            ),
        },
    ];

    return (
        <Card>
            <Row justify="space-between" align="middle" className="mb-4">
                 <Col>
                    <Title level={4} style={{ margin: 0 }}>Goods Types</Title>
                    <Text type="secondary">Manage all goods types in the system.</Text>
                 </Col>
                <Col>
                    <Space>
                        <Button icon={<ExportOutlined />} onClick={() => notification.info({message: 'Export function is not yet implemented.'})}>Export</Button>
                        <Button icon={<ProfileOutlined />} onClick={() => notification.info({message: 'Column customization is not yet implemented.'})}>Columns</Button>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>Add New</Button>
                    </Space>
                </Col>
            </Row>

            <div className="p-4 mb-6 bg-gray-50 rounded-lg">
                <Row gutter={16} align="bottom">
                    <Col>
                        <Form.Item label="Search" style={{ marginBottom: 0 }}>
                            <Input.Search placeholder="Search by name or code..." onSearch={setSearchTerm} allowClear style={{width: 250}} />
                        </Form.Item>
                    </Col>
                    <Col>
                        <Form.Item label="Status" style={{ marginBottom: 0 }}>
                            <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }}>
                                <Select.Option value="all">All</Select.Option>
                                <Select.Option value="active">Active</Select.Option>
                                <Select.Option value="inactive">Inactive</Select.Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>
            </div>

            <Table
                columns={columns}
                dataSource={goodsTypes}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
                onRow={(record) => ({ onDoubleClick: () => navigate(`/goods/types/${record.id}`)})}
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