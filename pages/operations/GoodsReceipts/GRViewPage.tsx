import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../services/supabaseClient';
import { GoodsReceipt, GRLine, Warehouse } from '../../../types/supabase';
import {
    Button, Card, Row, Col, Typography, Space, App, Spin, Descriptions, Tag, Alert, Table, Modal, Tooltip, Steps
} from 'antd';
import { 
    EditOutlined, DeleteOutlined, RollbackOutlined,
    CheckCircleTwoTone, WarningTwoTone, ClockCircleOutlined,
    ShopOutlined
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
        base_uom: { id: number; code: string } | null;
    } | null;
    locations: { id: number; code: string; name: string } | null;
    updated_at: string | null;
    updated_by: string | null;
    updated_by_user?: { full_name: string | null } | null;
};

type UserProfile = { full_name: string | null } | null;

type StatusHistoryItem = {
    id: number;
    from_status: string | null;
    to_status: string;
    changed_at: string;
    changed_by: string | null;
    notes: string | null;
    changed_by_user?: UserProfile;
};

type GRViewData = GoodsReceipt & {
    warehouse: Warehouse | null;
    gr_lines: LineWithDetails[];
    created_by_user: UserProfile;
    updated_by_user: UserProfile;
    completed_by_user: UserProfile;
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

// --- Main View Component ---
const GRViewPageContent: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification, modal } = App.useApp();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [goodsReceipt, setGoodsReceipt] = useState<GRViewData | null>(null);
    const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedLine, setSelectedLine] = useState<LineWithDetails | null>(null);

    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            // Step 1: Fetch GR and History in parallel
            const [grRes, historyRes] = await Promise.all([
                supabase
                    .from('goods_receipts')
                    .select(`
                        *,
                        warehouse:warehouses(*),
                        gr_lines(*,
                            goods_model:goods_models(id, code, name, tracking_type, base_uom:uoms(id, code)),
                            locations!location_id(id, code, name)
                        )
                    `)
                    .eq('id', id)
                    .single(),
                supabase
                    .from('transaction_status_history')
                    .select('id, from_status, to_status, changed_at, changed_by, notes')
                    .eq('transaction_id', id)
                    .eq('transaction_type', 'GR')
                    .order('changed_at', { ascending: true })
            ]);
    
            const { data: grData, error: grError } = grRes;
            const { data: historyData, error: historyError } = historyRes;

            if (grError) throw grError;
            if (historyError) throw historyError;
            if (!grData) throw new Error("Goods Receipt not found");
    
            // Step 2: Collect all unique user IDs
            const userIds = [
                grData.created_by,
                grData.updated_by,
                grData.completed_by
            ];
            (grData.gr_lines as LineWithDetails[]).forEach(line => {
                if (line.updated_by) userIds.push(line.updated_by);
            });
            (historyData || []).forEach(h => {
                if (h.changed_by) userIds.push(h.changed_by);
            });
            
            const uniqueUserIds = [...new Set(userIds.filter((uuid): uuid is string => !!uuid))];
    
            let profilesMap = new Map<string, { full_name: string | null }>();
    
            // Step 3: Fetch profiles for these user IDs if any exist
            if (uniqueUserIds.length > 0) {
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .in('id', uniqueUserIds);
    
                if (profilesError) throw profilesError;
    
                if(profilesData) {
                    profilesMap = new Map(profilesData.map(p => [p.id, { full_name: p.full_name }]));
                }
            }
            
            // Step 4: Combine the data into the final shape
            const combinedData: GRViewData = {
                ...(grData as any),
                created_by_user: grData.created_by ? profilesMap.get(grData.created_by) || null : null,
                updated_by_user: grData.updated_by ? profilesMap.get(grData.updated_by) || null : null,
                completed_by_user: grData.completed_by ? profilesMap.get(grData.completed_by) || null : null,
                gr_lines: (grData.gr_lines as LineWithDetails[]).map(line => ({
                    ...line,
                    updated_by_user: line.updated_by ? profilesMap.get(line.updated_by) || null : null,
                }))
            };
    
            const enrichedHistory = (historyData || []).map(h => ({
                ...h,
                changed_by_user: h.changed_by ? profilesMap.get(h.changed_by) || null : null,
            }));
            
            setGoodsReceipt(combinedData);
            setStatusHistory(enrichedHistory);
    
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

    const handleRowClick = (line: LineWithDetails) => {
        setSelectedLine(line);
        setIsModalVisible(true);
    };

    const getLineStatusIcon = (line: LineWithDetails) => {
        const actual = line.actual_qty ?? 0;
        const expected = line.expected_qty;
        if (actual >= expected) {
            return <Tooltip title="Fully Received"><CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: '18px' }} /></Tooltip>;
        }
        if (actual > 0 && actual < expected) {
            return <Tooltip title="Partially Received"><WarningTwoTone twoToneColor="#faad14" style={{ fontSize: '18px' }} /></Tooltip>;
        }
        return <Tooltip title="Pending Receipt"><ClockCircleOutlined style={{ fontSize: '18px', color: '#8c8c8c' }} /></Tooltip>;
    };

    const lineColumns = [
        { title: 'Status', key: 'status', render: getLineStatusIcon, width: 60, align: 'center' as const },
        { title: 'Goods Model', key: 'goods_model', render: (_:any, r: LineWithDetails) => (
            <div>
                <Text strong>{r.goods_model?.name}</Text><br/>
                <Text type="secondary">{r.goods_model?.code}</Text>
            </div>
        )},
        { title: 'Location', dataIndex: ['locations', 'code'], key: 'location' },
        { title: 'Tracking', dataIndex: ['goods_model', 'tracking_type'], key: 'tracking', render: (type: string) => <Tag>{type}</Tag>},
        { title: 'UoM', dataIndex: ['goods_model', 'base_uom', 'code'], key: 'uom'},
        { title: 'Expected', dataIndex: 'expected_qty', key: 'expected_qty', align: 'right' as const },
        { title: 'Received', dataIndex: 'actual_qty', key: 'actual_qty', align: 'right' as const, render: (qty: number | null) => qty || 0 },
        { title: 'Diff', key: 'diff', align: 'right' as const, render: (_: any, r: LineWithDetails) => (r.expected_qty ?? 0) - (r.actual_qty ?? 0) },
    ];
    
    if (loading) return <div className="flex justify-center items-center h-full"><Spin size="large" /></div>;
    if (error || !goodsReceipt) return <Alert message="Error" description={error || "Goods Receipt not found."} type="error" showIcon />;
    
    const pageActions = (
        <Space>
            <Button icon={<RollbackOutlined />} onClick={() => navigate('/operations/gr')}>Back to List</Button>
            {goodsReceipt.status === 'DRAFT' && <Button icon={<EditOutlined />} onClick={() => navigate(`/operations/gr/${id}/edit`)}>Edit</Button>}
            {goodsReceipt.status === 'DRAFT' && <Button icon={<DeleteOutlined />} danger onClick={handleDelete}>Delete</Button>}
        </Space>
    );

    const renderModalContent = (line: LineWithDetails) => {
        const trackingType = line.goods_model?.tracking_type;
        const diff = (line.expected_qty ?? 0) - (line.actual_qty ?? 0);
        let items = [];

        if (trackingType === 'SERIAL') {
            items.push(
                { key: '1', label: 'Planned Serial', children: line.serial_number || 'N/A' },
                { key: '2', label: 'Status', children: <Tag color={line.actual_qty && line.actual_qty > 0 ? 'success' : 'default'}>{line.actual_qty && line.actual_qty > 0 ? 'Received' : 'Pending'}</Tag> }
            );
        } else if (trackingType === 'LOT') {
            items.push(
                { key: '1', label: 'Lot Number', children: line.lot_number || 'N/A' },
                { key: '2', label: 'Expiry Date', children: line.expiry_date ? format(new Date(line.expiry_date), 'PP') : 'N/A' },
                { key: '3', label: 'Expected Qty', children: line.expected_qty },
                { key: '4', label: 'Received Qty', children: line.actual_qty ?? 0 },
                { key: '5', label: 'Difference', children: diff }
            );
        } else { // NONE
            items.push(
                { key: '1', label: 'Expected Qty', children: line.expected_qty },
                { key: '2', label: 'Received Qty', children: line.actual_qty ?? 0 },
                { key: '3', label: 'Difference', children: diff }
            );
        }

        // Common items
        items.push(
            { key: '97', label: 'Line Notes', children: line.notes || 'N/A' },
            { key: '98', label: 'Last Updated At', children: line.updated_at ? format(new Date(line.updated_at), 'PPpp') : 'N/A' },
            { key: '99', label: 'Last Updated By', children: line.updated_by_user?.full_name || 'N/A' }
        );
        
        return <Descriptions items={items} bordered column={1} size="small" />;
    };

    const renderStatusHistory = () => {
        const processFlow = ['CREATED', 'RECEIVING', 'COMPLETED'];
        const currentStatus = goodsReceipt.status;
        
        let currentIndex = processFlow.indexOf(currentStatus);
        if (currentStatus === 'PARTIAL_RECEIVED' || currentStatus === 'APPROVED') {
            currentIndex = processFlow.indexOf('RECEIVING');
        } else if (currentStatus === 'DRAFT') {
            currentIndex = -1; // Not yet started
        }

        const items = processFlow.map((status, index) => {
            let stepStatus: 'wait' | 'process' | 'finish' | 'error' = 'wait';
            if (index < currentIndex) {
                stepStatus = 'finish';
            } else if (index === currentIndex) {
                stepStatus = 'process';
            }
            if(currentStatus === 'COMPLETED') stepStatus = 'finish';

            const historyEntry = statusHistory.findLast(h => h.to_status === status);
            
            return {
                title: status.charAt(0) + status.slice(1).toLowerCase(),
                status: stepStatus,
                description: historyEntry ? (
                    <div style={{fontSize: '12px'}}>
                        <Text type="secondary">{historyEntry.changed_by_user?.full_name || 'System'}</Text><br/>
                        <Text type="secondary">{format(new Date(historyEntry.changed_at), 'MMM d, h:mm a')}</Text>
                    </div>
                ) : null,
            };
        });

        return <Steps direction="vertical" size="small" current={currentIndex} items={items} />;
    };

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Row justify="space-between" align="top" className="mb-4">
                <Col>
                    <Title level={3} style={{ margin: 0, color: '#1e293b' }}>
                        {goodsReceipt.reference_number || `GR-${goodsReceipt.id}`}
                    </Title>
                    <Text type="secondary">Details for this goods receipt</Text>
                </Col>
                <Col>
                    {pageActions}
                </Col>
            </Row>
            
            <Row gutter={24}>
                <Col span={17}>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <Card title="Information">
                            <Descriptions bordered column={2} size="small">
                                <Descriptions.Item label="Warehouse">{goodsReceipt.warehouse?.name}</Descriptions.Item>
                                <Descriptions.Item label="Transaction Type"><Tag>{goodsReceipt.transaction_type.replace(/_/g, ' ')}</Tag></Descriptions.Item>
                                <Descriptions.Item label="Partner">{goodsReceipt.partner_name || 'N/A'}</Descriptions.Item>
                                <Descriptions.Item label="Partner Ref.">{goodsReceipt.partner_reference || 'N/A'}</Descriptions.Item>
                                <Descriptions.Item label="Notes" span={2}>{goodsReceipt.notes || '-'}</Descriptions.Item>
                                <Descriptions.Item label="Created At">
                                    {goodsReceipt.created_at ? format(new Date(goodsReceipt.created_at), 'PPpp') : 'N/A'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Created By">
                                    {goodsReceipt.created_by_user?.full_name || 'System'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Last Updated At">
                                    {goodsReceipt.updated_at ? format(new Date(goodsReceipt.updated_at), 'PPpp') : 'N/A'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Last Updated By">
                                    {goodsReceipt.updated_by_user?.full_name || 'System'}
                                </Descriptions.Item>
                                {goodsReceipt.completed_at && (
                                    <>
                                        <Descriptions.Item label="Completed At">
                                            {format(new Date(goodsReceipt.completed_at), 'PPpp')}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Completed By">
                                            {goodsReceipt.completed_by_user?.full_name || 'System'}
                                        </Descriptions.Item>
                                    </>
                                )}
                            </Descriptions>
                        </Card>
                        <Card title="Line Items Summary">
                            <Table
                                columns={lineColumns}
                                dataSource={goodsReceipt.gr_lines}
                                rowKey="id"
                                pagination={false}
                                onRow={(record) => ({ onClick: () => handleRowClick(record) })}
                                rowClassName="cursor-pointer"
                                size="small"
                            />
                        </Card>
                    </Space>
                </Col>

                <Col span={7}>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <Card title="Status">
                            <div className="text-center mb-6">
                                <Tag color={STATUS_COLOR_MAP[goodsReceipt.status]} style={{ padding: '8px 16px', fontSize: '16px', fontWeight: 600 }}>
                                    {goodsReceipt.status.replace(/_/g, ' ')}
                                </Tag>
                            </div>
                            <Title level={5}>History</Title>
                            {statusHistory.length > 0 ? (
                                renderStatusHistory()
                            ) : (
                                <Paragraph type="secondary">No status history available.</Paragraph>
                            )}
                        </Card>

                        <Card title="Warehouse Info" size="small">
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Text strong><ShopOutlined /> {goodsReceipt.warehouse?.name}</Text>
                                <Text type="secondary">{goodsReceipt.warehouse?.address}</Text>
                                <Descriptions column={1} size="small" layout="horizontal" className="mt-2">
                                    <Descriptions.Item label="Manager">{goodsReceipt.warehouse?.manager_name || 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Phone">{goodsReceipt.warehouse?.phone || 'N/A'}</Descriptions.Item>
                                </Descriptions>
                            </Space>
                        </Card>
                    </Space>
                </Col>
            </Row>

            <Modal
                title={`Line Details: ${selectedLine?.goods_model?.name}`}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={[<Button key="back" onClick={() => setIsModalVisible(false)}>Close</Button>]}
            >
                {selectedLine && renderModalContent(selectedLine)}
            </Modal>
        </Space>
    );
};

const GRViewPage: React.FC = () => (
    <App><GRViewPageContent /></App>
);

export default GRViewPage;