import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import {
    Warehouse,
    Location,
    Database,
    GoodsModel,
    Uom
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
type GITransactionType = Database['public']['Enums']['gi_transaction_type_enum'];
type GoodsModelWithOptions = GoodsModel & { base_uom: Uom | null };
type PartnerWithOptions = { id: number; name: string };

type EditableLine = {
    key: number;
    id?: number;
    goods_model_id?: number;
    location_id?: number | null;
    quantity_planned?: number;
    lot_number?: string | null;
    serial_number?: string | null;
    uom_name?: string;
    uom_id?: number;
    tracking_type?: 'NONE' | 'LOT' | 'SERIAL';
};

const GI_TRANSACTION_TYPES: GITransactionType[] = [
    "SALE", "TRANSFER_OUT", "ADJUSTMENT_OUT", "RETURN_OUT", "SCRAP", "OTHER"
];

// --- Main Component ---
const GICreateEditPage: React.FC = () => {
    const navigate = useNavigate();
    const { id: giId } = useParams<{ id: string }>();
    const [form] = Form.useForm();
    const { notification } = App.useApp();
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
    const [locations, setLocations] = useState<Location[]>([]);

    const [lines, setLines] = useState<EditableLine[]>([]);
    const [nextKey, setNextKey] = useState(1);
    const [linesToDelete, setLinesToDelete] = useState<number[]>([]);

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
            
            // 1. Insert Header
            const { data: headerData, error: headerError } = await supabase
                .from('goods_issues')
                .insert({
                    warehouse_id: headerValues.warehouse_id,
                    issue_date: headerValues.issue_date ? dayjs(headerValues.issue_date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
                    issue_mode: headerValues.issue_mode,
                    reference_number: headerValues.reference_number || null,
                    warehouse_to_id: headerValues.warehouse_to_id || null,
                    partner_name: partnerName,
                    partner_id: headerValues.partner_id || null,
                    delivery_address: headerValues.delivery_address || null,
                    status,
                    notes: headerValues.notes || null,
                    created_by: user.id,
                    transaction_type: headerValues.transaction_type,
                })
                .select()
                .single();

            if (headerError) throw headerError;
            if (!headerData) throw new Error("Failed to create goods issue header.");

            const new_gi_id = headerData.id;

            // 2. Insert Lines
            const linesToInsert = lines
                .filter(l => l.goods_model_id && l.quantity_planned && l.quantity_planned > 0 && l.uom_id && l.tracking_type)
                .map(l => ({
                    gi_id: new_gi_id,
                    goods_model_id: l.goods_model_id!,
                    location_id: issueMode === 'DETAIL' ? l.location_id : null,
                    quantity_planned: l.quantity_planned!, 
                    lot_number: l.lot_number || null,
                    serial_number: l.serial_number || null,
                    uom_id: l.uom_id!,
                    tracking_type: l.tracking_type!,
                }));
            
            if (linesToInsert.length > 0) {
                const { error: linesError } = await supabase.from('gi_lines').insert(linesToInsert);
                if (linesError) throw linesError;
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
            <InputNumber min={1} value={record.quantity_planned} onChange={(value) => handleLineChange(record.key, 'quantity_planned', value)} style={{ width: '100%' }} />
        )},
        ...(issueMode === 'DETAIL' ? [{ 
            title: 'From Location', dataIndex: 'location_id', width: '15%', render: (_: any, record: EditableLine) => (
                <Select allowClear value={record.location_id} placeholder="Select Location" options={locations.map(l => ({ label: l.code, value: l.id }))} onChange={(value) => handleLineChange(record.key, 'location_id', value)} style={{ width: '100%' }} />
            )}] 
        : []),
        { title: 'Tracking Info', key: 'tracking_info', width: '25%', render: (_: any, record: EditableLine) => {
            if (record.tracking_type === 'LOT') return <Input placeholder="Lot Number" value={record.lot_number || ''} onChange={(e) => handleLineChange(record.key, 'lot_number', e.target.value)} />
            if (record.tracking_type === 'SERIAL') return <Input placeholder="Serial Number" value={record.serial_number || ''} onChange={(e) => handleLineChange(record.key, 'serial_number', e.target.value)} />
            return <Typography.Text type="secondary">-</Typography.Text>;
        }},
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
            <Form form={form} layout="vertical" initialValues={{ transaction_type: 'SALE', issue_mode: 'DETAIL', issue_date: dayjs() }}>
                <Card title="Information">
                    <Row gutter={16}>
                        <Col span={8}><Form.Item name="transaction_type" label="Transaction Type" rules={[{ required: true }]}><Select options={GI_TRANSACTION_TYPES.map(t => ({ label: t.replace(/_/g, ' '), value: t }))} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="warehouse_id" label="From Warehouse" rules={[{ required: true }]}><Select showSearch filterOption placeholder="Select warehouse" options={warehouses.map(w => ({ label: w.name, value: w.id }))} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="issue_date" label="Expected Issue Date"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                        
                        {transactionType === 'TRANSFER_OUT' && (
                            <Col span={8}><Form.Item name="warehouse_to_id" label="To Warehouse" rules={[{ required: true }]}><Select showSearch filterOption placeholder="Select destination warehouse" options={warehouses.filter(w => w.id !== selectedWarehouseId).map(w => ({ label: w.name, value: w.id }))} /></Form.Item></Col>
                        )}
                        {(transactionType === 'SALE' || transactionType === 'RETURN_OUT') && (
                           <>
                            <Col span={8}>
                                <Form.Item name="partner_id" label={transactionType === 'SALE' ? 'Customer' : 'Supplier'} rules={[{ required: true }]}>
                                    <Select 
                                        showSearch 
                                        placeholder="Select partner" 
                                        options={partners.map(p => ({ label: p.name, value: p.id }))}
                                        filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                                    />
                                </Form.Item>
                            </Col>
                            {transactionType === 'SALE' && <Col span={16}><Form.Item name="delivery_address" label="Delivery Address"><Input placeholder="Enter delivery address" /></Form.Item></Col>}
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
                            ? "In Detail mode, you must specify the exact location for each item to be picked."
                            : "In Summary mode, the system will automatically allocate items from locations using FIFO logic when picking starts."}
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
