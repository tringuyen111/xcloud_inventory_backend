import React, { useEffect, useState, useMemo } from 'react';
import {
    App, Button, Card, Form, Input, Spin, Select, Row, Col, Affix, DatePicker, Table, InputNumber, Popconfirm,
    Space, Tag
} from 'antd';
import { SaveOutlined, CloseOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { goodsTransferAPI, warehouseAPI, goodsModelAPI, uomAPI, inventoryAPI } from '../../../utils/apiClient';
import { transactionsClient, supabase } from '../../../lib/supabase';
import { Database } from '../../../types/supabase';
import { useUserProfile } from '../../../hooks/useUserProfile';
import dayjs from 'dayjs';

// Define types from Supabase schema
type GTHeaderInsert = Database['transactions']['Tables']['gt_header']['Insert'];
type GTLineInsert = Database['transactions']['Tables']['gt_lines']['Insert'];
type Warehouse = Database['master']['Tables']['warehouses']['Row'];
type GoodsModel = Database['master']['Tables']['goods_models']['Row'];
type Uom = Database['master']['Tables']['uoms']['Row'];
type OnhandItem = Database['inventory']['Tables']['onhand']['Row'];

// Local state type for line items
interface LineItem {
    key: string;
    goods_model_id: string | null;
    quantity: number;
}

const GTCreatePage: React.FC = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { notification } = App.useApp();
    const { profile, loading: profileLoading } = useUserProfile();

    // Data loading states
    const [loading, setLoading] = useState(false);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [goodsModels, setGoodsModels] = useState<GoodsModel[]>([]);
    const [uoms, setUoms] = useState<Uom[]>([]);
    const [onhandStock, setOnhandStock] = useState<OnhandItem[]>([]);

    // Form state
    const [lines, setLines] = useState<LineItem[]>([]);
    const fromWarehouseId = Form.useWatch('from_warehouse_id', form);
    
    const goodsModelsMap = useMemo(() => new Map(goodsModels.map(gm => [gm.id, gm])), [goodsModels]);
    const uomsMap = useMemo(() => new Map(uoms.map(u => [u.id, u.name])), [uoms]);

    // Fetch initial master data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [whRes, gmRes, uomRes, onhandRes] = await Promise.all([
                    warehouseAPI.list(),
                    goodsModelAPI.list(),
                    uomAPI.list(),
                    inventoryAPI.list()
                ]);
                setWarehouses(whRes || []);
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
        const newLine: LineItem = { key: `new_${Math.random()}`, goods_model_id: null, quantity: 1 };
        setLines([...lines, newLine]);
    };

    const handleLineChange = (key: string, field: keyof LineItem, value: any) => {
        setLines(lines.map(line => line.key === key ? { ...line, [field]: value } : line));
    };

    const handleRemoveLine = (key: string) => setLines(lines.filter(line => line.key !== key));

    const handleSubmit = async (action: 'draft' | 'confirm') => {
        if (!profile?.organization_uuid || !profile.id) {
            notification.error({ message: 'User profile/organization not found.' }); return;
        }
        if (lines.length === 0 || lines.some(l => !l.goods_model_id)) {
            notification.warning({ message: 'Please add at least one valid item.' }); return;
        }

        try {
            const headerValues = await form.validateFields();
            if (headerValues.from_warehouse_id === headerValues.to_warehouse_id) {
                throw new Error("From and To warehouses cannot be the same.");
            }
            setLoading(true);

            const headerPayload: GTHeaderInsert = {
                ...headerValues,
                document_date: dayjs().toISOString(), // Set document date to now
                expected_date: headerValues.expected_date ? dayjs(headerValues.expected_date).toISOString() : null,
                status: 'DRAFT',
                organization_id: profile.organization_uuid,
                created_by: profile.id,
            };

            const createdHeader = await goodsTransferAPI.create(headerPayload);
            if (!createdHeader?.id) throw new Error("Failed to create Goods Transfer header.");

            const linesPayload: Omit<GTLineInsert, 'from_location_id' | 'to_location_id'>[] = lines.map((line, index) => {
                const model = goodsModelsMap.get(line.goods_model_id!);
                if (!model) throw new Error(`Model details not found.`);
                return {
                    gt_header_id: createdHeader.id,
                    goods_model_id: line.goods_model_id!,
                    uom_id: model.base_uom_id,
                    quantity: line.quantity || 0,
                    line_number: index + 1,
                };
            });

            if (linesPayload.length > 0) {
                 // Note: from_location_id and to_location_id are handled by the RPC.
                const { error: linesError } = await transactionsClient.from('gt_lines').insert(linesPayload as any);
                if (linesError) throw new Error(`Failed to save lines: ${linesError.message}`);
            }

            if (action === 'confirm') {
                const { error: rpcError } = await supabase.rpc('gt_confirm', { p_gt_header_id: createdHeader.id });
                if (rpcError) throw new Error(`Failed to confirm transfer: ${rpcError.message}`);
            }

            notification.success({ message: `Goods Transfer saved as ${action === 'draft' ? 'Draft' : 'In Transit'} successfully.` });
            navigate('/operations/gt');

        } catch (error: any) {
            notification.error({ message: 'Operation Failed', description: error.message });
        } finally {
            setLoading(false);
        }
    };
    
    const lineItemColumns = [
        { title: 'Goods Model', dataIndex: 'goods_model_id', key: 'goods_model_id', width: '30%', render: (_: any, record: LineItem) => (
            <Select showSearch placeholder="Select Model" style={{ width: '100%' }} value={record.goods_model_id}
                onChange={(value) => handleLineChange(record.key, 'goods_model_id', value)} optionFilterProp="label"
                options={goodsModels.map(gm => ({ value: gm.id, label: `${gm.name} (${gm.code})` }))} />
        )},
        {
            title: 'Tracking Type',
            key: 'tracking_type',
            width: '15%',
            render: (_: any, record: LineItem) => {
                const model = record.goods_model_id ? goodsModelsMap.get(record.goods_model_id) : null;
                return model ? <Tag>{model.tracking_type}</Tag> : '-';
            }
        },
        { title: 'UoM', key: 'uom', width: '10%', render: (_: any, record: LineItem) => {
            const model = record.goods_model_id ? goodsModelsMap.get(record.goods_model_id) : null;
            return model ? uomsMap.get(model.base_uom_id) : '-';
        }},
        { title: 'Available Qty', key: 'available_qty', width: '15%', render: (_: any, record: LineItem) => {
            if (!record.goods_model_id || !fromWarehouseId) return <Tag color="orange">Select Warehouse & Model</Tag>;
            const total = onhandStock
                .filter(s => s.goods_model_id === record.goods_model_id && s.warehouse_id === fromWarehouseId)
                .reduce((sum, item) => sum + (item.quantity_available || 0), 0);
            return <Tag color={total > 0 ? "green" : "red"}>{total}</Tag>;
        }},
        { title: 'Qty to Transfer', dataIndex: 'quantity', key: 'quantity', width: '15%', render: (_: any, record: LineItem) => (
            <InputNumber min={1} style={{ width: '100%' }} value={record.quantity}
                onChange={(value) => handleLineChange(record.key, 'quantity', value!)} />
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
                <Card title="Create Goods Transfer" className="mb-4">
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="from_warehouse_id" label="From Warehouse" rules={[{ required: true }]}>
                            <Select showSearch placeholder="Select source warehouse" options={warehouses.map(w => ({ value: w.id, label: w.name }))} />
                        </Form.Item></Col>
                        <Col span={8}><Form.Item name="to_warehouse_id" label="To Warehouse" rules={[{ required: true }]}>
                            <Select showSearch placeholder="Select destination warehouse" options={warehouses.map(w => ({ value: w.id, label: w.name }))} />
                        </Form.Item></Col>
                         <Col span={8}><Form.Item name="expected_date" label="Expected Date">
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item></Col>
                    </Row>
                     <Row gutter={16}>
                        <Col span={8}><Form.Item name="carrier_name" label="Carrier">
                           <Input placeholder="e.g., GHN, Viettel Post"/>
                        </Form.Item></Col>
                         <Col span={8}><Form.Item name="vehicle_number" label="Vehicle Number">
                           <Input placeholder="e.g., 51C-12345"/>
                        </Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                         <Col span={24}><Form.Item name="notes" label="Notes">
                            <Input.TextArea rows={2} placeholder="Enter notes for the transfer" />
                        </Form.Item></Col>
                    </Row>
                </Card>

                <Card title="Items" extra={<Button icon={<PlusOutlined />} onClick={handleAddLine} disabled={!fromWarehouseId}>Add line</Button>}>
                    <Table
                        columns={lineItemColumns}
                        dataSource={lines} rowKey="key" pagination={false} bordered size="small"
                    />
                </Card>

                <Affix offsetBottom={0}>
                    <Card className="mt-4 p-0 border-t">
                        <Row justify="end"><Col><Space>
                            <Button danger icon={<CloseOutlined />} onClick={() => navigate('/operations/gt')}>Cancel</Button>
                            <Button icon={<SaveOutlined />} onClick={() => handleSubmit('draft')} loading={loading}>Save Draft</Button>
                            <Button type="primary" icon={<SaveOutlined />} onClick={() => handleSubmit('confirm')} loading={loading}>Confirm Transfer</Button>
                        </Space></Col></Row>
                    </Card>
                </Affix>
            </Form>
        </Spin>
    );
};

const GTCreatePageWrapper: React.FC = () => ( <App><GTCreatePage /></App> );
export default GTCreatePageWrapper;