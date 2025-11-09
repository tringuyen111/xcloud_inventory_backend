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
                .then(data => {
                    form.setFieldsValue(data);
                })
                .catch(error => notification.error({ message: 'Error fetching partner', description: error.message }))
                .finally(() => setLoading(false));
        } else {
            form.resetFields();
            form.setFieldsValue({ is_supplier: true });
        }
    }, [id, form, notification]);

    const onFinish = async (values: any) => {
        if (!profile?.organization_id) {
            notification.error({ message: 'Error', description: 'User organization not found.' });
            return;
        }
        setLoading(true);
        
        const payload = {
            ...values,
            organization_id: profile.organization_id.toString(),
        };

        try {
            if (isEdit) {
                await partnerAPI.update(id!, payload as PartnerUpdate);
                notification.success({ message: 'Success', description: 'Partner updated successfully.' });
            } else {
                await partnerAPI.create(payload as PartnerInsert);
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
                    <Form form={form} layout="vertical" onFinish={onFinish}>
                        <Row gutter={16}>
                            {isEdit && (
                                <Col span={12}>
                                    <Form.Item name="code" label="Code">
                                        <Input disabled />
                                    </Form.Item>
                                </Col>
                            )}
                            <Col span={isEdit ? 12 : 24}>
                                <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                                    <Input />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item label="Partner Type">
                            <Space>
                                <Form.Item name="is_supplier" valuePropName="checked" noStyle><Checkbox>Supplier</Checkbox></Form.Item>
                                <Form.Item name="is_customer" valuePropName="checked" noStyle><Checkbox>Customer</Checkbox></Form.Item>
                                <Form.Item name="is_carrier" valuePropName="checked" noStyle><Checkbox>Carrier</Checkbox></Form.Item>
                            </Space>
                        </Form.Item>

                        {isEdit && (
                            <Form.Item name="is_active" label="Status" valuePropName="checked">
                                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                            </Form.Item>
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
                    <div>Loading user profile...</div>
                )}
            </Spin>
        </Card>
    );
};

const PartnerFormPageWrapper: React.FC = () => (
    <App><PartnerFormPage /></App>
);

export default PartnerFormPage;