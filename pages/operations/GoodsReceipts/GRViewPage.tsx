import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../services/supabaseClient';
import { GoodsReceipt, GRLine, Warehouse } from '../../../types/supabase';
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

const { Text, Title, Paragraph } = Typography;

// --- Type Definitions for Detailed View ---
type LineWithDetails = GRLine & {
    goods_model: {
        id: number;
        code: string;
        name: string;
        tracking_type: 'NONE' | 'LOT' | 'SERIAL';
        base_uom: { id: number; code: string; name: string; } | null;
    } | null;
    locations: { id: number; code: string; name: string } | null;
};

type UserProfile = { full_name: string | null } | { email: string | null } | null;

type StatusHistoryItem = {
    id: number;
    from_status: string | null;
    to_status: string;
    changed_at: string;
    changed_by: string | null;
    changed_by_user?: UserProfile;
};

type GRViewData = GoodsReceipt & {
    warehouse: Warehouse | null;
    gr_lines: LineWithDetails[];
    created_by_user: UserProfile;
    updated_by_user: UserProfile;
};


// --- Status & Color Mapping ---
const STATUS_COLOR_MAP: Record<GoodsReceipt['status'], string> = {
    DRAFT: 'gold',
    CREATED: 'blue',
    RECEIVING: 'orange',
    PARTIAL_RECEIVED: 'purple',
    APPROVED: 'cyan',
    COMPLETED: 'green',
};

const TransactionTypeTag: React.FC<{type: string | undefined}> = ({ type }) => {
    if (!type) return null;
    const color = type === 'TRANSFER_IN' ? 'purple' : 'geekblue';
    return <Tag color={color}>{type.replace(/_/g, ' ')}</Tag>
}

