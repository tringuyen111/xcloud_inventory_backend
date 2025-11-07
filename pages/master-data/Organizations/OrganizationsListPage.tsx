import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { Organization } from '../../../types/supabase';
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

const defaultColumns: TableProps<Organization>['columns'] = [
    { title: 'Code', dataIndex: 'code', key: 'code', sorter: (a: Organization, b: Organization) => a.code.localeCompare(b.code) },
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a: Organization, b: Organization) => a.name.localeCompare(b.name) },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Status', dataIndex: 'is_active', key: 'is_active', render: (isActive: boolean) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Tag> },
    {
        title: 'Actions',
        key: 'action',
        align: 'center' as const,
        render: () => <EllipsisOutlined />, // Placeholder, actual render is in getColumns
    },
];

const OrganizationsListPage: React.FC = () => {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const { notification, modal } = App.useApp();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const user = useAuthStore((state) => state.user);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns.map(c => c.key as string));

    const fetchData = useCallback(async (page: number, pageSize: number) => {
        setLoading(true);
        try {
            let query = supabase.from('organizations').select('*', { count: 'exact' });
            if (searchTerm) query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`);
            if (statusFilter !== 'all') query = query.eq('is_active', statusFilter === 'active');
            if (dateRange && dateRange[0]) query = query.gte('updated_at', dateRange[0].startOf('day').toISOString());
            if (dateRange && dateRange[1]) query = query.lte('updated_at', dateRange[1].endOf('day').toISOString());
            
            const { data, error, count } = await query
                .order('name', { ascending: true })
                .range((page - 1) * pageSize, page * pageSize - 1);

            if (error) throw error;
            setOrganizations(data || []);
            setPagination(prev => ({ ...prev, total: count || 0 }));
        } catch (error: any) {
            notification.error({ message: "Error fetching organizations", description: error.message });
        } finally {
            setLoading(false);
        }
    }, [notification, searchTerm, statusFilter, dateRange]);

    useEffect(() => {
        fetchData(pagination.current, pagination.pageSize);
    }, [fetchData, pagination.current, pagination.pageSize]);
    
    const handleTableChange = (paginationConfig: any) => {
        setPagination({
            current: paginationConfig.current,
            pageSize: paginationConfig.pageSize,
            total: pagination.total
        });
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
            const { error } = await supabase.from('organizations').insert({ ...values, created_by: user?.id, updated_by: user?.id }).select();
            if (error) throw error;
            notification.success({ message: "Organization created successfully" });
            setIsModalOpen(false);
            fetchData(1, pagination.pageSize);
            setPagination(p => ({...p, current: 1}));
        } catch (error: any) {
            notification.error({ message: "Failed to create organization", description: error.message });
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
                    const { error } = await supabase.from('organizations').delete().eq('id', id);
                    if (error) throw error;
                    notification.success({ message: 'Organization deleted successfully' });
                    fetchData(pagination.current, pagination.pageSize);
                } catch (error: any) {
                    notification.error({ message: 'Failed to delete', description: error.message });
                }
            },
        });
    };
    
    const exportToCsv = (filename: string, data: Organization[]) => {
        const visibleCols = defaultColumns.filter(c => visibleColumns.includes(c.key as string) && c.key !== 'action');
        const header = visibleCols.map(c => c.title).join(',');
        const rows = data.map(row => 
            visibleCols.map(col => {
                const value = row[col.dataIndex as keyof Organization];
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
        const actionMenu = (record: Organization) => (
            <Menu>
                <Menu.Item key="1" icon={<EyeOutlined />} onClick={() => navigate(`/master-data/organizations/${record.id}`)}>View</Menu.Item>
                <Menu.Item key="2" icon={<EditOutlined />} onClick={() => navigate(`/master-data/organizations/${record.id}`)}>Edit</Menu.Item>
                <Menu.Divider />
                <Menu.Item key="3" icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)}>Delete</Menu.Item>
            </Menu>
        );

        const cols = [...defaultColumns];
        const actionCol = cols.find(c => c.key === 'action');
        if (actionCol) {
            actionCol.render = (_: any, record: Organization) => (
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
                    <Title level={4} style={{ margin: 0 }}>Organizations</Title>
                    <Text type="secondary">Manage all organizations in the system.</Text>
                </Col>
                <Col>
                    <Space>
                        <Button icon={<ExportOutlined />} onClick={() => exportToCsv('organizations.csv', organizations)}>Export</Button>
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
                <Row gutter={[16, 16]} align="bottom">
                    <Col><Form.Item label="Search" style={{ marginBottom: 0 }}><Input.Search placeholder="Search by name or code..." onSearch={(val) => {setSearchTerm(val); setPagination(p=>({...p, current:1}));}} allowClear style={{width: 250}} /></Form.Item></Col>
                    <Col><Form.Item label="Status" style={{ marginBottom: 0 }}><Select value={statusFilter} onChange={(val) => {setStatusFilter(val); setPagination(p=>({...p, current:1}));}} style={{ width: 120 }}><Select.Option value="all">All</Select.Option><Select.Option value="active">Active</Select.Option><Select.Option value="inactive">Inactive</Select.Option></Select></Form.Item></Col>
                    <Col><Form.Item label="Updated At" style={{ marginBottom: 0 }}><RangePicker onChange={(dates) => {setDateRange(dates); setPagination(p=>({...p, current:1}));}} /></Form.Item></Col>
                </Row>
            </div>

            <Table
                columns={getColumns()}
                dataSource={organizations}
                rowKey="id"
                loading={loading}
                pagination={{...pagination, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'], showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`}}
                onChange={handleTableChange}
                onRow={(record) => ({ onDoubleClick: () => navigate(`/master-data/organizations/${record.id}`)})}
            />

            <Modal title="Create Organization" open={isModalOpen} onOk={handleSave} onCancel={handleCancel} confirmLoading={isSaving} okText="Save" width={600}>
                <Form form={form} layout="vertical" name="create_org_form" className="mt-6">
                     <Row gutter={16}>
                        <Col span={12}><Form.Item name="code" label="Code" rules={[{ required: true }]}><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="tax_id" label="Tax ID"><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="phone" label="Phone"><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="email" label="Email" rules={[{ type: 'email' }]}><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="website" label="Website"><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="is_active" label="Status" initialValue={true}><Select><Select.Option value={true}>Active</Select.Option><Select.Option value={false}>Inactive</Select.Option></Select></Form.Item></Col>
                        <Col span={24}><Form.Item name="address" label="Address"><Input.TextArea rows={3} /></Form.Item></Col>
                        <Col span={24}><Form.Item name="notes" label="Notes"><Input.TextArea rows={3} /></Form.Item></Col>
                     </Row>
                </Form>
            </Modal>
        </Card>
    );
};

const OrganizationsListPageWrapper: React.FC = () => (
    <App><OrganizationsListPage /></App>
);

export default OrganizationsListPageWrapper;
