import React, { useState, useEffect, useCallback } from 'react';
// FIX: Corrected supabase client import path
import { supabase } from '../../services/supabaseClient';
import { Partner, Organization } from '../../types/supabase';
import {
    Button, Table, Tag, Space, App, Card, Row, Col, Input, Select, Modal, Form, Dropdown, Menu, Typography, DatePicker, Checkbox
} from 'antd';
import { useNavigate } from 'react-router-dom';
import {
    PlusOutlined, ExportOutlined, ProfileOutlined, EllipsisOutlined, EyeOutlined, EditOutlined, DeleteOutlined, DownOutlined
} from '@ant-design/icons';
import useAuthStore from '../../stores/authStore';
import type { TableProps } from 'antd';
import type { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const PARTNER_TYPES: Partner['partner_type'][] = ['CUSTOMER', 'SUPPLIER', 'CARRIER', 'OTHER'];
type PartnerWithOrg = Partner & { organizations: { name: string } | null };

const getTypeTagColor = (type: Partner['partner_type']) => {
    switch(type) {
        case 'CUSTOMER': return 'blue';
        case 'SUPPLIER': return 'orange';
        case 'CARRIER': return 'purple';
        default: return 'default';
    }
};

const defaultColumns: TableProps<PartnerWithOrg>['columns'] = [
    { title: 'Code', dataIndex: 'code', key: 'code', sorter: (a, b) => a.code.localeCompare(b.code) },
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: 'Organization', dataIndex: ['organizations', 'name'], key: 'organization', sorter: (a, b) => (a.organizations?.name || '').localeCompare(b.organizations?.name || '') },
    { title: 'Type', dataIndex: 'partner_type', key: 'partner_type', render: (type: Partner['partner_type']) => <Tag color={getTypeTagColor(type)}>{type}</Tag> },
    { title: 'Status', dataIndex: 'is_active', key: 'is_active', render: (isActive: boolean) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Tag> },
    {
        title: 'Actions',
        key: 'action',
        align: 'center' as const,
        render: () => <EllipsisOutlined />,
    },
];

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
    const [orgFilter, setOrgFilter] = useState<number | null>(null);
    const [typeFilter, setTypeFilter] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns.map(c => c.key as string));


    const fetchData = useCallback(async (page: number, pageSize: number) => {
        setLoading(true);
        try {
            let query = supabase.from('partners').select('*, organizations(name)', { count: 'exact' });
            if (searchTerm) query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`);
            if (statusFilter !== 'all') query = query.eq('is_active', statusFilter === 'active');
            if (orgFilter) query = query.eq('org_id', orgFilter);
            if (typeFilter) query = query.eq('partner_type', typeFilter);
            if (dateRange && dateRange[0]) query = query.gte('updated_at', dateRange[0].startOf('day').toISOString());
            if (dateRange && dateRange[1]) query = query.lte('updated_at', dateRange[1].endOf('day').toISOString());
            
            const { data, error, count } = await query
                .order('name', { ascending: true })
                .range((page - 1) * pageSize, page * pageSize - 1);

            if (error) throw error;
            setPartners(data as PartnerWithOrg[] || []);
            setPagination(prev => ({...prev, total: count || 0 }));
        } catch (error: any) {
            notification.error({ message: "Error fetching partners", description: error.message });
        } finally {
            setLoading(false);
        }
    }, [notification, searchTerm, statusFilter, orgFilter, typeFilter, dateRange]);
    
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
        fetchData(pagination.current, pagination.pageSize);
    }, [fetchData, pagination.current, pagination.pageSize]);

    useEffect(() => {
        fetchOrganizations();
    }, [fetchOrganizations]);

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
            const { error } = await supabase.from('partners').insert({ ...values, created_by: user?.id, updated_by: user?.id }).select();
            if (error) throw error;
            notification.success({ message: "Partner created successfully" });
            setIsModalOpen(false);
            fetchData(1, pagination.pageSize);
            setPagination(p=>({...p, current:1}));
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
                    fetchData(pagination.current, pagination.pageSize);
                } catch (error: any) {
                    notification.error({ message: 'Failed to delete', description: error.message });
                }
            },
        });
    };

    const exportToCsv = (filename: string, data: PartnerWithOrg[]) => {
        const visibleCols = defaultColumns.filter(c => visibleColumns.includes(c.key as string) && c.key !== 'action');
        const header = visibleCols.map(c => c.title).join(',');
        const rows = data.map(row => 
            visibleCols.map(col => {
                let value;
                if (Array.isArray(col.dataIndex)) {
                     value = col.dataIndex.reduce((obj, key) => (obj && obj[key] !== 'undefined') ? obj[key] : '', row);
                } else {
                    value = row[col.dataIndex as keyof PartnerWithOrg];
                }
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
        const actionMenu = (record: Partner) => (
            <Menu>
                <Menu.Item key="1" icon={<EyeOutlined />} onClick={() => navigate(`/master/partners/${record.id}`)}>View</Menu.Item>
                <Menu.Item key="2" icon={<EditOutlined />} onClick={() => navigate(`/master/partners/${record.id}`)}>Edit</Menu.Item>
                <Menu.Divider />
                <Menu.Item key="3" icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)}>Delete</Menu.Item>
            </Menu>
        );
        const cols = [...defaultColumns];
        const actionCol = cols.find(c => c.key === 'action');
        if (actionCol) {
            actionCol.render = (_: any, record: Partner) => (
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
                    <Title level={4} style={{ margin: 0 }}>Partners</Title>
                    <Text type="secondary">Manage customers, suppliers, and other partners.</Text>
                 </Col>
                <Col>
                    <Space>
                        <Button icon={<ExportOutlined />} onClick={() => exportToCsv('partners.csv', partners)}>Export</Button>
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
                    <Col><Form.Item label="Search" style={{ marginBottom: 0 }}><Input.Search placeholder="Search by name or code..." onSearch={val=>{setSearchTerm(val); setPagination(p=>({...p, current:1}));}} allowClear style={{width: 250}} /></Form.Item></Col>
                    <Col><Form.Item label="Organization" style={{ marginBottom: 0 }}><Select allowClear placeholder="All Organizations" value={orgFilter} onChange={val=>{setOrgFilter(val); setPagination(p=>({...p, current:1}));}} style={{ width: 150 }} options={organizations.map(o => ({label: o.name, value: o.id}))} /></Form.Item></Col>
                    <Col><Form.Item label="Type" style={{ marginBottom: 0 }}><Select allowClear placeholder="All Types" value={typeFilter} onChange={val=>{setTypeFilter(val); setPagination(p=>({...p, current:1}));}} style={{ width: 150 }} options={PARTNER_TYPES.map(o => ({label: o, value: o}))} /></Form.Item></Col>
                    <Col><Form.Item label="Status" style={{ marginBottom: 0 }}><Select value={statusFilter} onChange={val=>{setStatusFilter(val); setPagination(p=>({...p, current:1}));}} style={{ width: 120 }}><Select.Option value="all">All</Select.Option><Select.Option value="active">Active</Select.Option><Select.Option value="inactive">Inactive</Select.Option></Select></Form.Item></Col>
                    <Col><Form.Item label="Updated At" style={{ marginBottom: 0 }}><RangePicker onChange={dates=>{setDateRange(dates); setPagination(p=>({...p, current:1}));}} /></Form.Item></Col>
                </Row>
            </div>

            <Table
                columns={getColumns()}
                dataSource={partners}
                rowKey="id"
                loading={loading}
                pagination={{...pagination, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'], showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`}}
                onChange={handleTableChange}
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