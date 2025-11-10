import React, { useEffect, useState, useCallback } from 'react';
import {
    App, Button, Card, Col, Descriptions, Form, Input, InputNumber, Modal, Row, Select, Spin, Table, Tag, Timeline, Alert, Space, DatePicker, Tooltip
} from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { transactionsClient, supabase, inventoryClient } from '../../../lib/supabase';
import { useUserProfile } from '../../../hooks/useUserProfile';
import { locationAPI } from '../../../utils/apiClient';
import { Database } from '../../../types/supabase';
import dayjs from 'dayjs';
import { ArrowLeftOutlined, CheckCircleOutlined, SyncOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons';

// Type definitions
type GRHeader = Database['transactions']['Tables']['gr_header']['Row'];
type GRLine = Database['transactions']['Tables']['gr_lines']['Row'];
type GoodsModel = Database['master']['Tables']['goods_models']['Row'];
type Uom = Database['master']['Tables']['uoms']['Row'];
type Partner = Database['master']['Tables']['partners']['Row'];
type Warehouse = Database['master']['Tables']['warehouses']['Row'];
type Location = Database['master']['Tables']['locations']['Row'];
type UserProfile = { full_name: string | null };
type MovementItem = Database['inventory']['Tables']['onhand_movements']['Row'] & {
    locations: { code: string } | null;
    users: { full_name: string | null } | null;
};


interface EnrichedGRLine extends GRLine {
    goods_models: Pick<GoodsModel, 'code' | 'name' | 'tracking_type'> & { uoms: Pick<Uom, 'name'> | null };
}

interface EnrichedGRHeader extends GRHeader {
    gr_lines: EnrichedGRLine[];
    partners: Pick<Partner, 'name'> | null;
    warehouses: Pick<Warehouse, 'name'> | null;
    created_by_user: UserProfile | null;
    started_by_user: UserProfile | null;
    completed_by_user: UserProfile | null;
    cancelled_by_user: UserProfile | null;
}

const getStatusColor = (status: GRHeader['status']) => {
  switch (status) {
    case 'DRAFT': return 'default';
    case 'CREATED': return 'processing';
    case 'RECEIVING': return 'blue';
    case 'RECEIVED': return 'purple';
    case 'COMPLETED': return 'success';
    case 'CANCELLED': return 'error';
    default: return 'default';
  }
};

const GRViewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification } = App.useApp();
    const { profile } = useUserProfile();

    const [grData, setGrData] = useState<EnrichedGRHeader | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // State for Receive Modal
    const [isReceiveModalVisible, setIsReceiveModalVisible] = useState(false);
    const [receivingLine, setReceivingLine] = useState<EnrichedGRLine | null>(null);
    const [locations, setLocations] = useState<Location[]>([]);
    const [receiveForm] = Form.useForm();
    
    // State for Details Modal
    const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
    const [detailsLine, setDetailsLine] = useState<EnrichedGRLine | null>(null);
    const [detailsData, setDetailsData] = useState<MovementItem[]>([]);
    const [detailsLoading, setDetailsLoading] = useState(false);


    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await transactionsClient
                .from('gr_header')
                .select(`
                    *,
                    partners ( name ),
                    warehouses ( name ),
                    created_by_user:created_by(full_name),
                    started_by_user:started_by(full_name),
                    completed_by_user:completed_by(full_name),
                    cancelled_by_user:cancelled_by(full_name),
                    gr_lines (
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
            
            setGrData(data as any); // Cast as any to handle aliased user profiles

            // Fetch receivable locations for the specific warehouse
            const locs = await locationAPI.list();
            setLocations(locs.filter(l => l.warehouse_id === data.warehouse_id && l.is_receivable));

        } catch (err: any) {
            setError(err.message);
            notification.error({ message: "Failed to load Goods Receipt", description: err.message });
        } finally {
            setLoading(false);
        }
    }, [id, notification]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleHeaderAction = async (rpcName: 'gr_start_receiving' | 'gr_complete_receiving' | 'gr_cancel', params: any) => {
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
    };
    
    const showReceiveModal = (line: EnrichedGRLine) => {
        setReceivingLine(line);
        setIsReceiveModalVisible(true);
        receiveForm.setFieldsValue({
            // Pre-fill with remaining quantity
            quantity_to_receive: line.quantity_expected - line.quantity_received,
            // Pre-select the first available receiving location
            location_id: locations.length > 0 ? locations[0].id : null,
            lot_number: null,
            expiry_date: null,
            serial_number: null
        });
    };
    
    const showDetailsModal = async (line: EnrichedGRLine) => {
        setDetailsLine(line);
        setIsDetailsModalVisible(true);
        setDetailsLoading(true);
        try {
            const { data, error: moveError } = await inventoryClient
                .from('onhand_movements')
                .select('*, locations(code), users:created_by(full_name)')
                .eq('reference_line_id', line.id)
                .order('movement_date', { ascending: false });

            if (moveError) throw moveError;
            setDetailsData(data as MovementItem[] || []);
        } catch (err: any) {
            notification.error({ message: "Failed to load receiving details", description: err.message });
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleReceiveLine = async (values: any) => {
        if (!receivingLine || !profile?.id) return;
        setLoading(true);
        try {
            const trackingType = receivingLine.goods_models.tracking_type;
            
            if (trackingType === 'SERIAL') {
                const serials = (values.serial_number || '').split('\n').map((s: string) => s.trim()).filter(Boolean);
                if (serials.length === 0) throw new Error("Please provide at least one serial number.");
                
                // For SERIAL items, call the RPC for each serial number with a quantity of 1.
                const promises = serials.map((serial: string) => supabase.rpc('gr_receive_line', {
                    p_gr_line_id: receivingLine.id,
                    p_quantity_to_receive: 1,
                    p_location_id: values.location_id,
                    p_serial_number: serial
                }));
                await Promise.all(promises);
                notification.success({ message: `Successfully received ${serials.length} serial items.` });

            } else { // LOT or NONE tracking
                const params = {
                    p_gr_line_id: receivingLine.id,
                    p_quantity_to_receive: values.quantity_to_receive,
                    p_location_id: values.location_id,
                    p_lot_number: values.lot_number,
                    p_expiry_date: values.expiry_date ? dayjs(values.expiry_date).toISOString() : undefined,
                };
                const { error: rpcError } = await supabase.rpc('gr_receive_line', params);
                if (rpcError) throw rpcError;
                notification.success({ message: `Successfully received ${values.quantity_to_receive} items.` });
            }

            setIsReceiveModalVisible(false);
            receiveForm.resetFields();
            await fetchData(); // Refresh data to show updated quantities

        } catch (err: any) {
             notification.error({ message: 'Failed to receive item', description: err.message });
        } finally {
            setLoading(false);
        }
    };

    const lineColumns = [
        { title: 'Item Code', dataIndex: ['goods_models', 'code'], key: 'itemCode' },
        { title: 'Item Name', dataIndex: ['goods_models', 'name'], key: 'itemName' },
        { title: 'UoM', key: 'uom', render: (_:any, record: EnrichedGRLine) => record.goods_models.uoms?.name || 'N/A' },
        { title: 'Qty Expected', dataIndex: 'quantity_expected', key: 'qtyExpected' },
        { title: 'Qty Received', dataIndex: 'quantity_received', key: 'qtyReceived', render: (val: number) => <Tag color="green">{val}</Tag> },
        { title: 'Qty Remaining', key: 'qtyRemaining', render: (_: any, record: EnrichedGRLine) => {
            const remaining = record.quantity_expected - record.quantity_received;
            return <Tag color={remaining > 0 ? "orange" : "default"}>{remaining}</Tag>;
        }},
        { title: 'Action', key: 'action', render: (_: any, record: EnrichedGRLine) => {
            const canReceive = (grData?.status === 'RECEIVING') && (record.quantity_expected - record.quantity_received > 0);
            return (
                <Space>
                    <Tooltip title="View Received Details">
                        <Button icon={<EyeOutlined />} size="small" onClick={() => showDetailsModal(record)} />
                    </Tooltip>
                    <Button type="primary" size="small" onClick={() => showReceiveModal(record)} disabled={!canReceive}>
                        Receive
                    </Button>
                </Space>
            );
        }},
    ];

    if (loading && !grData) return <div className="flex justify-center items-center h-full"><Spin size="large" /></div>;
    if (error) return <Alert message="Error" description={error} type="error" showIcon />;
    if (!grData) return <Alert message="Not Found" description="The requested Goods Receipt could not be found." type="warning" />;

    return (
        <Spin spinning={loading}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/operations/gr')}>Back to List</Button>
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={18}>
                        <Card>
                            <Descriptions bordered column={2} title={`Goods Receipt: ${grData.code}`}>
                                <Descriptions.Item label="Status"><Tag color={getStatusColor(grData.status)}>{grData.status}</Tag></Descriptions.Item>
                                <Descriptions.Item label="Warehouse">{grData.warehouses?.name}</Descriptions.Item>
                                <Descriptions.Item label="Supplier">{grData.partners?.name || 'N/A'}</Descriptions.Item>
                                <Descriptions.Item label="PO Number">{grData.purchase_order_number || 'N/A'}</Descriptions.Item>
                                <Descriptions.Item label="Document Date">{dayjs(grData.document_date).format('YYYY-MM-DD')}</Descriptions.Item>
                                <Descriptions.Item label="Expected Date">{grData.expected_date ? dayjs(grData.expected_date).format('YYYY-MM-DD') : 'N/A'}</Descriptions.Item>
                                <Descriptions.Item label="Notes" span={2}>{grData.notes || 'N/A'}</Descriptions.Item>
                            </Descriptions>
                        </Card>
                        <Card title="Items" style={{ marginTop: 16 }}>
                            <Table dataSource={grData.gr_lines} columns={lineColumns} rowKey="id" size="small" pagination={false} />
                        </Card>
                    </Col>
                    <Col xs={24} lg={6}>
                        <Card title="Actions" style={{ marginBottom: 16 }}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                {grData.status === 'CREATED' && <Button type="primary" block onClick={() => handleHeaderAction('gr_start_receiving', { p_gr_header_id: id })}>Start Receiving</Button>}
                                {(grData.status === 'RECEIVING' || grData.status === 'RECEIVED') && <Button type="primary" block onClick={() => handleHeaderAction('gr_complete_receiving', { p_gr_header_id: id })}>Complete Receiving</Button>}
                                {(grData.status === 'DRAFT' || grData.status === 'CREATED') && <Button danger block onClick={() => handleHeaderAction('gr_cancel', { p_gr_header_id: id, p_cancellation_reason: 'Cancelled by user' })}>Cancel</Button>}
                                <Button block>Print</Button>
                            </Space>
                        </Card>
                        <Card title="History">
                           <Timeline>
                                <Timeline.Item dot={<CheckCircleOutlined />} color="green">Created by {grData.created_by_user?.full_name || 'System'} on {dayjs(grData.created_at).format('YYYY-MM-DD HH:mm')}</Timeline.Item>
                                {grData.started_at && <Timeline.Item dot={<SyncOutlined spin />} color="blue">Receiving started by {grData.started_by_user?.full_name || 'System'} on {dayjs(grData.started_at).format('YYYY-MM-DD HH:mm')}</Timeline.Item>}
                                {grData.completed_at && <Timeline.Item dot={<CheckCircleOutlined />} color="green">Completed by {grData.completed_by_user?.full_name || 'System'} on {dayjs(grData.completed_at).format('YYYY-MM-DD HH:mm')}</Timeline.Item>}
                                {grData.cancelled_at && <Timeline.Item dot={<CloseCircleOutlined />} color="red">Cancelled by {grData.cancelled_by_user?.full_name || 'System'} on {dayjs(grData.cancelled_at).format('YYYY-MM-DD HH:mm')}</Timeline.Item>}
                            </Timeline>
                        </Card>
                    </Col>
                </Row>
            </Space>

            {receivingLine && (
                <Modal
                    title={`Receive Item: ${receivingLine.goods_models.name}`}
                    open={isReceiveModalVisible}
                    onOk={() => receiveForm.submit()}
                    onCancel={() => { setIsReceiveModalVisible(false); receiveForm.resetFields(); }}
                    confirmLoading={loading}
                    destroyOnClose
                >
                    <Form form={receiveForm} layout="vertical" onFinish={handleReceiveLine}>
                        {receivingLine.goods_models.tracking_type !== 'SERIAL' &&
                            <Form.Item name="quantity_to_receive" label="Quantity to Receive" rules={[{ required: true }]}>
                                <InputNumber min={1} max={receivingLine.quantity_expected - receivingLine.quantity_received} style={{ width: '100%' }} />
                            </Form.Item>
                        }
                        <Form.Item name="location_id" label="Receiving Location" rules={[{ required: true }]}>
                            <Select showSearch placeholder="Select a receiving location" options={locations.map(l => ({ value: l.id, label: l.code }))} />
                        </Form.Item>
                        {receivingLine.goods_models.tracking_type === 'LOT' && (
                             <>
                                <Form.Item name="lot_number" label="Lot Number" rules={[{ required: true }]}>
                                    <Input />
                                </Form.Item>
                                <Form.Item name="expiry_date" label="Expiry Date">
                                    <DatePicker style={{ width: '100%' }} />
                                </Form.Item>
                             </>
                        )}
                         {receivingLine.goods_models.tracking_type === 'SERIAL' && (
                             <Form.Item name="serial_number" label="Serial Number(s)" rules={[{ required: true }]}>
                                <Input.TextArea rows={4} placeholder="Enter one serial number per line"/>
                             </Form.Item>
                        )}
                    </Form>
                </Modal>
            )}
            
            {detailsLine && (
                <Modal
                    title={`Receiving Details for: ${detailsLine.goods_models.name}`}
                    open={isDetailsModalVisible}
                    onCancel={() => setIsDetailsModalVisible(false)}
                    footer={[<Button key="close" onClick={() => setIsDetailsModalVisible(false)}>Close</Button>]}
                    width={800}
                    destroyOnClose
                >
                    <Spin spinning={detailsLoading}>
                        <Table
                            dataSource={detailsData}
                            columns={[
                                { title: 'Location', dataIndex: ['locations', 'code'], key: 'location', render: (val) => val || 'N/A' },
                                { title: 'Lot Number', dataIndex: 'lot_number', key: 'lot', render: (val) => val || 'N/A' },
                                { title: 'Serial Number', dataIndex: 'serial_number', key: 'serial', render: (val) => val || 'N/A' },
                                { title: 'Qty Received', dataIndex: 'quantity_change', key: 'qty' },
                                { title: 'Received By', dataIndex: ['users', 'full_name'], key: 'user', render: (val) => val || 'N/A' },
                                { title: 'Received At', dataIndex: 'movement_date', key: 'date', render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm') }
                            ]}
                            rowKey="id"
                            size="small"
                            pagination={false}
                        />
                    </Spin>
                </Modal>
            )}

        </Spin>
    );
};

const GRViewPageWrapper: React.FC = () => (
    <App><GRViewPage /></App>
);

export default GRViewPageWrapper;