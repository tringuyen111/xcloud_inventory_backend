

import React, { useEffect, useState } from 'react';
import { App, Button, Card, Form, Input, Spin, Switch, Space, Select, Row, Col, Affix } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { warehouseAPI } from '../../utils/apiClient';
import { Database } from '../../types/supabase';

type UserUpdate = Database['public']['Tables']['users']['Update'];
type Warehouse = Database['master']['Tables']['warehouses']['Row'];

const USER_ROLES = ['ADMIN', 'WAREHOUSE_MANAGER', 'STAFF'];

const UserFormPage: React.FC = () => {
    const [form] = Form.useForm();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification } = App.useApp();

    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [warehouses, setWarehouses] = useState<Pick<Warehouse, 'id' | 'name'>[]>([]);

    useEffect(() => {
        setIsEdit(!!id);
        const fetchData = async () => {
            setLoading(true);
            try {
                const whRes = await warehouseAPI.list();
                setWarehouses(whRes || []);

                if (id) {
                    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
                    if (error) throw error;
                    if (data) form.setFieldsValue(data);
                } else {
                    form.resetFields();
                    form.setFieldsValue({ is_active: true, role: 'STAFF' });
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
                const payload: UserUpdate = {
                    full_name: values.full_name,
                    role: values.role,
                    warehouse_id: values.warehouse_id,
                    is_active: values.is_active,
                };
                const { error } = await supabase.from('users').update(payload).eq('id', id!);
                if (error) throw error;
                notification.success({ message: 'User updated successfully.' });
            } else {
                // Step A: Create auth user
                const { data: authData, error: signUpError } = await supabase.auth.signUp({
                    email: values.email,
                    password: values.password,
                });
                if (signUpError) throw signUpError;
                if (!authData.user) throw new Error("Could not create authentication user.");

                // Step B: Update public user profile
                const { error: updateError } = await supabase
                    .from('users')
                    .update({
                        full_name: values.full_name,
                        role: values.role,
                        warehouse_id: values.warehouse_id,
                        is_active: values.is_active,
                    })
                    .eq('id', authData.user.id);
                if (updateError) throw updateError;
                notification.success({ message: 'User created successfully. A confirmation email has been sent.' });
            }
            navigate('/settings/users');
        } catch (error: any) {
            notification.error({ message: 'Operation Failed', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Spin spinning={loading}>
            <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ is_active: true }}>
                <Card title={isEdit ? 'Edit User' : 'Create User'}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                                <Input disabled={isEdit} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="full_name" label="Full Name" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>
                    {!isEdit && (
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="password"
                                    label="Password"
                                    rules={[{ required: true, min: 6, message: 'Password must be at least 6 characters long.' }]}
                                    hasFeedback
                                >
                                    <Input.Password />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="confirm"
                                    label="Confirm Password"
                                    dependencies={['password']}
                                    hasFeedback
                                    rules={[
                                        { required: true, message: 'Please confirm your password!' },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value || getFieldValue('password') === value) {
                                                    return Promise.resolve();
                                                }
                                                return Promise.reject(new Error('The two passwords that you entered do not match!'));
                                            },
                                        }),
                                    ]}
                                >
                                    <Input.Password />
                                </Form.Item>
                            </Col>
                        </Row>
                    )}
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                                <Select options={USER_ROLES.map(role => ({ value: role, label: role }))} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="warehouse_id" label="Default Warehouse">
                                <Select
                                    showSearch
                                    allowClear
                                    placeholder="Select a warehouse"
                                    optionFilterProp="label"
                                    options={warehouses.map(w => ({ value: w.id, label: w.name }))}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                         <Col span={12}>
                            <Form.Item name="is_active" label="Status" rules={[{ required: true }]}>
                                <Select>
                                    <Select.Option value={true}>Active</Select.Option>
                                    <Select.Option value={false}>Inactive</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>
                <Affix offsetBottom={0}>
                    <Card className="mt-4 p-0 border-t">
                        <Row justify="end">
                            <Col>
                                <Space>
                                    <Button icon={<CloseOutlined />} onClick={() => navigate('/settings/users')}>
                                        Cancel
                                    </Button>
                                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                                        {isEdit ? 'Save Changes' : 'Create User'}
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

const UserFormPageWrapper: React.FC = () => (
    <App><UserFormPage /></App>
);

export default UserFormPageWrapper;