
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
    Upload,
    Modal,
    Result,
} from 'antd';
import { UploadOutlined, ArrowLeftOutlined, InboxOutlined } from '@ant-design/icons';
import { supabase } from '../../lib/supabase';
import { useDebounce } from '../../hooks/useDebounce';
import type { UploadFile } from 'antd/es/upload/interface';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

interface ProductOption {
    label: string;
    value: string;
    product: {
        id: number;
        name: string;
        tracking_type: 'LOT' | 'SERIAL' | 'NONE';
    };
}

interface ImportResult {
    success_count: number;
    fail_count: number;
    failed_items: { code: string; reason: string }[];
}


const LotSerialImportPage: React.FC = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const { notification, modal } = App.useApp();

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
            const trackableItems = items.filter((item: any) => item.tracking_type === 'LOT' || item.tracking_type === 'SERIAL');
            
            const newOptions: ProductOption[] = trackableItems.map((item: any) => ({
                label: item.name,
                value: item.id.toString(),
                product: { id: item.id, name: item.name, tracking_type: item.tracking_type }
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
        const file: UploadFile = values.file.file;
        
        try {
            const fileContent = await file.originFileObj?.text();
            if (!fileContent) {
                throw new Error("Không thể đọc nội dung tệp.");
            }

            // Simple CSV parsing: assumes one column of codes, splitting by newline
            const codes = fileContent.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
            if (codes.length === 0) {
                throw new Error("Tệp không chứa mã nào hợp lệ.");
            }

            // Create payload for RPC
            const p_import_data = codes.map(code => ({
                code: code,
                manufacture_date: null,
                expiry_date: null
            }));

            const { data: result, error } = await supabase.rpc('import_tracking_codes_batch', {
                p_product_id: parseInt(values.p_product_id, 10),
                p_import_data: p_import_data,
            });

            if (error) throw error;

            const importResult = result as ImportResult;

            notification.success({ 
                message: 'Import hoàn tất',
                description: `Thành công: ${importResult.success_count}, Thất bại: ${importResult.fail_count}.`
            });

            if (importResult.fail_count > 0) {
                Modal.warning({
                    title: 'Một số mã không thể import',
                    width: 600,
                    content: (
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <Paragraph>Các mã sau đã tồn tại hoặc không hợp lệ:</Paragraph>
                            <ul>
                                {importResult.failed_items.map(item => (
                                    <li key={item.code}>{item.code}: {item.reason}</li>
                                ))}
                            </ul>
                        </div>
                    ),
                     onOk: () => navigate('/settings/lots-serials'),
                });
            } else {
                 navigate('/settings/lots-serials');
            }

        } catch (error: any) {
           notification.error({ message: `Lỗi import mã`, description: error.message });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="pb-24">
            <Form
                id="import-batch-form"
                form={form}
                layout="vertical"
                onFinish={onFinish}
            >
                <Card
                    title={<Title level={4} style={{ margin: 0 }}>Import Lot/Serial</Title>}
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
                             <Form.Item name="product_name" label="Tên sản phẩm">
                                <Input readOnly disabled />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="tracking_type" label="Loại tracking">
                                <Input readOnly disabled />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                           <Form.Item
                                name="file"
                                label="Tệp Import"
                                rules={[{ required: true, message: 'Tệp là bắt buộc' }]}
                                valuePropName="file"
                            >
                                <Dragger
                                    name="file"
                                    multiple={false}
                                    beforeUpload={() => false} // Prevent automatic upload
                                    accept=".csv"
                                >
                                    <p className="ant-upload-drag-icon">
                                        <InboxOutlined />
                                    </p>
                                    <p className="ant-upload-text">Nhấp hoặc kéo tệp vào khu vực này để tải lên</p>
                                    <p className="ant-upload-hint">
                                        Chỉ hỗ trợ tệp .csv. Tệp phải chứa một cột duy nhất là danh sách các mã Lot/Serial, mỗi mã trên một dòng.
                                    </p>
                                </Dragger>
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
                        icon={<UploadOutlined />}
                        htmlType="submit"
                        loading={submitting}
                        form="import-batch-form"
                    >
                        Import
                    </Button>
                </Space>
            </div>
        </div>
    );
};

const LotSerialImportPageWrapper: React.FC = () => (
    <App>
        <LotSerialImportPage />
    </App>
);

export default LotSerialImportPageWrapper;