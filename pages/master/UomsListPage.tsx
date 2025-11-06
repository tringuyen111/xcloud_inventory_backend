import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { Uom, UomCategory } from '../../types/supabase';
import {
  Button, Card, Input, Select, DatePicker, Table, Tag, Modal, Form,
  Row, Col, Typography, Space, App, Popover, Checkbox, InputNumber, Menu, Dropdown
} from 'antd';
import {
  PlusOutlined, EditOutlined, ExportOutlined, DownOutlined, MoreOutlined, StopOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { format } from 'date-fns';
import type { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

type UomWithCategory = Uom & { category?: { name: string } };

const UomsListPageContent: React.FC = () => {
  const [uoms, setUoms] = useState<UomWithCategory[]>([]);
  const [categories, setCategories] = useState<UomCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<UomWithCategory | null>(null);

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    categoryId: 'all',
    isBase: 'all',
    updatedAt: null as [Dayjs, Dayjs] | null,
  });
  
  const [visibleColumns, setVisibleColumns] = useState({
    code: true,
    name: true,
    category: true,
    is_base: true,
    ratio_to_base: true,
    status: true,
    updated_at: true,
  });

  const [form] = Form.useForm();
  const { notification, modal } = App.useApp();
  const isBaseUnit = Form.useWatch('is_base', form);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: catData, error: catError } = await supabase.from('uom_categories').select('id, name').eq('is_active', true);
      if (catError) throw catError;
      setCategories(catData || []);

      let query = supabase.from('uoms').select('*, category:uom_categories(name)');

      if (filters.search) query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
      if (filters.status !== 'all') query = query.eq('is_active', filters.status === 'active');
      if (filters.categoryId !== 'all') query = query.eq('category_id', filters.categoryId);
      if (filters.isBase !== 'all') query = query.eq('is_base', filters.isBase === 'yes');
      if (filters.updatedAt) {
        query = query.gte('updated_at', filters.updatedAt[0].startOf('day').toISOString());
        query = query.lte('updated_at', filters.updatedAt[1].endOf('day').toISOString());
      }
      
      const { data, error: queryError } = await query.order('id', { ascending: true });
      if (queryError) throw queryError;
      setUoms(data || []);
    } catch (err: any) {
      notification.error({ message: "Error loading data", description: err.message });
    } finally {
      setLoading(false);
    }
  }, [filters, notification]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = (record: UomWithCategory | null = null) => {
    setEditingRecord(record);
    form.setFieldsValue(record ? { ...record } : { code: '', name: '', is_active: true, is_base: false, ratio_to_base: 1 });
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const dataToSave = { ...values, updated_at: new Date().toISOString() };
      if (dataToSave.is_base) {
        dataToSave.ratio_to_base = 1;
      }
      
      if (editingRecord) {
        const { error } = await supabase.from('uoms').update(dataToSave).eq('id', editingRecord.id);
        if (error) throw error;
        notification.success({ message: 'UoM updated successfully' });
      } else {
        const { error } = await supabase.from('uoms').insert(dataToSave);
        if (error) throw error;
        notification.success({ message: 'UoM created successfully' });
      }
      handleCancel();
      loadData();
    } catch (err: any) {
      notification.error({ message: 'Save failed', description: err.message });
    }
  };
  
   const handleToggleStatus = (record: Uom) => {
    modal.confirm({
      title: `Confirm ${record.is_active ? 'Deactivation' : 'Activation'}`,
      content: `Are you sure you want to ${record.is_active ? 'deactivate' : 'activate'} the UoM "${record.name}"?`,
      onOk: async () => {
        try {
          const { error } = await supabase
            .from('uoms')
            .update({ is_active: !record.is_active, updated_at: new Date().toISOString() })
            .eq('id', record.id);
          if (error) throw error;
          notification.success({ message: `UoM status updated successfully` });
          loadData();
        } catch (err: any) {
          notification.error({ message: 'Status update failed', description: err.message });
        }
      },
    });
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const columns = [
    { title: 'Code', dataIndex: 'code', key: 'code', hidden: !visibleColumns.code },
    { title: 'Name', dataIndex: 'name', key: 'name', hidden: !visibleColumns.name },
    { title: 'Category', dataIndex: ['category', 'name'], key: 'category', hidden: !visibleColumns.category },
    { title: 'Is Base Unit', dataIndex: 'is_base', key: 'is_base', hidden: !visibleColumns.is_base, render: (isBase: boolean) => isBase ? <Tag color="blue">Base</Tag> : null },
    { title: 'Ratio to Base', dataIndex: 'ratio_to_base', key: 'ratio_to_base', hidden: !visibleColumns.ratio_to_base },
    { 
      title: 'Status', dataIndex: 'is_active', key: 'status', hidden: !visibleColumns.status,
      render: (isActive: boolean) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Tag>
    },
    {
      title: 'Updated At', dataIndex: 'updated_at', key: 'updated_at', hidden: !visibleColumns.updated_at,
      render: (text: string, record: Uom) => format(new Date(text || record.created_at!), 'yyyy-MM-dd HH:mm')
    },
    {
      title: 'Actions', key: 'actions', fixed: 'right' as const, width: 100,
      render: (_: any, record: UomWithCategory) => {
        const menu = (
          <Menu>
            <Menu.Item key="1" icon={<EditOutlined />} onClick={() => handleOpenModal(record)}>Edit</Menu.Item>
            <Menu.Item
              key="2"
              icon={record.is_active ? <StopOutlined /> : <CheckCircleOutlined />}
              onClick={() => handleToggleStatus(record)}
            >
              {record.is_active ? 'Deactivate' : 'Activate'}
            </Menu.Item>
          </Menu>
        );
        return (
          <Dropdown overlay={menu} trigger={['click']}>
            <Button icon={<MoreOutlined />} size="small" />
          </Dropdown>
        );
      }
    },
  ].filter(col => !col.hidden);
  
  const columnMenu = (
    <div style={{ padding: 8, display: 'flex', flexDirection: 'column' }}>
      {Object.keys(visibleColumns).map(key => (
        <Checkbox
          key={key}
          checked={visibleColumns[key as keyof typeof visibleColumns]}
          onChange={e => setVisibleColumns(prev => ({ ...prev, [key]: e.target.checked }))}
        >
          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </Checkbox>
      ))}
    </div>
  );

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Typography.Title level={3} style={{ margin: 0 }}>Units of Measure</Typography.Title>
          <Typography.Text type="secondary">Manage UoMs for all products</Typography.Text>
        </Col>
        <Col>
          <Space>
            <Button icon={<ExportOutlined />}>Export</Button>
            <Popover content={columnMenu} title="Visible Columns" trigger="click">
              <Button>Columns <DownOutlined /></Button>
            </Popover>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>Add New</Button>
          </Space>
        </Col>
      </Row>

      <Card>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={5}><Input.Search placeholder="Search name/code..." onSearch={val => handleFilterChange('search', val)} allowClear /></Col>
          <Col xs={24} sm={12} md={5}><Select style={{ width: '100%' }} placeholder="Filter by Category" onChange={val => handleFilterChange('categoryId', val)} allowClear>
            <Select.Option value="all">All Categories</Select.Option>
            {categories.map(c => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}
          </Select></Col>
          <Col xs={24} sm={12} md={5}><Select defaultValue="all" style={{ width: '100%' }} onChange={val => handleFilterChange('isBase', val)}>
            <Select.Option value="all">All Units</Select.Option>
            <Select.Option value="yes">Base Unit</Select.Option>
            <Select.Option value="no">Not Base Unit</Select.Option>
          </Select></Col>
          <Col xs={24} sm={12} md={5}><Select defaultValue="all" style={{ width: '100%' }} onChange={val => handleFilterChange('status', val)}>
            <Select.Option value="all">All Status</Select.Option>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="inactive">Inactive</Select.Option>
          </Select></Col>
          <Col xs={24} sm={12} md={4}><RangePicker style={{ width: '100%' }} onChange={dates => handleFilterChange('updatedAt', dates)} /></Col>
        </Row>
      </Card>

      <Card bodyStyle={{ padding: 0 }}>
        <Table dataSource={uoms} columns={columns} loading={loading} rowKey="id" size="middle" scroll={{ x: 1000 }} />
      </Card>

      <Modal 
        title={editingRecord ? 'Edit UoM' : 'Add New UoM'} 
        open={isModalOpen} 
        onOk={handleSave} 
        okText={editingRecord ? 'Save' : 'Create'}
        onCancel={handleCancel} 
        width={700} 
        confirmLoading={loading} 
        destroyOnClose
      >
        <Form form={form} layout="vertical" name="uom_form" style={{ marginTop: 24 }} initialValues={{ ratio_to_base: 1, is_base: false, is_active: true }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="category_id" label="Category" rules={[{ required: true }]}><Select>{categories.map(c => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}</Select></Form.Item></Col>
            <Col span={12}><Form.Item name="code" label="Code" rules={[{ required: true }]}><Input disabled={!!editingRecord} /></Form.Item></Col>
            <Col span={12}><Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="is_base" label="Is Base Unit" rules={[{ required: true }]}><Select><Select.Option value={true}>Yes</Select.Option><Select.Option value={false}>No</Select.Option></Select></Form.Item></Col>
            <Col span={12}><Form.Item name="ratio_to_base" label="Ratio to Base"><InputNumber style={{ width: '100%' }} min={0} disabled={isBaseUnit} /></Form.Item></Col>
             {editingRecord && (
              <Col span={12}>
                <Form.Item name="is_active" label="Status" rules={[{ required: true }]}>
                  <Select>
                    <Select.Option value={true}>Active</Select.Option>
                    <Select.Option value={false}>Inactive</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            )}
          </Row>
        </Form>
      </Modal>
    </Space>
  );
};

const UomsListPage: React.FC = () => (
    <App><UomsListPageContent /></App>
);

export default UomsListPage;