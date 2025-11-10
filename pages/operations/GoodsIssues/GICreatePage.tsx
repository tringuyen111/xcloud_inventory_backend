import React, { useEffect, useState, useMemo } from 'react';
import {
    App, Button, Card, Form, Input, Spin, Select, Row, Col, Affix, DatePicker, Table, InputNumber, Popconfirm,
    Radio, Tag, Space, Typography, Tooltip
} from 'antd';
import { SaveOutlined, CloseOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { goodsIssueAPI, warehouseAPI, partnerAPI, goodsModelAPI, uomAPI, inventoryAPI } from '../../../utils/apiClient';
import { transactionsClient, supabase } from '../../../lib/supabase';
import { Database } from '../../../types/supabase';
import { useUserProfile } from '../../../hooks/useUserProfile';
import dayjs from 'dayjs';

// Define types from Supabase schema
type GIHeaderInsert = Database['transactions']['Tables']['gi_header']['Insert'];
type GILineInsert = Database['transactions']['Tables']['gi_lines']['Insert'];
type Warehouse = Database['master']['Tables']['warehouses']['Row'];
type Partner = Database['master']['Tables']['partners']['Row'];
type GoodsModel = Database['master']['Tables']['goods_models']['Row'];
type Uom = Database['master']['Tables']['uoms']['Row'];
type OnhandItem = Database['inventory']['Tables']['onhand']['Row'];

// Local state type for line items
interface LineItem {
    key: string;
    goods_model_id: string | null;
    quantity_requested: number;
    pick_location_id?: string | null;
    lot_number?: string | null;
    onhand_id?: string | null; // To link to a specific onhand record in detail mode
}

type IssueMode = 'SUMMARY' | 'DETAIL';

const GICreatePage: React.FC = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { notification } = App.useApp();
    const { profile, loading: profileLoading } = useUserProfile();

    // Data loading states
    const [loading, setLoading] = useState(false);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [customers, setCustomers] = useState<Partner[]>([]);
    const [goodsModels, setGoodsModels] = useState<GoodsModel[]>([]);
    const [uoms, setUoms] = useState<Uom[]>([]);
    const [onhandStock, setOnhandStock] = useState<OnhandItem[]>([]);

    // Form state
    const [lines, setLines] = useState<LineItem[]>([]);
    const [issueMode, setIssueMode] = useState<IssueMode>('SUMMARY');
    const selectedWarehouseId = Form.useWatch('warehouse_id', form);
    
    const goodsModelsMap = useMemo(() => new Map(goodsModels.map(gm => [gm.id, gm])), [goodsModels]);
    const uomsMap = useMemo(() => new Map(uoms.map(u => [u.id, u.name])), [uoms]);

    // Fetch initial master data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [whRes, pRes, gmRes, uomRes, onhandRes] = await Promise.all([
                    warehouseAPI.list(),
                    partnerAPI.list(),
                    goodsModelAPI.list(),
                    uomAPI.list(),
                    inventoryAPI.list()
                ]);
                setWarehouses(whRes || []);
                setCustomers(pRes.filter(p => p.is_customer) || []);
                setGoodsModels(gmRes || []);
                setUoms(uomRes || []);
                setOnhandStock(onhandRes || []);
            } catch (error: any) {
                notification.error({ message: 'Error fetching initial data', description: error.message });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [notification]);
    
    const handleAddLine = () => {
        const newLine: LineItem = { key: `new_${Math.random()}`, goods_model_id: null, quantity_requested: 1 };
        setLines([...lines, newLine]);
    };

    const handleLineChange = (key: string, field: keyof LineItem, value: any) => {
        const newLines = lines.map(line => {
            if (line.key === key) {
                const updatedLine = { ...line, [field]: value };
                // Reset dependent fields when model changes
                if (field === 'goods_model_id') {
                    updatedLine.onhand_id = null;
                    updatedLine.pick_location_id = null;
                    updatedLine.lot_number = null;
                }
                // When onhand changes in detail mode, update other fields
                if (field === 'onhand_id') {
                    const stock = onhandStock.find(s => s.id === value);
                    if (stock) {
                        updatedLine.pick_location_id = stock.location_id;
                        updatedLine.lot_number = stock.lot_number;
                    }
                }
                return updatedLine;
            }
            return line;
        });
        setLines(newLines);
    };

    const handleRemoveLine = (key: string) => setLines(lines.filter(line => line.key !== key));

    const handleSubmit = async (action: 'draft' | 'submit') => {
        if (!profile?.organization_uuid || !profile.id) {
            notification.error({ message: 'User profile/organization not found.' }); return;
        }
        if (lines.length === 0 || lines.some(l => !l.goods_model_id)) {
            notification.warning({ message: 'Please add at least one valid item.' }); return;
        }

        try {
            const headerValues = await form.validateFields();
            setLoading(true);

            const headerPayload: GIHeaderInsert = {
                ...headerValues,
                expected_date: headerValues.expected_date ? dayjs(headerValues.expected_date).toISOString() : null,
                status: 'DRAFT',
                organization_id: profile.organization_uuid,
                created_by: profile.id,
            };

            const createdHeader = await goodsIssueAPI.create(headerPayload);
            if (!createdHeader?.id) throw new Error("Failed to create Goods Issue header.");

            const linesPayload: GILineInsert[] = lines.map((line, index) => {
                const model = goodsModelsMap.get(line.goods_model_id!);
                if (!model) throw new Error(`Model details not found.`);
                return {
                    gi_header_id: createdHeader.id,
                    goods_model_id: line.goods_model_id!,
                    uom_id: model.base_uom_id,
                    quantity_requested: line.quantity_requested || 0,
                    line_number: index + 1,
                    pick_location_id: issueMode === 'DETAIL' ? line.pick_location_id : null,
                    lot_number: issueMode === 'DETAIL' ? line.lot_number : null,
                };
            });

            if (linesPayload.length > 0) {
                const { error: linesError } = await transactionsClient.from('gi_lines').insert(linesPayload);
                if (linesError) throw new Error(`Failed to save lines: ${linesError.message}`);
            }

            if (action === 'submit') {
                const { error: rpcError } = await supabase.rpc('gi_submit_for_approval', { p_gi_header_id: createdHeader.id });
                if (rpcError) throw new Error(`Failed to submit for approval: ${rpcError.message}`);
            }

            notification.success({ message: `Goods Issue saved as ${action === 'draft' ? 'Draft' : 'Submitted'} successfully.` });
            navigate('/operations/gi');

        } catch (error: any) {
            notification.error({ message: 'Operation Failed', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const getOnhandOptionsForModel = (modelId: string) => {
        return onhandStock
            .filter(stock => stock.goods_model_id === modelId && stock.warehouse_id === selectedWarehouseId && stock.quantity_available > 0)
            .map(stock => ({
                value: stock.id,
                label: `Loc: ${stock.location_id} | Lot: ${stock.lot_number || 'N/A'} | Avail: ${stock.quantity_available}`
            }));
    };
    
    const baseColumns = [
        { title: 'Goods Model', dataIndex: 'goods_model_id', key: 'goods_model_id', width: '25%', render: (_: any, record: LineItem) => (
            <Select showSearch placeholder="Select Model" style={{ width: '100%' }} value={record.goods_model_id}
                onChange={(value) => handleLineChange(record.key, 'goods_model_id', value)} optionFilterProp="label"
                options={goodsModels.map(gm => ({ value: gm.id, label: `${gm.name} (${gm.code})` }))} />
        )},
        { title: 'Tracking', key: 'tracking', width: '10%', render: (_: any, record: LineItem) => 
            record.goods_model_id ? <Tag>{goodsModelsMap.get(record.goods_model_id)?.tracking_type}</Tag> : '-' },
        { title: 'UoM', key: 'uom', width: '10%', render: (_: any, record: LineItem) => {
            const model = record.goods_model_id ? goodsModelsMap.get(record.goods_model_id) : null;
            return model ? uomsMap.get(model.base_uom_id) : '-';
        }},
    ];

    const detailColumns = [
        ...baseColumns,
        { title: 'Pick From (Location/Lot/Available)', dataIndex: 'onhand_id', key: 'onhand_id', width: '30%', render: (_: any, record: LineItem) => (
             <Select showSearch placeholder="Select stock to pick" style={{ width: '100%' }} value={record.onhand_id}
                onChange={(value) => handleLineChange(record.key, 'onhand_id', value)} optionFilterProp="label"
                disabled={!record.goods_model_id || !selectedWarehouseId}
                options={record.goods_model_id ? getOnhandOptionsForModel(record.goods_model_id) : []} />
        )},
        { title: 'Qty Requested', dataIndex: 'quantity_requested', key: 'quantity_requested', width: '15%', render: (_: any, record: LineItem) => (
            <InputNumber min={1} style={{ width: '100%' }} value={record.quantity_requested}
                onChange={(value) => handleLineChange(record.key, 'quantity_requested', value!)} />
        )},
        { title: 'Action', key: 'action', width: '5%', render: (_: any, record: LineItem) => (
            <Popconfirm title="Sure to delete?" onConfirm={() => handleRemoveLine(record.key)}>
                <Button icon={<DeleteOutlined />} danger type="text" />
            </Popconfirm>
        )}
    ];

    const summaryColumns = [
        ...baseColumns,
        { title: 'Available Qty', key: 'available_qty', width: '15%', render: (_: any, record: LineItem) => {
            if (!record.goods_model_id || !selectedWarehouseId) return <Tag color="orange">Select Warehouse & Model</Tag>;
            const total = onhandStock
                .filter(s => s.goods_model_id === record.goods_model_id && s.warehouse_id === selectedWarehouseId)
                .reduce((sum, item) => sum + (item.quantity_available || 0), 0);
            return <Tag color={total > 0 ? "green" : "red"}>{total}</Tag>;
        }},
        { title: 'Qty Requested', dataIndex: 'quantity_requested', key: 'quantity_requested', width: '15%', render: (_: any, record: LineItem) => (
            <InputNumber min={1} style={{ width: '100%' }} value={record.quantity_requested}
                onChange={(value) => handleLineChange(record.key, 'quantity_requested', value!)} />
        )},
        { title: 'Action', key: 'action', width: '5%', render: (_: any, record: LineItem) => (
            <Popconfirm title="Sure to delete?" onConfirm={() => handleRemoveLine(record.key)}>
                <Button icon={<DeleteOutlined />} danger type="text" />
            </Popconfirm>
        )}
    ];

    return (
        <Spin spinning={loading || profileLoading}>
            <Form form={form} layout="vertical">
                <Card title="Create Goods Issue" className="mb-4">
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="warehouse_id" label="Warehouse" rules={[{ required: true }]}>
                            <Select showSearch placeholder="Select Warehouse" options={warehouses.map(w => ({ value: w.id, label: w.name }))} />
                        </Form.Item></Col>
                        <Col span={8}><Form.Item name="customer_id" label="Customer">
                            <Select showSearch placeholder="Select Customer" options={customers.map(s => ({ value: s.id, label: s.name }))} allowClear/>
                        </Form.Item></Col>
                        <Col span={8}><Form.Item name="expected_date" label="Expected Date">
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item></Col>
                        <Col span={8}><Form.Item name="sales_order_number" label="Sales Order Number">
                           <Input placeholder="SO Number"/>
                        </Form.Item></Col>
                         <Col span={16}><Form.Item name="notes" label="Notes">
                            <Input.TextArea rows={1} placeholder="Enter notes" />
                        </Form.Item></Col>
                    </Row>
                </Card>

                <Card>
                    <Row justify="space-between" align="middle" className="mb-4">
                        <Col>
                            <Space align="center">
                                <Typography.Title level={5} style={{ margin: 0 }}>Items</Typography.Title>
                                <Tooltip title="Summary mode automatically allocates stock via FIFO during submission. Detail mode requires you to specify the exact stock to pick.">
                                  <Radio.Group value={issueMode} onChange={(e) => setIssueMode(e.target.value)}>
                                      <Radio.Button value="SUMMARY">Summary</Radio.Button>
                                      <Radio.Button value="DETAIL">Detail</Radio.Button>
                                  </Radio.Group>
                                </Tooltip>
                            </Space>
                        </Col>
                        <Col>
                            <Button icon={<PlusOutlined />} onClick={handleAddLine} disabled={!selectedWarehouseId}>
                                {selectedWarehouseId ? "Add line" : "Select Warehouse First"}
                            </Button>
                        </Col>
                    </Row>
                    <Table
                        columns={issueMode === 'SUMMARY' ? summaryColumns : detailColumns}
                        dataSource={lines} rowKey="key" pagination={false} bordered size="small"
                    />
                </Card>

                <Affix offsetBottom={0}>
                    <Card className="mt-4 p-0 border-t">
                        <Row justify="end"><Col><Space>
                            <Button danger icon={<CloseOutlined />} onClick={() => navigate('/operations/gi')}>Cancel</Button>
                            <Button icon={<SaveOutlined />} onClick={() => handleSubmit('draft')} loading={loading}>Save Draft</Button>
                            <Button type="primary" icon={<SaveOutlined />} onClick={() => handleSubmit('submit')} loading={loading}>Submit for Approval</Button>
                        </Space></Col></Row>
                    </Card>
                </Affix>
            </Form>
        </Spin>
    );
};

const GICreatePageWrapper: React.FC = () => ( <App><GICreatePage /></App> );
export default GICreatePageWrapper;
