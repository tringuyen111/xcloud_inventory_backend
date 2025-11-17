import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    App,
    Button,
    Card,
    Col,
    Form,
    Input,
    Row,
    Spin,
    Typography,
    Space,
} from 'antd';
import { SaveOutlined, PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';

const { Title } = Typography;

const OrganizationFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const { notification } = App.useApp();
    const { user } = useAuth();

    const [loading, setLoading] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [pageTitle, setPageTitle] = useState<string>('Create New Organization');
    
    const isEditMode = !!id;

    useEffect(() => {
        if (isEditMode) {
            setPageTitle('Edit Organization');
            const fetchOrganization = async () => {
                setLoading(true);
                const { data, error } = await supabase
                    .from('organizations')
                    .select('*')
                    .eq('id', id)
                    .single();
                
                if (error) {
                    notification.error({
                        message: 'Error Fetching Organization',
                        description: error.message,
                    });
                    navigate('/master-data/organizations');
                } else if (data) {
                    form.setFieldsValue(data);
                    setPageTitle(`Edit Organization: ${data.code}`);
                }
                setLoading(false);
            };
            fetchOrganization();
        }
    }, [id, isEditMode, navigate, form, notification]);

    const onFinish = async (values: any) => {
        setSubmitting(true);
        // The is_active field is removed from the form, DB will use its default value.
        const payload = {
            ...values,
            ...(isEditMode 
                ? { updated_by: user?.id, updated_at: new Date().toISOString() } 
                : { created_by: user?.id })
        };
        
        try {
            if (isEditMode) {
                const { error } = await supabase
                    .from('organizations')
                    .update(payload)
                    .eq('id', id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('organizations')
                    .insert(payload);
                if (error) throw error;
            }
            
            notification.success({
                message: `Organization successfully ${isEditMode ? 'updated' : 'created'}`,
            });
            navigate('/master-data/organizations');

        } catch (error: any) {
            if (error.code === '23505' && error.message.includes('organizations_code_key')) {
                form.setFields([
                   {
                       name: 'code',
                       errors: ['Mã tổ chức này đã tồn tại.'],
                   },
               ]);
               notification.error({
                   message: `Failed to create organization`,
                   description: "Please use a different code.",
               });
           } else {
               notification.error({
                   message: `Failed to ${isEditMode ? 'update' : 'create'} organization`,
                   description: error.message,
               });
           }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="pb-24">
            <Spin spinning={loading}>
                <Form
                    id="organization-form"
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                >
                    <Card
                        title={<Title level={4} style={{ margin: 0 }}>{pageTitle}</Title>}
                    >
                        <Row gutter={24}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="code"
                                    label="Organization Code"
                                    rules={[
                                        { required: true, message: 'Code is required' },
                                        { min: 2, message: 'Code must be at least 2 characters' }
                                    ]}
                                >
                                    <Input placeholder="e.g., ORG-001" disabled={isEditMode} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                 <Form.Item
                                    name="name"
                                    label="Organization Name"
                                    rules={[
                                        { required: true, message: 'Name is required' },
                                        { min: 2, message: 'Name must be at least 2 characters' }
                                    ]}
                                >
                                    <Input placeholder="e.g., Main Distribution Inc." />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="email"
                                    label="Email"
                                    rules={[{ type: 'email', message: 'Please enter a valid email' }]}
                                >
                                    <Input placeholder="e.g., contact@organization.com" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="phone" label="Phone">
                                    <Input placeholder="e.g., (123) 456-7890" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                 <Form.Item name="tax_code" label="Tax Code">
                                    <Input placeholder="e.g., 1234567890" />
                                </Form.Item>
                            </Col>
                            {/* is_active field is removed as per requirements, DB defaults to true */}
                            <Col span={24}>
                                <Form.Item name="address" label="Address">
                                    <Input.TextArea rows={2} placeholder="Enter full address" />
                                </Form.Item>
                            </Col>
                             <Col span={24}>
                                <Form.Item name="notes" label="Notes">
                                    <Input.TextArea rows={3} placeholder="Any additional notes" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>
                </Form>
            </Spin>

            <div className="fixed bottom-6 right-6 z-50">
                <Space>
                    <Button
                        size="large"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/master-data/organizations')}
                    >
                        Hủy
                    </Button>
                    <Button
                        size="large"
                        type="primary"
                        icon={isEditMode ? <SaveOutlined /> : <PlusOutlined />}
                        htmlType="submit"
                        loading={submitting}
                        form="organization-form"
                    >
                        {isEditMode ? 'Lưu' : 'Tạo mới'}
                    </Button>
                </Space>
            </div>
        </div>
    );
};

const OrganizationFormPageWrapper: React.FC = () => (
    <App>
        <OrganizationFormPage />
    </App>
);

export default OrganizationFormPageWrapper;