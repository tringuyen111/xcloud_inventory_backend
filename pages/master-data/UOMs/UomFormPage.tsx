import React, { useEffect, useState } from 'react';
import { App, Button, Card, Form, Input, Spin, Switch, Space, Select, Checkbox, InputNumber, Row, Col } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { uomAPI, uomCategoryAPI } from '../../../utils/apiClient';
import { Database } from '../../../types/supabase';
import { useUserProfile } from '../../../hooks/useUserProfile';

type UomInsert = Database['master']['Tables']['uoms']['Insert'];
type UomUpdate = Database['master']['Tables']['uoms']['Update'];
type UomCategory = Database['master']['Tables']['uom_categories']['Row'];
type Uom = Database['master']['Tables']['uoms']['Row'];

const UomFormPage: React.FC = () => {
    const [form] = Form.useForm();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification } = App.useApp();
    const { profile, loading: profileLoading } = useUserProfile();

    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [categories, setCategories] = useState<UomCategory[]>([]);
    const [uoms, setUoms] = useState<Uom[]>([]);
    const isBaseUnit = Form.useWatch('is_base_unit', form);
    
    useEffect(() => {
        setIsEdit(!!id);
        const fetchData = async () => {
            setLoading(true);
            try {
                const [catRes, uomRes] = await Promise.all([
                    uomCategoryAPI.list(),
                    uomAPI.list()
                ]);
                setCategories(catRes as UomCategory[]);
                setUoms(uomRes as Uom[]);

                if (id) {
                    const data = await uomAPI.get(id);
                    form.setFieldsValue(data);
                } else {
                    form.resetFields();
                    form.setFieldsValue({ is_base_unit: false });
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
        if (!profile?.organization_id) {
            notification.error({ message: 'Error', description: 'User organization not found.' });
            return;
        }
        setLoading(true);
        const finalValues = {
            ...values,
            organization_id: profile.organization_id.toString(),
            base_unit_id: values.is_base_unit ? null : values.base_unit_id,
            conversion_factor: values.is_base_unit ? 1 : values.conversion_factor,
        };

        try {
            if (isEdit) {
                await uomAPI.update(id!, finalValues as UomUpdate);
                notification.success({ message: 'Success', description: 'UoM updated successfully.' });
            } else {
                await uomAPI.create(finalValues as UomInsert);
                notification.success({ message: 'Success', description: 'UoM created successfully.' });
            }
            navigate('/master-data/uoms');
        } catch (error: any) {
            notification.error({ message: 'Error', description: error.message });
        } finally {
            setLoading(false);
        }
    };
    
    const isReady = !profileLoading && (isEdit || !!profile);

    return (
        <Card title={isEdit ? 'Edit Unit of Measure' : 'Create Unit of Measure'}>
            <Spin spinning={loading || profileLoading}>
                {isReady ? (
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="uom_category_id" label="UoM Category" rules={[{ required: true }]}>
                                <Select showSearch options={categories.map(c => ({ value: c.id, label: c.name }))} />
                            </Form.Item>
                        </Col>
                         <Col span={12}>
                            <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                         {isEdit && (
                            <Col span={12}>
                                <Form.Item name="code" label="Code">
                                    <Input disabled />
                                </Form.Item>
                            </Col>
                        )}
                        <Col span={isEdit ? 12 : 24}>
                            <Form.Item name="symbol" label="Symbol">
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="is_base_unit" valuePropName="checked">
                        <Checkbox>Is Base Unit</Checkbox>
                    </Form.Item>
                    
                    {!isBaseUnit && (
                        <Row gutter={16}>
                             <Col span={12}>
                                <Form.Item name="base_unit_id" label="Base Unit" rules={[{ required: !isBaseUnit }]}>
                                    <Select showSearch options={uoms.filter(u => u.is_base_unit).map(u => ({ value: u.id, label: u.name }))} />
                                </Form.Item>
                            </Col>
                             <Col span={12}>
                                <Form.Item name="conversion_factor" label="Conversion Factor" rules={[{ required: !isBaseUnit }]}>
                                    <InputNumber style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                    )}
                    
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
                                    <Button icon={<CloseOutlined />} onClick={() => navigate('/master-data/uoms')}>
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

const UomFormPageWrapper: React.FC = () => (
    <App><UomFormPage /></App>
);

export default UomFormPageWrapper;