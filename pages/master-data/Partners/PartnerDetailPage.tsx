
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
import { Database } from '../../../types/supabase';

// Define the type for the data from the v_partners_list view
type PartnerViewDetails = {
    id: number;
    code: string;
    name: string;
    is_active: boolean;
    type: Database['public']['Enums']['partner_type_enum'];
    contact_person: string | null;
    phone: string | null;
    email: string | null;
    tax_code: string | null;
    address: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    created_by_name: string | null;
    updated_by_name: string | null;
};

const PartnerDetailPage: React.FC = () => {
    // Hooks
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification } = App.useApp();

    // State
    const [partner, setPartner] = useState<PartnerViewDetails | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Fetch data
    useEffect(() => {
        if (!id) {
            notification.error({ message: 'ID đối tác không hợp lệ.' });
            navigate('/master-data/partners');
            return;
        }

        const fetchPartner = async () => {
            setLoading(true);
            setFetchError(null);
            try {
                // Use the v_partners_list view as specified
                const { data, error } = await supabase
                    .from('v_partners_list')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                
                if (data) {
                    setPartner(data as PartnerViewDetails);
                } else {
                    // This case handles both not found and RLS denial
                    throw new Error('Đối tác không tồn tại hoặc bạn không có quyền xem.');
                }
            } catch (error: any) {
                notification.error({ message: 'Lỗi tải chi tiết đối tác', description: error.message });
                setFetchError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPartner();
    }, [id, navigate, notification]);

    const partnerTypeTag = (type: Database['public']['Enums']['partner_type_enum']) => {
        const colorMap: Record<Database['public']['Enums']['partner_type_enum'], string> = {
            SUPPLIER: 'purple',
            CUSTOMER: 'green',
            BOTH: 'gold',
        };
        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
    };
    
    const pageTitle = `Chi tiết Đối tác: ${partner?.name || ''}`;

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
                    <Button type="primary" onClick={() => navigate('/master-data/partners')}>
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
                                onClick={() => navigate('/master-data/partners')}
                            >
                                Quay lại Danh sách
                            </Button>
                            <Can module="masterData" action="edit">
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={() => navigate(`/master-data/partners/${id}/edit`)}
                                >
                                    Chỉnh sửa
                                </Button>
                            </Can>
                        </Space>
                    </Col>
                </Row>
            }
        >
            {partner && (
                <Descriptions title="Thông tin chi tiết" bordered column={{ xs: 1, sm: 2 }}>
                    <Descriptions.Item label="Tên đối tác">{partner.name}</Descriptions.Item>
                    <Descriptions.Item label="Mã đối tác">{partner.code}</Descriptions.Item>
                    
                    <Descriptions.Item label="Trạng thái">
                        <StatusTag status={partner.is_active} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Loại">{partnerTypeTag(partner.type)}</Descriptions.Item>
                    
                    <Descriptions.Item label="Người liên hệ">{partner.contact_person || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">{partner.phone || 'N/A'}</Descriptions.Item>

                    <Descriptions.Item label="Email">{partner.email || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Mã số thuế">{partner.tax_code || 'N/A'}</Descriptions.Item>

                    <Descriptions.Item label="Ngày tạo">
                        {dayjs(partner.created_at).format('DD/MM/YYYY HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người tạo">
                        {partner.created_by_name || 'N/A'}
                    </Descriptions.Item>

                    <Descriptions.Item label="Cập nhật lần cuối">
                        {dayjs(partner.updated_at).format('DD/MM/YYYY HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người cập nhật">
                        {partner.updated_by_name || 'N/A'}
                    </Descriptions.Item>

                    <Descriptions.Item label="Địa chỉ" span={2}>{partner.address || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Ghi chú" span={2}>{partner.notes || 'N/A'}</Descriptions.Item>
                </Descriptions>
            )}
        </Card>
    );
};

// Wrapper for Antd App context to use notifications
const PartnerDetailPageWrapper: React.FC = () => (
    <App>
        <PartnerDetailPage />
    </App>
);

export default PartnerDetailPageWrapper;
