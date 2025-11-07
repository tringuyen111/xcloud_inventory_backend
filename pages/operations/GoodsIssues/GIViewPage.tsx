

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { 
    GoodsIssue, 
    GILine,
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
type LineWithDetails = GILine & {
    goods_model: {
        code: string;
        name: string;
        uoms: { name: string } | null;
    } | null;
};

type GIViewData = GoodsIssue & {
    warehouses: Warehouse | null;
    to_warehouse: Warehouse | null;
    gi_lines: LineWithDetails[];
};

// --- Status & Color Mapping ---
const STATUS_COLOR_MAP: Record<Database['public']['Enums']['gi_status_enum'], string> = {
    DRAFT: 'gold',
    CREATED: 'blue',
    PICKING: 'orange',
    PICKED: 'purple',
    COMPLETED: 'green',
    CANCELLED: 'red',
};

const getUserDisplayName = (user: {full_name?: string | null, email?: string | null} | null) => {
    if (!user) return 'System';
    return user.full_name || user.email?.split('@')[0] || 'Unknown User';
}

const GIViewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification, modal } = App.useApp();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [goodsIssue, setGoodsIssue] = useState<GIViewData | null>(null);
    const [statusHistory, setStatusHistory] = useState<(TransactionStatusHistory & { user: {id: string, full_name: string} | null })[]>([]);

    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const giPromise = supabase
                .from('goods_issues')
                .select(`*, 
                    warehouses!goods_issues_warehouse_id_fkey(*), 
                    to_warehouse:warehouses!warehouse_to_id(*), 
                    gi_lines(*, goods_model:goods_models(code, name, uoms(name)))
                `)
                .eq('id', id)
                .single();
            
            const historyPromise = supabase
                .from('transaction_status_history')
                .select('*, user:users(id, full_name)')
                .eq('transaction_id', id)
                .eq('transaction_type', 'GI')
                .order('changed_at', { ascending: false });

            const [{ data: giData, error: giError }, { data: historyData, error: historyError }] = await Promise.all([giPromise, historyPromise]);
    
            if (giError) throw giError;
            if (historyError) throw historyError;
            if (!giData) throw new Error("Goods Issue not found");

            setGoodsIssue(giData as any);
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
          content: 'This will delete the goods issue and all its lines. This action cannot be undone.',
          okText: 'Yes, delete it',
          okType: 'danger',
          onOk: async () => {
              try {
                  const { error } = await supabase.from('goods_issues').delete().eq('id', id);
                  if (error) throw error;
                  notification.success({ message: 'Goods Issue deleted successfully' });
                  navigate('/operations/gi');
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
        { title: 'Picked', dataIndex: 'quantity_picked', key: 'quantity_picked', align: 'right' as const, render: (qty: number | null) => qty || 0 },
        // FIX: Use `quantity_picked` instead of `quantity_received` for correct calculation.
        { title: 'Diff', key: 'diff', align: 'right' as const, render: (_:any, record: LineWithDetails) => <Text type={ (record.quantity_planned - (record.quantity_picked || 0)) !== 0 ? 'danger' : undefined }>{record.quantity_planned - (record.quantity_picked || 0)}</Text> },
    ];
    
    if (loading) return <div className="flex justify-center items-center h-full"><Spin size="large" /></div>;
    if (error) return <Alert message="Error" description={error} type="error" showIcon />;
    if (!goodsIssue) return <Alert message="Not Found" description="The requested goods issue could not be found." type="warning" showIcon />;
    
    const pageActions = (
        <Space>
            <Button icon={<RollbackOutlined />} onClick={() => navigate('/operations/gi')}>Back to List</Button>
            <Button icon={<EditOutlined />} onClick={() => navigate(`/operations/gi/${id}/edit`)} disabled={goodsIssue.status !== 'DRAFT'}>Edit</Button>
            <Button icon={<DeleteOutlined />} danger onClick={handleDelete} disabled={goodsIssue.status !== 'DRAFT'}>Delete</Button>
        </Space>
    );

    const getDestination = () => {
        if (goodsIssue.transaction_type === 'TRANSFER_OUT') return `Warehouse: ${goodsIssue.to_warehouse?.name}`;
        return `Partner: ${goodsIssue.partner_name || 'N/A'}`;
    };

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <PageHeader
                title={goodsIssue.reference_number || `GI-${goodsIssue.id}`}
                description="Details for this goods issue."
                actions={
                     <Space>
                        <Button icon={<RollbackOutlined />} onClick={() => navigate('/operations/gi')}>Back to List</Button>
                        <Button icon={<EditOutlined />} onClick={() => navigate(`/operations/gi/${id}/edit`)} disabled={goodsIssue.status !== 'DRAFT'}>Edit</Button>
                        <Button icon={<DeleteOutlined />} danger onClick={handleDelete} disabled={goodsIssue.status !== 'DRAFT'}>Delete</Button>
                    </Space>
                }
            />
            
            <Row gutter={24}>
                <Col span={16}>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <Card>
                             <Descriptions bordered size="small" column={2}>
                                <Descriptions.Item label="Reference Number">{goodsIssue.reference_number}</Descriptions.Item>
                                <Descriptions.Item label="Destination">{getDestination()}</Descriptions.Item>
                                <Descriptions.Item label="Issue Date">{goodsIssue.issue_date ? format(new Date(goodsIssue.issue_date), 'dd MMM yyyy') : 'N/A'}</Descriptions.Item>
                                <Descriptions.Item label="Status"><Tag color={STATUS_COLOR_MAP[goodsIssue.status]}>{goodsIssue.status.replace('_', ' ')}</Tag></Descriptions.Item>
                                <Descriptions.Item label="Issue Mode"><Tag>{goodsIssue.issue_mode}</Tag></Descriptions.Item>
                                <Descriptions.Item label="Transaction Type"><Tag>{goodsIssue.transaction_type.replace(/_/g, ' ')}</Tag></Descriptions.Item>
                                <Descriptions.Item label="Notes" span={2}>{goodsIssue.notes || '-'}</Descriptions.Item>
                            </Descriptions>
                        </Card>
                        <Card title="Line Items Summary">
                            <Table columns={lineColumns} dataSource={goodsIssue.gi_lines} rowKey="id" pagination={false} size="small"/>
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
                                    <p className="text-xs text-gray-500">{format(new Date(goodsIssue.created_at), 'dd MMM yyyy, h:mm a')}</p>
                                </Timeline.Item>
                            </Timeline>
                        </Card>
                         <Card title="Warehouse Info" size="small">
                            <Title level={5} style={{marginTop: 0}}><ShopOutlined className="mr-2" />{goodsIssue.warehouses?.name}</Title>
                            <Paragraph>{goodsIssue.warehouses?.address || 'No address specified'}</Paragraph>
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