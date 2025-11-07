

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import {
    Warehouse,
    Location,
    Database,
    GoodsModel,
    Uom,
    Onhand
} from '../../../types/supabase';
import {
    Button,
    Card,
    Form,
    Input,
    Row,
    Col,
    Space,
    App,
    Spin,
    Select,
    Table,
    Popconfirm,
    InputNumber,
    Typography,
    Radio,
    DatePicker,
    AutoComplete,
    Modal
} from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
    SaveOutlined,
    CheckOutlined,
    RollbackOutlined,
    SelectOutlined
} from '@ant-design/icons';
import useAuthStore from '../../../stores/authStore';
import PageHeader from '../../../components/layout/PageHeader';
import dayjs from 'dayjs';

// --- Type Definitions ---
type GITransactionType = Database['public']['Enums']['gi_transaction_type_enum'];
type GoodsModelWithOptions = GoodsModel & { base_uom: Uom | null };
type PartnerWithOptions = { id: number; name: string };
type OnhandWithLocation = Onhand & { locations: { code: string } | null };

type LineDetail = {
    onhand_id: number;
    location_code: string;
    lot_number?: string | null;
    serial_number?: string | null;
    quantity_allocated: number;
    available_quantity: number;
};

type EditableLine = {
    key: number;
    id?: number; // DB ID
    goods_model_id?: number;
    quantity_planned: number;
    uom_name?: string;
    uom_id?: number;
    tracking_type?: 'NONE' | 'LOT' | 'SERIAL';
    details: LineDetail[];
};

const GI_TRANSACTION_TYPES: {label: string, value: GITransactionType}[] = [
    { label: "Sales", value: "SALES" },
    { label: "Transfer Out", value: "TRANSFER_OUT" },
    { label: "Adjustment Out", value: "ADJUSTMENT_OUT" },
    { label: "Return to Supplier", value: "RETURN_TO_SUPPLIER" },
    { label: "Scrap", value: "SCRAP" },
    { label: "Production", value: "PRODUCTION" },
    { label: "Internal Use", value: "INTERNAL_USE" },
    { label: "Other", value: "OTHER" },
];

