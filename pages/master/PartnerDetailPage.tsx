import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { Partner, Organization } from '../../types/supabase';
import {
  Button, Card, Form, Input, Row, Col, Typography, Space, App, Spin, Select, Descriptions, Tag, Alert
} from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import useAuthStore from '../../stores/authStore';

const { Title, Text } = Typography;
const PARTNER_TYPES: Partner['partner_type'][] = ['CUSTOMER', 'SUPPLIER', 'CARRIER', 'OTHER'];
type PartnerWithOrg = Partner & { organization?: { name: string } };

const PartnerDetailPageContent: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const { notification } = App.useApp();

    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [partner, setPartner] = useState<PartnerWithOrg | null>(null);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const user = useAuthStore((state) => state.user);

    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const orgPromise = supabase.from('organizations').select('id, name').eq('is_active', true);
            const partnerPromise = supabase.from('partners').select('*, organization:organizations(name)').eq('id', id).single();
            const [{ data: orgData, error: orgError }, { data: partnerData, error: partnerError }] = await Promise.all([orgPromise, partnerPromise]);
            
            if (orgError || partnerError) throw orgError || partnerError;
            
            setOrganizations(orgData || []);
            if (partnerData) {
                setPartner(partnerData);
                form.setFieldsValue(partnerData);
            } else {
                throw new Error("Partner not found");
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
            const { error } = await supabase.from('partners').update({ ...values, updated_at: new Date().toISOString(), updated_by: user?.id }).eq('id', id);
            if (error) throw error;
            notification.success({ message: 'Partner updated successfully' });
            setIsEditing(false);
            fetchData();
        } catch (err: any) {
            notification.error({ message: 'Update failed', description: err.message });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleCancel = () => {
        if (partner) form.setFieldsValue(partner);
        setIsEditing(false);
    };
    
    const getTypeTagColor = (type: Partner['partner_type']) => {
        switch(type) {
          case 'CUSTOMER': return 'blue';
          case 'SUPPLIER': return 'orange';
          case 'CARRIER': return 'purple';
          default: return 'default';
        }
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
                    <Title level={3} className="mb-0">{partner?.name}</Title>
                    <Text type="secondary">Details for partner code: {partner?.code}</Text>
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
                <Form form={form} layout="vertical" name="partner_form">
                <Row gutter={16}>
                  <Col span={12}><Form.Item name="org_id" label="Organization" rules={[{ required: true }]}><Select>{organizations.map(org => <Select.Option key={org.id} value={org.id}>{org.name}</Select.Option>)}</Select></Form.Item></Col>
                  <Col span={12}><Form.Item name="code" label="Code" rules={[{ required: true }]}><Input disabled /></Form.Item></Col>
                  <Col span={12}><Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
                  <Col span={12}><Form.Item name="partner_type" label="Partner Type"><Select>{PARTNER_TYPES.map(type => <Select.Option key={type} value={type}>{type}</Select.Option>)}</Select></Form.Item></Col>
                  <Col span={12}><Form.Item name="tax_id" label="Tax ID"><Input /></Form.Item></Col>
                  <Col span={12}><Form.Item name="phone" label="Phone"><Input /></Form.Item></Col>
                  <Col span={12}><Form.Item name="email" label="Email" rules={[{ type: 'email' }]}><Input /></Form.Item></Col>
                  <Col span={12}><Form.Item name="is_active" label="Status"><Select><Select.Option value={true}>Active</Select.Option><Select.Option value={false}>Inactive</Select.Option></Select></Form.Item></Col>
                  <Col span={24}><Form.Item name="address" label="Address"><Input.TextArea rows={3} /></Form.Item></Col>
                  <Col span={24}><Form.Item name="notes" label="Notes"><Input.TextArea rows={3} /></Form.Item></Col>
                </Row>
              </Form>
            ) : (
                <Descriptions bordered column={2}>
                    <Descriptions.Item label="Code">{partner?.code}</Descriptions.Item>
                    <Descriptions.Item label="Name">{partner?.name}</Descriptions.Item>
                    <Descriptions.Item label="Organization">{partner?.organization?.name}</Descriptions.Item>
                    <Descriptions.Item label="Partner Type"><Tag color={getTypeTagColor(partner?.partner_type!)}>{partner?.partner_type}</Tag></Descriptions.Item>
                    <Descriptions.Item label="Tax ID">{partner?.tax_id}</Descriptions.Item>
                    <Descriptions.Item label="Phone">{partner?.phone}</Descriptions.Item>
                    <Descriptions.Item label="Email">{partner?.email}</Descriptions.Item>
                    <Descriptions.Item label="Status"><Tag color={partner?.is_active ? 'green' : 'red'}>{partner?.is_active ? 'Active' : 'Inactive'}</Tag></Descriptions.Item>
                    <Descriptions.Item label="Address" span={2}>{partner?.address}</Descriptions.Item>
                    <Descriptions.Item label="Notes" span={2}>{partner?.notes}</Descriptions.Item>
                    <Descriptions.Item label="Created At">{partner?.created_at ? format(new Date(partner.created_at), 'yyyy-MM-dd HH:mm') : '-'}</Descriptions.Item>
                    <Descriptions.Item label="Created By">{getUserEmail(partner?.created_by)}</Descriptions.Item>
                    <Descriptions.Item label="Updated At">{partner?.updated_at ? format(new Date(partner.updated_at), 'yyyy-MM-dd HH:mm') : '-'}</Descriptions.Item>
                    <Descriptions.Item label="Updated By">{getUserEmail(partner?.updated_by)}</Descriptions.Item>
                </Descriptions>
            )}
        </Card>
    );
};

const PartnerDetailPage: React.FC = () => (
    <App><PartnerDetailPageContent /></App>
);

export default PartnerDetailPage;