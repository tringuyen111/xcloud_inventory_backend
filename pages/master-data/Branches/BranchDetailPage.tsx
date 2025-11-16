
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

// Define the type for the data from the v_branches_list view
type BranchViewDetails = {
    id: number;
    code: string;
    name: string;
    is_active: boolean;
    organization_name: string;
    phone: string | null;
    address: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    created_by_name: string | null;
    updated_by_name: string | null;
};

const BranchDetailPage: React.FC = () => {
    // Hooks
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification } = App.useApp();

    // State
    const [branch, setBranch] = useState<BranchViewDetails | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Fetch data
    useEffect(() => {
        if (!id) {
            notification.error({ message: 'ID chi nhánh không hợp lệ.' });
            navigate('/master-data/branches');
            return;
        }

        const fetchBranch = async () => {
            setLoading(true);
            setFetchError(null);
            try {
                // Use the v_branches_list view as specified
                const { data, error } = await supabase
                    .from('v_branches_list')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                
                if (data) {
                    setBranch(data as BranchViewDetails);
                } else {
                    // This case handles both not found and RLS denial
                    throw new Error('Chi nhánh không tồn tại hoặc bạn không có quyền xem.');
                }
            } catch (error: any) {
                notification.error({ message: 'Lỗi tải chi tiết chi nhánh', description: error.message });
                setFetchError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchBranch();
    }, [id, navigate, notification]);

    const pageTitle = `Chi tiết Chi nhánh: ${branch?.name || ''}`;

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
                    <Button type="primary" onClick={() => navigate('/master-data/branches')}>
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
                                onClick={() => navigate('/master-data/branches')}
                            >
                                Quay lại Danh sách
                            </Button>
                            <Can module="masterData" action="edit">
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={() => navigate(`/master-data/branches/${id}/edit`)}
                                >
                                    Chỉnh sửa
                                </Button>
                            </Can>
                        </Space>
                    </Col>
                </Row>
            }
        >
            {branch && (
                <Descriptions title="Thông tin chi tiết" bordered column={{ xs: 1, sm: 2 }}>
                    <Descriptions.Item label="Tên chi nhánh">{branch.name}</Descriptions.Item>
                    <Descriptions.Item label="Mã chi nhánh">{branch.code}</Descriptions.Item>
                    
                    <Descriptions.Item label="Trạng thái">
                        <StatusTag status={branch.is_active} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Tổ chức">{branch.organization_name}</Descriptions.Item>
                    
                    <Descriptions.Item label="Số điện thoại">{branch.phone || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label=" ">{/* Empty column as per spec */}</Descriptions.Item>

                    <Descriptions.Item label="Ngày tạo">
                        {dayjs(branch.created_at).format('DD/MM/YYYY HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người tạo">
                        {branch.created_by_name || 'N/A'}
                    </Descriptions.Item>

                    <Descriptions.Item label="Cập nhật lần cuối">
                        {dayjs(branch.updated_at).format('DD/MM/YYYY HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người cập nhật">
                        {branch.updated_by_name || 'N/A'}
                    </Descriptions.Item>

                    <Descriptions.Item label="Địa chỉ" span={2}>{branch.address || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Ghi chú" span={2}>{branch.notes || 'N/A'}</Descriptions.Item>
                </Descriptions>
            )}
        </Card>
    );
};

// Wrapper for Antd App context to use notifications
const BranchDetailPageWrapper: React.FC = () => (
    <App>
        <BranchDetailPage />
    </App>
);

export default BranchDetailPageWrapper;
