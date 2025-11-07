import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import {
    Warehouse,
    Location,
    Database
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
    DatePicker,
    AutoComplete
} from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
    SaveOutlined,
    CheckOutlined,
    RollbackOutlined
} from '@ant-design/icons';
import useAuthStore from '../../../stores/authStore';
import PageHeader from '../../../components/layout/PageHeader';
import dayjs from 'dayjs';

// --- Type Definitions ---
type GRTransactionType = Database['public']['Enums']['gr_transaction_type_enum'];
type GoodsModelWithOptions = {
    id: number;
    code: string;
    name: string;
    tracking_type: 'NONE' | 'LOT' | 'SERIAL';
    base_uom: { id: number; name: string } | null;
};
type PartnerWithOptions = { id: number; name: string };

type EditableLine = {
    key: number;
    id?: number;
    goods_model_id?: number;
    location_id?: number | null;
    quantity_planned?: number;
    quantity_received?: number | null;
    lot_number?: string | null;
    serial_number?: string | null;
    expiry_date?: string | null;
    uom_name?: string;
    uom_id?: number;
    tracking_type?: 'NONE' | 'LOT' | 'SERIAL';
};

const GR_TRANSACTION_TYPES: GRTransactionType[] = [
    "PURCHASE", "PRODUCTION", "RETURN_FROM_CUSTOMER", "TRANSFER_IN", "ADJUSTMENT_IN", "OTHER"
];

