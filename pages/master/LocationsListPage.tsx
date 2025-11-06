import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { Location, Warehouse, GoodsModel } from '../../types/supabase';
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

type LocationWithDetails = Location & { warehouse?: { name: string } };

const LocationsListPageContent: React.FC = () => {
  const [locations, setLocations] = useState<LocationWithDetails[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [goodsModels, setGoodsModels] = useState<(GoodsModel & { code: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<LocationWithDetails | null>(null);

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    warehouseId: 'all',
    updatedAt: null as [Dayjs, Dayjs] | null,
  });

  const [visibleColumns, setVisibleColumns] = useState({
    code: true,
    name: true,
    warehouse: true,
    constraint_type: true,
    status: true,
    updated_at: true,
  });

  const [form] = Form.useForm();
  const { notification, modal } = App.useApp();
  const constraintType = Form.useWatch('constraint_type', form);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const whPromise = supabase.from('warehouses').select('id, name').eq('is_active', true);
      const gmPromise = supabase.from('goods_models').select('id, name, code').eq('is_active', true);
      
      const [{data: whData, error: whError}, {data: gmData, error: gmError}] = await Promise.all([whPromise, gmPromise]);

      if (whError) throw whError;
      if (gmError) throw gmError;

      setWarehouses(whData || []);
      setGoodsModels(gmData || []);

      let query = supabase.from('locations').select('*, warehouse:warehouses(name)');

      if (filters.search) {
          query = query.or(`code.ilike.%${filters.search}%,name.ilike.%${filters.search}%`);
      }
      if (filters.status !== 'all') query = query.eq('is_active', filters.status === 'active');
      if (filters.warehouseId !== 'all') query = query.eq('warehouse_id', filters.warehouseId);
      if (filters.updatedAt) {
        query = query.gte('updated_at', filters.updatedAt[0].startOf('day').toISOString());
        query = query.lte('updated_at', filters.updatedAt[1].endOf('day').toISOString());
      }
      
      const { data, error: queryError } = await query.order('id', { ascending: true });
      if (queryError) throw queryError;
      setLocations(data || []);
    } catch (err: any) {
      notification.error({ message: "Error loading data", description: err.message });
    } finally {
      setLoading(false);
    }
  }, [filters, notification]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = (record: LocationWithDetails | null = null) => {
    setEditingRecord(record);
    form.setFieldsValue(record ? { ...record, constrained_goods_model_ids: record.constrained_goods_model_ids || [] } : { code: '', name: '', description: '', is_active: true, constraint_type: 'NONE', constrained_goods_model_ids: [] });
    setIsModalOpen(true);
  };
  
  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const handleSave = async () => {
    try {
      let values = await form.validateFields();
      if (values.constraint_type === 'NONE') {
        values = { ...values, constrained_goods_model_ids: null };
      }
      const dataToSave = { ...values, updated_at: new Date().toISOString() };

      if (editingRecord) {
        const { error } = await supabase.from('locations').update(dataToSave).eq('id', editingRecord.id);
        if (error) throw error;
        notification.success({ message: 'Location updated successfully' });
      } else {
        const { error } = await supabase.from('locations').insert(dataToSave);
        if (error) throw error;
        notification.success({ message: 'Location created successfully' });
      }
      handleCancel();
      loadData();
    } catch (err: any) {
      notification.error({ message: 'Save failed', description: err.message });
    }
  };
  
  const handleToggleStatus = (record: Location) => {
    modal.confirm({
      title: `Confirm ${record.is_active ? 'Deactivation' : 'Activation'}`,
      content: `Are you sure you want to ${record.is_active ? 'deactivate' : 'activate'} the location "${record.name}"?`,
      onOk: async () => {
        try {
          const { error } = await supabase
            .from('locations')
            .update({ is_active: !record.is_active, updated_at: new Date().toISOString() })
            .eq('id', record.id);
          if (error) throw error;
          notification.success({ message: `Location status updated successfully` });
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

  const tagRender = (props: any) => {
    const { label, closable, onClose } = props;
    return (
      <Tag
        color="blue"
        closable={closable}
        onClose={onClose}
        style={{ marginRight: 3 }}
      >
        {label}
      </Tag>
    );
  };

  const columns = [
    { title: 'Code', dataIndex: 'code', key: 'code', hidden: !visibleColumns.code },
    { title: 'Name', dataIndex: 'name', key: 'name', hidden: !visibleColumns.name },
    { title: 'Warehouse', dataIndex: ['warehouse', 'name'], key: 'warehouse', hidden: !visibleColumns.warehouse },
    { 
      title: 'Constraint', dataIndex: 'constraint_type', key: 'constraint_type', hidden: !visibleColumns.constraint_type,
      render: (type: string) => <Tag>{type.replace('_', ' ')}</Tag>
    },
    {
      title: 'Status', dataIndex: 'is_active', key: 'status', hidden: !visibleColumns.status,
      render: (isActive: boolean) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Tag>
    },
    {
      title: 'Updated At', dataIndex: 'updated_at', key: 'updated_at', hidden: !visibleColumns.updated_at,
      render: (text: string, record: Location) => format(new Date(text || record.created_at!), 'yyyy-MM-dd HH:mm')
    },
    {
      title: 'Actions', key: 'actions', fixed: 'right' as const, width: 100,
      render: (_: any, record: LocationWithDetails) => {
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
          <Typography.Title level={3} style={{ margin: 0 }}>Locations</Typography.Title>
          <Typography.Text type="secondary">Manage storage location information</Typography.Text>
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
          <Col xs={24} sm={12} md={6}><Input.Search placeholder="Search by code/name..." onSearch={val => handleFilterChange('search', val)} allowClear /></Col>
          <Col xs={24} sm={12} md={6}><Select style={{ width: '100%' }} placeholder="Filter by Warehouse" onChange={val => handleFilterChange('warehouseId', val)} allowClear>
            <Select.Option value="all">All Warehouses</Select.Option>
            {warehouses.map(w => <Select.Option key={w.id} value={w.id}>{w.name}</Select.Option>)}
          </Select></Col>
          <Col xs={24} sm={12} md={6}><Select defaultValue="all" style={{ width: '100%' }} onChange={val => handleFilterChange('status', val)}>
            <Select.Option value="all">All Status</Select.Option>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="inactive">Inactive</Select.Option>
          </Select></Col>
          <Col xs={24} sm={12} md={6}><RangePicker style={{ width: '100%' }} onChange={dates => handleFilterChange('updatedAt', dates)} /></Col>
        </Row>
      </Card>

      <Card bodyStyle={{ padding: 0 }}>
        <Table dataSource={locations} columns={columns} loading={loading} rowKey="id" size="middle" scroll={{ x: 1000 }} />
      </Card>

      <Modal 
        title={editingRecord ? 'Edit Location' : 'Add New Location'} 
        open={isModalOpen} 
        onOk={handleSave} 
        okText={editingRecord ? 'Save' : 'Create'}
        onCancel={handleCancel} 
        width={800} 
        confirmLoading={loading} 
        destroyOnClose
      >
        <Form form={form} layout="vertical" name="location_form" style={{ marginTop: 24 }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="warehouse_id" label="Warehouse" rules={[{ required: true }]}><Select>{warehouses.map(w => <Select.Option key={w.id} value={w.id}>{w.name}</Select.Option>)}</Select></Form.Item></Col>
            <Col span={12}><Form.Item name="code" label="Location Code" rules={[{ required: true }]}><Input/></Form.Item></Col>
            <Col span={24}><Form.Item name="name" label="Location Name" rules={[{ required: true }]}><Input/></Form.Item></Col>
            <Col span={24}><Form.Item name="description" label="Description"><Input.TextArea rows={2}/></Form.Item></Col>
            
            <Col span={24}><Typography.Title level={5}>Goods Model Constraints</Typography.Title></Col>
            <Col span={12}>
              <Form.Item name="constraint_type" label="Constraint Type" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="NONE">None (Accepts all models)</Select.Option>
                  <Select.Option value="ALLOWED">Allowed List (Only accepts selected models)</Select.Option>
                  <Select.Option value="DISALLOWED">Disallowed List (Accepts all except selected)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            {constraintType && constraintType !== 'NONE' && (
              <Col span={24}>
                <Form.Item name="constrained_goods_model_ids" label="Constrained Goods Models">
                  <Select
                    mode="multiple"
                    allowClear
                    style={{ width: '100%' }}
                    placeholder="Please select goods models"
                    options={goodsModels.map(model => ({ label: `${model.name} (${model.code})`, value: model.id }))}
                    tagRender={tagRender}
                  />
                </Form.Item>
              </Col>
            )}

            <Col span={24}>{editingRecord && <Form.Item name="is_active" label="Status"><Select><Select.Option value={true}>Active</Select.Option><Select.Option value={false}>Inactive</Select.Option></Select></Form.Item>}</Col>
          </Row>
        </Form>
      </Modal>
    </Space>
  );
};

const LocationsListPage: React.FC = () => (
    <App><LocationsListPageContent /></App>
);

export default LocationsListPage;