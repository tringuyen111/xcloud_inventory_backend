import React, { useEffect, useState } from 'react';
import { App, Button, Card, Form, Input, Spin, Switch, Space, Select, Row, Col, Radio } from 'antd';
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

                setGoodsTypes(gtRes as GoodsType[]);
                setUoms(uomRes as Uom[]);

                if (id) {
                    const data = await goodsModelAPI.get(id);
                    form.setFieldsValue(data);
                } else {
                    form.resetFields();
                    form.setFieldsValue({ tracking_type: 'NONE' });
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
        <Card title={isEdit ? 'Edit Goods Model' : 'Create Goods Model'}>
            <Spin spinning={loading || profileLoading}>
                 {isReady ? (
                    <Form form={form} layout="vertical" onFinish={onFinish}>
                        <Row gutter={16}>
                             {isEdit && (
                                <Col span={12}>
                                    <Form.Item name="code" label="Part Number (Code)">
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
                        <Row gutter={16}>
                             <Col span={12}>
                                <Form.Item name="sku" label="SKU / SAP Code">
                                    <Input />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="barcode" label="Barcode">
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
                                    <Radio.Group options={TRACKING_TYPES} optionType="button" buttonStyle="solid" />
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
                        <Form.Item>
                            <Row justify="end">
                                <Col>
                                    <Space>
                                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                                            {isEdit ? 'Save Changes' : 'Create'}
                                        </Button>
                                        <Button icon={<CloseOutlined />} onClick={() => navigate('/master-data/goods-models')}>
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

const GoodsModelFormPageWrapper: React.FC = () => (
    <App><GoodsModelFormPage /></App>
);

export default GoodsModelFormPageWrapper;