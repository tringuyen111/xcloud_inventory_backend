import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { UomCategory } from '../../types/supabase';
import {
  Button, Card, Form, Input, Row, Col, Typography, Space, App, Spin, Select, Descriptions, Tag, Alert
} from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import useAuthStore from '../../stores/authStore';

const { Title, Text } = Typography;

const UomCategoryDetailPageContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { notification } = App.useApp();

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<UomCategory | null>(null);
  const user = useAuthStore((state) => state.user);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('uom_categories').select('*').eq('id', id).single();
      if (error) throw error;
      if (data) {
        setCategory(data);
        form.setFieldsValue(data);
      } else {
        throw new Error("UoM Category not found");
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
      const { error } = await supabase.from('uom_categories').update({ ...values, updated_at: new Date().toISOString(), updated_by: user?.id }).eq('id', id);
      if (error) throw error;
      notification.success({ message: 'Category updated successfully' });
      setIsEditing(false);
      fetchData();
    } catch (err: any) {
      notification.error({ message: 'Update failed', description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (category) form.setFieldsValue(category);
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
          <Title level={3} className="mb-0">{category?.name}</Title>
          <Text type="secondary">Details for category code: {category?.code}</Text>
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
        <Form form={form} layout="vertical" name="uom_category_form">
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="code" label="Code" rules={[{ required: true }]}><Input disabled /></Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="is_active" label="Status" rules={[{ required: true }]}>
                        <Select><Select.Option value={true}>Active</Select.Option><Select.Option value={false}>Inactive</Select.Option></Select>
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item name="description" label="Notes"><Input.TextArea rows={3} /></Form.Item>
                </Col>
            </Row>
        </Form>
      ) : (
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Code">{category?.code}</Descriptions.Item>
          <Descriptions.Item label="Name">{category?.name}</Descriptions.Item>
          <Descriptions.Item label="Status" span={2}>
            <Tag color={category?.is_active ? 'green' : 'red'}>{category?.is_active ? 'Active' : 'Inactive'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Notes" span={2}>{category?.description}</Descriptions.Item>
          <Descriptions.Item label="Created At">{category?.created_at ? format(new Date(category.created_at), 'yyyy-MM-dd HH:mm') : '-'}</Descriptions.Item>
          <Descriptions.Item label="Created By">{getUserEmail(category?.created_by)}</Descriptions.Item>
          <Descriptions.Item label="Updated At">{category?.updated_at ? format(new Date(category.updated_at), 'yyyy-MM-dd HH:mm') : '-'}</Descriptions.Item>
          <Descriptions.Item label="Updated By">{getUserEmail(category?.updated_by)}</Descriptions.Item>
        </Descriptions>
      )}
    </Card>
  );
};

const UomCategoryDetailPage: React.FC = () => (
    <App><UomCategoryDetailPageContent /></App>
);

export default UomCategoryDetailPage;