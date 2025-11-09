import React, { useEffect, useState } from 'react';
import { App, Button, Card, Form, Input, Spin, Switch, Space, Select, Row, Col } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { locationAPI, warehouseAPI } from '../../../utils/apiClient';
import { Database } from '../../../types/supabase';

type LocationInsert = Database['master']['Tables']['locations']['Insert'];
type LocationUpdate = Database['master']['Tables']['locations']['Update'];
type Warehouse = Database['master']['Tables']['warehouses']['Row'];
type Location = Database['master']['Tables']['locations']['Row'];

const LocationFormPage: React.FC = () => {
    const [form] = Form.useForm();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification } = App.useApp();

    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);

    useEffect(() => {
        setIsEdit(!!id);
        const fetchData = async () => {
            setLoading(true);
            try {
                const [whRes, locRes] = await Promise.all([
                    warehouseAPI.list(),
                    locationAPI.list()
                ]);
                setWarehouses(whRes as Warehouse[]);
                setLocations(locRes as Location[]);

                if (id) {
                    const data = await locationAPI.get(id);
                    form.setFieldsValue(data);
                } else {
                    form.resetFields();
                    form.setFieldsValue({ is_blocked: false });
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
        // branch_id and organization_id are inferred on the backend via triggers from warehouse_id
        try {
            if (isEdit) {
                await locationAPI.update(id!, values as LocationUpdate);
                notification.success({ message: 'Success', description: 'Location updated successfully.' });
            } else {
                await locationAPI.create(values as LocationInsert);
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
        <Card title={isEdit ? 'Edit Location' : 'Create Location'}>
            <Spin spinning={loading}>
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="warehouse_id" label="Warehouse" rules={[{ required: true }]}>
                                <Select showSearch options={warehouses.map(w => ({ value: w.id, label: w.name }))} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="parent_id" label="Parent Location">
                                <Select allowClear showSearch options={locations.filter(l => l.id !== id).map(l => ({ value: l.id, label: l.name }))} />
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
                            <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="location_type" label="Location Type">
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                             <Form.Item name="zone_type" label="Zone Type">
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>
                     {isEdit && (
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="is_active" label="Status" valuePropName="checked">
                                    <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="is_blocked" label="Blocked" valuePropName="checked">
                                     <Switch checkedChildren="Blocked" unCheckedChildren="Not Blocked" />
                                </Form.Item>
                            </Col>
                        </Row>
                    )}
                    <Form.Item>
                        <Row justify="end">
                            <Col>
                                <Space>
                                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                                        {isEdit ? 'Save Changes' : 'Create'}
                                    </Button>
                                    <Button icon={<CloseOutlined />} onClick={() => navigate('/master-data/locations')}>
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

const LocationFormPageWrapper: React.FC = () => (
    <App><LocationFormPage /></App>
);

export default LocationFormPage;