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
type GTHeader = Database['transactions']['Tables']['gt_header']['Row'];
type GTLine = Database['transactions']['Tables']['gt_lines']['Row'];
type GoodsModel = Database['master']['Tables']['goods_models']['Row'];
type Uom = Database['master']['Tables']['uoms']['Row'];
type Warehouse = Database['master']['Tables']['warehouses']['Row'];
type UserProfile = { full_name: string | null };

interface EnrichedGTLine extends GTLine {
    goods_models: Pick<GoodsModel, 'code' | 'name' | 'tracking_type'> & { uoms: Pick<Uom, 'name'> | null };
}

interface EnrichedGTHeader extends GTHeader {
    gt_lines: EnrichedGTLine[];
    from_warehouse: Pick<Warehouse, 'name'> | null;
    to_warehouse: Pick<Warehouse, 'name'> | null;
    created_by_user: UserProfile | null;
    confirmed_by_user: UserProfile | null;
    completed_by_user: UserProfile | null;
}

const getStatusColor = (status: GTHeader['status']) => {
  switch (status) {
    case 'DRAFT': return 'default';
    case 'CREATED': return 'processing';
    case 'IN_PROGRESS': return 'blue';
    case 'IN_TRANSIT': return 'purple';
    case 'RECEIVING': return 'orange';
    case 'COMPLETED': return 'success';
    case 'CANCELLED': return 'error';
    default: return 'default';
  }
};

const GTViewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification, modal } = App.useApp();

    const [gtData, setGtData] = useState<EnrichedGTHeader | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await transactionsClient
                .from('gt_header')
                .select(`
                    *,
                    from_warehouse:warehouses!gt_header_from_warehouse_id_fkey(name),
                    to_warehouse:warehouses!gt_header_to_warehouse_id_fkey(name),
                    created_by_user:created_by(full_name),
                    confirmed_by_user:confirmed_by(full_name),
                    completed_by_user:completed_by(full_name),
                    gt_lines (
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
            
            setGtData(data as any);

        } catch (err: any) {
            setError(err.message);
            notification.error({ message: "Failed to load Goods Transfer", description: err.message });
        } finally {
            setLoading(false);
        }
    }, [id, notification]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCompleteAction = async () => {
        modal.confirm({
            title: 'Acknowledge and Complete Transfer?',
            icon: <ExclamationCircleOutlined />,
            content: 'This will confirm that you have received all items and complete the transfer. This action cannot be undone.',
            onOk: async () => {
                setLoading(true);
                try {
                    const { error: rpcError } = await supabase.rpc('gt_complete', { p_gt_header_id: id });
                    if (rpcError) throw rpcError;
                    notification.success({ message: `Transfer completed successfully.` });
                    await fetchData();
                } catch (err: any) {
                    notification.error({ message: 'Action Failed', description: err.message });
                } finally {
                    setLoading(false);
                }
            },
        });
    };
    
    const lineColumns = [
        { title: 'Item Code', dataIndex: ['goods_models', 'code'], key: 'itemCode' },
        { title: 'Item Name', dataIndex: ['goods_models', 'name'], key: 'itemName' },
        { title: 'UoM', key: 'uom', render: (_:any, record: EnrichedGTLine) => record.goods_models.uoms?.name || 'N/A' },
        { title: 'Qty to Transfer', dataIndex: 'quantity', key: 'quantity' },
        { title: 'Qty Transferred', dataIndex: 'quantity_transferred', key: 'quantity_transferred', render: (val: number | null) => <Tag color="green">{val || 0}</Tag> },
    ];

    if (loading && !gtData) return <div className="flex justify-center items-center h-full"><Spin size="large" /></div>;
    if (error) return <Alert message="Error" description={error} type="error" showIcon />;
    if (!gtData) return <Alert message="Not Found" description="The requested Goods Transfer could not be found." type="warning" />;

    return (
        <Spin spinning={loading}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/operations/gt')}>Back to List</Button>
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={18}>
                        <Card>
                            <Descriptions bordered column={2} title={`Goods Transfer: ${gtData.code}`}>
                                <Descriptions.Item label="Status"><Tag color={getStatusColor(gtData.status)}>{gtData.status}</Tag></Descriptions.Item>
                                <Descriptions.Item label="Document Date">{dayjs(gtData.document_date).format('YYYY-MM-DD')}</Descriptions.Item>
                                <Descriptions.Item label="From Warehouse">{gtData.from_warehouse?.name}</Descriptions.Item>
                                <Descriptions.Item label="To Warehouse">{gtData.to_warehouse?.name}</Descriptions.Item>
                                <Descriptions.Item label="Carrier">{gtData.carrier_name || 'N/A'}</Descriptions.Item>
                                <Descriptions.Item label="Vehicle Number">{gtData.vehicle_number || 'N/A'}</Descriptions.Item>
                                <Descriptions.Item label="Notes" span={2}>{gtData.notes || 'N/A'}</Descriptions.Item>
                            </Descriptions>
                        </Card>
                        <Card title="Items" style={{ marginTop: 16 }}>
                            <Table dataSource={gtData.gt_lines} columns={lineColumns} rowKey="id" size="small" pagination={false} bordered />
                        </Card>
                    </Col>
                    <Col xs={24} lg={6}>
                        <Card title="Actions" style={{ marginBottom: 16 }}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                {(gtData.status === 'IN_TRANSIT' || gtData.status === 'RECEIVING') && 
                                    <Button type="primary" block onClick={handleCompleteAction}>
                                        Acknowledge &amp; Complete
                                    </Button>
                                }
                                <Button block>Print Transfer Note</Button>
                            </Space>
                        </Card>
                        <Card title="History">
                           <Timeline>
                                <Timeline.Item dot={<CheckCircleOutlined />} color="green">Created by {gtData.created_by_user?.full_name || 'System'} on {dayjs(gtData.created_at).format('YYYY-MM-DD HH:mm')}</Timeline.Item>
                                {gtData.confirmed_at && <Timeline.Item dot={<SyncOutlined />} color="blue">Confirmed by {gtData.confirmed_by_user?.full_name || 'System'} on {dayjs(gtData.confirmed_at).format('YYYY-MM-DD HH:mm')}</Timeline.Item>}
                                {gtData.completed_at && <Timeline.Item dot={<CheckCircleOutlined />} color="green">Completed by {gtData.completed_by_user?.full_name || 'System'} on {dayjs(gtData.completed_at).format('YYYY-MM-DD HH:mm')}</Timeline.Item>}
                           </Timeline>
                        </Card>
                    </Col>
                </Row>
            </Space>
        </Spin>
    );
};

const GTViewPageWrapper: React.FC = () => (
    <App><GTViewPage /></App>
);

export default GTViewPageWrapper;