import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { Warehouse, Branch } from '../../types/supabase';
import {
    Button, Table, Tag, Space, App, Card, Row, Col, Input, Select, Modal, Form, Dropdown, Menu, Typography
} from 'antd';
import { useNavigate } from 'react-router-dom';
import {
    PlusOutlined, ExportOutlined, ProfileOutlined, EllipsisOutlined, EyeOutlined, EditOutlined, DeleteOutlined
} from '@ant-design/icons';
import useAuthStore from '../../stores/authStore';

const { Title, Text } = Typography;
const WAREHOUSE_TYPES = ['NORMAL', 'QUARANTINE', 'DAMAGE'];

type WarehouseWithBranch = Warehouse & { branches: { name: string } | null };

const WarehousesListPage: React.FC = () => {
    const [warehouses, setWarehouses] = useState<WarehouseWithBranch[]>([]);
    const [loading, setLoading] = useState(true);
    const { notification, modal } = App.useApp();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const user = useAuthStore((state) => state.user);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase.from('warehouses').select('*, branches(name)');
             if (searchTerm) query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`);
            if (statusFilter !== 'all') query = query.eq('is_active', statusFilter === 'active');
            const { data, error } = await query.order('name', { ascending: true });
            if (error) throw error;
            setWarehouses(data as WarehouseWithBranch[] || []);
        } catch (error: any) {
            notification.error({ message: "Error fetching warehouses", description: error.message });
        } finally {
            setLoading(false);
        }
    }, [notification, searchTerm, statusFilter]);

    const fetchBranches = useCallback(async () => {
        try {
            const { data, error } = await supabase.from('branches').select('id, name').eq('is_active', true);
            if (error) throw error;
            setBranches(data || []);
        } catch (error: any) {
            notification.error({ message: "Error fetching branches", description: error.message });
        }
    }, [notification]);

    useEffect(() => {
        fetchData();
        fetchBranches();
    }, [fetchData, fetchBranches]);

     const handleCreate = () => {
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleCancel = () => setIsModalOpen(false);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const values = await form.validateFields();
            const { error } = await supabase.from('warehouses').insert({ ...values, created_by: user?.id, updated_by: user?.id }).select();
            if (error) throw error;
            notification.success({ message: "Warehouse created successfully" });
            setIsModalOpen(false);
            fetchData();
        } catch (error: any) {
            notification.error({ message: "Failed to create warehouse", description: error.message });
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
                    const { error } = await supabase.from('warehouses').delete().eq('id', id);
                    if (error) throw error;
                    notification.success({ message: 'Warehouse deleted successfully' });
                    fetchData();
                } catch (error: any) {
                    notification.error({ message: 'Failed to delete', description: error.message });
                }
            },
        });
    };

    const actionMenu = (record: Warehouse) => (
        <Menu>
            <Menu.Item key="1" icon={<EyeOutlined />} onClick={() => navigate(`/master/warehouses/${record.id}`)}>View</Menu.Item>
            <Menu.Item key="2" icon={<EditOutlined />} onClick={() => navigate(`/master/warehouses/${record.id}`)}>Edit</Menu.Item>
            <Menu.Divider />
            <Menu.Item key="3" icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)}>Delete</Menu.Item>
        </Menu>
    );

    const columns = [
        { title: 'Code', dataIndex: 'code', key: 'code', sorter: (a: Warehouse, b: Warehouse) => a.code.localeCompare(b.code) },
        { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a: Warehouse, b: Warehouse) => a.name.localeCompare(b.name) },
        { title: 'Branch', dataIndex: 'branches', key: 'branch', render: (branch: { name: string } | null) => branch?.name || '-', sorter: (a: WarehouseWithBranch, b: WarehouseWithBranch) => (a.branches?.name || '').localeCompare(b.branches?.name || '') },
        { title: 'Type', dataIndex: 'warehouse_type', key: 'warehouse_type', render: (type: string) => <Tag>{type}</Tag> },
        { title: 'Status', dataIndex: 'is_active', key: 'is_active', render: (isActive: boolean) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Tag> },
        {
            title: 'Actions',
            key: 'action',
             align: 'center' as const,
            render: (_: any, record: Warehouse) => (
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
                    <Title level={4} style={{ margin: 0 }}>Warehouses</Title>
                    <Text type="secondary">Manage all warehouses in the system.</Text>
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
                dataSource={warehouses}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
                onRow={(record) => ({ onDoubleClick: () => navigate(`/master/warehouses/${record.id}`)})}
            />
            
            <Modal title="Create Warehouse" open={isModalOpen} onOk={handleSave} onCancel={handleCancel} confirmLoading={isSaving} okText="Save">
                 <Form form={form} layout="vertical" name="create_warehouse_form" className="mt-6">
                    <Form.Item name="branch_id" label="Branch" rules={[{ required: true }]}><Select options={branches.map(b => ({ label: b.name, value: b.id }))} /></Form.Item>
                    <Form.Item name="code" label="Code" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="warehouse_type" label="Warehouse Type" initialValue="NORMAL"><Select options={WAREHOUSE_TYPES.map(t => ({ label: t, value: t }))} /></Form.Item>
                    <Form.Item name="is_active" label="Status" initialValue={true}><Select><Select.Option value={true}>Active</Select.Option><Select.Option value={false}>Inactive</Select.Option></Select></Form.Item>
                    <Form.Item name="description" label="Notes"><Input.TextArea rows={3} /></Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

const WarehousesListPageWrapper: React.FC = () => (
    <App><WarehousesListPage /></App>
);

export default WarehousesListPageWrapper;