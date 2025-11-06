import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { Partner, Organization } from '../../types/supabase';
import {
    Button, Table, Tag, Space, App, Card, Row, Col, Input, Select, Modal, Form, Dropdown, Menu, Typography
} from 'antd';
import { useNavigate } from 'react-router-dom';
import {
    PlusOutlined, ExportOutlined, ProfileOutlined, EllipsisOutlined, EyeOutlined, EditOutlined, DeleteOutlined
} from '@ant-design/icons';
import useAuthStore from '../../stores/authStore';

const { Title, Text } = Typography;
const PARTNER_TYPES: Partner['partner_type'][] = ['CUSTOMER', 'SUPPLIER', 'CARRIER', 'OTHER'];
type PartnerWithOrg = Partner & { organizations: { name: string } | null };

const PartnersListPage: React.FC = () => {
    const [partners, setPartners] = useState<PartnerWithOrg[]>([]);
    const [loading, setLoading] = useState(true);
    const { notification, modal } = App.useApp();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const user = useAuthStore((state) => state.user);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase.from('partners').select('*, organizations(name)');
            if (searchTerm) query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`);
            if (statusFilter !== 'all') query = query.eq('is_active', statusFilter === 'active');
            const { data, error } = await query.order('name', { ascending: true });
            if (error) throw error;
            setPartners(data as PartnerWithOrg[] || []);
        } catch (error: any) {
            notification.error({ message: "Error fetching partners", description: error.message });
        } finally {
            setLoading(false);
        }
    }, [notification, searchTerm, statusFilter]);
    
    const fetchOrganizations = useCallback(async () => {
        try {
            const { data, error } = await supabase.from('organizations').select('id, name').eq('is_active', true);
            if (error) throw error;
            setOrganizations(data || []);
        } catch (error: any) {
             notification.error({ message: "Error fetching organizations", description: error.message });
        }
    }, [notification]);

    useEffect(() => {
        fetchData();
        fetchOrganizations();
    }, [fetchData, fetchOrganizations]);

     const handleCreate = () => {
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleCancel = () => setIsModalOpen(false);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const values = await form.validateFields();
            const { error } = await supabase.from('partners').insert({ ...values, created_by: user?.id, updated_by: user?.id }).select();
            if (error) throw error;
            notification.success({ message: "Partner created successfully" });
            setIsModalOpen(false);
            fetchData();
        } catch (error: any) {
            notification.error({ message: "Failed to create partner", description: error.message });
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
                    const { error } = await supabase.from('partners').delete().eq('id', id);
                    if (error) throw error;
                    notification.success({ message: 'Partner deleted successfully' });
                    fetchData();
                } catch (error: any) {
                    notification.error({ message: 'Failed to delete', description: error.message });
                }
            },
        });
    };

    const actionMenu = (record: Partner) => (
        <Menu>
            <Menu.Item key="1" icon={<EyeOutlined />} onClick={() => navigate(`/master/partners/${record.id}`)}>View</Menu.Item>
            <Menu.Item key="2" icon={<EditOutlined />} onClick={() => navigate(`/master/partners/${record.id}`)}>Edit</Menu.Item>
            <Menu.Divider />
            <Menu.Item key="3" icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)}>Delete</Menu.Item>
        </Menu>
    );
    
    const getTypeTagColor = (type: Partner['partner_type']) => {
        switch(type) {
          case 'CUSTOMER': return 'blue';
          case 'SUPPLIER': return 'orange';
          case 'CARRIER': return 'purple';
          default: return 'default';
        }
    };

    const columns = [
        { title: 'Code', dataIndex: 'code', key: 'code', sorter: (a: Partner, b: Partner) => a.code.localeCompare(b.code) },
        { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a: Partner, b: Partner) => a.name.localeCompare(b.name) },
        { title: 'Organization', dataIndex: 'organizations', key: 'organization', render: (org: { name: string } | null) => org?.name || '-', sorter: (a: PartnerWithOrg, b: PartnerWithOrg) => (a.organizations?.name || '').localeCompare(b.organizations?.name || '') },
        { title: 'Type', dataIndex: 'partner_type', key: 'partner_type', render: (type: Partner['partner_type']) => <Tag color={getTypeTagColor(type)}>{type}</Tag> },
        { title: 'Status', dataIndex: 'is_active', key: 'is_active', render: (isActive: boolean) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Tag> },
        {
            title: 'Actions',
            key: 'action',
            align: 'center' as const,
            render: (_: any, record: Partner) => (
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
                    <Title level={4} style={{ margin: 0 }}>Partners</Title>
                    <Text type="secondary">Manage customers, suppliers, and other partners.</Text>
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
                dataSource={partners}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
                onRow={(record) => ({ onDoubleClick: () => navigate(`/master/partners/${record.id}`)})}
            />

            <Modal title="Create Partner" open={isModalOpen} onOk={handleSave} onCancel={handleCancel} confirmLoading={isSaving} okText="Save" width={600}>
                <Form form={form} layout="vertical" name="create_partner_form" className="mt-6">
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="org_id" label="Organization" rules={[{ required: true }]}><Select options={organizations.map(org => ({ label: org.name, value: org.id }))} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="code" label="Code" rules={[{ required: true }]}><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="partner_type" label="Partner Type" initialValue="CUSTOMER"><Select options={PARTNER_TYPES.map(t => ({ label: t, value: t }))} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="tax_id" label="Tax ID"><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="phone" label="Phone"><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="email" label="Email" rules={[{ type: 'email' }]}><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="is_active" label="Status" initialValue={true}><Select><Select.Option value={true}>Active</Select.Option><Select.Option value={false}>Inactive</Select.Option></Select></Form.Item></Col>
                        <Col span={24}><Form.Item name="address" label="Address"><Input.TextArea rows={3} /></Form.Item></Col>
                        <Col span={24}><Form.Item name="notes" label="Notes"><Input.TextArea rows={3} /></Form.Item></Col>
                    </Row>
                </Form>
            </Modal>
        </Card>
    );
};

const PartnersListPageWrapper: React.FC = () => (
    <App><PartnersListPage /></App>
);

export default PartnersListPageWrapper;