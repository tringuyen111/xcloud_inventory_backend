

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
} from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { supabase } from '../../../lib/supabase';
import StatusTag from '../../../components/shared/StatusTag';
import Can from '../../../components/auth/Can';
import dayjs from 'dayjs';

// Define the type for the data from the v_product_types_list view
type GoodsTypeViewDetails = {
    id: number;
    code: string;
    name: string;
    is_active: boolean;
    description: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    created_by_name: string | null;
    updated_by_name: string | null;
};

const GoodsTypeDetailPage: React.FC = () => {
    // Hooks
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification } = App.useApp();

    // State
    const [goodsType, setGoodsType] = useState<GoodsTypeViewDetails | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Fetch data
    useEffect(() => {
        if (!id) {
            notification.error({ message: 'ID không hợp lệ.' });
            navigate('/product/goods-types');
            return;
        }

        const fetchGoodsType = async () => {
            setLoading(true);
            setFetchError(null);
            try {
                // Use the v_product_types_list view as specified
                const { data, error } = await supabase
                    .from('v_product_types_list')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                
                if (data) {
                    setGoodsType(data as GoodsTypeViewDetails);
                } else {
                    // This case handles both not found and RLS denial
                    throw new Error('Loại sản phẩm không tồn tại hoặc bạn không có quyền xem.');
                }
            } catch (error: any) {
                notification.error({ message: 'Lỗi tải chi tiết loại sản phẩm', description: error.message });
                setFetchError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchGoodsType();
    }, [id, navigate, notification]);

    const pageTitle = `Chi tiết Loại sản phẩm: ${goodsType?.name || ''}`;

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
                    <Button type="primary" onClick={() => navigate('/product/goods-types')}>
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
                                onClick={() => navigate('/product/goods-types')}
                            >
                                Quay lại Danh sách
                            </Button>
                            <Can module="masterData" action="edit">
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={() => navigate(`/product/goods-types/${id}/edit`)}
                                >
                                    Chỉnh sửa
                                </Button>
                            </Can>
                        </Space>
                    </Col>
                </Row>
            }
        >
            {goodsType && (
                <Descriptions title="Thông tin chi tiết" bordered column={{ xs: 1, sm: 2 }}>
                    <Descriptions.Item label="Tên loại sản phẩm">{goodsType.name}</Descriptions.Item>
                    <Descriptions.Item label="Mã loại sản phẩm">{goodsType.code}</Descriptions.Item>

                    <Descriptions.Item label="Trạng thái">
                        <StatusTag status={goodsType.is_active} />
                    </Descriptions.Item>
                    <Descriptions.Item label=" ">{/* Empty for layout */}</Descriptions.Item>
                    
                    <Descriptions.Item label="Ngày tạo">
                        {dayjs(goodsType.created_at).format('DD/MM/YYYY HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người tạo">
                        {goodsType.created_by_name || 'N/A'}
                    </Descriptions.Item>

                    <Descriptions.Item label="Cập nhật lần cuối">
                        {dayjs(goodsType.updated_at).format('DD/MM/YYYY HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người cập nhật">
                        {goodsType.updated_by_name || 'N/A'}
                    </Descriptions.Item>

                    <Descriptions.Item label="Mô tả" span={2}>{goodsType.description || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Ghi chú" span={2}>{goodsType.notes || 'N/A'}</Descriptions.Item>
                </Descriptions>
            )}
        </Card>
    );
};

// Wrapper for Antd App context to use notifications
const GoodsTypeDetailPageWrapper: React.FC = () => (
    <App>
        <GoodsTypeDetailPage />
    </App>
);

export default GoodsTypeDetailPageWrapper;