const GICreateEditPage: React.FC = () => {
    const navigate = useNavigate();
    const { id: giId } = useParams<{ id: string }>();
    const [form] = Form.useForm();
    const { notification, modal } = App.useApp();
    const user = useAuthStore((state) => state.user);
    const selectedWarehouseId = Form.useWatch('warehouse_id', form);
    const issueMode = Form.useWatch('issue_mode', form);
    const transactionType = Form.useWatch('transaction_type', form);
    
    const isEditMode = !!giId;

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [partners, setPartners] = useState<PartnerWithOptions[]>([]);
    const [goodsModels, setGoodsModels] = useState<GoodsModelWithOptions[]>([]);
    
    const [lines, setLines] = useState<EditableLine[]>([]);
    const [nextKey, setNextKey] = useState(1);
    
    const [modalVisible, setModalVisible] = useState(false);
    const [currentLineKey, setCurrentLineKey] = useState<number | null>(null);
    const [onhandStock, setOnhandStock] = useState<OnhandWithLocation[]>([]);
    // FIX: Changed object key type from number to string for state to fix type inference issues.
    const [selectedOnhand, setSelectedOnhand] = useState<{[key: string]: number}>({});
    const [onhandLoading, setOnhandLoading] = useState(false);

    const fetchDependencies = useCallback(async () => {
        try {
            const [whRes, partnerRes, gmRes] = await Promise.all([
                supabase.from('warehouses').select('id, name').eq('is_active', true),
                supabase.from('partners').select('id, name').eq('is_active', true),
                supabase.from('goods_models').select('*, base_uom:uoms(*)').eq('is_active', true)
            ]);
            if (whRes.error) throw whRes.error;
            if (partnerRes.error) throw partnerRes.error;
            if (gmRes.error) throw gmRes.error;
            
            setWarehouses(whRes.data || []);
            setPartners(partnerRes.data || []);
            setGoodsModels((gmRes.data as any[]) || []);
        } catch (error) {
            notification.error({ message: 'Error fetching dependencies', description: (error as Error).message });
        }
    }, [notification]);

    useEffect(() => {
        const initialize = async () => {
            setLoading(true);
            await fetchDependencies();
            // TODO: Add fetch logic for edit mode when it's needed
            setLoading(false);
        };
        initialize();
    }, [fetchDependencies, isEditMode]);

    const handleAddLine = () => {
        setLines(prev => [...prev, { key: nextKey, quantity_planned: 1, details: [] }]);
        setNextKey(p => p + 1);
    };

    const handleLineChange = (key: number, field: keyof EditableLine, value: any) => {
        setLines(currentLines => currentLines.map(line => {
            if (line.key === key) {
                const updatedLine = { ...line, [field]: value };
                if (field === 'goods_model_id') {
                    const model = goodsModels.find(m => m.id === value);
                    updatedLine.uom_name = model?.base_uom?.name;
                    updatedLine.uom_id = model?.base_uom?.id;
                    updatedLine.tracking_type = model?.tracking_type;
                    updatedLine.details = []; // Reset details if model changes
                    updatedLine.quantity_planned = 1;
                }
                return updatedLine;
            }
            return line;
        }));
    };
    
    const handleRemoveLine = (key: number) => {
        setLines(currentLines => currentLines.filter(line => line.key !== key));
    };

    const openOnhandModal = async (line: EditableLine) => {
        if (!line.goods_model_id || !selectedWarehouseId) {
            notification.warning({ message: "Please select a warehouse and a goods model first." });
            return;
        }
        setCurrentLineKey(line.key);
        setOnhandLoading(true);
        setModalVisible(true);
        try {
            const { data, error } = await supabase
                .from('onhand')
                .select('*, locations(code)')
                .eq('warehouse_id', selectedWarehouseId)
                .eq('goods_model_id', line.goods_model_id)
                .gt('available_quantity', 0);
            if (error) throw error;
            setOnhandStock(data as OnhandWithLocation[]);
            // Pre-fill selected quantities from line details
            // FIX: Changed object key type from number to string to match state type.
            const initialSelection: {[key: string]: number} = {};
            line.details.forEach(d => { initialSelection[d.onhand_id] = d.quantity_allocated });
            setSelectedOnhand(initialSelection);
        } catch (error: any) {
            notification.error({ message: "Failed to fetch onhand stock", description: error.message });
        } finally {
            setOnhandLoading(false);
        }
    };

    const handleModalOk = () => {
        if (currentLineKey === null) return;
        const newDetails: LineDetail[] = Object.entries(selectedOnhand)
            // FIX: Cast `qty` to number to fix type error where it was inferred as `unknown`.
            .filter(([, qty]) => (qty as number) > 0)
            .map(([onhandIdStr, qty]) => {
                const onhandId = parseInt(onhandIdStr);
                const stockItem = onhandStock.find(s => s.id === onhandId);
                return {
                    onhand_id: onhandId,
                    location_code: stockItem?.locations?.code || 'N/A',
                    lot_number: stockItem?.lot_number,
                    serial_number: stockItem?.serial_number,
                    // FIX: Cast `qty` to number to fix type error on assignment.
                    quantity_allocated: qty as number,
                    available_quantity: stockItem?.available_quantity || 0,
                };
            });
        
        const totalPlanned = newDetails.reduce((sum, d) => sum + d.quantity_allocated, 0);
        
        setLines(lines.map(l => l.key === currentLineKey ? { ...l, details: newDetails, quantity_planned: totalPlanned } : l));
        setModalVisible(false);
        setCurrentLineKey(null);
        setSelectedOnhand({});
    };

    const handleSubmit = async (isDraft: boolean) => {
        setIsSaving(true);
        try {
            if (!user) throw new Error('You must be logged in.');
            const headerValues = await form.validateFields();
            const status = isDraft ? 'DRAFT' : 'CREATED';

            if (!isDraft && lines.length === 0) {
                throw new Error('Please add at least one valid line item.');
            }
            
            const linesToInsert = lines
                .filter(l => l.goods_model_id && l.quantity_planned && l.quantity_planned > 0 && l.uom_id && l.tracking_type);

            if (!isDraft && linesToInsert.length === 0) {
                throw new Error('All line items must have a Goods Model and a valid Planned Quantity.');
            }
            
            // 1. Insert Header
            const { data: headerData, error: headerError } = await supabase
                .from('goods_issues')
                .insert({
                    ...headerValues,
                    issue_date: headerValues.issue_date ? dayjs(headerValues.issue_date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
                    status,
                    created_by: user.id,
                }).select().single();

            if (headerError) throw headerError;
            if (!headerData) throw new Error("Failed to create goods issue header.");

            const new_gi_id = headerData.id;

            // 2. Insert Lines & Details
            for (const line of linesToInsert) {
                const { data: lineData, error: lineError } = await supabase
                    .from('gi_lines')
                    .insert({
                        gi_id: new_gi_id,
                        goods_model_id: line.goods_model_id!,
                        quantity_planned: line.quantity_planned!,
                        uom_id: line.uom_id!,
                        tracking_type: line.tracking_type!,
                    }).select().single();

                if (lineError) throw lineError;
                if (!lineData) throw new Error("Failed to create a line item.");
                
                // For Detail mode, insert the allocation details
                if (issueMode === 'DETAIL' && line.details.length > 0) {
                    const detailsToInsert = line.details.map(d => ({
                        gi_line_id: lineData.id,
                        onhand_id: d.onhand_id,
                        quantity_allocated: d.quantity_allocated,
                        allocation_method: 'MANUAL',
                        // These are duplicated for easier access on PDA if needed
                        warehouse_id: selectedWarehouseId,
                        location_id: onhandStock.find(s => s.id === d.onhand_id)?.location_id,
                        goods_model_id: line.goods_model_id!,
                        lot: d.lot_number,
                        serial: d.serial_number,
                        created_by: user.id
                    }));
                    
                    const { error: detailError } = await supabase.from('gi_line_details').insert(detailsToInsert as any);
                    if (detailError) throw detailError;
                }
            }

            notification.success({ message: `Goods Issue successfully created (ID: ${new_gi_id})` });
            navigate(`/operations/gi/${new_gi_id}`);
    
        } catch (error: any) {
            notification.error({ message: 'Submission Failed', description: error.message || 'Please check the form for errors.', duration: 10 });
        } finally {
            setIsSaving(false);
        }
    };
    
    const goodsModelOptions = useMemo(() => goodsModels.map(gm => ({ 
        value: gm.id, 
        label: `[${gm.code}] ${gm.name}` 
    })), [goodsModels]);
    
    const lineColumns: any[] = [
        { title: 'Goods Model', dataIndex: 'goods_model_id', width: '30%', render: (_: any, record: EditableLine) => (
            <Select showSearch allowClear value={record.goods_model_id} placeholder="Search model..." options={goodsModelOptions} onChange={(value) => handleLineChange(record.key, 'goods_model_id', value)} filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} style={{ width: '100%' }} />
        )},
        { title: 'UoM', dataIndex: 'uom_name', width: '8%', render: (text: string) => <Typography.Text>{text || '-'}</Typography.Text> },
        { title: 'Planned Qty', dataIndex: 'quantity_planned', width: '12%', align: 'right' as const, render: (_: any, record: EditableLine) => (
            <InputNumber min={1} value={record.quantity_planned} onChange={(value) => handleLineChange(record.key, 'quantity_planned', value)} style={{ width: '100%' }} disabled={issueMode === 'DETAIL'} />
        )},
        ...(issueMode === 'DETAIL' ? [{ 
            title: 'Stock Allocation', key: 'allocation', width: '25%', render: (_: any, record: EditableLine) => (
                <Space>
                    <Button icon={<SelectOutlined/>} onClick={() => openOnhandModal(record)}>Select Stock</Button>
                    {/* FIX: Use Typography.Text to resolve component name collision and fix type error. */}
                    <Typography.Text type="secondary">{record.details.length} batch(es) selected</Typography.Text>
                </Space>
            )}] 
        : []),
        { title: 'Action', key: 'action', width: '5%', align: 'center' as const, render: (_: any, record: EditableLine) => (
            <Popconfirm title="Sure to delete?" onConfirm={() => handleRemoveLine(record.key)}>
                <Button icon={<DeleteOutlined />} danger type="text" />
            </Popconfirm>
        )},
    ];

    if (loading) return <Spin fullscreen />;
    const title = isEditMode ? `Edit Goods Issue (GI-${giId})` : "Create Goods Issue";
    const description = isEditMode ? "Update details for this goods issue." : "Create a new goods issue for outgoing inventory.";
    
    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <PageHeader title={title} description={description} />
            <Form form={form} layout="vertical" initialValues={{ transaction_type: 'SALES', issue_mode: 'DETAIL', issue_date: dayjs() }}>
                <Card title="Information">
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="transaction_type" label="Transaction Type" rules={[{ required: true }]}><Select options={GI_TRANSACTION_TYPES} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="warehouse_id" label="From Warehouse" rules={[{ required: true }]}><Select showSearch filterOption placeholder="Select warehouse" options={warehouses.map(w => ({ label: w.name, value: w.id }))} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="issue_date" label="Expected Issue Date"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                        
                        {transactionType === 'TRANSFER_OUT' && (
                            <Col span={8}><Form.Item name="warehouse_to_id" label="To Warehouse" rules={[{ required: true }]}><Select showSearch filterOption placeholder="Select destination warehouse" options={warehouses.filter(w => w.id !== selectedWarehouseId).map(w => ({ label: w.name, value: w.id }))} /></Form.Item></Col>
                        )}
                        {(transactionType === 'SALES' || transactionType === 'RETURN_TO_SUPPLIER') && (
                           <>
                            <Col span={8}>
                                <Form.Item name="partner_id" label={transactionType === 'SALES' ? 'Customer' : 'Supplier'} rules={[{ required: true }]}>
                                    <Select showSearch placeholder="Select partner" options={partners.map(p => ({ label: p.name, value: p.id }))} filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}/>
                                </Form.Item>
                            </Col>
                            {transactionType === 'SALES' && <Col span={16}><Form.Item name="delivery_address" label="Delivery Address"><Input placeholder="Enter delivery address" /></Form.Item></Col>}
                           </>
                        )}

                        <Col span={8}><Form.Item name="reference_number" label="Reference"><Input placeholder="e.g., SO-123, DO-456" /></Form.Item></Col>
                        <Col span={24}><Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item></Col>
                    </Row>
                </Card>
                <Card 
                  title="Line Items" 
                  extra={
                    <Space>
                      <Form.Item name="issue_mode" label="Issue Mode" style={{marginBottom: 0}}>
                        <Radio.Group>
                          <Radio.Button value="DETAIL">Detail</Radio.Button>
                          <Radio.Button value="SUMMARY">Summary</Radio.Button>
                        </Radio.Group>
                      </Form.Item>
                      <Button icon={<PlusOutlined />} onClick={handleAddLine} type="dashed">Add Item</Button>
                    </Space>
                  }
                >
                    <Typography.Paragraph type="secondary" style={{marginTop: -10, marginBottom: 16}}>
                        {issueMode === 'DETAIL' 
                            ? "In Detail mode, you must specify the exact stock to be picked for each item."
                            : "In Summary mode, the system will automatically allocate stock using FIFO logic when picking starts."}
                    </Typography.Paragraph>
                    <Table dataSource={lines} columns={lineColumns} pagination={false} rowKey="key" size="small" scroll={{ x: 1200 }} />
                </Card>
            </Form>
            <Row justify="end" style={{marginTop: 16}}>
                <Space>
                    <Button icon={<RollbackOutlined />} onClick={() => navigate('/operations/gi')} danger>Cancel</Button>
                    <Button icon={<SaveOutlined />} onClick={() => handleSubmit(true)} loading={isSaving}>Save as Draft</Button>
                    <Button type="primary" icon={<CheckOutlined />} onClick={() => handleSubmit(false)} loading={isSaving}>{isEditMode ? 'Update Issue' : 'Create Issue'}</Button>
                </Space>
            </Row>

            <Modal
                title="Select Onhand Stock"
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={() => setModalVisible(false)}
                width={800}
                confirmLoading={onhandLoading}
            >
                <Table
                    loading={onhandLoading}
                    dataSource={onhandStock}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    scroll={{y: 400}}
                    columns={[
                        { title: 'Location', dataIndex: ['locations', 'code'], key: 'location'},
                        { title: 'Lot/Serial', key: 'tracking', render: (_, r: OnhandWithLocation) => r.lot_number || r.serial_number || 'N/A' },
                        { title: 'Available Qty', dataIndex: 'available_quantity', key: 'available_quantity', align: 'right'},
                        { title: 'Qty to Issue', key: 'qty_to_issue', width: 120, render: (_, r: OnhandWithLocation) => (
                            <InputNumber 
                                min={0} 
                                max={r.available_quantity!}
                                value={selectedOnhand[r.id] || 0}
                                onChange={(val) => setSelectedOnhand(prev => ({...prev, [r.id]: val || 0}))}
                            />
                        )}
                    ]}
                />
            </Modal>
        </Space>
    );
};

const GICreatePageWrapper: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    return (
        <App>
            <GICreateEditPage key={id} />
        </App>
    );
};

export default GICreatePageWrapper;