

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
    Select,
} from 'antd';
import { SaveOutlined, PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { Database } from '../../../types/supabase';

const { Title } = Typography;
const { Option } = Select;

const partnerTypes: Database['public']['Enums']['partner_type_enum'][] = ['SUPPLIER', 'CUSTOMER', 'BOTH'];

const PartnerFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const { notification } = App.useApp();
    const { user } = useAuth();

    const [loading, setLoading] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [pageTitle, setPageTitle] = useState<string>('Tạo mới Đối tác');
    
    const isEditMode = !!id;

    useEffect(() => {
        if (isEditMode) {
            setPageTitle('Chỉnh sửa Đối tác');
            const fetchPartner = async () => {
                setLoading(true);
                const { data, error } = await supabase
                    .from('partners')
                    .select('*')
                    .eq('id', id)
                    .single();
                
                if (error) {
                    notification.error({ message: 'Lỗi tải thông tin đối tác', description: error.message });
                    navigate('/master-data/partners');
                } else if (data) {
                    form.setFieldsValue(data);
                    setPageTitle(`Chỉnh sửa Đối tác: ${data.code}`);
                }
                setLoading(false);
            };
            fetchPartner();
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
                    .from('partners')
                    .update(payload)
                    .eq('id', id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('partners')
                    .insert(payload);
                if (error) throw error;
            }
            
            notification.success({ message: `Đối tác đã được ${isEditMode ? 'cập nhật' : 'tạo'} thành công` });
            navigate('/master-data/partners');

        } catch (error: any) {
            if (error.code === '23505' && error.message.includes('partners_code_key')) {
                form.setFields([{ name: 'code', errors: ['Mã đối tác này đã tồn tại.'] }]);
           } else {
               notification.error({ message: `Lỗi ${isEditMode ? 'cập nhật' : 'tạo'} đối tác`, description: error.message });
           }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="pb-24">
            <Spin spinning={loading}>
                <Form
                    id="partner-form"
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
                                    label="Mã đối tác"
                                    rules={[
                                        { required: true, message: 'Mã là bắt buộc' },
                                        { min: 2, message: 'Mã phải có ít nhất 2 ký tự' }
                                    ]}
                                >
                                    <Input placeholder="e.g., NCC-APPLE" disabled={isEditMode} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                 <Form.Item
                                    name="name"
                                    label="Tên đối tác"
                                    rules={[
                                        { required: true, message: 'Tên là bắt buộc' },
                                        { min: 2, message: 'Tên phải có ít nhất 2 ký tự' }
                                    ]}
                                >
                                    <Input placeholder="e.g., Apple Inc." />
                                </Form.Item>
                            </Col>
                             <Col xs={24} md={12}>
                                <Form.Item
                                    name="type"
                                    label="Loại đối tác"
                                    rules={[{ required: true, message: 'Loại đối tác là bắt buộc' }]}
                                >
                                    <Select placeholder="Chọn loại đối tác">
                                        {partnerTypes.map(type => (
                                            <Option key={type} value={type}>{type}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                             <Col xs={24} md={12}>
                                <Form.Item name="tax_code" label="Mã số thuế">
                                    <Input placeholder="e.g., 0123456789" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="contact_person" label="Người liên hệ">
                                    <Input placeholder="e.g., John Doe" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="phone" label="Số điện thoại">
                                    <Input placeholder="e.g., 0987654321" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="email"
                                    label="Email"
                                    rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
                                >
                                    <Input placeholder="e.g., contact@example.com" />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item name="address" label="Địa chỉ">
                                    <Input.TextArea rows={2} placeholder="Nhập địa chỉ đầy đủ" />
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
                        onClick={() => navigate('/master-data/partners')}
                    >
                        Hủy
                    </Button>
                    <Button
                        size="large"
                        type="primary"
                        icon={isEditMode ? <SaveOutlined /> : <PlusOutlined />}
                        htmlType="submit"
                        loading={submitting}
                        form="partner-form"
                    >
                        {isEditMode ? 'Lưu' : 'Tạo mới'}
                    </Button>
                </Space>
            </div>
        </div>
    );
};

const PartnerFormPageWrapper: React.FC = () => (
    <App>
        <PartnerFormPage />
    </App>
);

export default PartnerFormPageWrapper;