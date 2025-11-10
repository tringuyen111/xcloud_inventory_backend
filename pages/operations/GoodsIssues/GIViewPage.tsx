import React, { useEffect, useState, useCallback } from 'react';
import {
    App, Button, Card, Col, Descriptions, Row, Spin, Table, Tag, Timeline, Alert, Space, Modal
} from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { transactionsClient, supabase } from '../../../lib/supabase';
import { Database } from '../../../types/supabase';
import dayjs from 'dayjs';
import { ArrowLeftOutlined, CheckCircleOutlined, SyncOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

// Type definitions
type GIHeader = Database['transactions']['Tables']['gi_header']['Row'];
type GILine = Database['transactions']['Tables']['gi_lines']['Row'];
type GoodsModel = Database['master']['Tables']['goods_models']['Row'];
type Uom = Database['master']['Tables']['uoms']['Row'];
type Partner = Database['master']['Tables']['partners']['Row'];
type Warehouse = Database['master']['Tables']['warehouses']['Row'];
type UserProfile = { full_name: string | null };

interface EnrichedGILine extends GILine {
    goods_models: Pick<GoodsModel, 'code' | 'name' | 'tracking_type'> & { uoms: Pick<Uom, 'name'> | null };
}

interface EnrichedGIHeader extends GIHeader {
    gi_lines: EnrichedGILine[];
    partners: Pick<Partner, 'name'> | null;
    warehouses: Pick<Warehouse, 'name'> | null;
    created_by_user: UserProfile | null;
    approved_by_user: UserProfile | null;
    started_by_user: UserProfile | null;
    completed_by_user: UserProfile | null;
    cancelled_by_user: UserProfile | null;
}

const getStatusColor = (status: GIHeader['status']) => {
  switch (status) {
    case 'DRAFT': return 'default';
    case 'CREATED': return 'processing';
    case 'PICKING': return 'blue';
    case 'PICKED': return 'purple';
    case 'WAITING_FOR_APPROVAL': return 'warning';
    case 'COMPLETED': return 'success';
    case 'CANCELLED': return 'error';
    default: return 'default';
  }
};

const GIViewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification, modal } = App.useApp();

    const [giData, setGiData] = useState<EnrichedGIHeader | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await transactionsClient
                .from('gi_header')
                .select(`
                    *,
                    partners ( name ),
                    warehouses ( name ),
                    created_by_user:created_by(full_name),
                    approved_by_user:approved_by(full_name),
                    started_by_user:started_by(full_name),
                    completed_by_user:completed_by(full_name),
                    cancelled_by_user:cancelled_by(full_name),
                    gi_lines (
                      *,
                      goods_models (
                        code,
                        name,
                        tracking_type,
                        uoms ( name )
                      )
                    )
                `)
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;
            
            setGiData(data as any);

        } catch (err: any) {
            setError(err.message);
            notification.error({ message: "Failed to load Goods Issue", description: err.message });
        } finally {
            setLoading(false);
        }
    }, [id, notification]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAction = async (rpcName: 'gi_complete' | 'gi_cancel', params: any, confirmation: { title: string, content: string }) => {
        modal.confirm({
            title: confirmation.title,
            icon: <ExclamationCircleOutlined />,
            content: confirmation.content,
            onOk: async () => {
                setLoading(true);
                try {
                    const { error: rpcError } = await supabase.rpc(rpcName, params);
                    if (rpcError) throw rpcError;
                    notification.success({ message: `Action executed successfully.` });
                    await fetchData(); // Refresh data to show new state
                } catch (err: any) {
                    notification.error({ message: 'Action Failed', description: err.message });
                } finally {
                    setLoading(false);
                }
            },
            onCancel() {},
        });
    };
    
    const lineColumns = [
        { title: 'Item Code', dataIndex: ['goods_models', 'code'], key: 'itemCode' },
        { title: 'Item Name', dataIndex: ['goods_models', 'name'], key: 'itemName' },
        { title: 'UoM', key: 'uom', render: (_:any, record: EnrichedGILine) => record.goods_models.uoms?.name || 'N/A' },
        { title: 'Qty Requested', dataIndex: 'quantity_requested', key: 'qtyRequested' },
        { title: 'Qty Issued', dataIndex: 'quantity_issued', key: 'qtyIssued', render: (val: number) => <Tag color="green">{val}</Tag> },
        { title: 'Qty Remaining', key: 'qtyRemaining', render: (_: any, record: EnrichedGILine) => {
            const remaining = record.quantity_requested - record.quantity_issued;
            return <Tag color={remaining > 0 ? "orange" : "default"}>{remaining}</Tag>;
        }},
    ];

    if (loading && !giData) return <div className="flex justify-center items-center h-full"><Spin size="large" /></div>;
    if (error) return <Alert message="Error" description={error} type="error" showIcon />;
    if (!giData) return <Alert message="Not Found" description="The requested Goods Issue could not be found." type="warning" />;

    return (
        <Spin spinning={loading}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/operations/gi')}>Back to List</Button>
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={18}>
                        <Card>
                            <Descriptions bordered column={2} title={`Goods Issue: ${giData.code}`}>
                                <Descriptions.Item label="Status"><Tag color={getStatusColor(giData.status)}>{giData.status}</Tag></Descriptions.Item>
                                <Descriptions.Item label="Warehouse">{giData.warehouses?.name}</Descriptions.Item>
                                <Descriptions.Item label="Customer">{giData.partners?.name || 'N/A'}</Descriptions.Item>
                                <Descriptions.Item label="Sales Order">{giData.sales_order_number || 'N/A'}</Descriptions.Item>
                                <Descriptions.Item label="Document Date">{dayjs(giData.document_date).format('YYYY-MM-DD')}</Descriptions.Item>
                                <Descriptions.Item label="Expected Date">{giData.expected_date ? dayjs(giData.expected_date).format('YYYY-MM-DD') : 'N/A'}</Descriptions.Item>
                                <Descriptions.Item label="Notes" span={2}>{giData.notes || 'N/A'}</Descriptions.Item>
                            </Descriptions>
                        </Card>
                        <Card title="Items" style={{ marginTop: 16 }}>
                            <Table dataSource={giData.gi_lines} columns={lineColumns} rowKey="id" size="small" pagination={false} />
                        </Card>
                    </Col>
                    <Col xs={24} lg={6}>
                        <Card title="Actions" style={{ marginBottom: 16 }}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                {giData.status === 'WAITING_FOR_APPROVAL' && 
                                    <Button type="primary" block onClick={() => handleAction('gi_complete', { p_gi_header_id: id }, {
                                        title: 'Approve Completion?',
                                        content: 'This will complete the goods issue despite the quantity discrepancy. This action cannot be undone.'
                                    })}>
                                        Approve Completion
                                    </Button>
                                }
                                {(giData.status === 'DRAFT' || giData.status === 'CREATED') && 
                                    <Button danger block onClick={() => handleAction('gi_cancel', { p_gi_header_id: id, p_cancellation_reason: 'Cancelled by manager' }, {
                                        title: 'Cancel this Goods Issue?',
                                        content: 'This will cancel the goods issue and release any reserved stock. This action cannot be undone.'
                                    })}>
                                        Cancel Issue
                                    </Button>
                                }
                                <Button block>Print Delivery Note</Button>
                            </Space>
                        </Card>
                        <Card title="History">
                           <Timeline>
                                <Timeline.Item dot={<CheckCircleOutlined />} color="green">Created by {giData.created_by_user?.full_name || 'System'} on {dayjs(giData.created_at).format('YYYY-MM-DD HH:mm')}</Timeline.Item>
                                {giData.started_at && <Timeline.Item dot={<SyncOutlined spin />} color="blue">Picking started by {giData.started_by_user?.full_name || 'System'} on {dayjs(giData.started_at).format('YYYY-MM-DD HH:mm')}</Timeline.Item>}
                                {giData.approved_at && <Timeline.Item dot={<CheckCircleOutlined />} color="purple">Approved by {giData.approved_by_user?.full_name || 'System'} on {dayjs(giData.approved_at).format('YYYY-MM-DD HH:mm')}</Timeline.Item>}
                                {giData.completed_at && <Timeline.Item dot={<CheckCircleOutlined />} color="green">Completed by {giData.completed_by_user?.full_name || 'System'} on {dayjs(giData.completed_at).format('YYYY-MM-DD HH:mm')}</Timeline.Item>}
                                {giData.cancelled_at && <Timeline.Item dot={<CloseCircleOutlined />} color="red">Cancelled by {giData.cancelled_by_user?.full_name || 'System'} on {dayjs(giData.cancelled_at).format('YYYY-MM-DD HH:mm')}</Timeline.Item>}
                            </Timeline>
                        </Card>
                    </Col>
                </Row>
            </Space>
        </Spin>
    );
};

const GIViewPageWrapper: React.FC = () => (
    <App><GIViewPage /></App>
);

export default GIViewPageWrapper;