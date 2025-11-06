import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { Uom, UomCategory } from '../../types/supabase';
import {
    Button, Table, Tag, Space, App, Card, Row, Col, Input, Select, Modal, Form, Dropdown, Menu, Typography, InputNumber
} from 'antd';
import { useNavigate } from 'react-router-dom';
import {
    PlusOutlined, ExportOutlined, ProfileOutlined, EllipsisOutlined, EyeOutlined, EditOutlined, DeleteOutlined
} from '@ant-design/icons';
import useAuthStore from '../../stores/authStore';

const { Title, Text } = Typography;

type UomWithCategory = Uom & { uom_categories: { name: string } | null };

const UomsListPage: React.FC = () => {
    const [uoms, setUoms] = useState<UomWithCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const { notification, modal } = App.useApp();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const user = useAuthStore((state) => state.user);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [categories, setCategories] = useState<UomCategory[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const isBaseUnit = Form.useWatch('is_base', form);


    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase.from('uoms').select('*, uom_categories(name)');
            if (searchTerm) query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`);
            if (statusFilter !== 'all') query = query.eq('is_active', statusFilter === 'active');
            const { data, error } = await query.order('name', { ascending: true });
            if (error) throw error;
            setUoms(data as UomWithCategory[] || []);
        } catch (error: any) {
            notification.error({ message: "Error fetching UoMs", description: error.message });
        } finally {
            setLoading(false);
        }
    }, [notification, searchTerm, statusFilter]);
    
    const fetchCategories = useCallback(async () => {
        try {
            const { data, error } = await supabase.from('uom_categories').select('id, name').eq('is_active', true);
            if (error) throw error;
            setCategories(data || []);
        } catch (error: any) {
            notification.error({ message: "Error fetching categories", description: error.message });
        }
    }, [notification]);

    useEffect(() => {
        fetchData();
        fetchCategories();
    }, [fetchData, fetchCategories]);

    const handleCreate = () => {
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleCancel = () => setIsModalOpen(false);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const values = await form.validateFields();
            const dataToSave = { ...values, created_by: user?.id, updated_by: user?.id };
            if (dataToSave.is_base) {
                dataToSave.ratio_to_base = 1;
            }
            const { error } = await supabase.from('uoms').insert(dataToSave).select();
            if (error) throw error;
            notification.success({ message: "UoM created successfully" });
            setIsModalOpen(false);
            fetchData();
        } catch (error: any) {
            notification.error({ message: "Failed to create UoM", description: error.message });
        } finally {
            setIsSaving(false);
        }
    };
    
     const handleDelete = (id: number) => {
        modal.confirm({
            title: 'Are you sure?',
            content: 'This action cannot be undone.',
            okText: 'Yes, delete it',
            okType: 'danger',
            onOk: async () => {
                try {
                    const { error } = await supabase.from('uoms').delete().eq('id', id);
                    if (error) throw error;
                    notification.success({ message: 'UoM deleted successfully' });
                    fetchData();
                } catch (error: any) {
                    notification.error({ message: 'Failed to delete', description: error.message });
                }
            },
        });
    };

    const actionMenu = (record: Uom) => (
        <Menu>
            <Menu.Item key="1" icon={<EyeOutlined />} onClick={() => navigate(`/master/uoms/${record.id}`)}>View</Menu.Item>
            <Menu.Item key="2" icon={<EditOutlined />} onClick={() => navigate(`/master/uoms/${record.id}`)}>Edit</Menu.Item>
            <Menu.Divider />
            <Menu.Item key="3" icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)}>Delete</Menu.Item>
        </Menu>
    );

    const columns = [
        { title: 'Code', dataIndex: 'code', key: 'code', sorter: (a: Uom, b: Uom) => a.code.localeCompare(b.code) },
        { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a: Uom, b: Uom) => a.name.localeCompare(b.name) },
        { title: 'Category', dataIndex: 'uom_categories', key: 'category', render: (cat: { name: string } | null) => cat?.name || '-', sorter: (a: UomWithCategory, b: UomWithCategory) => (a.uom_categories?.name || '').localeCompare(b.uom_categories?.name || '') },
        { title: 'Base Unit', dataIndex: 'is_base', key: 'is_base', render: (isBase: boolean) => <Tag color={isBase ? 'blue' : 'default'}>{isBase ? 'Yes' : 'No'}</Tag> },
        { title: 'Ratio', dataIndex: 'ratio_to_base', key: 'ratio_to_base' },
        { title: 'Status', dataIndex: 'is_active', key: 'is_active', render: (isActive: boolean) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Tag> },
        {
            title: 'Actions',
            key: 'action',
             align: 'center' as const,
            render: (_: any, record: Uom) => (
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
                    <Title level={4} style={{ margin: 0 }}>Units of Measure</Title>
                    <Text type="secondary">Manage all units of measure.</Text>
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
                dataSource={uoms}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
                onRow={(record) => ({ onDoubleClick: () => navigate(`/master/uoms/${record.id}`)})}
            />

            <Modal title="Create UoM" open={isModalOpen} onOk={handleSave} onCancel={handleCancel} confirmLoading={isSaving} okText="Save">
                <Form form={form} layout="vertical" name="create_uom_form" className="mt-6">
                    <Form.Item name="category_id" label="Category" rules={[{ required: true }]}><Select options={categories.map(c => ({ label: c.name, value: c.id }))} /></Form.Item>
                    <Form.Item name="code" label="Code" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="is_base" label="Is Base Unit" initialValue={false}><Select><Select.Option value={true}>Yes</Select.Option><Select.Option value={false}>No</Select.Option></Select></Form.Item>
                    <Form.Item name="ratio_to_base" label="Ratio to Base" initialValue={1} rules={[{ required: !isBaseUnit, message: "Ratio is required for non-base units" }]}><InputNumber style={{ width: '100%' }} min={0} disabled={isBaseUnit} /></Form.Item>
                    <Form.Item name="is_active" label="Status" initialValue={true}><Select><Select.Option value={true}>Active</Select.Option><Select.Option value={false}>Inactive</Select.Option></Select></Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

const UomsListPageWrapper: React.FC = () => (
    <App><UomsListPage /></App>
);

export default UomsListPageWrapper;