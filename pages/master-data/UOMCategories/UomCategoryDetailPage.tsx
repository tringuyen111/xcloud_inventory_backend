
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

// Define the type for the data from the v_uom_categories_list view
type UomCategoryViewDetails = {
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

const UomCategoryDetailPage: React.FC = () => {
    // Hooks
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification } = App.useApp();

    // State
    const [uomCategory, setUomCategory] = useState<UomCategoryViewDetails | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Fetch data
    useEffect(() => {
        if (!id) {
            notification.error({ message: 'ID không hợp lệ.' });
            navigate('/product/uom-categories');
            return;
        }

        const fetchUomCategory = async () => {
            setLoading(true);
            setFetchError(null);
            try {
                // Use the v_uom_categories_list view as specified
                const { data, error } = await supabase
                    .from('v_uom_categories_list')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                
                if (data) {
                    setUomCategory(data as UomCategoryViewDetails);
                } else {
                    // This case handles both not found and RLS denial
                    throw new Error('Nhóm đơn vị tính không tồn tại hoặc bạn không có quyền xem.');
                }
            } catch (error: any) {
                notification.error({ message: 'Lỗi tải chi tiết nhóm ĐVT', description: error.message });
                setFetchError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUomCategory();
    }, [id, navigate, notification]);

    const pageTitle = `Chi tiết Nhóm ĐVT: ${uomCategory?.name || ''}`;

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
                    <Button type="primary" onClick={() => navigate('/product/uom-categories')}>
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
                                onClick={() => navigate('/product/uom-categories')}
                            >
                                Quay lại Danh sách
                            </Button>
                            <Can module="masterData" action="edit">
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={() => navigate(`/product/uom-categories/${id}/edit`)}
                                >
                                    Chỉnh sửa
                                </Button>
                            </Can>
                        </Space>
                    </Col>
                </Row>
            }
        >
            {uomCategory && (
                <Descriptions title="Thông tin chi tiết" bordered column={{ xs: 1, sm: 2 }}>
                    <Descriptions.Item label="Tên nhóm ĐVT">{uomCategory.name}</Descriptions.Item>
                    <Descriptions.Item label="Mã nhóm ĐVT">{uomCategory.code}</Descriptions.Item>

                    <Descriptions.Item label="Trạng thái">
                        <StatusTag status={uomCategory.is_active} />
                    </Descriptions.Item>
                    <Descriptions.Item label=" ">{/* Empty for layout */}</Descriptions.Item>
                    
                    <Descriptions.Item label="Ngày tạo">
                        {dayjs(uomCategory.created_at).format('DD/MM/YYYY HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người tạo">
                        {uomCategory.created_by_name || 'N/A'}
                    </Descriptions.Item>

                    <Descriptions.Item label="Cập nhật lần cuối">
                        {dayjs(uomCategory.updated_at).format('DD/MM/YYYY HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người cập nhật">
                        {uomCategory.updated_by_name || 'N/A'}
                    </Descriptions.Item>

                    <Descriptions.Item label="Mô tả" span={2}>{uomCategory.description || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Ghi chú" span={2}>{uomCategory.notes || 'N/A'}</Descriptions.Item>
                </Descriptions>
            )}
        </Card>
    );
};

// Wrapper for Antd App context to use notifications
const UomCategoryDetailPageWrapper: React.FC = () => (
    <App>
        <UomCategoryDetailPage />
    </App>
);

export default UomCategoryDetailPageWrapper;
