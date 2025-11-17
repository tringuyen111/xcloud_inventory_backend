

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    App,
    Button,
    Card,
    Col,
    Form,
    Input,
    Row,
    Spin,
    Typography,
    Space,
} from 'antd';
import { SaveOutlined, PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';

const { Title } = Typography;

const UomCategoryFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const { notification } = App.useApp();
    const { user } = useAuth();

    const [loading, setLoading] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [pageTitle, setPageTitle] = useState<string>('Tạo mới Nhóm ĐVT');
    
    const isEditMode = !!id;

    useEffect(() => {
        if (isEditMode) {
            setPageTitle('Chỉnh sửa Nhóm ĐVT');
            const fetchUomCategory = async () => {
                setLoading(true);
                const { data, error } = await supabase
                    .from('uom_categories')
                    .select('*')
                    .eq('id', id)
                    .single();
                
                if (error) {
                    notification.error({ message: 'Error Fetching UoM Category', description: error.message });
                    navigate('/product/uom-categories');
                } else if (data) {
                    form.setFieldsValue(data);
                    setPageTitle(`Chỉnh sửa Nhóm ĐVT: ${data.code}`);
                }
                setLoading(false);
            };
            fetchUomCategory();
        }
    }, [id, isEditMode, navigate, form, notification]);

    const onFinish = async (values: any) => {
        setSubmitting(true);
        const payload = {
            ...values,
            ...(isEditMode 
                ? { updated_by: user?.id, updated_at: new Date().toISOString() } 
                : { created_by: user?.id })
        };
        
        try {
            if (isEditMode) {
                const { error } = await supabase
                    .from('uom_categories')
                    .update(payload)
                    .eq('id', id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('uom_categories')
                    .insert(payload);
                if (error) throw error;
            }
            
            notification.success({ message: `Nhóm ĐVT đã được ${isEditMode ? 'cập nhật' : 'tạo'} thành công` });
            navigate('/product/uom-categories');

        } catch (error: any) {
            if (error.code === '23505' && error.message.includes('uom_categories_code_key')) {
                form.setFields([{ name: 'code', errors: ['Mã nhóm ĐVT này đã tồn tại.'] }]);
           } else {
               notification.error({ message: `Lỗi ${isEditMode ? 'cập nhật' : 'tạo'} nhóm ĐVT`, description: error.message });
           }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="pb-24">
            <Spin spinning={loading}>
                <Form
                    id="uom-category-form"
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                >
                    <Card
                        title={<Title level={4} style={{ margin: 0 }}>{pageTitle}</Title>}
                    >
                        <Row gutter={24}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="code"
                                    label="Mã nhóm ĐVT"
                                    rules={[
                                        { required: true, message: 'Mã là bắt buộc' },
                                        { min: 2, message: 'Mã phải có ít nhất 2 ký tự' }
                                    ]}
                                >
                                    <Input placeholder="e.g., WEIGHT" disabled={isEditMode} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                 <Form.Item
                                    name="name"
                                    label="Tên nhóm ĐVT"
                                    rules={[
                                        { required: true, message: 'Tên là bắt buộc' },
                                        { min: 2, message: 'Tên phải có ít nhất 2 ký tự' }
                                    ]}
                                >
                                    <Input placeholder="e.g., Weight" />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item name="description" label="Mô tả">
                                    <Input.TextArea rows={3} placeholder="Mô tả nhóm đơn vị tính" />
                                </Form.Item>
                            </Col>
                             <Col span={24}>
                                <Form.Item name="notes" label="Ghi chú">
                                    <Input.TextArea rows={3} placeholder="Ghi chú bổ sung" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>
                </Form>
            </Spin>

            <div className="fixed bottom-6 right-6 z-50">
                <Space>
                    <Button
                        size="large"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/product/uom-categories')}
                    >
                        Hủy
                    </Button>
                    <Button
                        size="large"
                        type="primary"
                        icon={isEditMode ? <SaveOutlined /> : <PlusOutlined />}
                        htmlType="submit"
                        loading={submitting}
                        form="uom-category-form"
                    >
                        {isEditMode ? 'Lưu' : 'Tạo mới'}
                    </Button>
                </Space>
            </div>
        </div>
    );
};

const UomCategoryFormPageWrapper: React.FC = () => (
    <App>
        <UomCategoryFormPage />
    </App>
);

export default UomCategoryFormPageWrapper;