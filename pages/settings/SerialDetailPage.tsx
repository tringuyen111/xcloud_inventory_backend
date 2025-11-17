

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

// Type for the data from the v_serials_list view
type SerialViewDetails = {
    id: number;
    serial_number: string;
    product_name: string;
    product_code: string;
    lot_number: string | null;
    status: Database['public']['Enums']['serial_lot_status_enum'];
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

const SerialDetailPage: React.FC = () => {
    // Hooks
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification } = App.useApp();

    // State
    const [serial, setSerial] = useState<SerialViewDetails | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Fetch data
    useEffect(() => {
        if (!id) {
            notification.error({ message: 'ID Serial không hợp lệ.' });
            navigate('/settings/lots-serials');
            return;
        }

        const fetchSerial = async () => {
            setLoading(true);
            setFetchError(null);
            try {
                const { data, error } = await supabase
                    .from('v_serials_list')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                
                if (data) {
                    setSerial(data as SerialViewDetails);
                } else {
                    throw new Error('Serial không tồn tại hoặc bạn không có quyền xem.');
                }
            } catch (error: any) {
                notification.error({ message: 'Lỗi tải chi tiết Serial', description: error.message });
                setFetchError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSerial();
    }, [id, navigate, notification]);

    const pageTitle = `Chi tiết Serial: ${serial?.serial_number || ''}`;

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
                                    onClick={() => navigate(`/settings/lots-serials/serials/${id}/edit`)}
                                >
                                    Chỉnh sửa
                                </Button>
                            </Can>
                        </Space>
                    </Col>
                </Row>
            }
        >
            {serial && (
                <Descriptions title="Thông tin chi tiết" bordered column={{ xs: 1, sm: 2 }}>
                    <Descriptions.Item label="Số serial">{serial.serial_number}</Descriptions.Item>
                    <Descriptions.Item label="Sản phẩm">{serial.product_name}</Descriptions.Item>
                    
                    <Descriptions.Item label="Trạng thái">
                        {statusTag(serial.status)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Mã sản phẩm">{serial.product_code}</Descriptions.Item>
                    
                    <Descriptions.Item label="Thuộc Lô">{serial.lot_number || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label=" "></Descriptions.Item>

                    <Descriptions.Item label="Ngày sản xuất">
                        {serial.manufacture_date ? dayjs(serial.manufacture_date).format('DD/MM/YYYY') : 'N/A'}
                    </Descriptions.Item>
                     <Descriptions.Item label="Ngày hết hạn">
                        {serial.expiry_date ? dayjs(serial.expiry_date).format('DD/MM/YYYY') : 'N/A'}
                    </Descriptions.Item>
                    
                    <Descriptions.Item label="Ngày tạo">
                        {dayjs(serial.created_at).format('DD/MM/YYYY HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người tạo">
                        {serial.created_by_name || 'N/A'}
                    </Descriptions.Item>

                    <Descriptions.Item label="Cập nhật lần cuối">
                        {dayjs(serial.updated_at).format('DD/MM/YYYY HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người cập nhật">
                        {serial.updated_by_name || 'N/A'}
                    </Descriptions.Item>
                    
                    <Descriptions.Item label="Ghi chú" span={2}>{serial.notes || 'N/A'}</Descriptions.Item>
                </Descriptions>
            )}
        </Card>
    );
};

const SerialDetailPageWrapper: React.FC = () => (
    <App>
        <SerialDetailPage />
    </App>
);

export default SerialDetailPageWrapper;
