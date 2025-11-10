import React, { useEffect, useState, useMemo } from 'react';
import { App, Button, Card, Form, Spin, Select, Row, Col, Affix, Table, InputNumber, Typography, Popconfirm, Empty, Space } from 'antd';
import { SaveOutlined, CloseOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { warehouseAPI, locationAPI, inventoryAPI, goodsModelAPI, putawayAPI } from '../../../utils/apiClient';
import { transactionsClient, supabase } from '../../../lib/supabase';
import { Database } from '../../../types/supabase';
import { useUserProfile } from '../../../hooks/useUserProfile';
import dayjs from 'dayjs';

type Warehouse = Database['master']['Tables']['warehouses']['Row'];
type Location = Database['master']['Tables']['locations']['Row'];
type OnhandItem = Database['inventory']['Tables']['onhand']['Row'];
type GoodsModel = Database['master']['Tables']['goods_models']['Row'];
type PutawayHeaderInsert = Database['transactions']['Tables']['putaway_header']['Insert'];
type PutawayLineInsert = Database['transactions']['Tables']['putaway_lines']['Insert'];

interface PutawayLineItem {
  key: string;
  onhand_id: string;
  goods_model_id: string;
  lot_number: string | null;
  available_quantity: number;
  quantity_to_putaway: number;
  to_location_id: string | null;
}

const PutawayCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const { notification } = App.useApp();
    const { profile, loading: profileLoading } = useUserProfile();

    const [loading, setLoading] = useState(false);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [allLocations, setAllLocations] = useState<Location[]>([]);
    const [allOnhand, setAllOnhand] = useState<OnhandItem[]>([]);
    const [allGoodsModels, setAllGoodsModels] = useState<GoodsModel[]>([]);

    const [sourceWarehouseId, setSourceWarehouseId] = useState<string | null>(null);
    const [sourceLocationId, setSourceLocationId] = useState<string | null>(null);
    
    const [putawayItems, setPutawayItems] = useState<PutawayLineItem[]>([]);

    const goodsModelsMap = useMemo(() => new Map(allGoodsModels.map(gm => [gm.id, gm])), [allGoodsModels]);
    const locationsMap = useMemo(() => new Map(allLocations.map(l => [l.id, l.code])), [allLocations]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [whRes, locRes, onhandRes, gmRes] = await Promise.all([
                    warehouseAPI.list(),
                    locationAPI.list(),
                    inventoryAPI.list(),
                    goodsModelAPI.list()
                ]);
                
                setWarehouses(whRes || []);
                setAllLocations(locRes || []);
                setAllOnhand(onhandRes || []);
                setAllGoodsModels(gmRes || []);
            } catch (error: any) {
                notification.error({ message: 'Error fetching initial data', description: error.message });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [notification]);

    const sourceLocations = useMemo(() => allLocations.filter(l => l.warehouse_id === sourceWarehouseId && l.is_receivable), [allLocations, sourceWarehouseId]);
    const destinationLocations = useMemo(() => allLocations.filter(l => l.warehouse_id === sourceWarehouseId && !l.is_receivable && l.is_active), [allLocations, sourceWarehouseId]);
    const onhandAtSource = useMemo(() => allOnhand.filter(s => s.location_id === sourceLocationId && s.quantity_onhand > 0), [allOnhand, sourceLocationId]);

    const handleAddPutawayItem = (item: OnhandItem) => {
        if (putawayItems.some(pi => pi.onhand_id === item.id)) {
            notification.info({ message: "Item already in list" });
            return;
        }
        const newItem: PutawayLineItem = {
            key: item.id,
            onhand_id: item.id,
            goods_model_id: item.goods_model_id,
            lot_number: item.lot_number,
            available_quantity: item.quantity_onhand,
            quantity_to_putaway: item.quantity_onhand,
            to_location_id: null,
        };
        setPutawayItems([...putawayItems, newItem]);
    };
    
    const handlePutawayItemChange = (key: string, field: keyof PutawayLineItem, value: any) => {
        setPutawayItems(putawayItems.map(item => item.key === key ? { ...item, [field]: value } : item));
    };

    const handleRemovePutawayItem = (key: string) => {
        setPutawayItems(putawayItems.filter(item => item.key !== key));
    };

    const handleSubmit = async () => {
        if (!profile?.organization_uuid || !profile.id) {
            notification.error({ message: 'User profile/organization not found.' }); return;
        }
        if (putawayItems.length === 0 || putawayItems.some(p => !p.to_location_id || p.quantity_to_putaway <= 0)) {
            notification.warning({ message: 'Please complete all putaway tasks before confirming.' }); return;
        }

        setLoading(true);
        const headerPayload: PutawayHeaderInsert = {
            code: `PAW-${Date.now()}`,
            organization_id: profile.organization_uuid,
            warehouse_id: sourceWarehouseId!,
            putaway_date: dayjs().toISOString(),
            status: 'MOVING',
            created_by: profile.id,
        };

        try {
            const createdHeader = await putawayAPI.create(headerPayload);
            if (!createdHeader?.id) throw new Error("Failed to create Putaway header.");

            const linesPayload: PutawayLineInsert[] = putawayItems.map((item, index) => ({
                putaway_header_id: createdHeader.id,
                goods_model_id: item.goods_model_id,
                line_number: index + 1,
                from_location_id: sourceLocationId!,
                to_location_id: item.to_location_id!,
                lot_number: item.lot_number,
                quantity: item.quantity_to_putaway,
                created_by: profile.id,
            }));
            
            const { data: createdLines, error: linesError } = await transactionsClient.from('putaway_lines').insert(linesPayload as any).select();
            if (linesError) throw new Error(`Failed to create putaway lines: ${linesError.message}`);
            
            // Execute each line via RPC
            for (const line of createdLines) {
                const { error: rpcError } = await supabase.rpc('putaway_execute_line', {
                    p_putaway_line_id: line.id,
                    p_quantity_to_putaway: line.quantity,
                });
                if (rpcError) throw new Error(`Failed to execute putaway for line ${line.line_number}: ${rpcError.message}`);
            }

            // Mark header as complete
            await putawayAPI.update(createdHeader.id, { status: 'COMPLETED', completed_at: new Date().toISOString(), completed_by: profile.id });

            notification.success({ message: 'Success', description: 'Putaway task executed and completed successfully.' });
            navigate('/operations/pa');
        } catch (error: any) {
            notification.error({ message: 'Operation Failed', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const availableStockColumns = [
        { title: 'Goods', dataIndex: 'goods_model_id', render: (id: string) => goodsModelsMap.get(id)?.name || 'N/A' },
        { title: 'Lot', dataIndex: 'lot_number', render: (lot: string) => lot || 'N/A' },
        { title: 'Available Qty', dataIndex: 'quantity_onhand' },
        { title: 'Action', key: 'action', render: (_: any, record: OnhandItem) => <Button icon={<PlusOutlined />} onClick={() => handleAddPutawayItem(record)}>Add</Button> }
    ];
    
    const putawayTasksColumns = [
        { title: 'Goods', dataIndex: 'goods_model_id', render: (id: string) => goodsModelsMap.get(id)?.name || 'N/A' },
        { title: 'Lot', dataIndex: 'lot_number', render: (lot: string) => lot || 'N/A' },
        { title: 'Qty to Putaway', key: 'quantity', render: (_: any, record: PutawayLineItem) => (
            <InputNumber min={1} max={record.available_quantity} value={record.quantity_to_putaway}
                onChange={(value) => handlePutawayItemChange(record.key, 'quantity_to_putaway', value!)}
            />
        )},
        { title: 'Destination', key: 'destination', render: (_: any, record: PutawayLineItem) => (
            <Select showSearch placeholder="Select destination" style={{ width: 200 }} value={record.to_location_id}
                onChange={(value) => handlePutawayItemChange(record.key, 'to_location_id', value)}
                options={destinationLocations.map(l => ({ value: l.id, label: l.code }))}
            />
        )},
        { title: 'Action', key: 'action', render: (_: any, record: PutawayLineItem) => (
            <Popconfirm title="Remove this task?" onConfirm={() => handleRemovePutawayItem(record.key)}>
                <Button icon={<DeleteOutlined />} danger type="text" />
            </Popconfirm>
        )}
    ];

    return (
        <Spin spinning={loading || profileLoading}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Card>
                    <Typography.Title level={4}>Execute Putaway</Typography.Title>
                    <Typography.Paragraph type="secondary">
                        Select a source location to view available stock, then create and execute putaway tasks.
                    </Typography.Paragraph>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Select showSearch placeholder="1. Select Warehouse" style={{ width: '100%' }}
                                onChange={val => { setSourceWarehouseId(val); setSourceLocationId(null); setPutawayItems([]); }}
                                options={warehouses.map(w => ({ value: w.id, label: w.name }))} />
                        </Col>
                        <Col span={12}>
                            <Select showSearch placeholder="2. Select Source Location" style={{ width: '100%' }}
                                disabled={!sourceWarehouseId} value={sourceLocationId}
                                onChange={val => { setSourceLocationId(val); setPutawayItems([]); }}
                                options={sourceLocations.map(l => ({ value: l.id, label: l.code }))} />
                        </Col>
                    </Row>
                </Card>

                {sourceLocationId && (
                     <Card title={`Available Stock at ${locationsMap.get(sourceLocationId) || ''}`}>
                        <Table dataSource={onhandAtSource} columns={availableStockColumns} rowKey="id" size="small" pagination={false} bordered
                            locale={{ emptyText: <Empty description="No stock available at this location." /> }} />
                    </Card>
                )}

                <Card title="Putaway Tasks">
                    <Table dataSource={putawayItems} columns={putawayTasksColumns} rowKey="key" size="small" pagination={false} bordered
                        locale={{ emptyText: <Empty description="Add items from the 'Available Stock' list above." /> }} />
                </Card>

                <Affix offsetBottom={0}>
                    <Card className="mt-4 p-0 border-t">
                        <Row justify="end">
                            <Col>
                                <Space>
                                    <Button danger icon={<CloseOutlined />} onClick={() => navigate('/operations/pa')}>
                                        Cancel
                                    </Button>
                                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading} onClick={handleSubmit} disabled={putawayItems.length === 0}>
                                        Confirm & Putaway
                                    </Button>
                                </Space>
                            </Col>
                        </Row>
                    </Card>
                </Affix>
            </Space>
        </Spin>
    );
};

const PutawayCreatePageWrapper: React.FC = () => ( <App><PutawayCreatePage /></App> );
export default PutawayCreatePageWrapper;