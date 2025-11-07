import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../services/supabaseClient';
import { GoodsIssue, GILine, Warehouse } from '../../../types/supabase';
import {
    Button, Card, Row, Col, Typography, Space, App, Spin, Descriptions, Tag, Alert, Table, Timeline
} from 'antd';
import { 
    RollbackOutlined,
    ShopOutlined,
    UserOutlined,
    EditOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import { format } from 'date-fns';
import PageHeader from '../../../components/layout/PageHeader';

const { Text, Title, Paragraph } = Typography;

// --- Type Definitions ---
type UserProfile = { email: string | null } | null;
type StatusHistoryItem = {
    id: number;
    to_status: string;
    changed_at: string;
    changed_by: string | null;
    changed_by_user?: UserProfile;
};
type GIViewData = GoodsIssue & {
    warehouse: Warehouse | null;
    to_warehouse: { name: string } | null;
    partner: { name: string } | null;
    gi_lines: (GILine & {
        goods_model: { code: string; name: string; base_uom: { name: string } | null; } | null;
        locations: { name: string } | null;
    })[];
    created_by_user: UserProfile;
};

const STATUS_COLOR_MAP: Record<string, string> = {
    DRAFT: 'gold',
    CREATED: 'blue',
    PICKING: 'orange',
    PICKED: 'purple',
    COMPLETED: 'green',
    CANCELLED: 'red',
};

const GIViewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification, modal } = App.useApp();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [goodsIssue, setGoodsIssue] = useState<GIViewData | null>(null);
    const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);

    const getUserDisplayName = (user: UserProfile) => {
        if (!user || !user.email) return 'System';
        return user.email.split('@')[0];
    }

    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('goods_issues')
                .select(`
                    *,
                    warehouse:warehouses!goods_issues_warehouse_id_fkey(*),
                    to_warehouse:warehouses!goods_issues_to_warehouse_id_fkey(id, name),
                    partner:partners(id, name),
                    gi_lines(*, goods_model:goods_models(code, name, base_uom:uoms(name)), locations(name))
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!data) throw new Error("Goods Issue not found.");

            setGoodsIssue(data as GIViewData);
    
        } catch (err: any) {
            setError(err.message);
            notification.error({ message: "Error fetching data", description: err.message });
        } finally {
            setLoading(false);
        }
    }, [id, notification]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const lineColumns = [
        { title: 'Goods Model', key: 'goods_model', render: (_:any, r: any) => <div><Text strong>{r.goods_model?.name}</Text><br/><Text type="secondary">{r.goods_model?.code}</Text></div> },
        { title: 'From Location', dataIndex: ['locations', 'name'], key: 'location', render: (loc: any) => loc || <Tag>Auto</Tag>},
        { title: 'UoM', dataIndex: ['goods_model', 'base_uom', 'name'], key: 'uom' },
        { title: 'Required', dataIndex: 'required_qty', key: 'required_qty', align: 'right' as const },
        { title: 'Allocated', dataIndex: 'allocated_qty', key: 'allocated_qty', align: 'right' as const },
        { title: 'Picked', dataIndex: 'picked_qty', key: 'picked_qty', align: 'right' as const },
    ];
    
    if (loading) return <div className="flex justify-center items-center h-full"><Spin size="large" /></div>;
    if (error) return <Alert message="Error" description={error} type="error" showIcon />;
    if (!goodsIssue) return <Alert message="Not Found" description="The requested goods issue could not be found." type="warning" showIcon />;

    const destination = goodsIssue.transaction_type === 'TRANSFER_OUT' 
        ? `Warehouse: ${goodsIssue.to_warehouse?.name || 'N/A'}`
        : `Partner: ${goodsIssue.partner?.name || 'N/A'}`;

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <PageHeader
                title={goodsIssue.reference_number || `GI-${goodsIssue.id}`}
                description="Details for this goods issue."
                actions={
                     <Space>
                        <Button icon={<RollbackOutlined />} onClick={() => navigate('/operations/gi')}>Back to List</Button>
                        <Button icon={<EditOutlined />} onClick={() => navigate(`/operations/gi/${id}/edit`)} disabled={goodsIssue.status !== 'DRAFT'}>Edit</Button>
                        <Button icon={<DeleteOutlined />} danger disabled={goodsIssue.status !== 'DRAFT'}>Delete</Button>
                    </Space>
                }
            />
            

            <Row gutter={24}>
                <Col span={16}>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <Card title="Information">
                             <Descriptions bordered size="small" column={2}>
                                <Descriptions.Item label="Reference">{goodsIssue.reference_number || `GI-${goodsIssue.id}`}</Descriptions.Item>
                                <Descriptions.Item label="Transaction Type"><Tag>{goodsIssue.transaction_type?.replace(/_/g, ' ')}</Tag></Descriptions.Item>
                                <Descriptions.Item label="From Warehouse">{goodsIssue.warehouse?.name}</Descriptions.Item>
                                <Descriptions.Item label="Destination">{destination}</Descriptions.Item>
                                <Descriptions.Item label="Issue Mode" span={2}><Tag>{goodsIssue.issue_mode}</Tag></Descriptions.Item>
                                <Descriptions.Item label="Notes" span={2}>{goodsIssue.notes || '-'}</Descriptions.Item>
                                <Descriptions.Item label="Created At">{format(new Date(goodsIssue.created_at), 'dd MMM yyyy, h:mm a')}</Descriptions.Item>
                                <Descriptions.Item label="Created By">{getUserDisplayName(goodsIssue.created_by_user)}</Descriptions.Item>
                            </Descriptions>
                        </Card>
                        <Card title="Line Items Summary">
                            <Table columns={lineColumns} dataSource={goodsIssue.gi_lines} rowKey="id" pagination={false} size="small"/>
                        </Card>
                    </Space>
                </Col>

                <Col span={8}>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <Card title="Status">
                            <div className="text-center">
                                <Tag color={STATUS_COLOR_MAP[goodsIssue.status]} style={{ fontSize: 16, padding: '8px 16px', borderRadius: 8}}>
                                    {goodsIssue.status.replace('_', ' ')}
                                </Tag>
                            </div>
                            {/* History could be added here later */}
                        </Card>
                         <Card title="Warehouse Info" >
                            <Title level={5}><ShopOutlined className="mr-2" />{goodsIssue.warehouse?.name}</Title>
                            <Paragraph>{goodsIssue.warehouse?.address || 'No address specified'}</Paragraph>
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="Manager">{goodsIssue.warehouse?.manager_name || 'N/A'}</Descriptions.Item>
                                <Descriptions.Item label="Phone">{goodsIssue.warehouse?.phone || 'N/A'}</Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </Space>
                </Col>
            </Row>
        </Space>
    );
};

const GIViewPageWrapper: React.FC = () => (
    <App><GIViewPage /></App>
);

export default GIViewPageWrapper;