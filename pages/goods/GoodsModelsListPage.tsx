import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { GoodsModel, GoodsType, Uom } from '../../types/supabase';
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

type GoodsModelWithDetails = GoodsModel & { 
  goods_type?: { name: string },
  base_uom?: { name: string },
};

const TRACKING_TYPES: GoodsModel['tracking_type'][] = ['NONE', 'LOT', 'SERIAL'];

const GoodsModelsListPageContent: React.FC = () => {
  const [goodsModels, setGoodsModels] = useState<GoodsModelWithDetails[]>([]);
  const [goodsTypes, setGoodsTypes] = useState<GoodsType[]>([]);
  const [uoms, setUoms] = useState<Uom[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<GoodsModelWithDetails | null>(null);
  
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    goodsTypeId: 'all',
    trackingType: 'all',
    updatedAt: null as [Dayjs, Dayjs] | null,
  });

  const [visibleColumns, setVisibleColumns] = useState({
    code: true,
    name: true,
    goods_type: true,
    tracking_type: true,
    base_uom: true,
    status: true,
    updated_at: true,
  });

  const [form] = Form.useForm();
  const { notification, modal } = App.useApp();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const typesPromise = supabase.from('goods_types').select('id, name').eq('is_active', true);
      const uomsPromise = supabase.from('uoms').select('id, name').eq('is_active', true);
      
      const [{data: typesData, error: typesError}, {data: uomsData, error: uomsError}] = await Promise.all([typesPromise, uomsPromise]);

      if (typesError) throw typesError;
      if (uomsError) throw uomsError;
      
      setGoodsTypes(typesData || []);
      setUoms(uomsData || []);

      let query = supabase.from('goods_models').select('*, goods_type:goods_types(name), base_uom:uoms(name)');

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
      }
      if (filters.status !== 'all') {
        query = query.eq('is_active', filters.status === 'active');
      }
      if (filters.goodsTypeId !== 'all') {
        query = query.eq('goods_type_id', filters.goodsTypeId);
      }
      if (filters.trackingType !== 'all') {
        query = query.eq('tracking_type', filters.trackingType);
      }
      if (filters.updatedAt) {
        query = query.gte('updated_at', filters.updatedAt[0].startOf('day').toISOString());
        query = query.lte('updated_at', filters.updatedAt[1].endOf('day').toISOString());
      }

      const { data, error: queryError } = await query.order('id', { ascending: true });

      if (queryError) throw queryError;
      setGoodsModels(data || []);
    } catch (err: any) {
      notification.error({ message: "Error loading data", description: err.message });
    } finally {
      setLoading(false);
    }
  }, [filters, notification]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = (record: GoodsModelWithDetails | null = null) => {
    setEditingRecord(record);
    form.setFieldsValue(record ? { ...record } : { code: '', name: '', description: '', is_active: true, tracking_type: 'NONE' });
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
      const dataToSave = {
        ...values,
        updated_at: new Date().toISOString(),
      };

      if (editingRecord) {
        const { error } = await supabase.from('goods_models').update(dataToSave).eq('id', editingRecord.id);
        if (error) throw error;
        notification.success({ message: 'Goods Model updated successfully' });
      } else {
        const { error } = await supabase.from('goods_models').insert(dataToSave);
        if (error) throw error;
        notification.success({ message: 'Goods Model created successfully' });
      }
      handleCancel();
      loadData();
    } catch (err: any)
{
      notification.error({ message: 'Save failed', description: err.message });
    }
  };

  const handleToggleStatus = (record: GoodsModel) => {
    modal.confirm({
      title: `Confirm ${record.is_active ? 'Deactivation' : 'Activation'}`,
      content: `Are you sure you want to ${record.is_active ? 'deactivate' : 'activate'} the goods model "${record.name}"?`,
      onOk: async () => {
        try {
          const { error } = await supabase
            .from('goods_models')
            .update({ is_active: !record.is_active, updated_at: new Date().toISOString() })
            .eq('id', record.id);
          if (error) throw error;
          notification.success({ message: `Goods Model status updated successfully` });
          loadData();
        } catch (err: any) {
          notification.error({ message: 'Status update failed', description: err.message });
        }
      },
    });
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({...prev, [key]: value}));
  }

  const columns = [
    { title: 'Code', dataIndex: 'code', key: 'code', hidden: !visibleColumns.code },
    { title: 'Name', dataIndex: 'name', key: 'name', hidden: !visibleColumns.name },
    { title: 'Goods Type', dataIndex: ['goods_type', 'name'], key: 'goods_type', hidden: !visibleColumns.goods_type },
    { 
      title: 'Tracking Type', dataIndex: 'tracking_type', key: 'tracking_type', hidden: !visibleColumns.tracking_type,
      render: (type: GoodsModel['tracking_type']) => {
        let color = 'default';
        if (type === 'LOT') color = 'gold';
        if (type === 'SERIAL') color = 'cyan';
        return <Tag color={color}>{type}</Tag>;
      }
    },
    { title: 'Base UoM', dataIndex: ['base_uom', 'name'], key: 'base_uom', hidden: !visibleColumns.base_uom },
    { 
      title: 'Status', dataIndex: 'is_active', key: 'status', hidden: !visibleColumns.status,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Tag>
      )
    },
    { 
      title: 'Updated At', dataIndex: 'updated_at', key: 'updated_at', hidden: !visibleColumns.updated_at,
      render: (text: string | null, record: GoodsModel) => format(new Date(text || record.created_at), 'yyyy-MM-dd HH:mm')
    },
    {
      title: 'Actions', key: 'actions', fixed: 'right' as const, width: 100,
      render: (_: any, record: GoodsModelWithDetails) => {
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
              <Typography.Title level={3} style={{ margin: 0 }}>Goods Models</Typography.Title>
              <Typography.Text type="secondary">Manage models (SKUs) of goods</Typography.Text>
          </Col>
          <Col>
              <Space>
                  <Button icon={<ExportOutlined />}>Export</Button>
                  <Popover content={columnMenu} title="Visible Columns" trigger="click">
                    <Button>Columns <DownOutlined /></Button>
                  </Popover>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
                      Add New
                  </Button>
              </Space>
          </Col>
      </Row>

      <Card>
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} sm={12} lg={5}>
              <Typography.Text>Search</Typography.Text>
              <Input.Search placeholder="Search by name or code..." onSearch={value => handleFilterChange('search', value)} allowClear />
          </Col>
          <Col xs={24} sm={12} lg={5}>
              <Typography.Text>Goods Type</Typography.Text>
              <Select
                style={{ width: '100%' }}
                placeholder="Filter by Goods Type"
                onChange={value => handleFilterChange('goodsTypeId', value)}
                defaultValue="all"
              >
                <Select.Option value="all">All Goods Types</Select.Option>
                {goodsTypes.map(type => <Select.Option key={type.id} value={type.id}>{type.name}</Select.Option>)}
              </Select>
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <Typography.Text>Tracking Type</Typography.Text>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by Tracking Type"
              onChange={value => handleFilterChange('trackingType', value)}
              defaultValue="all"
            >
              <Select.Option value="all">All Tracking Types</Select.Option>
              {TRACKING_TYPES.map(type => <Select.Option key={type} value={type}>{type}</Select.Option>)}
            </Select>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Typography.Text>Status</Typography.Text>
            <Select
              defaultValue="all"
              style={{ width: '100%' }}
              onChange={value => handleFilterChange('status', value)}
            >
              <Select.Option value="all">All Status</Select.Option>
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="inactive">Inactive</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} lg={5}>
             <Typography.Text>Updated At</Typography.Text>
             <RangePicker style={{ width: '100%' }} onChange={dates => handleFilterChange('updatedAt', dates)} />
          </Col>
        </Row>
      </Card>
      
      <Card bodyStyle={{ padding: 0 }}>
        <Table
          dataSource={goodsModels}
          columns={columns}
          loading={loading}
          rowKey="id"
          size="middle"
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={editingRecord ? 'Edit Goods Model' : 'Add New Goods Model'}
        open={isModalOpen}
        onOk={handleSave}
        okText={editingRecord ? 'Save' : 'Create'}
        onCancel={handleCancel}
        width={800}
        confirmLoading={loading}
        destroyOnClose
      >
        <Form form={form} layout="vertical" name="goods_model_form" style={{ marginTop: 24 }}>
          <Row gutter={16}>
             <Col span={12}>
              <Form.Item name="code" label="Code" rules={[{ required: true, message: 'Code is required' }]}>
                <Input disabled={!!editingRecord} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name is required' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="goods_type_id" label="Goods Type" rules={[{ required: true, message: 'Goods Type is required' }]}>
                <Select placeholder="Select a goods type">
                  {goodsTypes.map(type => <Select.Option key={type.id} value={type.id}>{type.name}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
             <Col span={12}>
              <Form.Item name="base_uom_id" label="Base UoM" rules={[{ required: true, message: 'Base UoM is required' }]}>
                <Select placeholder="Select a base unit of measure">
                  {uoms.map(uom => <Select.Option key={uom.id} value={uom.id}>{uom.name}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tracking_type" label="Tracking Type" rules={[{ required: true, message: 'Tracking Type is required' }]}>
                <Select placeholder="Select a tracking type">
                  {TRACKING_TYPES.map(type => <Select.Option key={type} value={type}>{type}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="Description">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
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

const GoodsModelsListPage: React.FC = () => (
    <App>
        <GoodsModelsListPageContent />
    </App>
);

export default GoodsModelsListPage;