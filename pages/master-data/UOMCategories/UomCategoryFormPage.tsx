import React, { useEffect, useState } from 'react';
import { App, Button, Card, Form, Input, Spin, Switch, Space, Row, Col } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { uomCategoryAPI } from '../../../utils/apiClient';
import { Database } from '../../../types/supabase';
import { useUserProfile } from '../../../hooks/useUserProfile';

type UomCategoryInsert = Database['master']['Tables']['uom_categories']['Insert'];
type UomCategoryUpdate = Database['master']['Tables']['uom_categories']['Update'];

const UomCategoryFormPage: React.FC = () => {
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
            uomCategoryAPI.get(id)
                .then((data) => {
                    if (data) form.setFieldsValue(data);
                })
                .catch(error => notification.error({ message: 'Error fetching UoM Category', description: error.message }))
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
        const payload = {
            ...values,
            organization_id: profile.organization_uuid,
        };
        try {
            if (isEdit) {
                await uomCategoryAPI.update(id!, payload as UomCategoryUpdate);
                notification.success({ message: 'Success', description: 'UoM Category updated successfully.' });
            } else {
                await uomCategoryAPI.create(payload as UomCategoryInsert);
                notification.success({ message: 'Success', description: 'UoM Category created successfully.' });
            }
            navigate('/master-data/uom-categories');
        } catch (error: any) {
            notification.error({ message: 'Error', description: error.message });
        } finally {
            setLoading(false);
        }
    };
    
    const isReady = !profileLoading && (isEdit || !!profile);

    return (
        <Card title={isEdit ? 'Edit UoM Category' : 'Create UoM Category'}>
            <Spin spinning={loading || profileLoading}>
                {isReady ? (
                    <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ is_active: true }}>
                        <Row gutter={16}>
                            {isEdit && (
                                <Col xs={24} sm={12}>
                                    <Form.Item name="code" label="Code">
                                        <Input disabled />
                                    </Form.Item>
                                </Col>
                            )}
                            <Col xs={24} sm={isEdit ? 12 : 24}>
                                <Form.Item name="name" label="Name (Vietnamese)" rules={[{ required: true }]}>
                                    <Input />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                             <Col xs={24} sm={12}>
                                <Form.Item name="name_en" label="Name (English)">
                                    <Input />
                                </Form.Item>
                            </Col>
                             {isEdit && (
                                <Col xs={24} sm={12}>
                                    <Form.Item name="is_active" label="Status" valuePropName="checked">
                                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                                    </Form.Item>
                                </Col>
                            )}
                        </Row>
                        
                        <Form.Item name="description" label="Description">
                            <Input.TextArea rows={3} />
                        </Form.Item>
                        
                        <Form.Item>
                            <Row justify="end">
                                <Col>
                                    <Space>
                                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                                            {isEdit ? 'Save Changes' : 'Create'}
                                        </Button>
                                        <Button icon={<CloseOutlined />} onClick={() => navigate('/master-data/uom-categories')}>
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

const UomCategoryFormPageWrapper: React.FC = () => (
    <App><UomCategoryFormPage /></App>
);

export default UomCategoryFormPageWrapper;
