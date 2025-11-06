import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { Partner, Organization } from '../../types/supabase';
import {
  Button, Card, Input, Select, DatePicker, Table, Tag, Modal, Form,
  Row, Col, Typography, Space, App, Popover, Checkbox, Dropdown, Menu
} from 'antd';
import {
  PlusOutlined, EditOutlined, ExportOutlined, DownOutlined, MoreOutlined, CheckCircleOutlined, StopOutlined
} from '@ant-design/icons';
import { format } from 'date-fns';
import type { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;
const PARTNER_TYPES: Partner['partner_type'][] = ['CUSTOMER', 'SUPPLIER', 'CARRIER', 'OTHER'];

type PartnerWithOrg = Partner & { organization?: { name: string } };

const PartnersListPageContent: React.FC = () => {
  const [partners, setPartners] = useState<PartnerWithOrg[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PartnerWithOrg | null>(null);

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    type: 'all',
    orgId: 'all',
    updatedAt: null as [Dayjs, Dayjs] | null,
  });

  const [visibleColumns, setVisibleColumns] = useState({
    code: true,
    name: true,
    type: true,
    tax_id: true,
    phone: true,
    email: true,
    status: true,
    updated_at: true,
  });

  const [form] = Form.useForm();
  const { notification, modal } = App.useApp();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: orgData, error: orgError } = await supabase.from('organizations').select('id, name').eq('is_active', true);
      if (orgError) throw orgError;
      setOrganizations(orgData || []);

      let query = supabase.from('partners').select('*, organization:organizations(name)');

      if (filters.search) query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
      if (filters.status !== 'all') query = query.eq('is_active', filters.status === 'active');
      if (filters.type !== 'all') query = query.eq('partner_type', filters.type);
      if (filters.orgId !== 'all') query = query.eq('org_id', filters.orgId);
      if (filters.updatedAt) {
        query = query.gte('updated_at', filters.updatedAt[0].startOf('day').toISOString());
        query = query.lte('updated_at', filters.updatedAt[1].endOf('day').toISOString());
      }

      const { data, error: queryError } = await query.order('id', { ascending: true });
      if (queryError) throw queryError;
      setPartners(data || []);
    } catch (err: any) {
      notification.error({ message: "Error loading data", description: err.message });
    } finally {
      setLoading(false);
    }
  }, [filters, notification]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = (record: PartnerWithOrg | null = null) => {
    setEditingRecord(record);
    form.setFieldsValue(record ? { ...record } : { code: '', name: '', is_active: true, partner_type: 'CUSTOMER' });
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
        const { error } = await supabase.from('partners').update(dataToSave).eq('id', editingRecord.id);
        if (error) throw error;
        notification.success({ message: 'Partner updated successfully' });
      } else {
        const { error } = await supabase.from('partners').insert(dataToSave);
        if (error) throw error;
        notification.success({ message: 'Partner created successfully' });
      }
      handleCancel();
      loadData();
    } catch (err: any) {
      notification.error({ message: 'Save failed', description: err.message });
    }
  };
  
  const handleToggleStatus = (record: Partner) => {
    modal.confirm({
      title: `Confirm ${record.is_active ? 'Deactivation' : 'Activation'}`,
      content: `Are you sure you want to ${record.is_active ? 'deactivate' : 'activate'} the partner "${record.name}"?`,
      onOk: async () => {
        try {
          const { error } = await supabase
            .from('partners')
            .update({ is_active: !record.is_active, updated_at: new Date().toISOString() })
            .eq('id', record.id);
          if (error) throw error;
          notification.success({ message: `Partner status updated successfully` });
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
  
  const getTypeTagColor = (type: Partner['partner_type']) => {
    switch(type) {
      case 'CUSTOMER': return 'blue';
      case 'SUPPLIER': return 'orange';
      case 'CARRIER': return 'purple';
      default: return 'default';
    }
  };

  const columns = [
    { title: 'Code', dataIndex: 'code', key: 'code', hidden: !visibleColumns.code },
    { title: 'Name', dataIndex: 'name', key: 'name', hidden: !visibleColumns.name },
    { title: 'Type', dataIndex: 'partner_type', key: 'type', hidden: !visibleColumns.type, render: (type: Partner['partner_type']) => <Tag color={getTypeTagColor(type)}>{type}</Tag> },
    { title: 'Tax ID', dataIndex: 'tax_id', key: 'tax_id', hidden: !visibleColumns.tax_id },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', hidden: !visibleColumns.phone },
    { title: 'Email', dataIndex: 'email', key: 'email', hidden: !visibleColumns.email },
    { title: 'Status', dataIndex: 'is_active', key: 'status', hidden: !visibleColumns.status, render: (isActive: boolean) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Tag> },
    { title: 'Updated At', dataIndex: 'updated_at', key: 'updated_at', hidden: !visibleColumns.updated_at, render: (text: string, record: Partner) => format(new Date(text || record.created_at!), 'yyyy-MM-dd HH:mm') },
    { 
      title: 'Actions', key: 'actions', fixed: 'right' as const, width: 100, 
      render: (_: any, record: PartnerWithOrg) => {
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
          <Typography.Title level={3} style={{ margin: 0 }}>Partners</Typography.Title>
          <Typography.Text type="secondary">Manage all partner information</Typography.Text>
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
          <Col xs={24} sm={12} md={6}><Input.Search placeholder="Search name/code..." onSearch={val => handleFilterChange('search', val)} allowClear /></Col>
          <Col xs={24} sm={12} md={5}><Select style={{ width: '100%' }} placeholder="Filter by Org" onChange={val => handleFilterChange('orgId', val)} allowClear>
            <Select.Option value="all">All Organizations</Select.Option>
            {organizations.map(o => <Select.Option key={o.id} value={o.id}>{o.name}</Select.Option>)}
          </Select></Col>
          <Col xs={24} sm={12} md={5}><Select defaultValue="all" style={{ width: '100%' }} onChange={val => handleFilterChange('type', val)}>
            <Select.Option value="all">All Types</Select.Option>
            {PARTNER_TYPES.map(type => <Select.Option key={type} value={type}>{type}</Select.Option>)}
          </Select></Col>
          <Col xs={24} sm={12} md={4}><Select defaultValue="all" style={{ width: '100%' }} onChange={val => handleFilterChange('status', val)}>
            <Select.Option value="all">All Status</Select.Option>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="inactive">Inactive</Select.Option>
          </Select></Col>
          <Col xs={24} sm={24} md={4}><RangePicker style={{ width: '100%' }} onChange={dates => handleFilterChange('updatedAt', dates)} /></Col>
        </Row>
      </Card>

      <Card bodyStyle={{ padding: 0 }}>
        <Table dataSource={partners} columns={columns} loading={loading} rowKey="id" size="middle" scroll={{ x: 1300 }} />
      </Card>

      <Modal title={editingRecord ? 'Edit Partner' : 'Add New Partner'} open={isModalOpen} onOk={handleSave} onCancel={handleCancel} width={800} confirmLoading={loading} destroyOnClose>
        <Form form={form} layout="vertical" name="partner_form" style={{ marginTop: 24 }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="org_id" label="Organization" rules={[{ required: true }]}><Select>{organizations.map(org => <Select.Option key={org.id} value={org.id}>{org.name}</Select.Option>)}</Select></Form.Item></Col>
            <Col span={12}><Form.Item name="code" label="Code" rules={[{ required: true }]}><Input disabled={!!editingRecord} /></Form.Item></Col>
            <Col span={12}><Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="partner_type" label="Partner Type"><Select>{PARTNER_TYPES.map(type => <Select.Option key={type} value={type}>{type}</Select.Option>)}</Select></Form.Item></Col>
            <Col span={12}><Form.Item name="tax_id" label="Tax ID"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="phone" label="Phone"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="email" label="Email" rules={[{ type: 'email' }]}><Input /></Form.Item></Col>
            <Col span={12}>{editingRecord && <Form.Item name="is_active" label="Status"><Select><Select.Option value={true}>Active</Select.Option><Select.Option value={false}>Inactive</Select.Option></Select></Form.Item>}</Col>
            <Col span={24}><Form.Item name="address" label="Address"><Input.TextArea rows={3} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </Space>
  );
};

const PartnersListPage: React.FC = () => (
    <App><PartnersListPageContent /></App>
);

export default PartnersListPage;