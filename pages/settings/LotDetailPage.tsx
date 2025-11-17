

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
import { supabase } from '../../lib/supabase';
import Can from '../../components/auth/Can';
import dayjs from 'dayjs';
import { Database } from '../../types/supabase';

// Type for the data from the v_lots_list view
type LotViewDetails = {
    id: number;
    lot_number: string;
    product_name: string;
    product_code: string;
    status: Database['public']['Enums']['serial_lot_status_enum'];
    current_quantity: number | null;
    received_quantity: number;
    issued_quantity: number;
    manufacture_date: string | null;
    expiry_date: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    created_by_name: string | null;
    updated_by_name: string | null;
};

const statusTag = (status: Database['public']['Enums']['serial_lot_status_enum']) => {
    const colorMap: Record<Database['public']['Enums']['serial_lot_status_enum'], string> = {
        AVAILABLE: 'green',
        IN_STOCK: 'blue',
        EMPTY: 'default',
        EXPIRED: 'red',
        LOST: 'gold',
        USED: 'geekblue',
        PARTIAL: 'cyan',
        IMPORTED: 'purple',
        CREATED: 'volcano',
    };
    return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
};


const LotDetailPage: React.FC = () => {
    // Hooks
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification } = App.useApp();

    // State
    const [lot, setLot] = useState<LotViewDetails | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Fetch data
    useEffect(() => {
        if (!id) {
            notification.error({ message: 'ID Lô không hợp lệ.' });
            navigate('/settings/lots-serials');
            return;
        }

        const fetchLot = async () => {
            setLoading(true);
            setFetchError(null);
            try {
                const { data, error } = await supabase
                    .from('v_lots_list')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                
                if (data) {
                    setLot(data as LotViewDetails);
                } else {
                    throw new Error('Lô không tồn tại hoặc bạn không có quyền xem.');
                }
            } catch (error: any) {
                notification.error({ message: 'Lỗi tải chi tiết Lô', description: error.message });
                setFetchError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLot();
    }, [id, navigate, notification]);

    const pageTitle = `Chi tiết Lô: ${lot?.lot_number || ''}`;

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
                    <Button type="primary" onClick={() => navigate('/settings/lots-serials')}>
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
                                onClick={() => navigate('/settings/lots-serials')}
                            >
                                Quay lại Danh sách
                            </Button>
                            <Can module="settings" action="manageUsers">
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={() => navigate(`/settings/lots-serials/lots/${id}/edit`)}
                                >
                                    Chỉnh sửa
                                </Button>
                            </Can>
                        </Space>
                    </Col>
                </Row>
            }
        >
            {lot && (
                <Descriptions title="Thông tin chi tiết" bordered column={{ xs: 1, sm: 2 }}>
                    <Descriptions.Item label="Số lô">{lot.lot_number}</Descriptions.Item>
                    <Descriptions.Item label="Sản phẩm">{lot.product_name}</Descriptions.Item>
                    
                    <Descriptions.Item label="Trạng thái">
                        {statusTag(lot.status)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Mã sản phẩm">{lot.product_code}</Descriptions.Item>
                    
                    <Descriptions.Item label="SL hiện tại">{lot.current_quantity}</Descriptions.Item>
                    <Descriptions.Item label="SL đã nhập">{lot.received_quantity}</Descriptions.Item>
                    
                    <Descriptions.Item label="SL đã xuất">{lot.issued_quantity}</Descriptions.Item>
                    <Descriptions.Item label=" "></Descriptions.Item>

                    <Descriptions.Item label="Ngày sản xuất">
                        {lot.manufacture_date ? dayjs(lot.manufacture_date).format('DD/MM/YYYY') : 'N/A'}
                    </Descriptions.Item>
                     <Descriptions.Item label="Ngày hết hạn">
                        {lot.expiry_date ? dayjs(lot.expiry_date).format('DD/MM/YYYY') : 'N/A'}
                    </Descriptions.Item>
                    
                    <Descriptions.Item label="Ngày tạo">
                        {dayjs(lot.created_at).format('DD/MM/YYYY HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người tạo">
                        {lot.created_by_name || 'N/A'}
                    </Descriptions.Item>

                    <Descriptions.Item label="Cập nhật lần cuối">
                        {dayjs(lot.updated_at).format('DD/MM/YYYY HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người cập nhật">
                        {lot.updated_by_name || 'N/A'}
                    </Descriptions.Item>
                    
                    <Descriptions.Item label="Ghi chú" span={2}>{lot.notes || 'N/A'}</Descriptions.Item>
                </Descriptions>
            )}
        </Card>
    );
};

const LotDetailPageWrapper: React.FC = () => (
    <App>
        <LotDetailPage />
    </App>
);

export default LotDetailPageWrapper;
