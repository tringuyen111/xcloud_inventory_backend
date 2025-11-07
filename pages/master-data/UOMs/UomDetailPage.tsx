import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Uom, UomCategory } from '../../../types/supabase';
import {
  Button, Card, Form, Input, Row, Col, Typography, Space, App, Spin, Select, Descriptions, Tag, Alert, InputNumber
} from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import useAuthStore from '../../../stores/authStore';

const { Title, Text } = Typography;

type UomWithCategory = Uom & { category?: { name: string } };

const UomDetailPageContent: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const { notification } = App.useApp();
  
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uom, setUom] = useState<UomWithCategory | null>(null);
    const [categories, setCategories] = useState<UomCategory[]>([]);
    const isBaseUnit = Form.useWatch('is_base', form);
    const user = useAuthStore((state) => state.user);

    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const catPromise = supabase.from('uom_categories').select('id, name').eq('is_active', true);
            const uomPromise = supabase.from('uoms').select('*, category:uom_categories(name)').eq('id', id).single();
            const [{data: catData, error: catError}, {data: uomData, error: uomError}] = await Promise.all([catPromise, uomPromise]);

            if (catError || uomError) throw catError || uomError;
            
            setCategories(catData || []);
            if (uomData) {
                setUom(uomData);
                form.setFieldsValue(uomData);
            } else {
                throw new Error("UoM not found");
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
            const values = await form.validateFields();
            const dataToSave = { ...values, updated_at: new Date().toISOString(), updated_by: user?.id };
            if (dataToSave.is_base) {
                dataToSave.ratio_to_base = 1;
            }
            const { error } = await supabase.from('uoms').update(dataToSave).eq('id', id);
            if (error) throw error;
            notification.success({ message: 'UoM updated successfully' });
            setIsEditing(false);
            fetchData();
        } catch (err: any) {
            notification.error({ message: 'Update failed', description: err.message });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleCancel = () => {
        if (uom) form.setFieldsValue(uom);
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
                    <Title level={3} className="mb-0">{uom?.name}</Title>
                    <Text type="secondary">Details for UoM code: {uom?.code}</Text>
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
                <Form form={form} layout="vertical" name="uom_form">
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="category_id" label="Category" rules={[{ required: true }]}><Select>{categories.map(c => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}</Select></Form.Item></Col>
                        <Col span={12}><Form.Item name="code" label="Code" rules={[{ required: true }]}><Input disabled /></Form.Item></Col>
                        <Col span={12}><Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="is_base" label="Is Base Unit" rules={[{ required: true }]}><Select><Select.Option value={true}>Yes</Select.Option><Select.Option value={false}>No</Select.Option></Select></Form.Item></Col>
                        <Col span={12}><Form.Item name="ratio_to_base" label="Ratio to Base"><InputNumber style={{ width: '100%' }} min={0} disabled={isBaseUnit} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="is_active" label="Status" rules={[{ required: true }]}><Select><Select.Option value={true}>Active</Select.Option><Select.Option value={false}>Inactive</Select.Option></Select></Form.Item></Col>
                    </Row>
                </Form>
            ) : (
                <Descriptions bordered column={2}>
                    <Descriptions.Item label="Code">{uom?.code}</Descriptions.Item>
                    <Descriptions.Item label="Name">{uom?.name}</Descriptions.Item>
                    <Descriptions.Item label="Category">{uom?.category?.name}</Descriptions.Item>
                    <Descriptions.Item label="Is Base Unit">{uom?.is_base ? 'Yes' : 'No'}</Descriptions.Item>
                    <Descriptions.Item label="Ratio to Base">{uom?.ratio_to_base}</Descriptions.Item>
                    <Descriptions.Item label="Status"><Tag color={uom?.is_active ? 'green' : 'red'}>{uom?.is_active ? 'Active' : 'Inactive'}</Tag></Descriptions.Item>
                    <Descriptions.Item label="Created At">{uom?.created_at ? format(new Date(uom.created_at), 'yyyy-MM-dd HH:mm') : '-'}</Descriptions.Item>
                    <Descriptions.Item label="Created By">{getUserEmail(uom?.created_by)}</Descriptions.Item>
                    <Descriptions.Item label="Updated At">{uom?.updated_at ? format(new Date(uom.updated_at), 'yyyy-MM-dd HH:mm') : '-'}</Descriptions.Item>
                    <Descriptions.Item label="Updated By">{getUserEmail(uom?.updated_by)}</Descriptions.Item>
                </Descriptions>
            )}
        </Card>
    );
};

const UomDetailPage: React.FC = () => (
    <App><UomDetailPageContent /></App>
);

export default UomDetailPage;