import React, { useEffect, useState } from 'react';
import { App, Button, Card, Form, Input, Spin, Switch, Space, Row, Col } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { organizationAPI } from '../../../utils/apiClient';
import { Database } from '../../../types/supabase';

type OrganizationInsert = Database['master']['Tables']['organizations']['Insert'];
type OrganizationUpdate = Database['master']['Tables']['organizations']['Update'];

const OrganizationFormPage: React.FC = () => {
    const [form] = Form.useForm();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification } = App.useApp();

    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    useEffect(() => {
        const isEditing = !!id;
        setIsEdit(isEditing);
        
        if (isEditing) {
            setLoading(true);
            const fetchOrganization = async () => {
                try {
                    const data = await organizationAPI.get(id);
                    if (data) {
                        form.setFieldsValue(data);
                    }
                } catch(error: any) {
                    notification.error({ message: 'Error fetching organization', description: error.message });
                } finally {
                    setLoading(false);
                }
            };
            fetchOrganization();
        } else {
            form.resetFields();
            form.setFieldsValue({ is_active: true });
        }
    }, [id, form, notification]);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            if (isEdit) {
                await organizationAPI.update(id!, values as OrganizationUpdate);
                notification.success({ message: 'Success', description: 'Organization updated successfully.' });
            } else {
                await organizationAPI.create(values as OrganizationInsert);
                notification.success({ message: 'Success', description: 'Organization created successfully.' });
            }
            navigate('/master-data/organizations');
        } catch (caughtError: any) {
             notification.error({ message: 'Operation Failed', description: caughtError.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card title={isEdit ? 'Edit Organization' : 'Create Organization'}>
            <Spin spinning={loading}>
                <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ is_active: true }}>
                    {isEdit && (
                        <Row gutter={16}>
                            <Col xs={24} sm={12}>
                                <Form.Item name="code" label="Organization Code">
                                    <Input disabled style={{ cursor: 'not-allowed', backgroundColor: '#f5f5f5' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                    )}

                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item name="name" label="Organization Name (Vietnamese)" rules={[{ required: true, message: 'Please enter the organization name' }]}>
                                <Input placeholder="e.g., Công ty Cổ phần ABC" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item name="name_en" label="Organization Name (English)">
                                <Input placeholder="e.g., ABC Corporation" />
                            </Form.Item>
                        </Col>
                    </Row>
                    
                     <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item name="tax_code" label="Tax Code">
                                <Input placeholder="e.g., 0101234567" />
                            </Form.Item>
                        </Col>
                         <Col xs={24} sm={12}>
                            <Form.Item name="phone" label="Phone Number">
                                <Input placeholder="e.g., (+84) 28 3848 1234" />
                            </Form.Item>
                        </Col>
                    </Row>

                     <Row gutter={16}>
                         <Col xs={24} sm={12}>
                            <Form.Item name="email" label="Email Address" rules={[{ type: 'email' }]}>
                                <Input placeholder="e.g., contact@abccorp.vn" />
                            </Form.Item>
                        </Col>
                         <Col xs={24} sm={12}>
                            <Form.Item name="website" label="Website" rules={[{ type: 'url' }]}>
                                <Input placeholder="e.g., https://www.abccorp.vn" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={24}>
                             <Form.Item name="address" label="Address">
                                <Input.TextArea rows={3} placeholder="Full address" />
                            </Form.Item>
                        </Col>
                    </Row>

                     <Row gutter={16}>
                        <Col span={24}>
                             <Form.Item name="description" label="Description / Notes">
                                <Input.TextArea rows={3} placeholder="Any additional notes" />
                            </Form.Item>
                        </Col>
                    </Row>
                    
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
                                        {isEdit ? 'Save Changes' : 'Create Organization'}
                                    </Button>
                                    <Button icon={<CloseOutlined />} onClick={() => navigate('/master-data/organizations')}>
                                        Cancel
                                    </Button>
                                </Space>
                            </Col>
                        </Row>
                    </Form.Item>
                </Form>
            </Spin>
        </Card>
    );
};

const OrganizationFormPageWrapper: React.FC = () => (
    <App><OrganizationFormPage /></App>
);

export default OrganizationFormPageWrapper;
