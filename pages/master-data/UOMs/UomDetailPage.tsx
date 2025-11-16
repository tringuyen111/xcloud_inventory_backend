
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

// Define the type for the data from the v_uoms_list view
type UomViewDetails = {
    id: number;
    code: string;
    name: string;
    is_active: boolean;
    category_name: string;
    is_base_unit: boolean;
    conversion_factor: number;
    notes: string | null;
    created_at: string;
    updated_at: string;
    created_by_name: string | null;
    updated_by_name: string | null;
};

const UomDetailPage: React.FC = () => {
    // Hooks
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification } = App.useApp();

    // State
    const [uom, setUom] = useState<UomViewDetails | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Fetch data
    useEffect(() => {
        if (!id) {
            notification.error({ message: 'ID không hợp lệ.' });
            navigate('/product/uoms');
            return;
        }

        const fetchUom = async () => {
            setLoading(true);
            setFetchError(null);
            try {
                // Use the v_uoms_list view as specified
                const { data, error } = await supabase
                    .from('v_uoms_list')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                
                if (data) {
                    setUom(data as UomViewDetails);
                } else {
                    // This case handles both not found and RLS denial
                    throw new Error('Đơn vị tính không tồn tại hoặc bạn không có quyền xem.');
                }
            } catch (error: any) {
                notification.error({ message: 'Lỗi tải chi tiết đơn vị tính', description: error.message });
                setFetchError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUom();
    }, [id, navigate, notification]);

    const pageTitle = `Chi tiết ĐVT: ${uom?.name || ''}`;

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
                    <Button type="primary" onClick={() => navigate('/product/uoms')}>
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
                                onClick={() => navigate('/product/uoms')}
                            >
                                Quay lại Danh sách
                            </Button>
                            <Can module="masterData" action="edit">
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={() => navigate(`/product/uoms/${id}/edit`)}
                                >
                                    Chỉnh sửa
                                </Button>
                            </Can>
                        </Space>
                    </Col>
                </Row>
            }
        >
            {uom && (
                <Descriptions title="Thông tin chi tiết" bordered column={{ xs: 1, sm: 2 }}>
                    <Descriptions.Item label="Tên ĐVT">{uom.name}</Descriptions.Item>
                    <Descriptions.Item label="Mã ĐVT">{uom.code}</Descriptions.Item>

                    <Descriptions.Item label="Trạng thái">
                        <StatusTag status={uom.is_active} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Nhóm ĐVT">{uom.category_name}</Descriptions.Item>
                    
                    <Descriptions.Item label="Là ĐV cơ sở?">
                        {uom.is_base_unit ? <Tag color="blue">YES (Base Unit)</Tag> : 'NO'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Hệ số quy đổi">
                        {uom.is_base_unit ? '1.0000' : uom.conversion_factor}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày tạo">
                        {dayjs(uom.created_at).format('DD/MM/YYYY HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người tạo">
                        {uom.created_by_name || 'N/A'}
                    </Descriptions.Item>

                    <Descriptions.Item label="Cập nhật lần cuối">
                        {dayjs(uom.updated_at).format('DD/MM/YYYY HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người cập nhật">
                        {uom.updated_by_name || 'N/A'}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ghi chú" span={2}>{uom.notes || 'N/A'}</Descriptions.Item>
                </Descriptions>
            )}
        </Card>
    );
};

// Wrapper for Antd App context to use notifications
const UomDetailPageWrapper: React.FC = () => (
    <App>
        <UomDetailPage />
    </App>
);

export default UomDetailPageWrapper;
