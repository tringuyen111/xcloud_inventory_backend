
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    App,
    Button,
    Card,
    Descriptions,
    Spin,
    Typography,
    Space,
    Row,
    Col,
    Result,
    Tag,
    Image,
    Empty,
} from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { supabase } from '../../../lib/supabase';
import StatusTag from '../../../components/shared/StatusTag';
import Can from '../../../components/auth/Can';
import dayjs from 'dayjs';
import { Database } from '../../../types/supabase';

// Define the type for the data from the v_products_list view
type ProductViewDetails = {
    id: number;
    code: string;
    name: string;
    is_active: boolean;
    organization_name: string;
    product_type_name: string;
    tracking_type: Database['public']['Enums']['tracking_type_enum'];
    base_uom_name: string;
    sku: string | null;
    min_stock_level: number;
    shelf_life_days: number | null;
    weight_kg: number | null;
    volume_cbm: number | null;
    images: string[] | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    created_by_name: string | null;
    updated_by_name: string | null;
};

const GoodsModelDetailPage: React.FC = () => {
    // Hooks
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification } = App.useApp();

    // State
    const [product, setProduct] = useState<ProductViewDetails | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Fetch data
    useEffect(() => {
        if (!id) {
            notification.error({ message: 'ID sản phẩm không hợp lệ.' });
            navigate('/product/goods-models');
            return;
        }

        const fetchProduct = async () => {
            setLoading(true);
            setFetchError(null);
            try {
                // Use the v_products_list view as specified
                const { data, error } = await supabase
                    .from('v_products_list')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                
                if (data) {
                    setProduct(data as ProductViewDetails);
                } else {
                    // This case handles both not found and RLS denial
                    throw new Error('Sản phẩm không tồn tại hoặc bạn không có quyền xem.');
                }
            } catch (error: any) {
                notification.error({ message: 'Lỗi tải chi tiết sản phẩm', description: error.message });
                setFetchError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id, navigate, notification]);

    const trackingTypeTag = (type: Database['public']['Enums']['tracking_type_enum']) => {
        const colorMap: Record<Database['public']['Enums']['tracking_type_enum'], string> = {
            NONE: 'default',
            LOT: 'geekblue',
            SERIAL: 'volcano',
        };
        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
    };

    const pageTitle = `Chi tiết Sản phẩm: ${product?.name || ''}`;

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Spin size="large" /></div>;
    }

    if (fetchError) {
        return (
            <Result
                status="404"
                title="Không thể tải dữ liệu"
                subTitle={fetchError}
                extra={
                    <Button type="primary" onClick={() => navigate('/product/goods-models')}>
                        Quay lại Danh sách
                    </Button>
                }
            />
        );
    }
    
    return (
        <Card
            title={
                <Row justify="space-between" align="middle">
                    <Col>
                        <Typography.Title level={4} style={{ margin: 0 }}>
                            {pageTitle}
                        </Typography.Title>
                    </Col>
                    <Col>
                        <Space>
                            <Button
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate('/product/goods-models')}
                            >
                                Quay lại Danh sách
                            </Button>
                            <Can module="masterData" action="edit">
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={() => navigate(`/product/goods-models/${id}/edit`)}
                                >
                                    Chỉnh sửa
                                </Button>
                            </Can>
                        </Space>
                    </Col>
                </Row>
            }
        >
            {product && (
                <Row gutter={[32, 16]}>
                    {/* Left Column: Media Gallery */}
                    <Col xs={24} lg={10}>
                         <div className="flex flex-col items-center">
                            <Image.PreviewGroup>
                                <Image
                                    className="w-full max-w-md h-auto object-cover rounded-lg shadow-md mb-4"
                                    src={(product.images && product.images.length > 0) ? product.images[currentImageIndex] : "https://via.placeholder.com/400?text=No+Image"}
                                />
                            </Image.PreviewGroup>
                            
                            {(product.images && product.images.length > 1) && (
                                <Space size="small" wrap className="justify-center">
                                    {product.images.map((imgUrl, index) => (
                                        <div
                                            key={index}
                                            className={`w-20 h-20 cursor-pointer p-1 border-2 rounded-md transition-all ${
                                                currentImageIndex === index ? 'border-blue-500' : 'border-transparent'
                                            }`}
                                            onClick={() => setCurrentImageIndex(index)}
                                        >
                                            <img src={imgUrl} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover rounded" />
                                        </div>
                                    ))}
                                </Space>
                            )}
                         </div>
                    </Col>

                    {/* Right Column: Information */}
                    <Col xs={24} lg={14}>
                        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
                            <Descriptions.Item label="Tên sản phẩm">{product.name}</Descriptions.Item>
                            <Descriptions.Item label="Mã sản phẩm">{product.code}</Descriptions.Item>
                            
                            <Descriptions.Item label="SKU">{product.sku || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Loại SP">{product.product_type_name}</Descriptions.Item>
                            
                            <Descriptions.Item label="ĐVT Cơ sở">{product.base_uom_name}</Descriptions.Item>
                            <Descriptions.Item label="Loại Tracking">{trackingTypeTag(product.tracking_type)}</Descriptions.Item>

                            <Descriptions.Item label="Trạng thái">
                                <StatusTag status={product.is_active} />
                            </Descriptions.Item>
                            <Descriptions.Item label="Tổ chức">{product.organization_name}</Descriptions.Item>

                            <Descriptions.Item label="Tồn kho tối thiểu">{product.min_stock_level}</Descriptions.Item>
                            <Descriptions.Item label="Số ngày HSD">{product.shelf_life_days ?? 'N/A'}</Descriptions.Item>

                            <Descriptions.Item label="Cân nặng (kg)">{product.weight_kg ?? 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Thể tích (cbm)">{product.volume_cbm ?? 'N/A'}</Descriptions.Item>
                            
                            <Descriptions.Item label="Ngày tạo">
                                {dayjs(product.created_at).format('DD/MM/YYYY HH:mm:ss')}
                            </Descriptions.Item>
                            <Descriptions.Item label="Người tạo">
                                {product.created_by_name || 'N/A'}
                            </Descriptions.Item>

                            <Descriptions.Item label="Cập nhật lần cuối">
                                {dayjs(product.updated_at).format('DD/MM/YYYY HH:mm:ss')}
                            </Descriptions.Item>
                            <Descriptions.Item label="Người cập nhật">
                                {product.updated_by_name || 'N/A'}
                            </Descriptions.Item>
                            
                            <Descriptions.Item label="Ghi chú" span={2}>{product.notes || 'N/A'}</Descriptions.Item>
                        </Descriptions>
                    </Col>
                </Row>
            )}
        </Card>
    );
};

// Wrapper for Antd App context to use notifications
const GoodsModelDetailPageWrapper: React.FC = () => (
    <App>
        <GoodsModelDetailPage />
    </App>
);

export default GoodsModelDetailPageWrapper;
