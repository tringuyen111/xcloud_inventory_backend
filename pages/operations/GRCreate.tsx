import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import {
    Warehouse,
    Location,
    Database
} from '../../types/supabase';
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
    Tag,
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
import useAuthStore from '../../stores/authStore';
import PageHeader from '../../components/layout/PageHeader';
import dayjs from 'dayjs';

// --- Type Definitions ---
type GRTransactionType = Database['public']['Enums']['gr_transaction_type'];
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
    expected_qty?: number;
    actual_qty?: number | null;
    uom_name?: string;
    tracking_type?: 'NONE' | 'LOT' | 'SERIAL';
};

const GR_TRANSACTION_TYPES: GRTransactionType[] = [
    "PURCHASE", "PRODUCTION", "RETURN_FROM_CUSTOMER", "TRANSFER_IN", "ADJUSTMENT_IN"
];

// --- Main Component ---
const GRCreateEditPage: React.FC<{ isEditMode?: boolean }> = ({ isEditMode = false }) => {
    const navigate = useNavigate();
    const { id: grId } = useParams<{ id: string }>();
    const [form] = Form.useForm();
    const { notification } = App.useApp();
    const user = useAuthStore((state) => state.user);
    const selectedWarehouseId = Form.useWatch('warehouse_id', form);

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
                    key: -(index + 1),
                    uom_name: model?.base_uom?.name || '',
                    tracking_type: model?.tracking_type,
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
            supabase.from('locations').select('id, name').eq('warehouse_id', selectedWarehouseId).eq('is_active', true)
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
        setLines(prev => [...prev, { key: nextKey, expected_qty: 1 }]);
        setNextKey(p => p + 1);
    }

    const handleLineChange = (key: number, field: keyof EditableLine, value: any) => {
        if (field === 'goods_model_id' && value && lines.some(line => line.goods_model_id === value && line.key !== key)) {
            notification.error({ message: "Model already added. Please edit the existing line." });
            return;
        }
        setLines(currentLines => currentLines.map(line => {
            if (line.key === key) {
                const updatedLine = { ...line, [field]: value };
                if (field === 'goods_model_id') {
                    const model = goodsModels.find(m => m.id === value);
                    updatedLine.uom_name = model?.base_uom?.name;
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
    
            if (!isDraft && lines.length === 0) throw new Error('Please add at least one line item.');
            if (!isDraft && lines.some(l => !l.goods_model_id || !l.expected_qty || l.expected_qty <= 0)) {
                throw new Error('All line items must have a Goods Model and a valid Expected Quantity.');
            }
            
            const status = isDraft ? 'DRAFT' : 'CREATED';

            if (isEditMode) {
                // --- EDIT MODE LOGIC ---
                const headerPayload = {
                    warehouse_id: headerValues.warehouse_id,
                    transaction_type: headerValues.transaction_type,
                    partner_name: headerValues.partner_name || null,
                    partner_reference: headerValues.partner_reference || null,
                    reference_number: headerValues.reference_number || null,
                    notes: headerValues.notes || null,
                    status: form.getFieldValue('status') === 'DRAFT' ? status : form.getFieldValue('status'),
                    receipt_date: headerValues.receipt_date ? dayjs(headerValues.receipt_date).format('YYYY-MM-DD') : null,
                    updated_by: user.id,
                };
        
                const { data: gr, error: grError } = await supabase.from('goods_receipts').update(headerPayload).eq('id', grId).select().single();
                if (grError) throw grError;
        
                if (linesToDelete.length > 0) {
                    const { error: deleteError } = await supabase.from('gr_lines').delete().in('id', linesToDelete);
                    if (deleteError) throw deleteError;
                }
        
                const validLines = lines.filter(l => l.goods_model_id && l.expected_qty && l.expected_qty > 0);
        
                if (validLines.length > 0) {
                    const linesToUpsert = validLines.map(l => {
                        const payload: any = {
                            gr_id: gr.id,
                            goods_model_id: l.goods_model_id!,
                            location_id: l.location_id || null,
                            expected_qty: l.expected_qty!,
                            actual_qty: l.actual_qty ?? 0,
                        };
                        if (l.id) payload.id = l.id;
                        return payload;
                    });
                    const { error: linesError } = await supabase.from('gr_lines').upsert(linesToUpsert, { onConflict: 'id' });
                    if (linesError) throw linesError;
                }
                notification.success({ message: `Goods Receipt successfully updated` });
                navigate(`/operations/gr/${gr.id}`);

            } else {
                // --- CREATE MODE LOGIC (RPC) ---
                const linesToInsert = lines
                    .filter(l => l.goods_model_id && l.expected_qty && l.expected_qty > 0)
                    .map(l => ({
                        goods_model_id: l.goods_model_id,
                        location_id: l.location_id || null,
                        expected_qty: l.expected_qty
                    }));

                if (!isDraft && linesToInsert.length === 0) {
                    throw new Error('All line items must have a Goods Model and valid quantity.');
                }
                
                const rpcPayload = {
                    p_warehouse_id: headerValues.warehouse_id,
                    p_receipt_date: headerValues.receipt_date ? dayjs(headerValues.receipt_date).format('YYYY-MM-DD') : null,
                    p_transaction_type: headerValues.transaction_type,
                    p_status: status,
                    p_partner_name: headerValues.partner_name || null,
                    p_partner_reference: headerValues.partner_reference || null,
                    p_notes: headerValues.notes || null,
                    p_lines: linesToInsert
                };
        
                const { data: new_gr_id, error: rpcError } = await supabase.rpc(
                    'create_goods_receipt_with_lines', 
                    rpcPayload
                );
        
                if (rpcError) throw rpcError;
        
                notification.success({ message: `Goods Receipt successfully created (ID: ${new_gr_id})` });
                navigate(`/operations/gr/${new_gr_id}`);
            }
    
        } catch (error: any) {
            console.error('Submission Error:', error);
            let description = 'An unknown error occurred. Please check the console for details.';

            if (error) {
                description = error.message || error.details || JSON.stringify(error);
            }
            
            notification.error({
                message: 'Submission Failed',
                description: description,
                duration: 10 // Show for longer
            });
        } finally {
            setIsSaving(false);
        }
    };

    const goodsModelOptions = useMemo(() => goodsModels.map(gm => ({ 
        value: gm.id, 
        label: `[${gm.code}] ${gm.name}` 
    })), [goodsModels]);
    
    const partnerOptions = useMemo(() => partners.map(p => ({ label: p.name, value: p.name })), [partners]);

    const lineColumns = [
        { title: 'Goods Model', dataIndex: 'goods_model_id', width: '35%', render: (_: any, record: EditableLine) => (
            <Select showSearch allowClear value={record.goods_model_id} placeholder="Search by name or code..." options={goodsModelOptions} onChange={(value) => handleLineChange(record.key, 'goods_model_id', value)} filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} style={{ width: '100%' }} />
        )},
        { title: 'UoM', dataIndex: 'uom_name', width: '8%', render: (text: string) => <Typography.Text>{text || '-'}</Typography.Text> },
        { title: 'Tracking', dataIndex: 'tracking_type', width: '10%', render: (type: string) => type ? <Tag>{type}</Tag> : '-' },
        { title: 'Location', dataIndex: 'location_id', width: '22%', render: (_: any, record: EditableLine) => (
            <Select allowClear value={record.location_id} placeholder={"N/A at creation"} options={locations.map(l => ({ label: l.name, value: l.id }))} onChange={(value) => handleLineChange(record.key, 'location_id', value)} style={{ width: '100%' }} disabled={false} />
        )},
        { title: 'Expected Qty', dataIndex: 'expected_qty', width: '15%', align: 'right' as const, render: (_: any, record: EditableLine) => (
            <InputNumber min={1} value={record.expected_qty} onChange={(value) => handleLineChange(record.key, 'expected_qty', value)} style={{ width: '100%' }} />
        )},
        { title: 'Action', key: 'action', width: '10%', align: 'center' as const, render: (_: any, record: EditableLine) => (
            <Popconfirm title="Sure to delete?" onConfirm={() => handleRemoveLine(record.key)}>
                <Button icon={<DeleteOutlined />} danger type="text" />
            </Popconfirm>
        )},
    ];


    // --- Render ---
    if (loading) return <Spin fullscreen />;
    const title = isEditMode ? `Edit Goods Receipt (GR-${grId})` : "Create Goods Receipt";
    const description = isEditMode ? "Update details for this goods receipt." : "Create a new goods receipt for incoming inventory.";
    
    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <PageHeader title={title} description={description} />
            <Form form={form} layout="vertical" initialValues={{ transaction_type: 'PURCHASE', receipt_date: dayjs() }}>
                <Card title="Information">
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="transaction_type" label="Transaction Type" rules={[{ required: true }]}><Select options={GR_TRANSACTION_TYPES.map(t => ({ label: t.replace(/_/g, ' '), value: t }))} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="warehouse_id" label="Warehouse" rules={[{ required: true }]}><Select showSearch filterOption placeholder="Select warehouse" options={warehouses.map(w => ({ label: w.name, value: w.id }))} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="receipt_date" label="Expected Receipt Date"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="partner_name" label="Partner Name"><AutoComplete options={partnerOptions} style={{ width: '100%' }} placeholder="Select or enter partner name" filterOption={(inputValue, option) => option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="partner_reference" label="Partner Reference"><Input placeholder="e.g., PO-123, ASN-456" /></Form.Item></Col>
                        <Col span={8}><Form.Item name="reference_number" label="Reference Number"><Input placeholder="Your internal reference" /></Form.Item></Col>
                    </Row>
                     <Row><Col span={24}><Form.Item name="notes" label="Notes"><Input.TextArea rows={2} placeholder="Add any relevant notes here..." /></Form.Item></Col></Row>
                </Card>
            </Form>
            <Card title="Line Items" extra={<Button icon={<PlusOutlined />} onClick={handleAddLine} type="dashed">Add Item</Button>}>
                <Table dataSource={lines} columns={lineColumns} pagination={false} rowKey="key" size="small" />
            </Card>
            <Row justify="end">
                <Space>
                    <Button icon={<RollbackOutlined />} onClick={() => navigate('/operations/gr')} danger>Cancel</Button>
                    <Button icon={<SaveOutlined />} onClick={() => handleSubmit(true)} loading={isSaving}>Save as Draft</Button>
                    <Button type="primary" icon={<CheckOutlined />} onClick={() => handleSubmit(false)} loading={isSaving}>{isEditMode ? 'Update' : 'Create'}</Button>
                </Space>
            </Row>
        </Space>
    );
};

// Wrapper to provide App context (notification, modal)
const GRCreateWrapper: React.FC<{ isEditMode?: boolean }> = ({ isEditMode }) => (
    <App>
        <GRCreateEditPage isEditMode={isEditMode} />
    </App>
);

export default GRCreateWrapper;