import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// FIX: Corrected supabase client import path
import { supabase } from '../../services/supabaseClient';
import { Warehouse, Branch } from '../../types/supabase';
import {
  Button, Card, Form, Input, Row, Col, Typography, Space, App, Spin, Select, Descriptions, Tag, Alert
} from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import useAuthStore from '../../stores/authStore';

const { Title, Text } = Typography;
const WAREHOUSE_TYPES = ['NORMAL', 'QUARANTINE', 'DAMAGE'];
type WarehouseWithBranch = Warehouse & { branch?: { name: string } };

const WarehouseDetailPageContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { notification } = App.useApp();

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warehouse, setWarehouse] = useState<WarehouseWithBranch | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const user = useAuthStore((state) => state.user);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const branchPromise = supabase.from('branches').select('id, name').eq('is_active', true);
      const warehousePromise = supabase.from('warehouses').select('*, branch:branches(name)').eq('id', id).single();

      const [{ data: branchData, error: branchError }, { data: whData, error: whError }] = await Promise.all([branchPromise, warehousePromise]);
      
      if (branchError) throw branchError;
      if (whError) throw whError;

      setBranches(branchData || []);
      if (whData) {
        setWarehouse(whData);
        form.setFieldsValue(whData);
      } else {
        throw new Error("Warehouse not found");
      }
    } catch (err: any) {
      setError(err.message);
      notification.error({ message: "Error fetching data", description: err.message });
    } finally {
      setLoading(false);
    }
  }, [id, form, notification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const values = await form.validateFields();
      const { error } = await supabase.from('warehouses').update({ ...values, updated_at: new Date().toISOString(), updated_by: user?.id }).eq('id', id);
      if (error) throw error;
      notification.success({ message: 'Warehouse updated successfully' });
      setIsEditing(false);
      fetchData();
    } catch (err: any) {
      notification.error({ message: 'Update failed', description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (warehouse) form.setFieldsValue(warehouse);
    setIsEditing(false);
  };

  const getUserEmail = (userId: string | null | undefined) => {
    if (!userId) return '-';
    if (userId === user?.id) return user?.email;
    return 'Another User';
  };

  if (loading) return <div className="flex justify-center items-center h-full"><Spin size="large" /></div>;
  if (error) return <Alert message="Error" description={error} type="error" showIcon />;

  return (
    <Card>
      <Row justify="space-between" align="middle" className="mb-6">
        <Col>
          <Title level={3} className="mb-0">{warehouse?.name}</Title>
          <Text type="secondary">Details for warehouse code: {warehouse?.code}</Text>
        </Col>
        <Col>
          <Space>
            <Button onClick={() => navigate(-1)}>Back</Button>
            {isEditing ? (
              <>
                <Button onClick={handleCancel}>Cancel</Button>
                <Button type="primary" onClick={handleSave} loading={isSaving}>Save</Button>
              </>
            ) : (
              <Button type="primary" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>Edit</Button>
            )}
          </Space>
        </Col>
      </Row>

      {isEditing ? (
        <Form form={form} layout="vertical" name="warehouse_form">
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="branch_id" label="Branch" rules={[{ required: true }]}><Select>{branches.map(b => <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>)}</Select></Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="code" label="Code" rules={[{ required: true }]}><Input disabled /></Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="warehouse_type" label="Warehouse Type" initialValue="NORMAL"><Select>{WAREHOUSE_TYPES.map(type => <Select.Option key={type} value={type}>{type}</Select.Option>)}</Select></Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="is_active" label="Status" rules={[{ required: true }]}><Select><Select.Option value={true}>Active</Select.Option><Select.Option value={false}>Inactive</Select.Option></Select></Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item name="notes" label="Notes"><Input.TextArea rows={3} /></Form.Item>
                </Col>
            </Row>
        </Form>
      ) : (
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Code">{warehouse?.code}</Descriptions.Item>
          <Descriptions.Item label="Name">{warehouse?.name}</Descriptions.Item>
          <Descriptions.Item label="Branch">{warehouse?.branch?.name}</Descriptions.Item>
          <Descriptions.Item label="Type"><Tag>{warehouse?.warehouse_type}</Tag></Descriptions.Item>
          <Descriptions.Item label="Status" span={2}>
            <Tag color={warehouse?.is_active ? 'green' : 'red'}>{warehouse?.is_active ? 'Active' : 'Inactive'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Notes" span={2}>{warehouse?.notes}</Descriptions.Item>
          <Descriptions.Item label="Created At">{warehouse?.created_at ? format(new Date(warehouse.created_at), 'yyyy-MM-dd HH:mm') : '-'}</Descriptions.Item>
          <Descriptions.Item label="Created By">{getUserEmail(warehouse?.created_by)}</Descriptions.Item>
          <Descriptions.Item label="Updated At">{warehouse?.updated_at ? format(new Date(warehouse.updated_at), 'yyyy-MM-dd HH:mm') : '-'}</Descriptions.Item>
          <Descriptions.Item label="Updated By">{getUserEmail(warehouse?.updated_by)}</Descriptions.Item>
        </Descriptions>
      )}
    </Card>
  );
};

const WarehouseDetailPage: React.FC = () => (
    <App><WarehouseDetailPageContent /></App>
);

export default WarehouseDetailPage;