import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { Uom, UomCategory } from '../../../types/supabase';
import {
    Button, Table, Tag, Space, App, Card, Row, Col, Input, Select, Modal, Form, Dropdown, Menu, Typography, InputNumber, DatePicker, Checkbox
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

type UomWithCategory = Uom & { uom_categories: { name: string } | null };

const defaultColumns: TableProps<UomWithCategory>['columns'] = [
    { title: 'Code', dataIndex: 'code', key: 'code', sorter: (a, b) => a.code.localeCompare(b.code) },
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: 'Category', dataIndex: ['uom_categories', 'name'], key: 'category', sorter: (a, b) => (a.uom_categories?.name || '').localeCompare(b.uom_categories?.name || '') },
    { title: 'Base Unit', dataIndex: 'is_base', key: 'is_base', render: (isBase: boolean) => <Tag color={isBase ? 'blue' : 'default'}>{isBase ? 'Yes' : 'No'}</Tag> },
    { title: 'Ratio', dataIndex: 'ratio_to_base', key: 'ratio_to_base' },
    { title: 'Status', dataIndex: 'is_active', key: 'is_active', render: (isActive: boolean) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Tag> },
    {
        title: 'Actions',
        key: 'action',
        align: 'center' as const,
        render: () => <EllipsisOutlined />,
    },
];

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
    const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
    const [isBaseFilter, setIsBaseFilter] = useState<string>('all');
    const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const isBaseUnit = Form.useWatch('is_base', form);
    
    const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns.map(c => c.key as string));

    const fetchData = useCallback(async (page: number, pageSize: number) => {
        setLoading(true);
        try {
            let query = supabase.from('uoms').select('*, uom_categories(name)', { count: 'exact' });
            if (searchTerm) query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`);
            if (statusFilter !== 'all') query = query.eq('is_active', statusFilter === 'active');
            if (categoryFilter) query = query.eq('category_id', categoryFilter);
            if (isBaseFilter !== 'all') query = query.eq('is_base', isBaseFilter === 'yes');
            if (dateRange && dateRange[0]) query = query.gte('updated_at', dateRange[0].startOf('day').toISOString());
            if (dateRange && dateRange[1]) query = query.lte('updated_at', dateRange[1].endOf('day').toISOString());
            
            const { data, error, count } = await query
                .order('name', { ascending: true })
                .range((page - 1) * pageSize, page * pageSize - 1);
            
            if (error) throw error;
            setUoms(data as UomWithCategory[] || []);
            setPagination(prev => ({...prev, total: count || 0 }));
        } catch (error: any) {
            notification.error({ message: "Error fetching UoMs", description: error.message });
        } finally {
            setLoading(false);
        }
    }, [notification, searchTerm, statusFilter, categoryFilter, isBaseFilter, dateRange]);
    
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
        fetchData(pagination.current, pagination.pageSize);
    }, [fetchData, pagination.current, pagination.pageSize]);
    
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

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
            const dataToSave = { ...values, created_by: user?.id, updated_by: user?.id };
            if (dataToSave.is_base) {
                dataToSave.ratio_to_base = 1;
            }
            const { error } = await supabase.from('uoms').insert(dataToSave).select();
            if (error) throw error;
            notification.success({ message: "UoM created successfully" });
            setIsModalOpen(false);
            fetchData(1, pagination.pageSize);
            setPagination(p=>({...p, current:1}));
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
                    fetchData(pagination.current, pagination.pageSize);
                } catch (error: any) {
                    notification.error({ message: 'Failed to delete', description: error.message });
                }
            },
        });
    };

    const exportToCsv = (filename: string, data: UomWithCategory[]) => {
        const visibleCols = defaultColumns.filter(c => visibleColumns.includes(c.key as string) && c.key !== 'action');
        const header = visibleCols.map(c => c.title).join(',');
        const rows = data.map(row => 
            visibleCols.map(col => {
                let value;
                 if (Array.isArray(col.dataIndex)) {
                     value = col.dataIndex.reduce((obj, key) => (obj && obj[key] !== 'undefined') ? obj[key] : '', row);
                } else {
                    value = row[col.dataIndex as keyof UomWithCategory];
                }
                if (value === null || value === undefined) return '';
                if (typeof value === 'boolean') return value ? 'Yes' : 'No';
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
        const actionMenu = (record: Uom) => (
            <Menu>
                <Menu.Item key="1" icon={<EyeOutlined />} onClick={() => navigate(`/master-data/uoms/${record.id}`)}>View</Menu.Item>
                <Menu.Item key="2" icon={<EditOutlined />} onClick={() => navigate(`/master-data/uoms/${record.id}`)}>Edit</Menu.Item>
                <Menu.Divider />
                <Menu.Item key="3" icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)}>Delete</Menu.Item>
            </Menu>
        );
        const cols = [...defaultColumns];
        const actionCol = cols.find(c => c.key === 'action');
        if (actionCol) {
            actionCol.render = (_: any, record: Uom) => (
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
                    <Title level={4} style={{ margin: 0 }}>Units of Measure</Title>
                    <Text type="secondary">Manage all units of measure.</Text>
                 </Col>
                <Col>
                    <Space>
                        <Button icon={<ExportOutlined />} onClick={() => exportToCsv('uoms.csv', uoms)}>Export</Button>
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
                    <Col><Form.Item label="Category" style={{ marginBottom: 0 }}><Select allowClear placeholder="All Categories" value={categoryFilter} onChange={val=>{setCategoryFilter(val); setPagination(p=>({...p, current:1}));}} style={{ width: 150 }} options={categories.map(c => ({label: c.name, value: c.id}))} /></Form.Item></Col>
                    <Col><Form.Item label="Base Unit" style={{ marginBottom: 0 }}><Select value={isBaseFilter} onChange={val=>{setIsBaseFilter(val); setPagination(p=>({...p, current:1}));}} style={{ width: 120 }}><Select.Option value="all">All</Select.Option><Select.Option value="yes">Yes</Select.Option><Select.Option value="no">No</Select.Option></Select></Form.Item></Col>
                    <Col><Form.Item label="Status" style={{ marginBottom: 0 }}><Select value={statusFilter} onChange={val=>{setStatusFilter(val); setPagination(p=>({...p, current:1}));}} style={{ width: 120 }}><Select.Option value="all">All</Select.Option><Select.Option value="active">Active</Select.Option><Select.Option value="inactive">Inactive</Select.Option></Select></Form.Item></Col>
                    <Col><Form.Item label="Updated At" style={{ marginBottom: 0 }}><RangePicker onChange={dates=>{setDateRange(dates); setPagination(p=>({...p, current:1}));}} /></Form.Item></Col>
                </Row>
            </div>

            <Table
                columns={getColumns()}
                dataSource={uoms}
                rowKey="id"
                loading={loading}
                pagination={{...pagination, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'], showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`}}
                onChange={handleTableChange}
                onRow={(record) => ({ onDoubleClick: () => navigate(`/master-data/uoms/${record.id}`)})}
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
