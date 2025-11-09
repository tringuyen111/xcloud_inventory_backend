import React, { useEffect, useState } from 'react';
import { App, Button, Card, Form, Input, Spin, Switch, Space, Select, Row, Col, Affix } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { locationAPI, warehouseAPI, goodsModelAPI } from '../../../utils/apiClient';
import { Database } from '../../../types/supabase';

type LocationInsert = Database['master']['Tables']['locations']['Insert'];
type LocationUpdate = Database['master']['Tables']['locations']['Update'];
type Warehouse = Database['master']['Tables']['warehouses']['Row'];
type GoodsModel = Database['master']['Tables']['goods_models']['Row'];

const LocationFormPage: React.FC = () => {
    const [form] = Form.useForm();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification } = App.useApp();

    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [goodsModels, setGoodsModels] = useState<GoodsModel[]>([]);
    
    const restrictionType = Form.useWatch('goods_model_restriction_type', form);

    useEffect(() => {
        setIsEdit(!!id);
        const fetchData = async () => {
            setLoading(true);
            try {
                const [whRes, gmRes] = await Promise.all([
                    warehouseAPI.list(),
                    goodsModelAPI.list()
                ]);
                
                setWarehouses(whRes || []);
                setGoodsModels(gmRes || []);

                if (id) {
                    const data = await locationAPI.get(id);
                    if (data) {
                      form.setFieldsValue(data);
                    }
                } else {
                    form.resetFields();
                    form.setFieldsValue({ 
                        is_blocked: false, 
                        is_active: true,
                        goods_model_restriction_type: 'NONE'
                    });
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
        
        const payload = { ...values };
        if (payload.goods_model_restriction_type === 'NONE') {
            payload.restricted_goods_model_ids = null;
        }

        try {
            if (isEdit) {
                await locationAPI.update(id!, payload as LocationUpdate);
                notification.success({ message: 'Success', description: 'Location updated successfully.' });
            } else {
                await locationAPI.create(payload as LocationInsert);
                notification.success({ message: 'Success', description: 'Location created successfully.' });
            }
            navigate('/master-data/locations');
        } catch (error: any) {
            notification.error({ message: 'Error', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Spin spinning={loading}>
            <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ is_active: true, goods_model_restriction_type: 'NONE' }}>
                <Card title={isEdit ? 'Edit Location' : 'Create Location'}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="name" label="Location Name" rules={[{ required: true }]}>
                                <Input placeholder="e.g., Aisle 1, Rack 01, Bin A" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="warehouse_id" label="Warehouse" rules={[{ required: true }]}>
                              <Select showSearch placeholder="Select warehouse" options={warehouses.map(w => ({ value: w.id, label: w.name }))} />
                          </Form.Item>
                        </Col>
                    </Row>
                    
                    {isEdit && (
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="code" label="Location Code">
                                    <Input disabled />
                                </Form.Item>
                            </Col>
                        </Row>
                    )}

                    <Card size="small" title="Storage Restrictions" style={{ marginBottom: '16px' }}>
                        <Form.Item name="goods_model_restriction_type" label="Goods Model Restriction">
                            <Select>
                                <Select.Option value="NONE">No Restriction</Select.Option>
                                <Select.Option value="ALLOWED_LIST">Allow Specific Models</Select.Option>
                                <Select.Option value="DISALLOWED_LIST">Disallow Specific Models</Select.Option>
                            </Select>
                        </Form.Item>

                        {restrictionType && restrictionType !== 'NONE' && (
                            <Form.Item
                                name="restricted_goods_model_ids"
                                label={restrictionType === 'ALLOWED_LIST' ? "Allowed Models" : "Disallowed Models"}
                                rules={[{ required: true, message: 'Please select at least one model.' }]}
                            >
                                <Select
                                    mode="multiple"
                                    allowClear
                                    showSearch
                                    placeholder="Select goods models..."
                                    optionFilterProp="label"
                                    options={goodsModels.map(gm => ({
                                        value: gm.id,
                                        label: `${gm.name} (${gm.code})`
                                    }))}
                                />
                            </Form.Item>
                        )}
                    </Card>

                    {isEdit && (
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item name="is_active" label="Status" valuePropName="checked">
                                    <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                                </Form.Item>
                            </Col>
                        </Row>
                    )}

                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                </Card>

                <Affix offsetBottom={0}>
                    <Card className="mt-4 p-0 border-t">
                        <Row justify="end">
                            <Col>
                                <Space>
                                    <Button icon={<CloseOutlined />} onClick={() => navigate('/master-data/locations')}>
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

const LocationFormPageWrapper: React.FC = () => (
    <App><LocationFormPage /></App>
);

export default LocationFormPageWrapper;