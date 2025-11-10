import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    App, Button, Card, Col, Descriptions, Form, Input, InputNumber, Modal, Row, Spin, Table, Tag, Timeline, Alert, Space, Checkbox, Tooltip
} from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { transactionsClient, supabase } from '../../../lib/supabase';
import { Database } from '../../../types/supabase';
import dayjs from 'dayjs';
import { ArrowLeftOutlined, CheckCircleOutlined, SyncOutlined, CloseCircleOutlined, ExclamationCircleOutlined, SaveOutlined } from '@ant-design/icons';

// Type definitions
type ICHeader = Database['transactions']['Tables']['ic_header']['Row'];
type ICLine = Database['transactions']['Tables']['ic_lines']['Row'];
type GoodsModel = Database['master']['Tables']['goods_models']['Row'];
type Location = Database['master']['Tables']['locations']['Row'];
type Warehouse = Database['master']['Tables']['warehouses']['Row'];
type UserProfile = { full_name: string | null };

interface EnrichedICLine extends ICLine {
    locations: Pick<Location, 'code'> | null;
    goods_models: Pick<GoodsModel, 'code' | 'name'> | null;
}

interface EnrichedICHeader extends ICHeader {
    ic_lines: EnrichedICLine[];
    warehouses: Pick<Warehouse, 'name'> | null;
    created_by_user: UserProfile | null;
    started_by_user: UserProfile | null;
    completed_by_user: UserProfile | null;
}

// Local state for editable lines
type EditableLine = {
    counted_quantity: number | null;
    variance_reason: string | null;
    isSaving?: boolean;
};

const getStatusColor = (status: ICHeader['status']) => {
  switch (status) {
    case 'DRAFT': return 'default';
    case 'CREATED': return 'processing';
    case 'COUNTING': return 'blue';
    case 'COMPLETED': return 'success';
    case 'CANCELLED': return 'error';
    default: return 'default';
  }
};

const ICViewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification, modal } = App.useApp();

    const [icData, setIcData] = useState<EnrichedICHeader | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editableLines, setEditableLines] = useState<Record<string, EditableLine>>({});

    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await transactionsClient
                .from('ic_header')
                .select(`
                    *,
                    warehouses ( name ),
                    created_by_user:created_by(full_name),
                    started_by_user:started_by(full_name),
                    completed_by_user:completed_by(full_name),
                    ic_lines (
                      *,
                      locations ( code ),
                      goods_models ( code, name )
                    )
                `)
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;
            
            setIcData(data as any);
            
            // Initialize editable state
            const initialEditableState: Record<string, EditableLine> = {};
            (data.ic_lines as EnrichedICLine[]).forEach(line => {
                initialEditableState[line.id] = {
                    counted_quantity: line.counted_quantity,
                    variance_reason: line.variance_reason,
                    isSaving: false
                };
            });
            setEditableLines(initialEditableState);

        } catch (err: any) {
            setError(err.message);
            notification.error({ message: "Failed to load Inventory Count", description: err.message });
        } finally {
            setLoading(false);
        }
    }, [id, notification]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleLineChange = (lineId: string, field: keyof EditableLine, value: any) => {
        setEditableLines(prev => ({
            ...prev,
            [lineId]: { ...prev[lineId], [field]: value }
        }));
    };
    
    const handleSaveLine = async (line: EnrichedICLine) => {
        const editedLine = editableLines[line.id];
        setEditableLines(prev => ({ ...prev, [line.id]: { ...prev[line.id], isSaving: true } }));
        try {
            const { error: rpcError } = await supabase.rpc('ic_count_line', {
                p_ic_line_id: line.id,
                p_counted_quantity: editedLine.counted_quantity,
                p_variance_reason: editedLine.variance_reason,
            });
            if (rpcError) throw rpcError;
            notification.success({ message: `Line ${line.line_number} saved.` });
        } catch (err: any) {
            notification.error({ message: 'Failed to save line', description: err.message });
        } finally {
             setEditableLines(prev => ({ ...prev, [line.id]: { ...prev[line.id], isSaving: false } }));
        }
    };

    const handleHeaderAction = async (rpcName: 'ic_start' | 'ic_complete', params: any, confirmation?: { title: string, content: React.ReactNode }) => {
        const performAction = async () => {
            setLoading(true);
            try {
                const { error: rpcError } = await supabase.rpc(rpcName, params);
                if (rpcError) throw rpcError;
                notification.success({ message: 'Action executed successfully.' });
                await fetchData();
            } catch (err: any) {
                notification.error({ message: 'Action Failed', description: err.message });
            } finally {
                setLoading(false);
            }
        };

        if (confirmation) {
             modal.confirm({ ...confirmation, onOk: performAction });
        } else {
            await performAction();
        }
    };
    
    const lineColumns = useMemo(() => [
        { title: 'Line', dataIndex: 'line_number', key: 'line_number', width: 60 },
        { title: 'Location', dataIndex: ['locations', 'code'], key: 'locationCode', width: 120 },
        { title: 'Item', key: 'item', render: (_:any, r: EnrichedICLine) => `${r.goods_models?.name} (${r.goods_models?.code})` },
        { title: 'Lot/Serial', dataIndex: 'lot_number', key: 'lot_number', width: 120, render: (val: any) => val || '-' },
        { title: 'System Qty', dataIndex: 'system_quantity', key: 'system_quantity', width: 120 },
        {
            title: 'Counted Qty',
            key: 'counted_quantity',
            width: 120,
            render: (_: any, record: EnrichedICLine) => (
                <InputNumber
                    value={editableLines[record.id]?.counted_quantity}
                    onChange={(val) => handleLineChange(record.id, 'counted_quantity', val)}
                    disabled={icData?.status !== 'COUNTING'}
                />
            ),
        },
        {
            title: 'Variance',
            key: 'variance',
            width: 100,
            render: (_: any, record: EnrichedICLine) => {
                const variance = (editableLines[record.id]?.counted_quantity ?? 0) - record.system_quantity;
                const color = variance === 0 ? 'default' : variance > 0 ? 'green' : 'red';
                return <Tag color={color}>{variance}</Tag>;
            },
        },
        {
            title: 'Variance Reason',
            key: 'variance_reason',
            render: (_: any, record: EnrichedICLine) => (
                <Input
                    value={editableLines[record.id]?.variance_reason}
                    onChange={(e) => handleLineChange(record.id, 'variance_reason', e.target.value)}
                    disabled={icData?.status !== 'COUNTING'}
                />
            ),
        },
        {
            title: 'Action',
            key: 'action',
            width: 80,
            render: (_: any, record: EnrichedICLine) => (
                <Tooltip title="Save this line">
                    <Button
                        icon={<SaveOutlined />}
                        size="small"
                        onClick={() => handleSaveLine(record)}
                        disabled={icData?.status !== 'COUNTING'}
                        loading={editableLines[record.id]?.isSaving}
                    />
                </Tooltip>
            ),
        },
    ], [editableLines, icData?.status]);

    if (loading && !icData) return <div className="flex justify-center items-center h-full"><Spin size="large" /></div>;
    if (error) return <Alert message="Error" description={error} type="error" showIcon />;
    if (!icData) return <Alert message="Not Found" description="The requested Inventory Count could not be found." type="warning" />;

    const CompletionModalContent = ({ onConfirm }: { onConfirm: (applyAdjustments: boolean) => void }) => {
        const [apply, setApply] = useState(true);
        return (
            <div>
                <p>You are about to complete this inventory count. This action cannot be undone.</p>
                <Checkbox checked={apply} onChange={(e) => setApply(e.target.checked)}>
                    Apply variance as inventory adjustments
                </Checkbox>
            </div>
        );
    };

    const handleCompleteCount = () => {
        let applyAdjustments = true;
        modal.confirm({
            title: 'Complete Inventory Count?',
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <p>This action will finalize the count. This cannot be undone.</p>
                    <Checkbox defaultChecked onChange={(e) => (applyAdjustments = e.target.checked)}>
                       Apply variance as inventory adjustments
                    </Checkbox>
                </div>
            ),
            onOk: () => handleHeaderAction('ic_complete', { p_ic_header_id: id, p_apply_adjustments: applyAdjustments }),
        });
    };

    return (
        <Spin spinning={loading}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/operations/ic')}>Back to List</Button>
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={18}>
                        <Card>
                            <Descriptions bordered column={2} title={`Inventory Count: ${icData.code}`}>
                                <Descriptions.Item label="Status"><Tag color={getStatusColor(icData.status)}>{icData.status}</Tag></Descriptions.Item>
                                <Descriptions.Item label="Warehouse">{icData.warehouses?.name}</Descriptions.Item>
                                <Descriptions.Item label="Count Date">{dayjs(icData.count_date).format('YYYY-MM-DD')}</Descriptions.Item>
                                <Descriptions.Item label="Notes" span={2}>{icData.notes || 'N/A'}</Descriptions.Item>
                            </Descriptions>
                        </Card>
                        <Card title="Count Items" style={{ marginTop: 16 }}>
                            <Table dataSource={icData.ic_lines} columns={lineColumns} rowKey="id" size="small" pagination={{pageSize: 10}} bordered/>
                        </Card>
                    </Col>
                    <Col xs={24} lg={6}>
                        <Card title="Actions" style={{ marginBottom: 16 }}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                {icData.status === 'CREATED' && <Button type="primary" block onClick={() => handleHeaderAction('ic_start', { p_ic_header_id: id })}>Start Count</Button>}
                                {icData.status === 'COUNTING' && <Button type="primary" block onClick={handleCompleteCount}>Complete Count</Button>}
                                <Button block disabled>Print Count Sheet</Button>
                            </Space>
                        </Card>
                        <Card title="History">
                           <Timeline>
                                <Timeline.Item dot={<CheckCircleOutlined />} color="green">Created by {icData.created_by_user?.full_name || 'System'} on {dayjs(icData.created_at).format('YYYY-MM-DD HH:mm')}</Timeline.Item>
                                {icData.started_at && <Timeline.Item dot={<SyncOutlined spin />} color="blue">Count started by {icData.started_by_user?.full_name || 'System'} on {dayjs(icData.started_at).format('YYYY-MM-DD HH:mm')}</Timeline.Item>}
                                {icData.completed_at && <Timeline.Item dot={<CheckCircleOutlined />} color="green">Completed by {icData.completed_by_user?.full_name || 'System'} on {dayjs(icData.completed_at).format('YYYY-MM-DD HH:mm')}</Timeline.Item>}
                            </Timeline>
                        </Card>
                    </Col>
                </Row>
            </Space>
        </Spin>
    );
};

const ICViewPageWrapper: React.FC = () => (
    <App><ICViewPage /></App>
);

export default ICViewPageWrapper;