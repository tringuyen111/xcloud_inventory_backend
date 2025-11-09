import React, { useEffect, useState } from 'react';
import { App, Button, Card, Form, Input, Spin, Switch, Space, Checkbox, Row, Col } from 'antd';
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
                    if (data) form.setFieldsValue(data);
                })
                .catch(error => notification.error({ message: 'Error fetching partner', description: error.message }))
                .finally(() => setLoading(false));
        } else {
            form.resetFields();
            form.setFieldsValue({ is_supplier: false, is_customer: false, is_carrier: false, is_active: true });
        }
    }, [id, form, notification]);

    const onFinish = async (values: any) => {
        if (!profile?.organization_uuid) {
            notification.error({ message: 'Error', description: 'User organization could not be determined.' });
            return;
        }
        setLoading(true);
        
        const payload = {
            ...values,
            organization_id: profile.organization_uuid,
            is_supplier: !!values.is_supplier,
            is_customer: !!values.is_customer,
            is_carrier: !!values.is_carrier,
        };

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
        <Card title={isEdit ? 'Edit Partner' : 'Create Partner'}>
            <Spin spinning={loading || profileLoading}>
                {isReady ? (
                    <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ is_active: true }}>
                        <Card title="Classification" style={{ marginBottom: 16 }}>
                             <Row gutter={16}>
                                <Col span={24}>
                                    <Form.Item label="Partner Type">
                                        <Space>
                                            <Form.Item name="is_supplier" valuePropName="checked" noStyle><Checkbox>Supplier</Checkbox></Form.Item>
                                            <Form.Item name="is_customer" valuePropName="checked" noStyle><Checkbox>Customer</Checkbox></Form.Item>
                                            <Form.Item name="is_carrier" valuePropName="checked" noStyle><Checkbox>Carrier</Checkbox></Form.Item>
                                        </Space>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>
                        
                        <Card title="General Information" style={{ marginBottom: 16 }}>
                            <Row gutter={16}>
                                {isEdit && (
                                    <Col span={12}>
                                        <Form.Item name="code" label="Code">
                                            <Input disabled />
                                        </Form.Item>
                                    </Col>
                                )}
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
                        </Card>

                        <Card title="Contact Details" style={{ marginBottom: 16 }}>
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
                        </Card>

                        {isEdit && (
                            <Card title="Status" style={{ marginBottom: 16 }}>
                                <Form.Item name="is_active" label="Active Status" valuePropName="checked">
                                    <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                                </Form.Item>
                            </Card>
                        )}
                        
                        <Form.Item>
                            <Row justify="end">
                                <Col>
                                    <Space>
                                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                                            {isEdit ? 'Save Changes' : 'Create'}
                                        </Button>
                                        <Button icon={<CloseOutlined />} onClick={() => navigate('/master-data/partners')}>
                                            Cancel
                                        </Button>
                                    </Space>
                                </Col>
                            </Row>
                        </Form.Item>
                    </Form>
                ) : (
                    <div className="text-center p-8">Loading user and organization context...</div>
                )}
            </Spin>
        </Card>
    );
};

const PartnerFormPageWrapper: React.FC = () => (
    <App><PartnerFormPage /></App>
);

export default PartnerFormPageWrapper;
