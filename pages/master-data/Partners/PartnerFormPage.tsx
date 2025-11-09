import React, { useEffect, useState } from 'react';
import { App, Button, Card, Form, Input, Spin, Switch, Space, Select, Row, Col, Affix } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { partnerAPI } from '../../../utils/apiClient';
import { Database } from '../../../types/supabase';
import { useUserProfile } from '../../../hooks/useUserProfile';

type PartnerInsert = Database['master']['Tables']['partners']['Insert'];
type PartnerUpdate = Database['master']['Tables']['partners']['Update'];

const PartnerFormPage: React.FC = () => {
    const [form] = Form.useForm();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification } = App.useApp();
    const { profile, loading: profileLoading } = useUserProfile();

    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    useEffect(() => {
        setIsEdit(!!id);
        if (id) {
            setLoading(true);
            partnerAPI.get(id)
                .then((data) => {
                    if (data) {
                        const partnerTypes = [];
                        if (data.is_supplier) partnerTypes.push('is_supplier');
                        if (data.is_customer) partnerTypes.push('is_customer');
                        if (data.is_carrier) partnerTypes.push('is_carrier');
                        form.setFieldsValue({ ...data, partner_types: partnerTypes });
                    }
                })
                .catch(error => notification.error({ message: 'Error fetching partner', description: error.message }))
                .finally(() => setLoading(false));
        } else {
            form.resetFields();
            form.setFieldsValue({ is_active: true });
        }
    }, [id, form, notification]);

    const onFinish = async (values: any) => {
        if (!profile?.organization_uuid) {
            notification.error({ message: 'Error', description: 'User organization could not be determined.' });
            return;
        }
        setLoading(true);
        
        const partnerTypes: string[] = values.partner_types || [];
        const payload = {
            ...values,
            organization_id: profile.organization_uuid,
            is_supplier: partnerTypes.includes('is_supplier'),
            is_customer: partnerTypes.includes('is_customer'),
            is_carrier: partnerTypes.includes('is_carrier'),
        };
        delete payload.partner_types;

        try {
            if (isEdit) {
                await partnerAPI.update(id!, payload as PartnerUpdate)
                notification.success({ message: 'Success', description: 'Partner updated successfully.' });
            } else {
                await partnerAPI.create(payload as PartnerInsert)
                notification.success({ message: 'Success', description: 'Partner created successfully.' });
            }
            navigate('/master-data/partners');
        } catch (error: any) {
            notification.error({ message: 'Error', description: error.message });
        } finally {
            setLoading(false);
        }
    };
    
    const isReady = !profileLoading && (isEdit || !!profile);

    return (
        <Spin spinning={loading || profileLoading}>
            <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ is_active: true }}>
                <Card title={isEdit ? 'Edit Partner' : 'Create Partner'}>
                    {isReady ? (
                        <>
                            <Row gutter={16}>
                                <Col span={24}>
                                    <Form.Item name="partner_types" label="Partner Type" rules={[{ required: true, message: 'Please select at least one partner type!' }]}>
                                        <Select
                                            mode="multiple"
                                            allowClear
                                            placeholder="Select partner types"
                                            options={[
                                                { label: 'Supplier', value: 'is_supplier' },
                                                { label: 'Customer', value: 'is_customer' },
                                                { label: 'Carrier', value: 'is_carrier' },
                                            ]}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                                        <Input placeholder="Partner's common name" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="tax_code" label="Tax Code">
                                        <Input placeholder="Partner's tax identification number" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="phone" label="Phone">
                                        <Input placeholder="Main phone number" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}>
                                        <Input placeholder="Main contact email" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="contact_person_name" label="Contact Person Name">
                                        <Input placeholder="Name of the primary contact" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="contact_person_phone" label="Contact Person Phone">
                                        <Input placeholder="Phone number of the primary contact" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            {isEdit && (
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="code" label="Partner Code">
                                            <Input disabled />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="is_active" label="Status" valuePropName="checked">
                                            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            )}
                        </>
                    ) : (
                        <div className="text-center p-8">Loading user and organization context...</div>
                    )}
                </Card>

                <Affix offsetBottom={0}>
                    <Card className="mt-4 p-0 border-t">
                        <Row justify="end">
                            <Col>
                                <Space>
                                    <Button icon={<CloseOutlined />} onClick={() => navigate('/master-data/partners')}>
                                        Cancel
                                    </Button>
                                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                                        {isEdit ? 'Save Changes' : 'Create'}
                                    </Button>
                                </Space>
                            </Col>
                        </Row>
                    </Card>
                </Affix>
            </Form>
        </Spin>
    );
};

const PartnerFormPageWrapper: React.FC = () => (
    <App><PartnerFormPage /></App>
);

export default PartnerFormPageWrapper;