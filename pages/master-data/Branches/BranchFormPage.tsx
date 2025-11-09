import React, { useEffect, useState } from 'react';
import { App, Button, Card, Form, Input, Spin, Switch, Space, Select, Row, Col, Affix } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { branchAPI, organizationAPI } from '../../../utils/apiClient';
import { Database } from '../../../types/supabase';

type BranchInsert = Database['master']['Tables']['branches']['Insert'];
type BranchUpdate = Database['master']['Tables']['branches']['Update'];
type Organization = Database['master']['Tables']['organizations']['Row'];

const BranchFormPage: React.FC = () => {
    const [form] = Form.useForm();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification } = App.useApp();

    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [organizations, setOrganizations] = useState<Pick<Organization, 'id' | 'name'>[]>([]);

    useEffect(() => {
        setIsEdit(!!id);
        const fetchData = async () => {
            setLoading(true);
            try {
                const orgs = await organizationAPI.list();
                setOrganizations(orgs || []);
                
                if (id) {
                    const data = await branchAPI.get(id);
                    if (data) {
                      form.setFieldsValue(data);
                    }
                } else {
                    form.resetFields();
                    form.setFieldsValue({ is_active: true });
                }
            } catch (error: any) {
                notification.error({ message: 'Error fetching data', description: error.message });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, form, notification]);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            if (isEdit) {
                await branchAPI.update(id!, values as BranchUpdate);
                notification.success({ message: 'Success', description: 'Branch updated successfully.' });
            } else {
                await branchAPI.create(values as BranchInsert);
                notification.success({ message: 'Success', description: 'Branch created successfully.' });
            }
            navigate('/master-data/branches');
        } catch (error: any) {
            notification.error({ message: 'Operation Failed', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Spin spinning={loading}>
            <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ is_active: true }}>
                <Card title={isEdit ? 'Edit Branch' : 'Create Branch'}>
                     {isEdit && (
                        <Row gutter={16}>
                            <Col xs={24} sm={12}>
                                <Form.Item name="code" label="Branch Code">
                                    <Input disabled style={{ cursor: 'not-allowed', backgroundColor: '#f5f5f5' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                    )}

                    <Form.Item name="organization_id" label="Organization" rules={[{ required: true, message: 'Please select an organization' }]}>
                        <Select
                            showSearch
                            placeholder="Select an organization"
                            optionFilterProp="children"
                            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                            options={organizations.map(org => ({ value: org.id, label: org.name }))}
                        />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item name="name" label="Branch Name (Vietnamese)" rules={[{ required: true, message: 'Please enter the branch name' }]}>
                                <Input placeholder="e.g., Chi nhánh Hồ Chí Minh" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                             <Form.Item name="name_en" label="Branch Name (English)">
                                <Input placeholder="e.g., Ho Chi Minh Branch" />
                            </Form.Item>
                        </Col>
                    </Row>
                    
                     <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item name="manager_name" label="Manager Name">
                                <Input placeholder="e.g., Nguyễn Văn A" />
                            </Form.Item>
                        </Col>
                         <Col xs={24} sm={12}>
                            <Form.Item name="manager_phone" label="Manager Phone">
                                <Input placeholder="e.g., (+84) 909 123 456" />
                            </Form.Item>
                        </Col>
                    </Row>
                    
                     <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item name="phone" label="Branch Phone">
                                <Input placeholder="e.g., (+84) 28 3848 1234" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item name="email" label="Branch Email" rules={[{ type: 'email' }]}>
                                <Input placeholder="e.g., info.hcm@abccorp.vn" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={24}>
                             <Form.Item name="address" label="Address">
                                <Input.TextArea rows={3} placeholder="Full address of the branch" />
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    <Row gutter={16}>
                        <Col span={24}>
                             <Form.Item name="description" label="Description / Notes">
                                <Input.TextArea rows={3} placeholder="Any additional notes about the branch" />
                            </Form.Item>
                        </Col>
                    </Row>

                    {isEdit && (
                        <Form.Item name="is_active" label="Status" valuePropName="checked">
                            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                        </Form.Item>
                    )}
                </Card>
                <Affix offsetBottom={0}>
                    <Card className="mt-4 p-0 border-t">
                        <Row justify="end">
                            <Col>
                                <Space>
                                    <Button icon={<CloseOutlined />} onClick={() => navigate('/master-data/branches')}>
                                        Cancel
                                    </Button>
                                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                                        {isEdit ? 'Save Changes' : 'Create Branch'}
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

const BranchFormPageWrapper: React.FC = () => (
    <App><BranchFormPage /></App>
);

export default BranchFormPageWrapper;