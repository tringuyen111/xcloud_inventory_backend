import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { GoodsModel, GoodsType, Uom } from '../../types/supabase';
import {
    Button, Table, Tag, Space, App, Card, Row, Col, Input, Select, Modal, Form, Dropdown, Menu, Typography
} from 'antd';
import { useNavigate } from 'react-router-dom';
import {
    PlusOutlined, ExportOutlined, ProfileOutlined, EllipsisOutlined, EyeOutlined, EditOutlined, DeleteOutlined
} from '@ant-design/icons';
import useAuthStore from '../../stores/authStore';

const { Title, Text } = Typography;

type GoodsModelWithDetails = GoodsModel & { 
    goods_types: { name: string } | null;
    uoms: { name: string } | null;
};

const GoodsModelsListPage: React.FC = () => {
    const [goodsModels, setGoodsModels] = useState<GoodsModelWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const { notification, modal } = App.useApp();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const user = useAuthStore((state) => state.user);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [goodsTypes, setGoodsTypes] = useState<GoodsType[]>([]);
    const [uoms, setUoms] = useState<Uom[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase.from('goods_models').select('*, goods_types(name), uoms(name)');
            if (searchTerm) query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`);
            if (statusFilter !== 'all') query = query.eq('is_active', statusFilter === 'active');
            const { data, error } = await query.order('name', { ascending: true });

            if (error) throw error;
            setGoodsModels(data as GoodsModelWithDetails[] || []);
        } catch (error: any) {
            notification.error({ message: "Error fetching goods models", description: error.message });
        } finally {
            setLoading(false);
        }
    }, [notification, searchTerm, statusFilter]);
    
    const fetchDropdownData = useCallback(async () => {
        try {
            const [typesRes, uomsRes] = await Promise.all([
                supabase.from('goods_types').select('id, name').eq('is_active', true),
                supabase.from('uoms').select('id, name').eq('is_active', true)
            ]);
            if (typesRes.error) throw typesRes.error;
            if (uomsRes.error) throw uomsRes.error;
            setGoodsTypes(typesRes.data || []);
            setUoms(uomsRes.data || []);
        } catch (error: any) {
             notification.error({ message: "Error fetching related data", description: error.message });
        }
    }, [notification]);

    useEffect(() => {
        fetchData();
        fetchDropdownData();
    }, [fetchData, fetchDropdownData]);

    const handleCreate = () => {
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleCancel = () => setIsModalOpen(false);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const values = await form.validateFields();
            const { error } = await supabase.from('goods_models').insert({ ...values, created_by: user?.id, updated_by: user?.id }).select();
            if (error) throw error;
            notification.success({ message: "Goods Model created successfully" });
            setIsModalOpen(false);
            fetchData();
        } catch (error: any) {
            notification.error({ message: "Failed to create Goods Model", description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (id: number) => {
        modal.confirm({
            title: 'Are you sure you want to delete this goods model?',
            content: 'This action cannot be undone.',
            okText: 'Yes, delete it',
            okType: 'danger',
            onOk: async () => {
                try {
                    const { error } = await supabase.from('goods_models').delete().eq('id', id);
                    if (error) throw error;
                    notification.success({ message: 'Goods Model deleted successfully' });
                    fetchData();
                } catch (error: any) {
                    notification.error({ message: 'Failed to delete Goods Model', description: error.message });
                }
            },
        });
    };
    
    const actionMenu = (record: GoodsModel) => (
        <Menu>
            <Menu.Item key="1" icon={<EyeOutlined />} onClick={() => navigate(`/goods/models/${record.id}`)}>View</Menu.Item>
            <Menu.Item key="2" icon={<EditOutlined />} onClick={() => navigate(`/goods/models/${record.id}`)}>Edit</Menu.Item>
            <Menu.Divider />
            <Menu.Item key="3" icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)}>Delete</Menu.Item>
        </Menu>
    );

    const columns = [
        { title: 'Code', dataIndex: 'code', key: 'code', sorter: (a: GoodsModel, b: GoodsModel) => a.code.localeCompare(b.code) },
        { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a: GoodsModel, b: GoodsModel) => a.name.localeCompare(b.name)},
        { title: 'Goods Type', dataIndex: 'goods_types', key: 'goods_type', render: (type: { name: string } | null) => type?.name || '-', sorter: (a: GoodsModelWithDetails, b: GoodsModelWithDetails) => (a.goods_types?.name || '').localeCompare(b.goods_types?.name || '') },
        { title: 'Base UoM', dataIndex: 'uoms', key: 'base_uom', render: (uom: { name: string } | null) => uom?.name || '-', sorter: (a: GoodsModelWithDetails, b: GoodsModelWithDetails) => (a.uoms?.name || '').localeCompare(b.uoms?.name || '') },
        { title: 'Tracking', dataIndex: 'tracking_type', key: 'tracking_type', render: (type: string) => <Tag>{type}</Tag> },
        { title: 'Status', dataIndex: 'is_active', key: 'is_active', render: (isActive: boolean) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Tag> },
        {
            title: 'Actions',
            key: 'action',
            align: 'center' as const,
            render: (_: any, record: GoodsModel) => (
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
                    <Title level={4} style={{ margin: 0 }}>Goods Models</Title>
                    <Text type="secondary">Manage all goods models (SKUs) in the system.</Text>
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
                    <Col><Form.Item label="Search" style={{ marginBottom: 0 }}><Input.Search placeholder="Search by name or code..." onSearch={setSearchTerm} allowClear style={{width: 250}} /></Form.Item></Col>
                    <Col><Form.Item label="Status" style={{ marginBottom: 0 }}><Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }}><Select.Option value="all">All</Select.Option><Select.Option value="active">Active</Select.Option><Select.Option value="inactive">Inactive</Select.Option></Select></Form.Item></Col>
                </Row>
            </div>

            <Table
                columns={columns}
                dataSource={goodsModels}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
                onRow={(record) => ({ onDoubleClick: () => navigate(`/goods/models/${record.id}`)})}
            />

            <Modal title="Create Goods Model" open={isModalOpen} onOk={handleSave} onCancel={handleCancel} confirmLoading={isSaving} okText="Save" width={600}>
                <Form form={form} layout="vertical" name="create_goods_model_form" className="mt-6">
                     <Row gutter={16}>
                        <Col span={12}><Form.Item name="code" label="Code" rules={[{ required: true }]}><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="goods_type_id" label="Goods Type" rules={[{ required: true }]}><Select options={goodsTypes.map(gt => ({ label: gt.name, value: gt.id }))} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="base_uom_id" label="Base UoM" rules={[{ required: true }]}><Select options={uoms.map(uom => ({ label: uom.name, value: uom.id }))} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="tracking_type" label="Tracking Type" initialValue="NONE" rules={[{ required: true }]}><Select options={['NONE', 'LOT', 'SERIAL'].map(t => ({ label: t, value: t }))} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="is_active" label="Status" initialValue={true}><Select><Select.Option value={true}>Active</Select.Option><Select.Option value={false}>Inactive</Select.Option></Select></Form.Item></Col>
                        <Col span={24}><Form.Item name="description" label="Notes"><Input.TextArea rows={3} /></Form.Item></Col>
                     </Row>
                </Form>
            </Modal>
        </Card>
    );
};

const GoodsModelsListPageWrapper: React.FC = () => (
    <App><GoodsModelsListPage /></App>
);

export default GoodsModelsListPageWrapper;