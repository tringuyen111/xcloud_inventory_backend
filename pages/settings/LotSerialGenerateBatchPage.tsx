


import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { supabase } from '../../lib/supabase';
import { useDebounce } from '../../hooks/useDebounce';

const { Title } = Typography;

interface ProductOption {
    label: string;
    value: string;
    // Store the full product object to use its properties later
    product: {
        id: number;
        name: string;
        tracking_type: 'LOT' | 'SERIAL' | 'NONE';
    };
}

const LotSerialGenerateBatchPage: React.FC = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const { notification } = App.useApp();

    const [submitting, setSubmitting] = useState<boolean>(false);
    
    // State for Async Product Select
    const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
    const [productSearchText, setProductSearchText] = useState('');
    const [isSearchingProducts, setIsSearchingProducts] = useState(false);
    const debouncedProductSearch = useDebounce(productSearchText, 500);
    const [selectedProduct, setSelectedProduct] = useState<ProductOption['product'] | null>(null);

    const fetchProducts = useCallback(async (searchText: string) => {
        setIsSearchingProducts(true);
        try {
            const { data, error } = await supabase.rpc('get_products_list', {
                p_search_text: searchText || null,
                p_page_number: 1,
                p_page_size: 50,
            });

            if (error) throw error;
            
            const items = (data as any)?.data || [];
            // Filter products to only include those with LOT or SERIAL tracking
            const trackableItems = items.filter((item: any) => item.tracking_type === 'LOT' || item.tracking_type === 'SERIAL');
            
            const newOptions: ProductOption[] = trackableItems.map((item: any) => ({
                label: item.name,
                value: item.id.toString(),
                product: {
                    id: item.id,
                    name: item.name,
                    tracking_type: item.tracking_type,
                }
            }));
            
            setProductOptions(currentOptions => {
                const combined = [...currentOptions, ...newOptions];
                return Array.from(new Map(combined.map(item => [item.value, item])).values());
            });

        } catch (error: any) {
            notification.error({ message: `Lỗi tải danh sách sản phẩm`, description: error.message });
        } finally {
            setIsSearchingProducts(false);
        }
    }, [notification]);

    useEffect(() => {
        fetchProducts(debouncedProductSearch);
    }, [debouncedProductSearch, fetchProducts]);
    
    // Auto-fill form fields when a product is selected
    useEffect(() => {
        if (selectedProduct) {
            form.setFieldsValue({
                product_name: selectedProduct.name,
                tracking_type: selectedProduct.tracking_type,
            });
        }
    }, [selectedProduct, form]);

    const onFinish = async (values: any) => {
        setSubmitting(true);
        try {
            const { error } = await supabase.rpc('generate_tracking_codes_batch', {
                p_product_id: parseInt(values.p_product_id, 10),
                p_quantity: values.p_quantity,
            });
            if (error) throw error;
            
            notification.success({ 
                message: 'Tạo mã thành công',
                description: `Đã tạo thành công ${values.p_quantity} mã (${selectedProduct?.tracking_type}) cho sản phẩm.`
            });
            navigate('/settings/lots-serials');

        } catch (error: any) {
           notification.error({ message: `Lỗi tạo mã hàng loạt`, description: error.message });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="pb-24">
            <Form
                id="generate-batch-form"
                form={form}
                layout="vertical"
                onFinish={onFinish}
            >
                <Card
                    title={<Title level={4} style={{ margin: 0 }}>Tạo mã hàng loạt</Title>}
                >
                    <Row gutter={24}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="p_product_id"
                                label="Sản phẩm"
                                rules={[{ required: true, message: 'Sản phẩm là bắt buộc' }]}
                            >
                                <Select
                                    showSearch
                                    placeholder="Chọn hoặc tìm kiếm sản phẩm..."
                                    onSearch={setProductSearchText}
                                    loading={isSearchingProducts}
                                    filterOption={false}
                                    options={productOptions}
                                    onSelect={(_, option) => setSelectedProduct(option.product)}
                                    notFoundContent={isSearchingProducts ? <Spin size="small" /> : 'Không tìm thấy sản phẩm có tracking LOT/SERIAL'}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                             <Form.Item
                                name="product_name"
                                label="Tên sản phẩm"
                            >
                                <Input readOnly disabled />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="tracking_type"
                                label="Loại tracking"
                            >
                                <Input readOnly disabled />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                             <Form.Item
                                name="p_quantity"
                                label="Số lượng tạo"
                                rules={[
                                    { required: true, message: 'Số lượng là bắt buộc' },
                                    { type: 'number', min: 1, message: 'Số lượng phải lớn hơn 0' },
                                    { type: 'number', max: 1000, message: 'Tối đa 1000 mã mỗi lần' },
                                ]}
                            >
                                <InputNumber style={{ width: '100%' }} placeholder="e.g., 50" min={1} max={1000} precision={0} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>
            </Form>

            <div className="fixed bottom-6 right-6 z-50">
                <Space>
                    <Button
                        size="large"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/settings/lots-serials')}
                    >
                        Hủy
                    </Button>
                    <Button
                        size="large"
                        type="primary"
                        icon={<PlusOutlined />}
                        htmlType="submit"
                        loading={submitting}
                        form="generate-batch-form"
                    >
                        Tạo
                    </Button>
                </Space>
            </div>
        </div>
    );
};

const LotSerialGenerateBatchPageWrapper: React.FC = () => (
    <App>
        <LotSerialGenerateBatchPage />
    </App>
);

export default LotSerialGenerateBatchPageWrapper;