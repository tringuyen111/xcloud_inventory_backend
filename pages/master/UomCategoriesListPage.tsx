import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { UomCategory } from '../../types/supabase';
import {
  Button, Card, Input, DatePicker, Table, Modal, Form,
  Row, Col, Typography, Space, App, Popover, Checkbox, Select, Menu, Dropdown, Tag
} from 'antd';
import {
  PlusOutlined, EditOutlined, ExportOutlined, DownOutlined, MoreOutlined, StopOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { format } from 'date-fns';
import type { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

const UomCategoriesListPageContent: React.FC = () => {
  const [categories, setCategories] = useState<UomCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<UomCategory | null>(null);

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    updatedAt: null as [Dayjs, Dayjs] | null,
  });

  const [visibleColumns, setVisibleColumns] = useState({
    code: true,
    name: true,
    description: true,
    status: true,
    updated_at: true,
  });

  const [form] = Form.useForm();
  const { notification, modal } = App.useApp();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('uom_categories').select('*');
      if (filters.search) query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
      if (filters.status !== 'all') {
        query = query.eq('is_active', filters.status === 'active');
      }
      if (filters.updatedAt) {
        query = query.gte('updated_at', filters.updatedAt[0].startOf('day').toISOString());
        query = query.lte('updated_at', filters.updatedAt[1].endOf('day').toISOString());
      }
      const { data, error: queryError } = await query.order('id', { ascending: true });
      if (queryError) throw queryError;
      setCategories(data || []);
    } catch (err: any) {
      notification.error({ message: "Error loading data", description: err.message });
    } finally {
      setLoading(false);
    }
  }, [filters, notification]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = (record: UomCategory | null = null) => {
    setEditingRecord(record);
    form.setFieldsValue(record ? { ...record } : { code: '', name: '', is_active: true });
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
      if (editingRecord) {
        const { error } = await supabase.from('uom_categories').update(dataToSave).eq('id', editingRecord.id);
        if (error) throw error;
        notification.success({ message: 'Category updated successfully' });
      } else {
        const { error } = await supabase.from('uom_categories').insert(dataToSave);
        if (error) throw error;
        notification.success({ message: 'Category created successfully' });
      }
      handleCancel();
      loadData();
    } catch (err: any) {
      notification.error({ message: 'Save failed', description: err.message });
    }
  };

  const handleToggleStatus = (record: UomCategory) => {
    modal.confirm({
      title: `Confirm ${record.is_active ? 'Deactivation' : 'Activation'}`,
      content: `Are you sure you want to ${record.is_active ? 'deactivate' : 'activate'} "${record.name}"?`,
      onOk: async () => {
        try {
          const { error } = await supabase
            .from('uom_categories')
            .update({ is_active: !record.is_active, updated_at: new Date().toISOString() })
            .eq('id', record.id);
          if (error) throw error;
          notification.success({ message: `Status updated successfully` });
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
    { title: 'Description', dataIndex: 'description', key: 'description', hidden: !visibleColumns.description },
    { 
      title: 'Status', dataIndex: 'is_active', key: 'status', hidden: !visibleColumns.status,
      render: (isActive: boolean) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Tag>
    },
    {
      title: 'Updated At', dataIndex: 'updated_at', key: 'updated_at', hidden: !visibleColumns.updated_at,
      render: (text: string, record: UomCategory) => format(new Date(text || record.created_at!), 'yyyy-MM-dd HH:mm')
    },
    {
      title: 'Actions', key: 'actions', fixed: 'right' as const, width: 100,
      render: (_: any, record: UomCategory) => {
        const menu = (
          <Menu>
            <Menu.Item key="1" icon={<EditOutlined />} onClick={() => handleOpenModal(record)}>
              Edit
            </Menu.Item>
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
          <Typography.Title level={3} style={{ margin: 0 }}>UoM Categories</Typography.Title>
          <Typography.Text type="secondary">Manage unit of measure categories</Typography.Text>
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
          <Col xs={24} sm={12} md={8}><Input.Search placeholder="Search name/code..." onSearch={val => handleFilterChange('search', val)} allowClear /></Col>
          <Col xs={24} sm={12} md={8}>
            <Select defaultValue="all" style={{ width: '100%' }} onChange={value => handleFilterChange('status', value)}>
              <Select.Option value="all">All Status</Select.Option>
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="inactive">Inactive</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}><RangePicker style={{ width: '100%' }} onChange={dates => handleFilterChange('updatedAt', dates)} /></Col>
        </Row>
      </Card>

      <Card bodyStyle={{ padding: 0 }}>
        <Table dataSource={categories} columns={columns} loading={loading} rowKey="id" size="middle" scroll={{ x: 800 }}/>
      </Card>

      <Modal 
        title={editingRecord ? 'Edit UoM Category' : 'Add New UoM Category'} 
        open={isModalOpen} 
        onOk={handleSave} 
        okText={editingRecord ? 'Save' : 'Create'}
        onCancel={handleCancel} 
        width={600} 
        confirmLoading={loading} 
        destroyOnClose
      >
        <Form form={form} layout="vertical" name="uom_category_form" style={{ marginTop: 24 }}>
          <Form.Item name="code" label="Code" rules={[{ required: true }]}><Input disabled={!!editingRecord} /></Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Description"><Input.TextArea rows={3} /></Form.Item>
          {editingRecord && (
             <Form.Item name="is_active" label="Status" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value={true}>Active</Select.Option>
                  <Select.Option value={false}>Inactive</Select.Option>
                </Select>
              </Form.Item>
          )}
        </Form>
      </Modal>
    </Space>
  );
};

const UomCategoriesListPage: React.FC = () => (
    <App><UomCategoriesListPageContent /></App>
);

export default UomCategoriesListPage;