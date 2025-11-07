

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Branch, Organization } from '../../../types/supabase';
import {
  Button, Card, Form, Input, Row, Col, Space, App, Spin, Select, Descriptions, Tag, Alert
} from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import useAuthStore from '../../../stores/authStore';
import PageHeader from '../../../components/layout/PageHeader';

type BranchWithOrg = Branch & { organization?: { name: string } };

const BranchDetailPageContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm<Branch>();
  const { notification } = App.useApp();

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branch, setBranch] = useState<BranchWithOrg | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const user = useAuthStore((state) => state.user);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
        const orgPromise = supabase.from('organizations').select('id, name').eq('is_active', true);
        const branchPromise = supabase.from('branches').select('*, organization:organizations(name)').eq('id', id).single();

        const [{ data: orgData, error: orgError }, { data: branchData, error: branchError }] = await Promise.all([orgPromise, branchPromise]);

        if (orgError) throw orgError;
        if (branchError) throw branchError;

        setOrganizations(orgData || []);
        if (branchData) {
            setBranch(branchData);
            form.setFieldsValue(branchData);
        } else {
            throw new Error("Branch not found");
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
        .from('branches')
        .update({ ...values, updated_at: new Date().toISOString(), updated_by: user?.id })
        .eq('id', id);
      
      if (error) throw error;
      
      notification.success({ message: 'Branch updated successfully' });
      setIsEditing(false);
      fetchData();
    } catch (err: any) {
      notification.error({ message: 'Update failed', description: err.message });
    } finally {
        setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (branch) form.setFieldsValue(branch);
    setIsEditing(false);
  };

  const getUserEmail = (userId: string | null | undefined) => {
    if (!userId) return '-';
    if (userId === user?.id) return user?.email;
    return 'Another User';
  };

  if (loading) return <div className="flex justify-center items-center h-full"><Spin size="large" /></div>;
  if (error) return <Alert message="Error" description={error} type="error" showIcon />;
  
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
        title={branch?.name || 'Branch Details'}
        description={`Details for branch code: ${branch?.code}`}
        actions={pageActions}
      />
      <Card>
        {isEditing ? (
          <Form form={form} layout="vertical" name="branch_form">
              <Row gutter={16}>
                  <Col span={12}>
                      <Form.Item name="org_id" label="Organization" rules={[{ required: true }]}>
                      <Select>
                          {organizations.map(org => <Select.Option key={org.id} value={org.id}>{org.name}</Select.Option>)}
                      </Select>
                      </Form.Item>
                  </Col>
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
              <Descriptions.Item label="Code">{branch?.code}</Descriptions.Item>
              <Descriptions.Item label="Name">{branch?.name}</Descriptions.Item>
              <Descriptions.Item label="Organization">{branch?.organization?.name}</Descriptions.Item>
              <Descriptions.Item label="Status">
                  <Tag color={branch?.is_active ? 'green' : 'red'}>{branch?.is_active ? 'Active' : 'Inactive'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Address" span={2}>{branch?.address}</Descriptions.Item>
              <Descriptions.Item label="Notes" span={2}>{branch?.notes}</Descriptions.Item>
              <Descriptions.Item label="Created At">
                  {branch?.created_at ? format(new Date(branch.created_at), 'yyyy-MM-dd HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Created By">{getUserEmail(branch?.created_by)}</Descriptions.Item>
              <Descriptions.Item label="Updated At">
                  {branch?.updated_at ? format(new Date(branch.updated_at), 'yyyy-MM-dd HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Updated By">{getUserEmail(branch?.updated_by)}</Descriptions.Item>
          </Descriptions>
        )}
      </Card>
    </Space>
  );
};

const BranchDetailPage: React.FC = () => (
    <App><BranchDetailPageContent /></App>
);

export default BranchDetailPage;
