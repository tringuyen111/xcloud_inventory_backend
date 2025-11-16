
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

// Define the type for the data from the v_warehouses_list view
type WarehouseViewDetails = {
    id: number;
    code: string;
    name: string;
    is_active: boolean;
    branch_name: string;
    manager_name: string | null;
    total_capacity_cbm: number | null;
    total_capacity_weight_kg: number | null;
    address: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    created_by_name: string | null;
    updated_by_name: string | null;
};

const WarehouseDetailPage: React.FC = () => {
    // Hooks
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification } = App.useApp();

    // State
    const [warehouse, setWarehouse] = useState<WarehouseViewDetails | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Fetch data
    useEffect(() => {
        if (!id) {
            notification.error({ message: 'ID kho không hợp lệ.' });
            navigate('/master-data/warehouses');
            return;
        }

        const fetchWarehouse = async () => {
            setLoading(true);
            setFetchError(null);
            try {
                // Use the v_warehouses_list view as specified
                const { data, error } = await supabase
                    .from('v_warehouses_list')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                
                if (data) {
                    setWarehouse(data as WarehouseViewDetails);
                } else {
                    // This case handles both not found and RLS denial
                    throw new Error('Kho không tồn tại hoặc bạn không có quyền xem.');
                }
            } catch (error: any) {
                notification.error({ message: 'Lỗi tải chi tiết kho', description: error.message });
                setFetchError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchWarehouse();
    }, [id, navigate, notification]);

    const pageTitle = `Chi tiết Kho: ${warehouse?.name || ''}`;

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
                    <Button type="primary" onClick={() => navigate('/master-data/warehouses')}>
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
                                onClick={() => navigate('/master-data/warehouses')}
                            >
                                Quay lại Danh sách
                            </Button>
                            <Can module="masterData" action="edit">
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={() => navigate(`/master-data/warehouses/${id}/edit`)}
                                >
                                    Chỉnh sửa
                                </Button>
                            </Can>
                        </Space>
                    </Col>
                </Row>
            }
        >
            {warehouse && (
                <Descriptions title="Thông tin chi tiết" bordered column={{ xs: 1, sm: 2 }}>
                    <Descriptions.Item label="Tên kho">{warehouse.name}</Descriptions.Item>
                    <Descriptions.Item label="Mã kho">{warehouse.code}</Descriptions.Item>
                    
                    <Descriptions.Item label="Trạng thái">
                        <StatusTag status={warehouse.is_active} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Chi nhánh">{warehouse.branch_name}</Descriptions.Item>
                    
                    <Descriptions.Item label="Tên người quản lý">{warehouse.manager_name || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label=" ">{/* Empty column as per spec */}</Descriptions.Item>

                    <Descriptions.Item label="Sức chứa CBM">{warehouse.total_capacity_cbm ?? 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Sức chứa KG">{warehouse.total_capacity_weight_kg ?? 'N/A'}</Descriptions.Item>

                    <Descriptions.Item label="Ngày tạo">
                        {dayjs(warehouse.created_at).format('DD/MM/YYYY HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người tạo">
                        {warehouse.created_by_name || 'N/A'}
                    </Descriptions.Item>

                    <Descriptions.Item label="Cập nhật lần cuối">
                        {dayjs(warehouse.updated_at).format('DD/MM/YYYY HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người cập nhật">
                        {warehouse.updated_by_name || 'N/A'}
                    </Descriptions.Item>

                    <Descriptions.Item label="Địa chỉ" span={2}>{warehouse.address || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Ghi chú" span={2}>{warehouse.notes || 'N/A'}</Descriptions.Item>
                </Descriptions>
            )}
        </Card>
    );
};

// Wrapper for Antd App context to use notifications
const WarehouseDetailPageWrapper: React.FC = () => (
    <App>
        <WarehouseDetailPage />
    </App>
);

export default WarehouseDetailPageWrapper;