// --- Main Component ---
const GRCreateEditPage: React.FC = () => {
    const navigate = useNavigate();
    const { id: grId } = useParams<{ id: string }>();
    const [form] = Form.useForm();
    const { notification } = App.useApp();
    const user = useAuthStore((state) => state.user);
    const selectedWarehouseId = Form.useWatch('warehouse_id', form);
    const transactionType = Form.useWatch('transaction_type', form);
    
    const isEditMode = !!grId;

    // --- State Management ---
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [partners, setPartners] = useState<PartnerWithOptions[]>([]);
    const [goodsModels, setGoodsModels] = useState<GoodsModelWithOptions[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);

    const [lines, setLines] = useState<EditableLine[]>([]);
    const [nextKey, setNextKey] = useState(1);
    const [linesToDelete, setLinesToDelete] = useState<number[]>([]);

    // --- Data Fetching ---
    const fetchDependencies = useCallback(async () => {
        try {
            const [whRes, partnerRes, gmRes] = await Promise.all([
                supabase.from('warehouses').select('id, name').eq('is_active', true),
                supabase.from('partners').select('id, name').eq('is_active', true),
                supabase.from('goods_models').select('id, code, name, tracking_type, base_uom:uoms(id, name)').eq('is_active', true)
            ]);
            if (whRes.error) throw whRes.error;
            if (partnerRes.error) throw partnerRes.error;
            if (gmRes.error) throw gmRes.error;
            
            const models = gmRes.data as any[] || [];
            setWarehouses(whRes.data || []);
            setPartners(partnerRes.data || []);
            setGoodsModels(models);
            return models;
        } catch (error) {
            notification.error({ message: 'Error fetching dependencies', description: (error as Error).message });
            throw error;
        }
    }, [notification]);

    const fetchGrForEdit = useCallback(async (currentGoodsModels: GoodsModelWithOptions[]) => {
        if (!grId) return;
        try {
            const { data, error } = await supabase.from('goods_receipts').select('*, gr_lines(*)').eq('id', grId).single();
            if (error) throw error;
            
            form.setFieldsValue({
                ...data,
                receipt_date: data.receipt_date ? dayjs(data.receipt_date) : null,
            });

            const loadedLines = data.gr_lines.map((line, index) => {
                const model = currentGoodsModels.find(m => m.id === line.goods_model_id);
                return {
                    ...line,
                    key: -(index + 1), // Use negative keys for existing items
                    uom_name: model?.base_uom?.name || '',
                    uom_id: model?.base_uom?.id,
                    tracking_type: model?.tracking_type,
                    expiry_date: line.expiry_date ? dayjs(line.expiry_date).toString() : undefined,
                };
            });
            setLines(loadedLines);
            setNextKey(1);

        } catch (error) {
             notification.error({ message: 'Error fetching Goods Receipt data', description: (error as Error).message });
             throw error;
        }
    }, [grId, form, notification]);
    
    useEffect(() => {
        const initialize = async () => {
            setLoading(true);
            try {
                const fetchedModels = await fetchDependencies();
                if (isEditMode) {
                    await fetchGrForEdit(fetchedModels);
                }
            } catch (error) {
                // Errors are handled in the fetch functions
            } finally {
                setLoading(false);
            }
        };
        initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditMode]);

    useEffect(() => {
        if (selectedWarehouseId) {
            supabase.from('locations').select('id, name, code').eq('warehouse_id', selectedWarehouseId).eq('is_active', true)
                .then(({ data, error }) => {
                    if (error) notification.error({ message: 'Failed to fetch locations', description: error.message });
                    else setLocations(data || []);
                });
        } else {
            setLocations([]);
        }
    }, [selectedWarehouseId, notification]);

    // --- UI Handlers for Lines ---
    const handleAddLine = () => {
        setLines(prev => [...prev, { key: nextKey, quantity_planned: 1 }]);
        setNextKey(p => p + 1);
    }

    const handleLineChange = (key: number, field: keyof EditableLine, value: any) => {
        setLines(currentLines => currentLines.map(line => {
            if (line.key === key) {
                const updatedLine = { ...line, [field]: value };
                if (field === 'goods_model_id') {
                    const model = goodsModels.find(m => m.id === value);
                    updatedLine.uom_name = model?.base_uom?.name;
                    updatedLine.uom_id = model?.base_uom?.id;
                    updatedLine.tracking_type = model?.tracking_type;
                }
                return updatedLine;
            }
            return line;
        }));
    };
    
    const handleRemoveLine = (key: number) => {
        const lineToRemove = lines.find(l => l.key === key);
        if (lineToRemove?.id) { 
            setLinesToDelete(prev => [...prev, lineToRemove.id!]);
        }
        setLines(currentLines => currentLines.filter(line => line.key !== key));
    };

    // --- Submission Logic ---
    const handleSubmit = async (isDraft: boolean) => {
        setIsSaving(true);
        try {
            if (!user) throw new Error('You must be logged in.');
            const headerValues = await form.validateFields();
            const status = isDraft ? 'DRAFT' : 'CREATED';
    
            if (!isDraft && lines.length === 0) {
                throw new Error('Please add at least one valid line item.');
            }

            const partnerName = headerValues.partner_id 
                ? partners.find(p => p.id === headerValues.partner_id)?.name || null
                : null;
            
            const linesToUpsert = lines
                .filter(l => l.goods_model_id && l.quantity_planned && l.quantity_planned > 0 && l.uom_id && l.tracking_type)
                .map(l => ({
                    id: l.id,
                    goods_model_id: l.goods_model_id!,
                    uom_id: l.uom_id!,
                    tracking_type: l.tracking_type!,
                    location_id: l.location_id || null,
                    quantity_planned: l.quantity_planned!,
                    quantity_received: l.quantity_received ?? 0,
                    lot_number: l.lot_number || null,
                    serial_number: l.serial_number || null,
                    expiry_date: l.expiry_date ? dayjs(l.expiry_date).format('YYYY-MM-DD') : null,
                }));
            
            if (!isDraft && linesToUpsert.length === 0) {
                throw new Error('All line items must have a Goods Model and a valid Planned Quantity.');
            }
    
            if (isEditMode) {
                // UPDATE LOGIC
                const { data: headerData, error: headerError } = await supabase
                    .from('goods_receipts')
                    .update({
                        ...headerValues,
                        status,
                        receipt_date: headerValues.receipt_date ? dayjs(headerValues.receipt_date).format('YYYY-MM-DD') : null,
                        partner_name: partnerName,
                        updated_by: user.id,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', grId)
                    .select()
                    .single();
                
                if (headerError) throw headerError;
                if (!headerData) throw new Error("Failed to update GR header.");

                const newLines = linesToUpsert.filter(l => !l.id).map(l => ({ ...l, gr_id: headerData.id }));
                const updatedLines = linesToUpsert.filter(l => l.id);

                if (newLines.length > 0) {
                    const { error: insertError } = await supabase.from('gr_lines').insert(newLines as any);
                    if (insertError) throw insertError;
                }
                if (updatedLines.length > 0) {
                    for (const line of updatedLines) {
                        const { error: updateError } = await supabase.from('gr_lines').update(line).eq('id', line.id!);
                        if (updateError) throw updateError;
                    }
                }
                if (linesToDelete.length > 0) {
                    const { error: deleteError } = await supabase.from('gr_lines').delete().in('id', linesToDelete);
                    if (deleteError) throw deleteError;
                }
                
                notification.success({ message: `Goods Receipt successfully updated (ID: ${headerData.id})` });
                navigate(`/operations/gr/${headerData.id}`);

            } else {
                // CREATE LOGIC
                const { data: headerData, error: headerError } = await supabase
                    .from('goods_receipts')
                    .insert({
                        warehouse_id: headerValues.warehouse_id,
                        receipt_date: headerValues.receipt_date ? dayjs(headerValues.receipt_date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
                        transaction_type: headerValues.transaction_type,
                        status,
                        partner_id: headerValues.partner_id || null,
                        partner_name: partnerName,
                        partner_reference: headerValues.partner_reference || null,
                        reference_number: headerValues.reference_number || null,
                        notes: headerValues.notes || null,
                        created_by: user.id,
                        warehouse_from_id: headerValues.warehouse_from_id || null,
                    })
                    .select()
                    .single();

                if (headerError) throw headerError;
                if (!headerData) throw new Error("Failed to create goods receipt header.");

                const new_gr_id = headerData.id;

                if (linesToUpsert.length > 0) {
                    const linesWithGrId = linesToUpsert.map(l => ({...l, gr_id: new_gr_id}));
                    const linesToInsert = linesWithGrId.map(({id, ...rest}) => rest); // remove id property for insert
                    const { error: linesError } = await supabase.from('gr_lines').insert(linesToInsert as any);
                    if (linesError) {
                        // Rollback header insert if lines fail
                        await supabase.from('goods_receipts').delete().eq('id', new_gr_id);
                        throw linesError;
                    }
                }

                notification.success({ message: `Goods Receipt successfully created (ID: ${new_gr_id})` });
                navigate(`/operations/gr/${new_gr_id}`);
            }
    
        } catch (error: any) {
            notification.error({ message: 'Submission Failed', description: error.message || 'Please check the form for errors.', duration: 10 });
        } finally {
            setIsSaving(false);
        }
    };
    
    // --- Render Logic ---
    const partnerOptions = useMemo(() => partners.map(p => ({ value: p.id, label: p.name })), [partners]);
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
            <InputNumber min={1} value={record.quantity_planned} onChange={(value) => handleLineChange(record.key, 'quantity_planned', value)} style={{ width: '100%' }} />
        )},
        { title: 'To Location', dataIndex: 'location_id', width: '15%', render: (_: any, record: EditableLine) => (
            <Select allowClear value={record.location_id} placeholder="Select Location" options={locations.map(l => ({ label: l.code, value: l.id }))} onChange={(value) => handleLineChange(record.key, 'location_id', value)} style={{ width: '100%' }} />
        )},
        { title: 'Tracking Info', key: 'tracking_info', width: '25%', render: (_: any, record: EditableLine) => {
            if (record.tracking_type === 'LOT') {
                return <Space.Compact style={{width: '100%'}}>
                    <Input placeholder="Lot Number" value={record.lot_number || ''} onChange={(e) => handleLineChange(record.key, 'lot_number', e.target.value)} />
                    <DatePicker placeholder="Expiry" value={record.expiry_date ? dayjs(record.expiry_date) : null} onChange={(date) => handleLineChange(record.key, 'expiry_date', date ? date.toString() : null)} />
                </Space.Compact>
            }
            if (record.tracking_type === 'SERIAL') {
                return <Input placeholder="Serial Number" value={record.serial_number || ''} onChange={(e) => handleLineChange(record.key, 'serial_number', e.target.value)} />
            }
            return <Typography.Text type="secondary">-</Typography.Text>;
        }},
        { title: 'Action', key: 'action', width: '5%', align: 'center' as const, render: (_: any, record: EditableLine) => (
            <Popconfirm title="Sure to delete?" onConfirm={() => handleRemoveLine(record.key)}>
                <Button icon={<DeleteOutlined />} danger type="text" />
            </Popconfirm>
        )},
    ];

    if (loading) return <Spin fullscreen />;
    const title = isEditMode ? `Edit Goods Receipt (GR-${grId})` : "Create Goods Receipt";
    const description = isEditMode ? "Update details for this goods receipt." : "Record a new incoming shipment of goods.";
    
    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <PageHeader title={title} description={description} />
            <Form form={form} layout="vertical" initialValues={{ transaction_type: 'PURCHASE', receipt_date: dayjs() }}>
                <Card title="Information">
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="transaction_type" label="Transaction Type" rules={[{ required: true }]}><Select options={GR_TRANSACTION_TYPES.map(t => ({ label: t.replace(/_/g, ' '), value: t }))} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="warehouse_id" label="Warehouse" rules={[{ required: true }]}><Select showSearch filterOption placeholder="Select warehouse" options={warehouses.map(w => ({ label: w.name, value: w.id }))} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="receipt_date" label="Receipt Date"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                        
                        {['PURCHASE', 'RETURN_FROM_CUSTOMER'].includes(transactionType) &&
                          <Col span={8}><Form.Item name="partner_id" label="Partner" rules={[{required: true}]}><AutoComplete options={partnerOptions} placeholder="Search partner..." filterOption={(inputValue, option) => option!.label.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1} /></Form.Item></Col>
                        }
                        {transactionType === 'TRANSFER_IN' &&
                          <Col span={8}><Form.Item name="warehouse_from_id" label="From Warehouse" rules={[{required: true}]}><Select showSearch filterOption placeholder="Select source warehouse" options={warehouses.filter(w => w.id !== selectedWarehouseId).map(w => ({ label: w.name, value: w.id }))} /></Form.Item></Col>
                        }
                        
                        <Col span={8}><Form.Item name="partner_reference" label="Partner Reference"><Input placeholder="e.g., Invoice #, PO #" /></Form.Item></Col>
                        <Col span={8}><Form.Item name="reference_number" label="Internal Reference"><Input placeholder="Auto-generated if empty" /></Form.Item></Col>
                        <Col span={24}><Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item></Col>
                    </Row>
                </Card>
                <Card title="Line Items" extra={<Button icon={<PlusOutlined />} onClick={handleAddLine} type="dashed">Add Item</Button>}>
                    <Table dataSource={lines} columns={lineColumns} pagination={false} rowKey="key" size="small" scroll={{ x: 1200 }} />
                </Card>
            </Form>
            <Row justify="end" style={{marginTop: 16}}>
                <Space>
                    <Button icon={<RollbackOutlined />} onClick={() => navigate('/operations/gr')} danger>Cancel</Button>
                    <Button icon={<SaveOutlined />} onClick={() => handleSubmit(true)} loading={isSaving}>Save as Draft</Button>
                    <Button type="primary" icon={<CheckOutlined />} onClick={() => handleSubmit(false)} loading={isSaving}>{isEditMode ? 'Update Receipt' : 'Create Receipt'}</Button>
                </Space>
            </Row>
        </Space>
    );
};

const GRCreatePageWrapper: React.FC = () => {
    const { id } = useParams<{ id: string }>(); 
    return (
        <App>
            <GRCreateEditPage key={id} />
        </App>
    );
};

export default GRCreatePageWrapper;
