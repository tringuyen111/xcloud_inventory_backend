
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
} from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { supabase } from '../../../lib/supabase';
import StatusTag from '../../../components/shared/StatusTag';
import Can from '../../../components/auth/Can';
import dayjs from 'dayjs';

// Type for the main data from v_locations_list
type LocationViewDetails = {
    id: number;
    code: string;
    name: string;
    is_active: boolean;
    warehouse_name: string;
    is_receiving_area: boolean;
    is_shipping_area: boolean;
    capacity_cbm: number | null;
    capacity_weight_kg: number | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    created_by_name: string | null;
    updated_by_name: string | null;
    allowed_product_ids: number[] | null;
};

// Type for the fetched product names
type AllowedProduct = {
    id: number;
    name: string;
};

const LocationDetailPage: React.FC = () => {
    // Hooks
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification } = App.useApp();

    // State
    const [location, setLocation] = useState<LocationViewDetails | null>(null);
    const [allowedProducts, setAllowedProducts] = useState<AllowedProduct[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Fetch data
    useEffect(() => {
        if (!id) {
            notification.error({ message: 'ID vị trí không hợp lệ.' });
            navigate('/master-data/locations');
            return;
        }

        const fetchLocationData = async () => {
            setLoading(true);
            setFetchError(null);
            try {
                // 1. Fetch main location details
                const { data: locationData, error: locationError } = await supabase
                    .from('v_locations_list')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (locationError) throw locationError;
                
                if (locationData) {
                    setLocation(locationData as LocationViewDetails);

                    // 2. If allowed products exist, fetch their names
                    const productIds = locationData.allowed_product_ids;
                    if (productIds && productIds.length > 0) {
                        const { data: productsData, error: productsError } = await supabase
                            .from('products')
                            .select('id, name')
                            .in('id', productIds);

                        if (productsError) throw productsError;
                        setAllowedProducts(productsData || []);
                    } else {
                        setAllowedProducts([]);
                    }
                } else {
                    throw new Error('Vị trí không tồn tại hoặc bạn không có quyền xem.');
                }
            } catch (error: any) {
                notification.error({ message: 'Lỗi tải chi tiết vị trí', description: error.message });
                setFetchError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLocationData();
    }, [id, navigate, notification]);
    
    // Helper function to determine location type
    const getLocationType = (loc: LocationViewDetails) => {
        if (loc.is_receiving_area) return 'Receiving';
        if (loc.is_shipping_area) return 'Shipping';
        return 'Storage';
    };

    const pageTitle = `Chi tiết Vị trí: ${location?.name || ''}`;

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
                    <Button type="primary" onClick={() => navigate('/master-data/locations')}>
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
                                onClick={() => navigate('/master-data/locations')}
                            >
                                Quay lại Danh sách
                            </Button>
                            <Can module="masterData" action="edit">
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={() => navigate(`/master-data/locations/${id}/edit`)}
                                >
                                    Chỉnh sửa
                                </Button>
                            </Can>
                        </Space>
                    </Col>
                </Row>
            }
        >
            {location && (
                <Descriptions title="Thông tin chi tiết" bordered column={{ xs: 1, sm: 2 }}>
                    <Descriptions.Item label="Tên vị trí">{location.name}</Descriptions.Item>
                    <Descriptions.Item label="Mã vị trí">{location.code}</Descriptions.Item>
                    
                    <Descriptions.Item label="Trạng thái">
                        <StatusTag status={location.is_active} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Kho">{location.warehouse_name}</Descriptions.Item>

                    <Descriptions.Item label="Loại vị trí">{getLocationType(location)}</Descriptions.Item>
                    <Descriptions.Item label=" ">{/* Empty column */}</Descriptions.Item>

                    <Descriptions.Item label="Sức chứa CBM">{location.capacity_cbm ?? 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Sức chứa KG">{location.capacity_weight_kg ?? 'N/A'}</Descriptions.Item>

                    <Descriptions.Item label="Ngày tạo">
                        {dayjs(location.created_at).format('DD/MM/YYYY HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người tạo">
                        {location.created_by_name || 'N/A'}
                    </Descriptions.Item>

                    <Descriptions.Item label="Cập nhật lần cuối">
                        {dayjs(location.updated_at).format('DD/MM/YYYY HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người cập nhật">
                        {location.updated_by_name || 'N/A'}
                    </Descriptions.Item>

                    <Descriptions.Item label="Sản phẩm cho phép" span={2}>
                        {(location.allowed_product_ids && location.allowed_product_ids.length > 0) ? (
                            <Space size={[0, 8]} wrap>
                                {allowedProducts.map(product => <Tag key={product.id}>{product.name}</Tag>)}
                            </Space>
                        ) : 'Tất cả sản phẩm'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ghi chú" span={2}>{location.notes || 'N/A'}</Descriptions.Item>
                </Descriptions>
            )}
        </Card>
    );
};

// Wrapper for Antd App context
const LocationDetailPageWrapper: React.FC = () => (
    <App>
        <LocationDetailPage />
    </App>
);

export default LocationDetailPageWrapper;
