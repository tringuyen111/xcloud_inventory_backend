import React, { useEffect, useState } from 'react';
import { App, Button, Card, Form, Input, Spin, Switch, Space, Select, Row, Col, Affix } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { goodsModelAPI, goodsTypeAPI, uomAPI } from '../../../utils/apiClient';
import { Database } from '../../../types/supabase';
import { useUserProfile } from '../../../hooks/useUserProfile';

type GoodsModelInsert = Database['master']['Tables']['goods_models']['Insert'];
type GoodsModelUpdate = Database['master']['Tables']['goods_models']['Update'];
type GoodsType = Database['master']['Tables']['goods_types']['Row'];
type Uom = Database['master']['Tables']['uoms']['Row'];

const TRACKING_TYPES = [
    { value: "NONE", label: "No Tracking" },
    { value: "LOT", label: "Lot Tracking" },
    { value: "SERIAL", label: "Serial Tracking" }
];

const GoodsModelFormPage: React.FC = () => {
    const [form] = Form.useForm();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification } = App.useApp();
    const { profile, loading: profileLoading } = useUserProfile();

    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [goodsTypes, setGoodsTypes] = useState<GoodsType[]>([]);
    const [uoms, setUoms] = useState<Uom[]>([]);

    useEffect(() => {
        setIsEdit(!!id);
        const fetchData = async () => {
            setLoading(true);
            try {
                const [gtRes, uomRes] = await Promise.all([
                    goodsTypeAPI.list(),
                    uomAPI.list()
                ]);
                
                setGoodsTypes(gtRes || []);
                setUoms(uomRes || []);

                if (id) {
                    const data = await goodsModelAPI.get(id);
                    if (data) form.setFieldsValue(data);
                } else {
                    form.resetFields();
                    form.setFieldsValue({ tracking_type: 'NONE', is_active: true });
                }
            } catch (error: any) {
                notification.error({ message: 'Error', description: error.message });
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
            organization_id: profile.organization_uuid,
        };
        try {
            if (isEdit) {
                await goodsModelAPI.update(id!, payload as GoodsModelUpdate);
                notification.success({ message: 'Success', description: 'Goods Model updated successfully.' });
            } else {
                await goodsModelAPI.create(payload as GoodsModelInsert);
                notification.success({ message: 'Success', description: 'Goods Model created successfully.' });
            }
            navigate('/master-data/goods-models');
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
                <Card title={isEdit ? 'Edit Goods Model' : 'Create Goods Model'}>
                     {isReady ? (
                        <>
                            {isEdit && (
                                <Form.Item name="code" label="Part Number (Code)">
                                    <Input disabled />
                                </Form.Item>
                            )}

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="name_en" label="Name (English)">
                                        <Input />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                 <Col span={24}>
                                    <Form.Item name="sku" label="SKU / SAP Code">
                                        <Input />
                                    </Form.Item>
                                </Col>
                            </Row>
                             <Row gutter={16}>
                                 <Col span={12}>
                                    <Form.Item name="goods_type_id" label="Goods Type" rules={[{ required: true }]}>
                                        <Select showSearch options={goodsTypes.map(gt => ({ value: gt.id, label: gt.name }))} />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="base_uom_id" label="Base UoM" rules={[{ required: true }]}>
                                        <Select showSearch options={uoms.map(u => ({ value: u.id, label: u.name }))} />
                                    </Form.Item>
                                </Col>
                            </Row>
                             <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="tracking_type" label="Tracking Type" rules={[{ required: true }]}>
                                        <Select options={TRACKING_TYPES} />
                                    </Form.Item>
                                </Col>
                                 {isEdit && (
                                    <Col span={12}>
                                        <Form.Item name="is_active" label="Status" valuePropName="checked">
                                            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                                        </Form.Item>
                                    </Col>
                                )}
                            </Row>
                             <Row gutter={16}>
                                <Col span={24}>
                                    <Form.Item name="description" label="Description">
                                        <Input.TextArea rows={3} />
                                    </Form.Item>
                                </Col>
                            </Row>
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
                                    <Button icon={<CloseOutlined />} onClick={() => navigate('/master-data/goods-models')}>
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

const GoodsModelFormPageWrapper: React.FC = () => (
    <App><GoodsModelFormPage /></App>
);

export default GoodsModelFormPageWrapper;