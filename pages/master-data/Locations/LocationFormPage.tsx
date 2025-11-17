

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

const { Title } = Typography;

interface SelectOption {
    label: string;
    value: string;
}

type LocationType = 'STORAGE' | 'RECEIVING' | 'SHIPPING';

const LocationFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const { notification } = App.useApp();
    const { user } = useAuth();

    const [loading, setLoading] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [pageTitle, setPageTitle] = useState<string>('Tạo mới Vị trí');
    
    // State for Async Selects
    const [warehouseOptions, setWarehouseOptions] = useState<SelectOption[]>([]);
    const [warehouseSearchText, setWarehouseSearchText] = useState('');
    const [isSearchingWarehouses, setIsSearchingWarehouses] = useState(false);
    const debouncedWarehouseSearch = useDebounce(warehouseSearchText, 500);

    const [productOptions, setProductOptions] = useState<SelectOption[]>([]);
    const [productSearchText, setProductSearchText] = useState('');
    const [isSearchingProducts, setIsSearchingProducts] = useState(false);
    const debouncedProductSearch = useDebounce(productSearchText, 500);

    const isEditMode = !!id;

    const fetchDropdownData = useCallback(async (
        rpcName: 'get_warehouses_list' | 'get_products_list',
        searchText: string,
        setOptions: React.Dispatch<React.SetStateAction<SelectOption[]>>,
        setIsSearching: React.Dispatch<React.SetStateAction<boolean>>
    ) => {
        setIsSearching(true);
        try {
            const { data, error } = await supabase.rpc(rpcName as any, {
                p_search_text: searchText || null,
                p_page_number: 1,
                p_page_size: 100, // Fetch more products
            });

            if (error) throw error;
            
            const items = (data as any)?.data || [];
            const newOptions = items.map((item: { id: number | string; name: string }) => ({
                label: item.name,
                value: item.id.toString(),
            }));
            
            setOptions(currentOptions => {
                const combined = [...currentOptions, ...newOptions];
                return Array.from(new Map(combined.map(item => [item.value, item])).values());
            });

        } catch (error: any) {
            notification.error({ message: `Lỗi tải danh sách cho ${rpcName}`, description: error.message });
        } finally {
            setIsSearching(false);
        }
    }, [notification]);

    useEffect(() => { fetchDropdownData('get_warehouses_list', debouncedWarehouseSearch, setWarehouseOptions, setIsSearchingWarehouses); }, [debouncedWarehouseSearch, fetchDropdownData]);
    useEffect(() => { fetchDropdownData('get_products_list', debouncedProductSearch, setProductOptions, setIsSearchingProducts); }, [debouncedProductSearch, fetchDropdownData]);

    useEffect(() => {
        if (isEditMode) {
            setPageTitle('Chỉnh sửa Vị trí');
            const fetchLocation = async () => {
                setLoading(true);
                try {
                    const { data, error } = await supabase
                        .from('locations')
                        .select('*, warehouse:warehouses(id, name)')
                        .eq('id', id)
                        .single();

                    if (error) throw error;

                    let locationType: LocationType = 'STORAGE';
                    if (data.is_receiving_area) locationType = 'RECEIVING';
                    if (data.is_shipping_area) locationType = 'SHIPPING';
                    
                    const formData = {
                        ...data,
                        warehouse_id: data.warehouse_id?.toString(),
                        location_type: locationType,
                        // `allowed_product_ids` might be null
                        allowed_product_ids: (data as any).allowed_product_ids?.map(String) || [],
                    };
                    form.setFieldsValue(formData);

                    if (data.warehouse) {
                        setWarehouseOptions([{ label: data.warehouse.name, value: data.warehouse.id.toString() }]);
                    }
                    
                    // If there are allowed products, fetch their names to pre-populate the select
                    const allowedIds = (data as any).allowed_product_ids;
                    if (Array.isArray(allowedIds) && allowedIds.length > 0) {
                        const { data: productsData, error: productsError } = await supabase
                            .from('products')
                            .select('id, name')
                            .in('id', allowedIds);
                        
                        if (productsError) throw productsError;

                        const productOpts = productsData.map(p => ({ label: p.name, value: p.id.toString() }));
                        setProductOptions(current => [...productOpts, ...current].filter((v,i,a)=>a.findIndex(t=>(t.value === v.value))===i));
                    }
                    
                    setPageTitle(`Chỉnh sửa Vị trí: ${data.code}`);
                } catch (err: any) {
                    notification.error({ message: 'Lỗi tải thông tin vị trí', description: err.message });
                    navigate('/master-data/locations');
                } finally {
                    setLoading(false);
                }
            };
            fetchLocation();
        }
    }, [id, isEditMode, navigate, form, notification]);

    const onFinish = async (values: any) => {
        setSubmitting(true);
        
        const locationType: LocationType = values.location_type || 'STORAGE';
        const payload = {
            ...values,
            warehouse_id: parseInt(values.warehouse_id, 10),
            is_storage_area: locationType === 'STORAGE',
            is_receiving_area: locationType === 'RECEIVING',
            is_shipping_area: locationType === 'SHIPPING',
            allowed_product_ids: values.allowed_product_ids?.map(Number) || null,
            ...(isEditMode 
                ? { updated_by: user?.id, updated_at: new Date().toISOString() } 
                : { created_by: user?.id })
        };
        
        // Remove UI-only field before submitting
        delete payload.location_type;

        try {
            if (isEditMode) {
                const { error } = await supabase.from('locations').update(payload).eq('id', id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('locations').insert(payload);
                if (error) throw error;
            }
            
            notification.success({ message: `Vị trí đã được ${isEditMode ? 'cập nhật' : 'tạo'} thành công` });
            navigate('/master-data/locations');

        } catch (error: any) {
             if (error.code === '23505' && error.message.includes('locations_warehouse_id_code_key')) {
                form.setFields([{ name: 'code', errors: ['Mã vị trí này đã tồn tại trong kho đã chọn.'] }]);
            } else {
               notification.error({ message: `Lỗi ${isEditMode ? 'cập nhật' : 'tạo'} vị trí`, description: error.message });
           }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="pb-24">
            <Spin spinning={loading}>
                <Form id="location-form" form={form} layout="vertical" onFinish={onFinish} initialValues={{ location_type: 'STORAGE' }}>
                    <Card title={<Title level={4} style={{ margin: 0 }}>{pageTitle}</Title>}>
                        <Row gutter={24}>
                            <Col xs={24} md={12}>
                                <Form.Item name="warehouse_id" label="Kho" rules={[{ required: true, message: 'Kho là bắt buộc' }]}>
                                    <Select
                                        showSearch placeholder="Chọn hoặc tìm kiếm kho..."
                                        onSearch={setWarehouseSearchText} loading={isSearchingWarehouses} filterOption={false}
                                        options={warehouseOptions} disabled={isEditMode}
                                    />
                                </Form.Item>
                            </Col>
                             <Col xs={24} md={12}>
                                <Form.Item name="name" label="Tên vị trí" rules={[{ required: true, message: 'Tên là bắt buộc' }, { min: 2, message: 'Tên phải có ít nhất 2 ký tự' }]}>
                                    <Input placeholder="e.g., Aisle 1, Rack 01, Shelf A" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="code" label="Mã vị trí" rules={[{ required: true, message: 'Mã là bắt buộc' }]}>
                                    <Input placeholder="e.g., A01-01-A" disabled={isEditMode} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="location_type" label="Loại vị trí">
                                    <Select>
                                        <Select.Option value="STORAGE">Storage Area</Select.Option>
                                        <Select.Option value="RECEIVING">Receiving Area</Select.Option>
                                        <Select.Option value="SHIPPING">Shipping Area</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item name="allowed_product_ids" label="Sản phẩm cho phép (Để trống cho phép tất cả)">
                                    <Select
                                        mode="multiple" showSearch allowClear placeholder="Chọn hoặc tìm kiếm sản phẩm..."
                                        onSearch={setProductSearchText} loading={isSearchingProducts} filterOption={false}
                                        options={productOptions}
                                    />
                                </Form.Item>
                            </Col>
                             <Col xs={24} md={12}>
                                <Form.Item name="capacity_cbm" label="Sức chứa (CBM)">
                                    <InputNumber min={0} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="capacity_weight_kg" label="Sức chứa (KG)">
                                    <InputNumber min={0} style={{ width: '100%' }} />
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
                    <Button size="large" icon={<ArrowLeftOutlined />} onClick={() => navigate('/master-data/locations')}>
                        Hủy
                    </Button>
                    <Button size="large" type="primary" icon={isEditMode ? <SaveOutlined /> : <PlusOutlined />} htmlType="submit" loading={submitting} form="location-form">
                        {isEditMode ? 'Lưu' : 'Tạo mới'}
                    </Button>
                </Space>
            </div>
        </div>
    );
};

const LocationFormPageWrapper: React.FC = () => (
    <App>
        <LocationFormPage />
    </App>
);

export default LocationFormPageWrapper;