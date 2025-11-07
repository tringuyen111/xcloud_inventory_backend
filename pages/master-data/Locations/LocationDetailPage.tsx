
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../services/supabaseClient';
import { Location, Warehouse, GoodsModel } from '../../../types/supabase';
import {
  Button, Card, Form, Input, Row, Col, Typography, Space, App, Spin, Select, Descriptions, Tag, Alert
} from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import useAuthStore from '../../../stores/authStore';

const { Title, Text } = Typography;

type LocationWithDetails = Location & { warehouse?: { name: string } };

const LocationDetailPageContent: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [form] = Form.useForm<any>();
    const { notification } = App.useApp();

    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [location, setLocation] = useState<LocationWithDetails | null>(null);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [goodsModels, setGoodsModels] = useState<(GoodsModel & { code: string })[]>([]);
    const constraintType = Form.useWatch('constraint_type', form);
    const user = useAuthStore((state) => state.user);

    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const whPromise = supabase.from('warehouses').select('id, name').eq('is_active', true);
            const gmPromise = supabase.from('goods_models').select('id, name, code').eq('is_active', true);
            const locPromise = supabase.from('locations').select('*, warehouse:warehouses(name)').eq('id', id).single();
            
            const [
                {data: whData, error: whError}, 
                {data: gmData, error: gmError},
                {data: locData, error: locError}
            ] = await Promise.all([whPromise, gmPromise, locPromise]);

            if (whError || gmError || locError) throw whError || gmError || locError;

            setWarehouses(whData || []);
            setGoodsModels(gmData || []);
            if (locData) {
                setLocation(locData);
                form.setFieldsValue({...locData, constrained_goods_model_ids: locData.constrained_goods_model_ids || []});
            } else {
                throw new Error("Location not found");
            }
        } catch (err: any) {
            setError(err.message);
            notification.error({ message: "Error fetching data", description: err.message });
        } finally {
            setLoading(false);
        }
    }, [id, form, notification]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            let values = await form.validateFields();
            if (values.constraint_type === 'NONE') {
                values = { ...values, constrained_goods_model_ids: null };
            }
            const { error } = await supabase.from('locations').update({ ...values, updated_at: new Date().toISOString(), updated_by: user?.id }).eq('id', id);
            if (error) throw error;
            notification.success({ message: 'Location updated successfully' });
            setIsEditing(false);
            fetchData();
        } catch (err: any) {
            notification.error({ message: 'Update failed', description: err.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (location) form.setFieldsValue({...location, constrained_goods_model_ids: location.constrained_goods_model_ids || []});
        setIsEditing(false);
    };

    const getUserEmail = (userId: string | null | undefined) => {
        if (!userId) return '-';
        if (userId === user?.id) return user?.email;
        return 'Another User';
    };

    if (loading) return <div className="flex justify-center items-center h-full"><Spin size="large" /></div>;
    if (error) return <Alert message="Error" description={error} type="error" showIcon />;

    return (
        <Card>
            <Row justify="space-between" align="middle" className="mb-6">
                <Col>
                    <Title level={3} className="mb-0">{location?.name}</Title>
                    <Text type="secondary">Details for location code: {location?.code}</Text>
                </Col>
                <Col>
                    <Space>
                        <Button onClick={() => navigate(-1)}>Back</Button>
                        {isEditing ? (
                            <>
                                <Button onClick={handleCancel}>Cancel</Button>
                                <Button type="primary" onClick={handleSave} loading={isSaving}>Save</Button>
                            </>
                        ) : (
                            <Button type="primary" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>Edit</Button>
                        )}
                    </Space>
                </Col>
            </Row>

            {isEditing ? (
                 <Form form={form} layout="vertical" name="location_form">
                 <Row gutter={16}>
                   <Col span={12}><Form.Item name="warehouse_id" label="Warehouse" rules={[{ required: true }]}><Select>{warehouses.map(w => <Select.Option key={w.id} value={w.id}>{w.name}</Select.Option>)}</Select></Form.Item></Col>
                   <Col span={12}><Form.Item name="code" label="Location Code" rules={[{ required: true }]}><Input disabled/></Form.Item></Col>
                   <Col span={24}><Form.Item name="name" label="Location Name" rules={[{ required: true }]}><Input/></Form.Item></Col>
                   <Col span={24}><Typography.Title level={5}>Goods Model Constraints</Typography.Title></Col>
                   <Col span={12}>
                     <Form.Item name="constraint_type" label="Constraint Type" rules={[{ required: true }]}>
                       <Select>
                         <Select.Option value="NONE">None (Accepts all models)</Select.Option>
                         <Select.Option value="ALLOWED">Allowed List (Only accepts selected models)</Select.Option>
                         <Select.Option value="DISALLOWED">Disallowed List (Accepts all except selected)</Select.Option>
                       </Select>
                     </Form.Item>
                   </Col>
                   {constraintType && constraintType !== 'NONE' && (
                     <Col span={24}>
                       <Form.Item name="constrained_goods_model_ids" label="Constrained Goods Models">
                         <Select
                           mode="multiple"
                           allowClear
                           style={{ width: '100%' }}
                           placeholder="Please select goods models"
                           options={goodsModels.map(model => ({ label: `${model.name} (${model.code})`, value: model.id }))}
                         />
                       </Form.Item>
                     </Col>
                   )}
                    <Col span={12}><Form.Item name="is_active" label="Status"><Select><Select.Option value={true}>Active</Select.Option><Select.Option value={false}>Inactive</Select.Option></Select></Form.Item></Col>
                   <Col span={24}><Form.Item name="description" label="Notes"><Input.TextArea rows={2}/></Form.Item></Col>
                 </Row>
               </Form>
            ) : (
                <Descriptions bordered column={2}>
                    <Descriptions.Item label="Code">{location?.code}</Descriptions.Item>
                    <Descriptions.Item label="Name">{location?.name}</Descriptions.Item>
                    <Descriptions.Item label="Warehouse">{location?.warehouse?.name}</Descriptions.Item>
                    <Descriptions.Item label="Status"><Tag color={location?.is_active ? 'green' : 'red'}>{location?.is_active ? 'Active' : 'Inactive'}</Tag></Descriptions.Item>
                    <Descriptions.Item label="Constraint Type" span={2}><Tag>{location?.constraint_type.replace('_', ' ')}</Tag></Descriptions.Item>
                    <Descriptions.Item label="Constrained Models" span={2}>
                        {
                            (location?.constrained_goods_model_ids && location.constrained_goods_model_ids.length > 0)
                                ? goodsModels.filter(gm => location.constrained_goods_model_ids?.includes(gm.id)).map(gm => gm.name).join(', ')
                                : 'N/A'
                        }
                    </Descriptions.Item>
                    <Descriptions.Item label="Notes" span={2}>{location?.description}</Descriptions.Item>
                    <Descriptions.Item label="Created At">{location?.created_at ? format(new Date(location.created_at), 'yyyy-MM-dd HH:mm') : '-'}</Descriptions.Item>
                    <Descriptions.Item label="Created By">{getUserEmail(location?.created_by)}</Descriptions.Item>
                    <Descriptions.Item label="Updated At">{location?.updated_at ? format(new Date(location.updated_at), 'yyyy-MM-dd HH:mm') : '-'}</Descriptions.Item>
                    <Descriptions.Item label="Updated By">{getUserEmail(location?.updated_by)}</Descriptions.Item>
                </Descriptions>
            )}
        </Card>
    );
};

const LocationDetailPage: React.FC = () => (
    <App><LocationDetailPageContent /></App>
);

export default LocationDetailPage;
