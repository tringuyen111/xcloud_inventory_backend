import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../services/supabaseClient';
import { GoodsReceipt, GRLine, Warehouse } from '../../../types/supabase';
import {
    Button, Card, Row, Col, Typography, Space, App, Spin, Descriptions, Tag, Alert, Table, Modal, Tooltip
} from 'antd';
import { 
    EditOutlined, DeleteOutlined, RollbackOutlined,
    CheckCircleTwoTone, WarningTwoTone, CloseCircleTwoTone,
    ShopOutlined, UserOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import { format, formatDistanceToNow } from 'date-fns';
import PageHeader from '../../../components/layout/PageHeader';

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
};

type UserProfile = { full_name: string | null } | null;

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
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedLine, setSelectedLine] = useState<LineWithDetails | null>(null);

    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('goods_receipts')
                .select(`
                    *,
                    warehouse:warehouses(*),
                    gr_lines(*,
                        goods_model:goods_models(id, code, name, tracking_type, base_uom:uoms(id, code)),
                        locations(id, code, name)
                    ),
                    created_by_user:profiles!created_by(full_name),
                    updated_by_user:profiles!updated_by(full_name),
                    completed_by_user:profiles!completed_by(full_name)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            setGoodsReceipt(data as GRViewData);
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
        return <Tooltip title="Pending Receipt"><CloseCircleTwoTone twoToneColor="#8c8c8c" style={{ fontSize: '18px' }} /></Tooltip>;
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

    const AuditInfo: React.FC<{label: string, user: UserProfile, date: string | null}> = ({label, user, date}) => (
        date ? (
            <div className="flex items-start space-x-2 text-sm">
                <UserOutlined className="text-gray-400 mt-1"/>
                <div>
                    <Text>{label} by <Text strong>{user?.full_name || 'System'}</Text></Text><br/>
                    <Text type="secondary" style={{ fontSize: 12 }}>{format(new Date(date), 'PPpp')}</Text>
                </div>
            </div>
        ) : null
    );

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <PageHeader 
                title={goodsReceipt.reference_number || `GR-${goodsReceipt.id}`}
                description={`Details for this goods receipt`}
                actions={pageActions}
            />
            
            <Row gutter={24}>
                <Col span={17}>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <Card>
                            <Descriptions bordered column={2} size="small">
                                <Descriptions.Item label="Warehouse">{goodsReceipt.warehouse?.name}</Descriptions.Item>
                                <Descriptions.Item label="Transaction Type"><Tag>{goodsReceipt.transaction_type.replace(/_/g, ' ')}</Tag></Descriptions.Item>
                                <Descriptions.Item label="Partner">{goodsReceipt.partner_name || 'N/A'}</Descriptions.Item>
                                <Descriptions.Item label="Partner Ref.">{goodsReceipt.partner_reference || 'N/A'}</Descriptions.Item>
                                <Descriptions.Item label="Notes" span={2}>{goodsReceipt.notes || '-'}</Descriptions.Item>
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
                            <div className="text-center">
                                <Tag color={STATUS_COLOR_MAP[goodsReceipt.status]} style={{ padding: '8px 16px', fontSize: '16px', fontWeight: 600 }}>
                                    {goodsReceipt.status.replace(/_/g, ' ')}
                                </Tag>
                            </div>
                            {/* Placeholder for future StatusHistory component */}
                            <Title level={5} className="mt-4">History</Title>
                            <Paragraph type="secondary">Status history will be shown here.</Paragraph>
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

                        <Card title="Audit Trail" size="small">
                             <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                <AuditInfo label="Created" user={goodsReceipt.created_by_user} date={goodsReceipt.created_at} />
                                <AuditInfo label="Last Updated" user={goodsReceipt.updated_by_user} date={goodsReceipt.updated_at} />
                                <AuditInfo label="Completed" user={goodsReceipt.completed_by_user} date={goodsReceipt.completed_at} />
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
                {selectedLine && (
                    <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Serial Number">{selectedLine.serial_number || 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="Lot Number">{selectedLine.lot_number || 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="Expiry Date">
                            {selectedLine.expiry_date ? format(new Date(selectedLine.expiry_date), 'PP') : 'N/A'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Line Notes">{selectedLine.notes || 'N/A'}</Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </Space>
    );
};

const GRViewPage: React.FC = () => (
    <App><GRViewPageContent /></App>
);

export default GRViewPage;