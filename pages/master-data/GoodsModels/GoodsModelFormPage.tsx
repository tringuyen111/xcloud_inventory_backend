

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
    InputNumber,
} from 'antd';
import { SaveOutlined, PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { useDebounce } from '../../../hooks/useDebounce';
import { Database } from '../../../types/supabase';
import ImageUpload from '../../../components/shared/ImageUpload';

const { Title } = Typography;

interface SelectOption {
    label: string;
    value: string;
}

type FetchedProduct = Database['public']['Tables']['products']['Row'] & {
    organization: { id: number; name: string } | null;
    product_type: { id: number; name: string } | null;
    base_uom: { id: number; name: string } | null;
};

const GoodsModelFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const { notification } = App.useApp();
    const { user } = useAuth();

    const [loading, setLoading] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [pageTitle, setPageTitle] = useState<string>('Tạo mới Sản phẩm');
    
    // State for Async Selects
    const [orgOptions, setOrgOptions] = useState<SelectOption[]>([]);
    const [orgSearchText, setOrgSearchText] = useState('');
    const [isSearchingOrgs, setIsSearchingOrgs] = useState(false);
    const debouncedOrgSearch = useDebounce(orgSearchText, 500);

    const [typeOptions, setTypeOptions] = useState<SelectOption[]>([]);
    const [typeSearchText, setTypeSearchText] = useState('');
    const [isSearchingTypes, setIsSearchingTypes] = useState(false);
    const debouncedTypeSearch = useDebounce(typeSearchText, 500);

    const [uomOptions, setUomOptions] = useState<SelectOption[]>([]);
    const [uomSearchText, setUomSearchText] = useState('');
    const [isSearchingUoms, setIsSearchingUoms] = useState(false);
    const debouncedUomSearch = useDebounce(uomSearchText, 500);

    const isEditMode = !!id;

    const fetchDropdownData = useCallback(async (
        rpcName: 'get_organizations_list' | 'get_product_types_list' | 'get_uoms_list',
        searchText: string,
        setOptions: React.Dispatch<React.SetStateAction<SelectOption[]>>,
        setIsSearching: React.Dispatch<React.SetStateAction<boolean>>
    ) => {
        setIsSearching(true);
        try {
            const { data, error } = await supabase.rpc(rpcName, {
                p_search_text: searchText || null,
                p_page_number: 1,
                p_page_size: 50
            });

            if (error) throw error;
            
            const items = (data as any)?.data || [];
            const newOptions = items.map((item: { id: number | string; name: string }) => ({
                label: item.name,
                value: item.id.toString(),
            }));
            
            setOptions(currentOptions => {
                const combined = [...currentOptions, ...newOptions];
                const uniqueOptions = Array.from(new Map(combined.map(item => [item.value, item])).values());
                return uniqueOptions;
            });

        } catch (error: any) {
            notification.error({ message: `Lỗi tải danh sách cho ${rpcName}`, description: error.message });
        } finally {
            setIsSearching(false);
        }
    }, [notification]);

    useEffect(() => { fetchDropdownData('get_organizations_list', debouncedOrgSearch, setOrgOptions, setIsSearchingOrgs); }, [debouncedOrgSearch, fetchDropdownData]);
    useEffect(() => { fetchDropdownData('get_product_types_list', debouncedTypeSearch, setTypeOptions, setIsSearchingTypes); }, [debouncedTypeSearch, fetchDropdownData]);
    useEffect(() => { fetchDropdownData('get_uoms_list', debouncedUomSearch, setUomOptions, setIsSearchingUoms); }, [debouncedUomSearch, fetchDropdownData]);

    useEffect(() => {
        if (isEditMode) {
            setPageTitle('Chỉnh sửa Sản phẩm');
            const fetchProduct = async () => {
                setLoading(true);
                const { data, error } = await supabase
                    .from('products')
                    .select('*, organization:organizations(id, name), product_type:product_types(id, name), base_uom:uoms(id, name)')
                    .eq('id', id)
                    .single();
                
                if (error) {
                    notification.error({ message: 'Error Fetching Product', description: error.message });
                } else if (data) {
                    const productData = data as any; // Cast to any to handle nested objects
                    const formData = { 
                        ...productData, 
                        organization_id: productData.organization_id?.toString(), 
                        product_type_id: productData.product_type_id?.toString(),
                        base_uom_id: productData.base_uom_id?.toString(),
                    };
                    form.setFieldsValue(formData);
                    
                    if (productData.organization) setOrgOptions([{ label: productData.organization.name, value: productData.organization.id.toString() }]);
                    if (productData.product_type) setTypeOptions([{ label: productData.product_type.name, value: productData.product_type.id.toString() }]);
                    if (productData.base_uom) setUomOptions([{ label: productData.base_uom.name, value: productData.base_uom.id.toString() }]);
                    
                    setPageTitle(`Chỉnh sửa Sản phẩm: ${productData.code}`);
                }
                setLoading(false);
            };
            fetchProduct();
        }
    }, [id, isEditMode, navigate, form, notification]);

    const onFinish = async (values: any) => {
        setSubmitting(true);
        const payload = {
            ...values,
            organization_id: parseInt(values.organization_id, 10),
            product_type_id: parseInt(values.product_type_id, 10),
            base_uom_id: parseInt(values.base_uom_id, 10),
            images: values.images || null,
            min_stock_level: values.min_stock_level ?? 0,
            ...(isEditMode 
                ? { updated_by: user?.id, updated_at: new Date().toISOString() } 
                : { created_by: user?.id })
        };
        
        try {
            if (isEditMode) {
                const { error } = await supabase.from('products').update(payload).eq('id', id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('products').insert(payload);
                if (error) throw error;
            }
            
            notification.success({ message: `Sản phẩm đã được ${isEditMode ? 'cập nhật' : 'tạo'} thành công` });
            navigate('/product/goods-models');

        } catch (error: any) {
            if (error.code === '23505' && error.message.includes('products_organization_id_code_key')) {
               form.setFields([{ name: 'code', errors: ['Mã sản phẩm này đã tồn tại trong tổ chức đã chọn.'] }]);
           } else {
               notification.error({ message: `Lỗi ${isEditMode ? 'cập nhật' : 'tạo'} sản phẩm`, description: error.message });
           }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="pb-24">
            <Spin spinning={loading}>
                <Form id="product-form" form={form} layout="vertical" onFinish={onFinish} initialValues={{ tracking_type: 'NONE' }}>
                    <Card title={<Title level={4} style={{ margin: 0 }}>{pageTitle}</Title>}>
                        <Row gutter={24}>
                            <Col xs={24} md={12}>
                                <Form.Item name="organization_id" label="Tổ chức" rules={[{ required: true, message: 'Tổ chức là bắt buộc' }]}>
                                    <Select showSearch placeholder="Chọn hoặc tìm kiếm..." onSearch={setOrgSearchText} loading={isSearchingOrgs} filterOption={false} options={orgOptions} disabled={isEditMode} />
                                </Form.Item>
                            </Col>
                             <Col xs={24} md={12}>
                                <Form.Item name="code" label="Mã sản phẩm" rules={[{ required: true, message: 'Mã là bắt buộc' }, { min: 2, message: 'Mã phải có ít nhất 2 ký tự' }]}>
                                    <Input placeholder="e.g., IPHONE-15-PROMAX" disabled={isEditMode} />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                 <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true, message: 'Tên là bắt buộc' }, { min: 2, message: 'Tên phải có ít nhất 2 ký tự' }]}>
                                    <Input placeholder="e.g., iPhone 15 Pro Max 256GB - Natural Titanium" />
                                </Form.Item>
                            </Col>
                             <Col xs={24} md={12}>
                                <Form.Item name="product_type_id" label="Loại sản phẩm" rules={[{ required: true, message: 'Loại sản phẩm là bắt buộc' }]}>
                                    <Select showSearch placeholder="Chọn hoặc tìm kiếm..." onSearch={setTypeSearchText} loading={isSearchingTypes} filterOption={false} options={typeOptions} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="base_uom_id" label="Đơn vị cơ sở" rules={[{ required: true, message: 'Đơn vị là bắt buộc' }]}>
                                    <Select showSearch placeholder="Chọn hoặc tìm kiếm..." onSearch={setUomSearchText} loading={isSearchingUoms} filterOption={false} options={uomOptions} />
                                </Form.Item>
                            </Col>
                             <Col xs={24} md={12}>
                                <Form.Item name="tracking_type" label="Loại hình theo dõi" rules={[{ required: true }]}>
                                    <Select>
                                        <Select.Option value="NONE">None</Select.Option>
                                        <Select.Option value="LOT">Lot</Select.Option>
                                        <Select.Option value="SERIAL">Serial</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                             <Col xs={24} md={12}>
                                <Form.Item name="sku" label="SKU">
                                    <Input placeholder="e.g., AP-IP15PM-256-NT" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="min_stock_level" label="Tồn kho tối thiểu">
                                    <InputNumber min={0} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="shelf_life_days" label="Hạn sử dụng (ngày)">
                                    <InputNumber min={0} precision={0} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                             <Col xs={24} md={12}>
                                <Form.Item name="weight_kg" label="Cân nặng (KG)">
                                    <InputNumber min={0} style={{ width: '100%' }} placeholder="e.g., 0.221" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="volume_cbm" label="Thể tích (CBM)">
                                    <InputNumber min={0} style={{ width: '100%' }} placeholder="e.g., 0.0001" />
                                </Form.Item>
                            </Col>
                             <Col span={24}>
                                <Form.Item name="notes" label="Ghi chú">
                                    <Input.TextArea rows={3} placeholder="Ghi chú bổ sung" />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item name="images" label="Hình ảnh sản phẩm">
                                    <ImageUpload maxCount={5} />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>
                </Form>
            </Spin>

            <div className="fixed bottom-6 right-6 z-50">
                <Space>
                    <Button size="large" icon={<ArrowLeftOutlined />} onClick={() => navigate('/product/goods-models')}>Hủy</Button>
                    <Button size="large" type="primary" icon={isEditMode ? <SaveOutlined /> : <PlusOutlined />} htmlType="submit" loading={submitting} form="product-form">
                        {isEditMode ? 'Lưu' : 'Tạo mới'}
                    </Button>
                </Space>
            </div>
        </div>
    );
};

const GoodsModelFormPageWrapper: React.FC = () => (
    <App>
        <GoodsModelFormPage />
    </App>
);

export default GoodsModelFormPageWrapper;