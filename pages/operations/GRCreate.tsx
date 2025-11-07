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
    key: number; // For React list keys
    id?: number; // DB ID for existing lines
    goods_model_id?: number;
    location_id?: number | null;
    expected_qty?: number;
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
    
    // Dropdown/AutoComplete data
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [partners, setPartners] = useState<PartnerWithOptions[]>([]);
    const [goodsModels, setGoodsModels] = useState<GoodsModelWithOptions[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);

    // Line items state
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
            setWarehouses(whRes.data || []);
            setPartners(partnerRes.data || []);
            setGoodsModels(gmRes.data as any[] || []);
        } catch (error: any) {
            notification.error({ message: 'Error fetching dependencies', description: error.message });
        }
    }, [notification]);

    const fetchGrForEdit = useCallback(async () => {
        if (!grId) return;
        try {
            const { data, error } = await supabase.from('goods_receipts').select('*, gr_lines(*)').eq('id', grId).single();
            if (error) throw error;
            
            form.setFieldsValue({
                ...data,
                receipt_date: data.receipt_date ? dayjs(data.receipt_date) : null,
            });

            const loadedLines = data.gr_lines.map((line, index) => {
                const model = goodsModels.find(m => m.id === line.goods_model_id);
                return {
                    ...line,
                    key: -(index + 1), // Use negative keys for existing items
                    uom_name: model?.base_uom?.name || '',
                    tracking_type: model?.tracking_type,
                };
            });
            setLines(loadedLines);
            setNextKey(1); // Reset key counter for new lines

        } catch (error: any) {
             notification.error({ message: 'Error fetching Goods Receipt data', description: error.message });
        }
    }, [grId, form, notification, goodsModels]);
    
    useEffect(() => {
        setLoading(true);
        fetchDependencies().then(() => {
            if (isEditMode) {
                fetchGrForEdit().finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
        });
    }, [fetchDependencies, fetchGrForEdit, isEditMode]);

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
    const handleAddLine = () => setLines(prev => [...prev, { key: nextKey, expected_qty: 1 }]) || setNextKey(p => p + 1);

    const handleLineChange = (key: number, field: keyof EditableLine, value: any) => {
        if (field === 'goods_model_id' && lines.some(line => line.goods_model_id === value && line.key !== key)) {
            notification.error({ message: "Model already added. Please edit the existing line." });
            return;
        }
        setLines(lines.map(line => {
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
        if (lineToRemove?.id) { // If it's an existing line from DB
            setLinesToDelete(prev => [...prev, lineToRemove.id!]);
        }
        setLines(lines.filter(line => line.key !== key));
    };

    // --- Submission Logic ---
    const handleSubmit = async (isDraft: boolean) => {
        setIsSaving(true);
        try {
            if (!user) throw new Error('You must be logged in.');
            const headerValues = await form.validateFields();
            if (!isDraft && lines.length === 0) throw new Error('Please add at least one line item.');
            
            const status = isDraft ? 'DRAFT' : 'CREATED';
            
            // FIX: Handle optional receipt_date gracefully
            const headerPayload: any = {
                ...headerValues,
                status: isEditMode ? (headerValues.status === 'DRAFT' ? status : headerValues.status) : status,
                [isEditMode ? 'updated_by' : 'created_by']: user.id,
            };
            
            if (headerValues.receipt_date) {
                headerPayload.receipt_date = dayjs(headerValues.receipt_date).toISOString();
            } else {
                headerPayload.receipt_date = null; // Explicitly set to null if empty
            }

            // Upsert Header
            const { data: gr, error: grError } = isEditMode
                ? await supabase.from('goods_receipts').update(headerPayload).eq('id', grId).select().single()
                : await supabase.from('goods_receipts').insert(headerPayload).select().single();
            if (grError) throw grError;

            // Delete marked lines
            if (linesToDelete.length > 0) {
                const { error: deleteError } = await supabase.from('gr_lines').delete().in('id', linesToDelete);
                if (deleteError) throw deleteError;
            }

            // Upsert Lines
            const linesToUpsert = lines.filter(l => l.goods_model_id && l.expected_qty).map(l => ({
                id: l.id, // Supabase handles upsert if id exists, insert if null/undefined
                gr_id: gr.id,
                goods_model_id: l.goods_model_id!,
                location_id: l.location_id,
                expected_qty: l.expected_qty!,
            }));
            if (linesToUpsert.length > 0) {
                 const { error: linesError } = await supabase.from('gr_lines').upsert(linesToUpsert);
                 if (linesError) throw linesError;
            }

            notification.success({ message: `Goods Receipt successfully ${isEditMode ? 'updated' : 'created'}` });
            navigate(`/operations/gr/${gr.id}`);

        } catch (error: any) {
            notification.error({ message: 'Submission Failed', description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    // --- Memoized Options and Columns ---
    const goodsModelOptions = useMemo(() => goodsModels.map(gm => ({ value: gm.id, label: `[${gm.code}] ${gm.name}` })), [goodsModels]);
    const partnerOptions = useMemo(() => partners.map(p => ({ label: p.name, value: p.name })), [partners]);

    const lineColumns = useMemo(() => [
        { title: 'Goods Model', dataIndex: 'goods_model_id', width: '35%', render: (_: any, record: EditableLine) => (
            <Select showSearch allowClear value={record.goods_model_id} placeholder="Search by name or code..." options={goodsModelOptions} onChange={(value) => handleLineChange(record.key, 'goods_model_id', value)} filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} style={{ width: '100%' }} />
        )},
        { title: 'UoM', dataIndex: 'uom_name', width: '8%', render: (text: string) => <Typography.Text>{text || '-'}</Typography.Text> },
        { title: 'Tracking', dataIndex: 'tracking_type', width: '10%', render: (type: string) => type ? <Tag>{type}</Tag> : '-' },
        { title: 'Location', dataIndex: 'location_id', width: '22%', render: (_: any, record: EditableLine) => (
            <Select allowClear value={record.location_id} placeholder={!isEditMode ? "N/A at creation" : "Select location"} options={locations.map(l => ({ label: l.name, value: l.id }))} onChange={(value) => handleLineChange(record.key, 'location_id', value)} style={{ width: '100%' }} disabled={!isEditMode} />
        )},
        { title: 'Expected Qty', dataIndex: 'expected_qty', width: '15%', align: 'right' as const, render: (_: any, record: EditableLine) => (
            <InputNumber min={1} value={record.expected_qty} onChange={(value) => handleLineChange(record.key, 'expected_qty', value)} style={{ width: '100%' }} />
        )},
        { title: 'Action', key: 'action', width: '10%', align: 'center' as const, render: (_: any, record: EditableLine) => (
            <Popconfirm title="Sure to delete?" onConfirm={() => handleRemoveLine(record.key)}>
                <Button icon={<DeleteOutlined />} danger type="text" />
            </Popconfirm>
        )},
    ], [lines, goodsModelOptions, locations, isEditMode, handleLineChange, handleRemoveLine]);


    // --- Render ---
    if (loading) return <Spin fullscreen />;
    const title = isEditMode ? `Edit Goods Receipt (GR-${grId})` : "Create Goods Receipt";
    const description = isEditMode ? "Update details for this goods receipt." : "Create a new goods receipt for incoming inventory.";
    
    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <PageHeader title={title} description={description} />
            <Form form={form} layout="vertical" initialValues={{ transaction_type: 'PURCHASE' }}>
                <Card title="Information">
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="transaction_type" label="Transaction Type" rules={[{ required: true }]}><Select options={GR_TRANSACTION_TYPES.map(t => ({ label: t.replace(/_/g, ' '), value: t }))} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="warehouse_id" label="Warehouse" rules={[{ required: true }]}><Select showSearch filterOption placeholder="Select warehouse" options={warehouses.map(w => ({ label: w.name, value: w.id }))} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="receipt_date" label="Expected Receipt Date"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="partner_name" label="Partner Name"><AutoComplete options={partnerOptions} style={{ width: '100%' }} placeholder="Select or enter partner name" filterOption={(inputValue, option) => option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="partner_reference" label="Partner Reference"><Input placeholder="e.g., PO-123, ASN-456" /></Form.Item></Col>
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