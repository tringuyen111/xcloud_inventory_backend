

import React, { useEffect, useState, useCallback } from 'react';
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
    Switch,
    InputNumber,
} from 'antd';
import { SaveOutlined, PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { useDebounce } from '../../../hooks/useDebounce';
import { Database } from '../../../types/supabase';

const { Title } = Typography;

interface SelectOption {
    label: string;
    value: string;
}

type FetchedUom = Database['public']['Tables']['uoms']['Row'] & {
    uom_category: { id: number; name: string } | null;
};

const UomFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const { notification } = App.useApp();
    const { user } = useAuth();

    const [loading, setLoading] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [pageTitle, setPageTitle] = useState<string>('Tạo mới Đơn vị tính');
    
    const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([]);
    const [categorySearchText, setCategorySearchText] = useState('');
    const [isSearchingCategories, setIsSearchingCategories] = useState(false);
    const debouncedCategorySearch = useDebounce(categorySearchText, 500);
    
    const isEditMode = !!id;
    const isBaseUnit = Form.useWatch('is_base_unit', form);

    const fetchUomCategories = useCallback(async (searchText: string) => {
        setIsSearchingCategories(true);
        try {
            const { data, error } = await supabase.rpc('get_uom_categories_list', {
                p_search_text: searchText || null,
                p_page_number: 1,
                p_page_size: 50
            });

            if (error) throw error;
            
            const items = (data as any)?.data || [];
            const newOptions = items.map((item: { id: number; name: string }) => ({
                label: item.name,
                value: item.id.toString(),
            }));
            
            setCategoryOptions(currentOptions => {
                const combined = [...currentOptions, ...newOptions];
                return Array.from(new Map(combined.map(item => [item.value, item])).values());
            });

        } catch (error: any) {
            notification.error({ message: 'Lỗi tải danh sách Nhóm ĐVT', description: error.message });
        } finally {
            setIsSearchingCategories(false);
        }
    }, [notification]);

    useEffect(() => { fetchUomCategories(debouncedCategorySearch); }, [debouncedCategorySearch, fetchUomCategories]);

    useEffect(() => {
        if (isBaseUnit) {
            form.setFieldsValue({ conversion_factor: 1 });
        }
    }, [isBaseUnit, form]);

    useEffect(() => {
        if (isEditMode) {
            setPageTitle('Chỉnh sửa Đơn vị tính');
            const fetchUom = async () => {
                setLoading(true);
                const { data, error } = await supabase
                    .from('uoms')
                    .select('*, uom_category:uom_categories(id, name)')
                    .eq('id', id)
                    .single();
                
                if (error) {
                    notification.error({ message: 'Error Fetching UoM', description: error.message });
                } else if (data) {
                    const uomData = data as any;
                    const formData = { 
                        ...uomData, 
                        category_id: uomData.category_id?.toString(),
                    };
                    form.setFieldsValue(formData);
                    
                    if (uomData.uom_category) {
                        setCategoryOptions([{ label: uomData.uom_category.name, value: uomData.uom_category.id.toString() }]);
                    }
                    
                    setPageTitle(`Chỉnh sửa ĐVT: ${uomData.code}`);
                }
                setLoading(false);
            };
            fetchUom();
        }
    }, [id, isEditMode, form, notification]);

    const onFinish = async (values: any) => {
        setSubmitting(true);
        const payload = {
            ...values,
            category_id: parseInt(values.category_id, 10),
            conversion_factor: values.is_base_unit ? 1 : values.conversion_factor,
            ...(isEditMode 
                ? { updated_by: user?.id, updated_at: new Date().toISOString() } 
                : { created_by: user?.id })
        };
        
        try {
            if (isEditMode) {
                const { error } = await supabase.from('uoms').update(payload).eq('id', id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('uoms').insert(payload);
                if (error) throw error;
            }
            
            notification.success({ message: `Đơn vị tính đã được ${isEditMode ? 'cập nhật' : 'tạo'} thành công` });
            navigate('/product/uoms');

        } catch (error: any) {
             if (error.code === '23505') { // General unique violation code
                if (error.message.includes('uoms_code_key')) {
                    form.setFields([{ name: 'code', errors: ['Mã ĐVT này đã tồn tại.'] }]);
                } else if (error.message.includes('idx_uom_base_unit_per_category')) {
                    notification.error({ 
                        message: 'Lỗi tạo đơn vị tính', 
                        description: 'Lỗi: Nhóm ĐVT này đã có một đơn vị cơ sở. Không thể tạo thêm.' 
                    });
                } else {
                    notification.error({ message: `Lỗi ${isEditMode ? 'cập nhật' : 'tạo'} ĐVT`, description: error.message });
                }
            } else {
               notification.error({ message: `Lỗi ${isEditMode ? 'cập nhật' : 'tạo'} ĐVT`, description: error.message });
           }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="pb-24">
            <Spin spinning={loading}>
                <Form id="uom-form" form={form} layout="vertical" onFinish={onFinish} initialValues={{ is_base_unit: false }}>
                    <Card title={<Title level={4} style={{ margin: 0 }}>{pageTitle}</Title>}>
                        <Row gutter={24}>
                            <Col xs={24} md={12}>
                                <Form.Item name="category_id" label="Nhóm ĐVT" rules={[{ required: true, message: 'Nhóm ĐVT là bắt buộc' }]}>
                                    <Select
                                        showSearch
                                        placeholder="Chọn hoặc tìm kiếm nhóm..."
                                        onSearch={setCategorySearchText}
                                        loading={isSearchingCategories}
                                        filterOption={false}
                                        options={categoryOptions}
                                        notFoundContent={isSearchingCategories ? <Spin size="small" /> : null}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="name" label="Tên đơn vị tính" rules={[{ required: true, message: 'Tên là bắt buộc' }]}>
                                    <Input placeholder="e.g., Cái, Thùng, Gram" />
                                </Form.Item>
                            </Col>
                             <Col xs={24} md={12}>
                                <Form.Item name="code" label="Mã đơn vị tính" rules={[{ required: true, message: 'Mã là bắt buộc' }]}>
                                    <Input placeholder="e.g., PCS, CTN, GR" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="is_base_unit" label="Là đơn vị cơ sở?" valuePropName="checked">
                                    <Switch />
                                </Form.Item>
                            </Col>
                             <Col xs={24} md={12}>
                                <Form.Item
                                    name="conversion_factor"
                                    label="Hệ số quy đổi"
                                    rules={[
                                        { required: true, message: 'Hệ số là bắt buộc' },
                                        { type: 'number', min: 0.0001, message: 'Phải lớn hơn 0' }
                                    ]}
                                >
                                    <InputNumber
                                        min={0.0001}
                                        style={{ width: '100%' }}
                                        disabled={isBaseUnit}
                                        placeholder={isBaseUnit ? '1 (Base Unit)' : 'e.g., 24'}
                                    />
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
                    <Button size="large" icon={<ArrowLeftOutlined />} onClick={() => navigate('/product/uoms')}>
                        Hủy
                    </Button>
                    <Button
                        size="large"
                        type="primary"
                        icon={isEditMode ? <SaveOutlined /> : <PlusOutlined />}
                        htmlType="submit"
                        loading={submitting}
                        form="uom-form"
                    >
                        {isEditMode ? 'Lưu' : 'Tạo mới'}
                    </Button>
                </Space>
            </div>
        </div>
    );
};

const UomFormPageWrapper: React.FC = () => (
    <App>
        <UomFormPage />
    </App>
);

export default UomFormPageWrapper;