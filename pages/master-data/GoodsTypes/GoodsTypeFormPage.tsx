import React, { useEffect, useState } from 'react';
import { App, Button, Card, Form, Input, Spin, Switch, Space, Row, Col, Affix } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { goodsTypeAPI } from '../../../utils/apiClient';
import { Database } from '../../../types/supabase';
import { useUserProfile } from '../../../hooks/useUserProfile';

type GoodsTypeInsert = Database['master']['Tables']['goods_types']['Insert'];
type GoodsTypeUpdate = Database['master']['Tables']['goods_types']['Update'];

const GoodsTypeFormPage: React.FC = () => {
    const [form] = Form.useForm();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification } = App.useApp();
    const { profile, loading: profileLoading } = useUserProfile();

    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    useEffect(() => {
        setIsEdit(!!id);
        const fetchData = async () => {
            setLoading(true);
            try {
                if (id) {
                    const data = await goodsTypeAPI.get(id);
                    if (data) form.setFieldsValue(data);
                } else {
                    form.resetFields();
                    form.setFieldsValue({ is_active: true });
                }
            } catch(error: any) {
                notification.error({ message: 'Error fetching data', description: error.message });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, form, notification]);

    const onFinish = async (values: any) => {
        if (!profile?.organization_uuid) {
            notification.error({ message: 'Error', description: 'User organization could not be determined.' });
            return;
        }
        setLoading(true);
        const payload = {
            ...values,
            parent_id: null, // Logic removed as per user request
            organization_id: profile.organization_uuid,
        };
        try {
            if (isEdit) {
                await goodsTypeAPI.update(id!, payload as GoodsTypeUpdate);
                notification.success({ message: 'Success', description: 'Goods Type updated successfully.' });
            } else {
                await goodsTypeAPI.create(payload as GoodsTypeInsert);
                notification.success({ message: 'Success', description: 'Goods Type created successfully.' });
            }
            navigate('/master-data/goods-types');
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
                <Card title={isEdit ? 'Edit Goods Type' : 'Create Goods Type'}>
                    {isReady ? (
                        <>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                                        <Input />
                                    </Form.Item>
                                </Col>
                                {isEdit && (
                                    <Col span={12}>
                                        <Form.Item name="code" label="Code">
                                            <Input disabled />
                                        </Form.Item>
                                    </Col>
                                )}
                            </Row>

                            {isEdit && (
                                 <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="is_active" label="Status" valuePropName="checked">
                                            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            )}

                            <Form.Item name="description" label="Description">
                                <Input.TextArea rows={3} placeholder="Enter a description for the goods type" />
                            </Form.Item>
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
                                    <Button icon={<CloseOutlined />} onClick={() => navigate('/master-data/goods-types')}>
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

const GoodsTypeFormPageWrapper: React.FC = () => (
    <App><GoodsTypeFormPage /></App>
);

export default GoodsTypeFormPageWrapper;