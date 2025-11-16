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
    Switch,
    Typography,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
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
    const [organizationCode, setOrganizationCode] = useState<string>('');
    
    const isEditMode = !!id;

    useEffect(() => {
        if (isEditMode) {
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
                    form.setFieldsValue({
                        ...data,
                        status: data.is_active,
                    });
                    setOrganizationCode(data.code);
                }
                setLoading(false);
            };
            fetchOrganization();
        }
    }, [id, isEditMode, navigate, form, notification]);

    const onFinish = async (values: any) => {
        setSubmitting(true);
        const { status, ...restValues } = values;
        const payload = {
            ...restValues,
            is_active: status,
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
            notification.error({
                message: `Failed to ${isEditMode ? 'update' : 'create'} organization`,
                description: error.message,
            });
        } finally {
            setSubmitting(false);
        }
    };

    const pageTitle = isEditMode ? `Edit Organization: ${organizationCode}` : 'Create New Organization';

    const headerActions = (
        <div className="flex items-center space-x-2">
            <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/master-data/organizations')}
            >
                Back to List
            </Button>
            <Button
                type="primary"
                icon={<SaveOutlined />}
                htmlType="submit"
                loading={submitting}
            >
                Save
            </Button>
        </div>
    );

    return (
        <Spin spinning={loading}>
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ status: true }}
            >
                <Card
                    title={<Title level={4} style={{ margin: 0 }}>{pageTitle}</Title>}
                    extra={headerActions}
                >
                    <Row gutter={24}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="code"
                                label="Organization Code"
                                rules={[{ required: true, message: 'Code is required' }]}
                            >
                                <Input placeholder="e.g., ORG-001" disabled={isEditMode} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                             <Form.Item
                                name="name"
                                label="Organization Name"
                                rules={[{ required: true, message: 'Name is required' }]}
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
                         <Col xs={24} md={12}>
                            <Form.Item name="status" label="Status" valuePropName="checked">
                                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                            </Form.Item>
                        </Col>
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
    );
};

const OrganizationFormPageWrapper: React.FC = () => (
    <App>
        <OrganizationFormPage />
    </App>
);

export default OrganizationFormPageWrapper;
