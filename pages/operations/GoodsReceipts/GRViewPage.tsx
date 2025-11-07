import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { 
    GoodsReceipt, 
    GRLine, 
    Warehouse,
    TransactionStatusHistory,
    Database
} from '../../../types/supabase';
import {
    Button, Card, Row, Col, Typography, Space, App, Spin, Descriptions, Tag, Alert, Table, Timeline
} from 'antd';
import { 
    RollbackOutlined,
    ShopOutlined,
    UserOutlined,
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { format } from 'date-fns';
import PageHeader from '../../../components/layout/PageHeader';

const { Text, Title, Paragraph } = Typography;

// --- Type Definitions for Detailed View ---
type LineWithDetails = GRLine & {
    goods_model: {
        code: string;
        name: string;
        uoms: { name: string } | null;
    } | null;
};

type GRViewData = GoodsReceipt & {
    warehouses: Warehouse | null;
    gr_lines: LineWithDetails[];
};

// --- Status & Color Mapping ---
const STATUS_COLOR_MAP: Record<Database['public']['Enums']['gr_status_enum'], string> = {
    DRAFT: 'gold',
    CREATED: 'blue',
    RECEIVING: 'orange',
    PARTIAL_RECEIVED: 'purple',
    APPROVED: 'cyan',
    COMPLETED: 'green',
};

const getUserDisplayName = (user: {full_name?: string | null, email?: string | null} | null) => {
    if (!user) return 'System';
    return user.full_name || user.email?.split('@')[0] || 'Unknown User';
}

const GRViewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification, modal } = App.useApp();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [goodsReceipt, setGoodsReceipt] = useState<GRViewData | null>(null);
    const [statusHistory, setStatusHistory] = useState<(TransactionStatusHistory & { user: {id: string, full_name: string} | null })[]>([]);

    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const grPromise = supabase
                .from('goods_receipts')
                .select(`*, warehouses!inner(*), gr_lines(*, goods_model:goods_models(code, name, uoms(name)))`)
                .eq('id', id)
                .single();
            
            const historyPromise = supabase
                .from('transaction_status_history')
                .select('*, user:users(id, full_name)')
                .eq('transaction_id', id)
                .eq('transaction_type', 'GR')
                .order('changed_at', { ascending: false });

            const [{ data: grData, error: grError }, { data: historyData, error: historyError }] = await Promise.all([grPromise, historyPromise]);
    
            if (grError) throw grError;
            if (historyError) throw historyError;
            if (!grData) throw new Error("Goods Receipt not found");

            setGoodsReceipt(grData as any);
            setStatusHistory(historyData as any);
    
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
        { title: 'No.', dataIndex: 'index', render: (_:any, __:any, index: number) => index + 1, width: 50 },
        { title: 'Goods Model', dataIndex: ['goods_model', 'name'], key: 'goods_model', render: (text: string, record: LineWithDetails) => (
            <div>
                <Text strong>{text}</Text><br/>
                <Text type="secondary">{record.goods_model?.code}</Text>
            </div>
        )},
        { title: 'UoM', dataIndex: ['goods_model', 'uoms', 'name'], key: 'uom' },
        { title: 'Planned', dataIndex: 'quantity_planned', key: 'quantity_planned', align: 'right' as const },
        { title: 'Received', dataIndex: 'quantity_received', key: 'quantity_received', align: 'right' as const, render: (qty: number | null) => qty || 0 },
        { title: 'Diff', key: 'diff', align: 'right' as const, render: (_:any, record: LineWithDetails) => <Text type={ (record.quantity_planned - (record.quantity_received || 0)) !== 0 ? 'danger' : undefined }>{record.quantity_planned - (record.quantity_received || 0)}</Text> },
    ];
    
    if (loading) return <div className="flex justify-center items-center h-full"><Spin size="large" /></div>;
    if (error) return <Alert message="Error" description={error} type="error" showIcon />;
    if (!goodsReceipt) return <Alert message="Not Found" description="The requested goods receipt could not be found." type="warning" showIcon />;
    
    const pageActions = (
        <Space>
            <Button icon={<RollbackOutlined />} onClick={() => navigate('/operations/gr')}>Back to List</Button>
            <Button icon={<EditOutlined />} onClick={() => navigate(`/operations/gr/${id}/edit`)} disabled={goodsReceipt.status !== 'DRAFT'}>Edit</Button>
            <Button icon={<DeleteOutlined />} danger onClick={handleDelete} disabled={goodsReceipt.status !== 'DRAFT'}>Delete</Button>
        </Space>
    );

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <PageHeader
                title={goodsReceipt.reference_number || `GR-${goodsReceipt.id}`}
                description="Details for this goods receipt."
                actions={pageActions}
            />
            
            <Row gutter={24}>
                <Col span={16}>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <Card>
                             <Descriptions bordered size="small" column={2}>
                                <Descriptions.Item label="Reference Number">{goodsReceipt?.reference_number}</Descriptions.Item>
                                <Descriptions.Item label="Partner">{goodsReceipt?.partner_name || 'N/A'}</Descriptions.Item>
                                <Descriptions.Item label="Receipt Date">{goodsReceipt.receipt_date ? format(new Date(goodsReceipt.receipt_date), 'dd MMM yyyy') : 'N/A'}</Descriptions.Item>
                                <Descriptions.Item label="Status"><Tag color={STATUS_COLOR_MAP[goodsReceipt.status]}>{goodsReceipt.status.replace('_', ' ')}</Tag></Descriptions.Item>
                                <Descriptions.Item label="Notes" span={2}>{goodsReceipt.notes || '-'}</Descriptions.Item>
                            </Descriptions>
                        </Card>
                        <Card title="Line Items Summary">
                            <Table columns={lineColumns} dataSource={goodsReceipt.gr_lines} rowKey="id" pagination={false} size="small"/>
                        </Card>
                    </Space>
                </Col>

                <Col span={8}>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <Card title="History Timeline" size="small">
                            <Timeline>
                                {statusHistory.map((item, index) => (
                                     <Timeline.Item key={item.id} color={index === 0 ? STATUS_COLOR_MAP[item.to_status as keyof typeof STATUS_COLOR_MAP] : 'gray'}>
                                        <p className="font-semibold">{item.to_status.replace('_', ' ')}</p>
                                        <p className="text-xs text-gray-500"><UserOutlined className="mr-1" />{getUserDisplayName(item.user)}</p>
                                        <p className="text-xs text-gray-500">{format(new Date(item.changed_at), 'dd MMM yyyy, h:mm a')}</p>
                                    </Timeline.Item>
                                ))}
                                 <Timeline.Item color="gray">
                                    <p className="font-semibold">Created</p>
                                    <p className="text-xs text-gray-500">{format(new Date(goodsReceipt.created_at), 'dd MMM yyyy, h:mm a')}</p>
                                </Timeline.Item>
                            </Timeline>
                        </Card>
                         <Card title="Warehouse Info" size="small">
                            <Title level={5} style={{marginTop: 0}}><ShopOutlined className="mr-2" />{goodsReceipt.warehouses?.name}</Title>
                            <Paragraph>{goodsReceipt.warehouses?.address || 'No address specified'}</Paragraph>
                        </Card>
                    </Space>
                </Col>
            </Row>
        </Space>
    );
};

const GRViewPageWrapper: React.FC = () => (
    <App><GRViewPage /></App>
);

export default GRViewPageWrapper;