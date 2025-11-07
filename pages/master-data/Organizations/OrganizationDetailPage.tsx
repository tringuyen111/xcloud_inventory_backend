
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../services/supabaseClient';
import { Organization } from '../../../types/supabase';
import {
  Button, Card, Form, Input, Row, Col, Typography, Space, App, Spin, Select, Descriptions, Tag, Alert
} from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import useAuthStore from '../../../stores/authStore';
import PageHeader from '../../../components/layout/PageHeader';

const OrganizationDetailPageContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm<Organization>();
  const { notification } = App.useApp();

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const user = useAuthStore((state) => state.user);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setOrganization(data);
        form.setFieldsValue(data);
      } else {
          throw new Error("Organization not found");
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
      const { error } = await supabase
        .from('organizations')
        .update({ ...values, updated_at: new Date().toISOString(), updated_by: user?.id })
        .eq('id', id);
      
      if (error) throw error;
      
      notification.success({ message: 'Organization updated successfully' });
      setIsEditing(false);
      fetchData(); // Refresh data
    } catch (err: any) {
      notification.error({ message: 'Update failed', description: err.message });
    } finally {
        setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (organization) {
        form.setFieldsValue(organization);
    }
    setIsEditing(false);
  };

  const getUserEmail = (userId: string | null | undefined) => {
    if (!userId) return '-';
    if (userId === user?.id) return user?.email;
    return 'Another User';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Spin size="large" /></div>;
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" showIcon />;
  }
  
  const pageActions = (
    <Space>
        <Button onClick={() => navigate(-1)}>Back</Button>
        {isEditing ? (
            <>
            <Button onClick={handleCancel}>Cancel</Button>
            <Button type="primary" onClick={handleSave} loading={isSaving}>Save</Button>
            </>
        ) : (
            <Button type="primary" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>
            Edit
            </Button>
        )}
    </Space>
  );

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader 
        title={organization?.name || 'Organization Details'}
        description={`Details for organization code: ${organization?.code}`}
        actions={pageActions}
      />
      <Card>
        {isEditing ? (
          <Form form={form} layout="vertical" name="organization_form">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="code" label="Code" rules={[{ required: true }]}>
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
               <Col span={12}>
                <Form.Item name="tax_id" label="Tax ID">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="phone" label="Phone">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}>
                  <Input />
                </Form.Item>
              </Col>
               <Col span={12}>
                <Form.Item name="website" label="Website">
                  <Input />
                </Form.Item>
              </Col>
               <Col span={12}>
                  <Form.Item name="is_active" label="Status" rules={[{ required: true }]}>
                    <Select>
                      <Select.Option value={true}>Active</Select.Option>
                      <Select.Option value={false}>Inactive</Select.Option>
                    </Select>
                  </Form.Item>
              </Col>
               <Col span={24}>
                <Form.Item name="address" label="Address">
                  <Input.TextArea rows={3} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="notes" label="Notes">
                  <Input.TextArea rows={3} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        ) : (
          <Descriptions bordered column={2}>
              <Descriptions.Item label="Code">{organization?.code}</Descriptions.Item>
              <Descriptions.Item label="Name">{organization?.name}</Descriptions.Item>
              <Descriptions.Item label="Tax ID">{organization?.tax_id}</Descriptions.Item>
              <Descriptions.Item label="Phone">{organization?.phone}</Descriptions.Item>
              <Descriptions.Item label="Email">{organization?.email}</Descriptions.Item>
              <Descriptions.Item label="Website">{organization?.website}</Descriptions.Item>
              <Descriptions.Item label="Status">
                  <Tag color={organization?.is_active ? 'green' : 'red'}>
                      {organization?.is_active ? 'Active' : 'Inactive'}
                  </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Address" span={2}>{organization?.address}</Descriptions.Item>
              <Descriptions.Item label="Notes" span={2}>{organization?.notes}</Descriptions.Item>
              <Descriptions.Item label="Created At">
                  {organization?.created_at ? format(new Date(organization.created_at), 'yyyy-MM-dd HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Created By">{getUserEmail(organization?.created_by)}</Descriptions.Item>
              <Descriptions.Item label="Updated At">
                  {organization?.updated_at ? format(new Date(organization.updated_at), 'yyyy-MM-dd HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Updated By">{getUserEmail(organization?.updated_by)}</Descriptions.Item>
          </Descriptions>
        )}
      </Card>
    </Space>
  );
};

const OrganizationDetailPage: React.FC = () => (
    <App>
        <OrganizationDetailPageContent />
    </App>
);

export default OrganizationDetailPage;