// --- Main View Component ---
const GRViewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification, modal } = App.useApp();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [goodsReceipt, setGoodsReceipt] = useState<GRViewData | null>(null);
    const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);

    const getUserDisplayName = (user: UserProfile) => {
        if (!user) return 'System';
        if ('full_name' in user && user.full_name) return user.full_name;
        if ('email' in user && user.email) return user.email.split('@')[0];
        return 'System';
    }

    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const [grRes, historyRes] = await Promise.all([
                supabase
                    .from('goods_receipts')
                    .select(`*, warehouse:warehouses(*), gr_lines(*, goods_model:goods_models(id, code, name, tracking_type, base_uom:uoms(id, code, name)), locations!location_id(id, code, name))`)
                    .eq('id', id)
                    .single(),
                supabase
                    .from('transaction_status_history')
                    .select('id, from_status, to_status, changed_at, changed_by')
                    .eq('transaction_id', id)
                    .eq('transaction_type', 'GR')
                    .order('changed_at', { ascending: false })
            ]);
    
            if (grRes.error) throw grRes.error;
            if (historyRes.error) throw historyRes.error;
            if (!grRes.data) throw new Error("Goods Receipt not found");

            const grData = grRes.data as any;
            const historyData = historyRes.data || [];
    
            const userIds = new Set<string>();
            if (grData.created_by) userIds.add(grData.created_by);
            if (grData.updated_by) userIds.add(grData.updated_by);
            historyData.forEach(h => { if(h.changed_by) userIds.add(h.changed_by) });
            
            let profilesMap = new Map<string, UserProfile>();
            if (userIds.size > 0) {
                const { data: profilesData, error: profilesError } = await supabase
                    .from('users')
                    .select('id, raw_user_meta_data ->> email as email')
                    .in('id', Array.from(userIds));
                if (profilesError) console.warn("Could not fetch user profiles:", profilesError.message);
                else if (profilesData) {
                    profilesData.forEach(p => profilesMap.set(p.id, { email: p.email }));
                }
            }
            
            setGoodsReceipt({
                ...grData,
                created_by_user: grData.created_by ? profilesMap.get(grData.created_by) || null : null,
                updated_by_user: grData.updated_by ? profilesMap.get(grData.updated_by) || null : null,
            });

            setStatusHistory(historyData.map(h => ({
                ...h,
                changed_by_user: h.changed_by ? profilesMap.get(h.changed_by) || null : null,
            })));
    
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

    const handleDelete = () => {
        if (!id) return;
        modal.confirm({
            title: 'Are you sure?',
            content: 'This will delete the goods receipt and all its lines. This action cannot be undone.',
            okText: 'Yes, delete it',
            okType: 'danger',
            onOk: async () => {
                try {
                    const { error } = await supabase.from('goods_receipts').delete().eq('id', id);
                    if (error) throw error;
                    notification.success({ message: 'Goods Receipt deleted successfully' });
                    navigate('/operations/gr');
                } catch (error: any) {
                    notification.error({ message: 'Failed to delete', description: error.message });
                }
            },
        });
    };

    const lineColumns = [
        { title: 'Status', key: 'status', width: '8%', render: (record: LineWithDetails) => (
            <Tag color={record.actual_qty === record.expected_qty ? 'green' : (record.actual_qty || 0) > 0 ? 'orange' : 'default'}>
                {record.actual_qty === record.expected_qty ? 'Received' : (record.actual_qty || 0) > 0 ? 'Partial' : 'Pending'}
            </Tag>
        )},
        { title: 'Goods Model', dataIndex: ['goods_model', 'name'], key: 'goods_model', render: (text: string, record: LineWithDetails) => (
            <div>
                <Text strong>{text}</Text><br/>
                <Text type="secondary">{record.goods_model?.code}</Text>
            </div>
        )},
        { title: 'Location', dataIndex: ['locations', 'code'], key: 'location' },
        { title: 'Tracking', dataIndex: ['goods_model', 'tracking_type'], key: 'tracking_type', render: (type: string) => <Tag>{type}</Tag> },
        { title: 'UoM', dataIndex: ['goods_model', 'base_uom', 'name'], key: 'uom' },
        { title: 'Expected', dataIndex: 'expected_qty', key: 'expected_qty', align: 'right' as const },
        { title: 'Received', dataIndex: 'actual_qty', key: 'actual_qty', align: 'right' as const, render: (qty: number | null) => qty || 0 },
        { title: 'Diff', key: 'diff', align: 'right' as const, render: (_:any, record: LineWithDetails) => record.expected_qty - (record.actual_qty || 0) },
    ];
    
    if (loading) return <div className="flex justify-center items-center h-full"><Spin size="large" /></div>;
    if (error) return <Alert message="Error" description={error} type="error" showIcon />;
    if (!goodsReceipt) return <Alert message="Not Found" description="The requested goods receipt could not be found." type="warning" showIcon />;

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Title level={2} style={{ marginBottom: 0 }}>
                       Goods Receipt Detail
                    </Title>
                    <Text type="secondary">Details for this goods receipt</Text>
                </div>
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => navigate(`/operations/gr/${id}/edit`)}>Edit</Button>
                    <Button icon={<DeleteOutlined />} danger onClick={handleDelete}>Delete</Button>
                    <Button icon={<RollbackOutlined />} onClick={() => navigate('/operations/gr')}>Back to List</Button>
                </Space>
            </div>

            <Row gutter={24}>
                <Col span={16}>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <Card title="Information">
                             <Descriptions bordered size="small" column={2}>
                                <Descriptions.Item label="GR Number">{goodsReceipt.reference_number || `GR-${goodsReceipt.id}`}</Descriptions.Item>
                                <Descriptions.Item label="Transaction Type"><TransactionTypeTag type={goodsReceipt.transaction_type} /></Descriptions.Item>
                                <Descriptions.Item label="Warehouse">{goodsReceipt.warehouse?.name}</Descriptions.Item>
                                <Descriptions.Item label="Partner">{goodsReceipt.partner_name || 'N/A'}</Descriptions.Item>
                                <Descriptions.Item label="Partner Ref.">{goodsReceipt.partner_reference || 'N/A'}</Descriptions.Item>
                                <Descriptions.Item label="Notes" span={2}>{goodsReceipt.notes || '-'}</Descriptions.Item>
                                <Descriptions.Item label="Created At">{format(new Date(goodsReceipt.created_at), 'dd MMM yyyy, h:mm a')}</Descriptions.Item>
                                <Descriptions.Item label="Created By">{getUserDisplayName(goodsReceipt.created_by_user)}</Descriptions.Item>
                                <Descriptions.Item label="Last Updated At">{goodsReceipt.updated_at ? format(new Date(goodsReceipt.updated_at), 'dd MMM yyyy, h:mm a') : '-'}</Descriptions.Item>
                                <Descriptions.Item label="Last Updated By">{getUserDisplayName(goodsReceipt.updated_by_user)}</Descriptions.Item>
                            </Descriptions>
                        </Card>
                        <Card title="Line Items Summary">
                            <Table
                                columns={lineColumns}
                                dataSource={goodsReceipt.gr_lines}
                                rowKey="id"
                                pagination={false}
                                size="small"
                            />
                        </Card>
                    </Space>
                </Col>

                <Col span={8}>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <Card title="Status Timeline">
                            {statusHistory.length > 0 ? (
                                <Timeline>
                                    {statusHistory.map((item, index) => (
                                        <Timeline.Item key={item.id} color={index === 0 ? STATUS_COLOR_MAP[goodsReceipt.status] : 'gray'}>
                                            <p className="font-semibold">{item.to_status.replace('_', ' ')}</p>
                                            <p className="text-xs text-gray-500">
                                                <UserOutlined className="mr-1" />
                                                {getUserDisplayName(item.changed_by_user)}
                                            </p>
                                            <p className="text-xs text-gray-500">{format(new Date(item.changed_at), 'dd MMM yyyy, h:mm a')}</p>
                                        </Timeline.Item>
                                    ))}
                                </Timeline>
                            ) : (
                                <Timeline>
                                    <Timeline.Item color={STATUS_COLOR_MAP[goodsReceipt.status]}>
                                        <p className="font-semibold">{goodsReceipt.status.replace('_', ' ')}</p>
                                        <p className="text-xs text-gray-500">
                                            <UserOutlined className="mr-1" />
                                            {getUserDisplayName(goodsReceipt.created_by_user)}
                                        </p>
                                        <p className="text-xs text-gray-500">{format(new Date(goodsReceipt.created_at), 'dd MMM yyyy, h:mm a')}</p>
                                    </Timeline.Item>
                                </Timeline>
                            )}
                        </Card>
                         <Card title="Warehouse Info" >
                            <Title level={5}><ShopOutlined className="mr-2" />{goodsReceipt.warehouse?.name}</Title>
                            <Paragraph>{goodsReceipt.warehouse?.address || 'No address specified'}</Paragraph>
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="Manager">{goodsReceipt.warehouse?.manager_name || 'N/A'}</Descriptions.Item>
                                <Descriptions.Item label="Phone">{goodsReceipt.warehouse?.phone || 'N/A'}</Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </Space>
                </Col>
            </Row>
        </>
    );
};

const GRViewPageWrapper: React.FC = () => (
    <App><GRViewPage /></App>
);

export default GRViewPageWrapper;
