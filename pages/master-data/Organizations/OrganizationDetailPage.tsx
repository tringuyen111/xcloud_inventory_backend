
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

// Define the type for the data from the v_organizations_list view
type OrganizationViewDetails = {
    id: number;
    code: string;
    name: string;
    is_active: boolean;
    tax_code: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    created_by_name: string | null;
    updated_by_name: string | null;
};

const OrganizationDetailPage: React.FC = () => {
    // Hooks
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification } = App.useApp();

    // State
    const [organization, setOrganization] = useState<OrganizationViewDetails | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Fetch data
    useEffect(() => {
        if (!id) {
            notification.error({ message: 'ID không hợp lệ.' });
            navigate('/master-data/organizations');
            return;
        }

        const fetchOrganization = async () => {
            setLoading(true);
            setFetchError(null);
            try {
                // Use the v_organizations_list view as specified
                const { data, error } = await supabase
                    .from('v_organizations_list')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                
                if (data) {
                    setOrganization(data as OrganizationViewDetails);
                } else {
                    // This case handles both not found and RLS denial
                    throw new Error('Tổ chức không tồn tại hoặc bạn không có quyền xem.');
                }
            } catch (error: any) {
                notification.error({ message: 'Lỗi tải chi tiết tổ chức', description: error.message });
                setFetchError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOrganization();
    }, [id, navigate, notification]);

    const pageTitle = `Chi tiết Tổ chức: ${organization?.name || ''}`;

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
                    <Button type="primary" onClick={() => navigate('/master-data/organizations')}>
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
                                onClick={() => navigate('/master-data/organizations')}
                            >
                                Quay lại Danh sách
                            </Button>
                            <Can module="masterData" action="edit">
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={() => navigate(`/master-data/organizations/${id}/edit`)}
                                >
                                    Chỉnh sửa
                                </Button>
                            </Can>
                        </Space>
                    </Col>
                </Row>
            }
        >
            {organization && (
                <Descriptions bordered column={{ xs: 1, sm: 2 }}>
                    <Descriptions.Item label="Tên tổ chức">{organization.name}</Descriptions.Item>
                    <Descriptions.Item label="Mã tổ chức">{organization.code}</Descriptions.Item>

                    <Descriptions.Item label="Trạng thái">
                        <StatusTag status={organization.is_active} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Mã số thuế">{organization.tax_code || 'N/A'}</Descriptions.Item>
                    
                    <Descriptions.Item label="Email">{organization.email || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">{organization.phone || 'N/A'}</Descriptions.Item>
                    
                    <Descriptions.Item label="Ngày tạo">
                        {dayjs(organization.created_at).format('DD/MM/YYYY HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người tạo">
                        {organization.created_by_name || 'N/A'}
                    </Descriptions.Item>

                    <Descriptions.Item label="Cập nhật lần cuối">
                        {dayjs(organization.updated_at).format('DD/MM/YYYY HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người cập nhật">
                        {organization.updated_by_name || 'N/A'}
                    </Descriptions.Item>

                    <Descriptions.Item label="Địa chỉ" span={2}>{organization.address || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Ghi chú" span={2}>{organization.notes || 'N/A'}</Descriptions.Item>
                </Descriptions>
            )}
        </Card>
    );
};

// Wrapper for Antd App context to use notifications
const OrganizationDetailPageWrapper: React.FC = () => (
    <App>
        <OrganizationDetailPage />
    </App>
);

export default OrganizationDetailPageWrapper;
