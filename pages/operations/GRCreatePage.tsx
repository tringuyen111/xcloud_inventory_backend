
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { GoodsModel, Warehouse, Partner, Location, GRLine, Database } from '../../types/supabase';
import {
    Button, Card, Form, Input, Row, Col, Space, App, Spin, Select, Table, Popconfirm, InputNumber, Typography, Tag
} from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, CheckOutlined, RollbackOutlined } from '@ant-design/icons';
import useAuthStore from '../../stores/authStore';
import PageHeader from '../../components/layout/PageHeader';

const { Text } = Typography;

// --- Type Definitions ---
type GoodsModelWithUoM = GoodsModel & { uoms: { name: string } | null };

type EditableLine = Partial<GRLine> & {
    key: number;
    uom_name?: string;
    tracking_type?: 'NONE' | 'LOT' | 'SERIAL';
};

const GR_TRANSACTION_TYPES: Database['public']['Enums']['gr_transaction_type'][] = [
    "PURCHASE", "PRODUCTION", "RETURN_FROM_CUSTOMER", "TRANSFER_IN", "ADJUSTMENT_IN"
];

// --- Main Component ---
const GRCreatePageContent: React.FC<{ isEditMode?: boolean }> = ({ isEditMode }) => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [form] = Form.useForm();
    const { notification } = App.useApp();
    const user = useAuthStore((state) => state.user);
    const selectedWarehouseId = Form.useWatch('warehouse_id', form);

    // --- State Management ---
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Dropdown data
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [goodsModels, setGoodsModels] = useState<GoodsModelWithUoM[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);

    // Line items state
    const [lines, setLines] = useState<EditableLine[]>([]);
    const [nextKey, setNextKey] = useState(1);

    // --- Data Fetching ---
    const fetchInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const [whRes, partnerRes, gmRes] = await Promise.all([
                supabase.from('warehouses').select('id, name').eq('is_active', true),
                supabase.from('partners').select('id, name').eq('is_active', true),
                supabase.from('goods_models').select('*, uoms(name)').eq('is_active', true)
            ]);
            if (whRes.error) throw whRes.error;
            if (partnerRes.error) throw partnerRes.error;
            if (gmRes.error) throw gmRes.error;

            setWarehouses(whRes.data);
            setPartners(partnerRes.data);
            setGoodsModels(gmRes.data as GoodsModelWithUoM[]);
        } catch (error: any) {
            notification.error({ message: 'Error fetching initial data', description: error.message });
        } finally {
            setLoading(false);
        }
    }, [notification]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    // Fetch locations when warehouse changes
    useEffect(() => {
        if (selectedWarehouseId) {
            const fetchLocations = async () => {
                const { data, error } = await supabase
                    .from('locations')
                    .select('id, name')
                    .eq('warehouse_id', selectedWarehouseId)
                    .eq('is_active', true);
                if (error) {
                    notification.error({ message: 'Failed to fetch locations', description: error.message });
                } else {
                    setLocations(data);
                    // Reset location for existing lines if warehouse changes
                    setLines(prevLines => prevLines.map(line => ({ ...line, location_id: undefined })));
                }
            };
            fetchLocations();
        } else {
            setLocations([]);
        }
    }, [selectedWarehouseId, notification]);

    // --- UI Handlers for Lines ---
    const handleAddLine = () => {
        const newLine: EditableLine = { key: nextKey };
        setLines(prev => [...prev, newLine]);
        setNextKey(prev => prev + 1);
    };

    const handleLineChange = (key: number, field: keyof EditableLine, value: any) => {
        const newLines = lines.map(line => {
            if (line.key === key) {
                const updatedLine = { ...line, [field]: value };
                if (field === 'goods_model_id') {
                    const model = goodsModels.find(m => m.id === value);
                    if (model) {
                        updatedLine.uom_name = model.uoms?.name;
                        updatedLine.tracking_type = model.tracking_type;
                    } else {
                        updatedLine.uom_name = undefined;
                        updatedLine.tracking_type = undefined;
                    }
                }
                return updatedLine;
            }
            return line;
        });
        setLines(newLines);
    };

    const handleRemoveLine = (key: number) => {
        setLines(lines.filter(line => line.key !== key));
    };

    // --- Submission Logic ---
    const handleSubmit = async (status: 'DRAFT' | 'CREATED') => {
        setIsSaving(true);
        try {
            if (!user) {
                notification.error({ message: 'Authentication Error', description: 'You must be logged in to perform this action.' });
                setIsSaving(false);
                return;
            }
            
            await form.validateFields();
            if (status === 'CREATED') {
                 if (lines.length === 0) throw new Error('Please add at least one line item.');
                for (const line of lines) {
                    if (!line.goods_model_id || !line.expected_qty || line.expected_qty <= 0) {
                         throw new Error('Please ensure all line items have a Goods Model and a valid quantity.');
                    }
                }
            }
            
            const headerValues = form.getFieldsValue();
            const headerPayload = {
                ...headerValues,
                status,
                created_by: user.id,
            };

            const { data: grData, error: grError } = await supabase.from('goods_receipts').insert(headerPayload).select().single();
            if (grError) throw grError;

            if (lines.length > 0) {
                const linesToInsert = lines
                    .filter(line => line.goods_model_id && line.expected_qty)
                    .map(line => ({
                        gr_id: grData.id,
                        goods_model_id: line.goods_model_id,
                        location_id: line.location_id || null, // Ensure null instead of undefined
                        expected_qty: line.expected_qty,
                    }));

                if (linesToInsert.length > 0) {
                    const { error: linesError } = await supabase.from('gr_lines').insert(linesToInsert);
                    if (linesError) {
                        // Rollback header insertion if lines fail
                        await supabase.from('goods_receipts').delete().eq('id', grData.id);
                        throw linesError;
                    }
                }
            }
            
            notification.success({ message: `Goods Receipt saved as ${status}` });
            navigate(`/operations/gr/${grData.id}`);

        } catch (error: any) {
            notification.error({ message: 'Submission Failed', description: error.message || 'Please check all required fields.' });
        } finally {
            setIsSaving(false);
        }
    };

    // --- Table Columns ---
    const lineColumns = useMemo(() => [
        {
            title: 'Goods Model',
            dataIndex: 'goods_model_id',
            width: '35%',
            render: (_: any, record: EditableLine) => (
                <Select
                    showSearch
                    allowClear
                    value={record.goods_model_id}
                    placeholder="Search by name or code..."
                    options={goodsModels.map(gm => ({ label: `${gm.name} (${gm.code})`, value: gm.id }))}
                    onChange={(value) => handleLineChange(record.key, 'goods_model_id', value)}
                    filterOption={(inputValue, option) =>
                        (option?.label ?? '').toLowerCase().includes(inputValue.toLowerCase())
                    }
                    style={{ width: '100%' }}
                />
            )
        },
        { title: 'UoM', dataIndex: 'uom_name', width: '8%', render: (text: string) => text || '-' },
        { title: 'Tracking', dataIndex: 'tracking_type', width: '10%', render: (type: string) => type ? <Tag>{type}</Tag> : '-' },
        {
            title: 'Location', dataIndex: 'location_id', width: '22%', render: (_: any, record: EditableLine) => (
                <Select
                    value={record.location_id}
                    placeholder="Select location"
                    options={locations.map(l => ({ label: l.name, value: l.id }))}
                    onChange={(value) => handleLineChange(record.key, 'location_id', value)}
                    style={{ width: '100%' }}
                    disabled // Location is disabled by default
                />
            )
        },
        {
            title: 'Expected Qty', dataIndex: 'expected_qty', width: '15%', align: 'right' as const, render: (_: any, record: EditableLine) => (
                <InputNumber
                    min={1}
                    value={record.expected_qty}
                    onChange={(value) => handleLineChange(record.key, 'expected_qty', value)}
                    style={{ width: '100%' }}
                />
            )
        },
        {
            title: 'Action', key: 'action', width: '10%', align: 'center' as const, render: (_: any, record: EditableLine) => (
                <Popconfirm title="Sure to delete?" onConfirm={() => handleRemoveLine(record.key)}>
                    <Button icon={<DeleteOutlined />} danger type="text" />
                </Popconfirm>
            )
        },
    ], [lines, goodsModels, locations, handleLineChange, handleRemoveLine]);

    // --- Render ---
    if (loading) return <Spin fullscreen />;

    const title = isEditMode ? "Edit Goods Receipt" : "Create Goods Receipt";
    const description = isEditMode ? `Editing GR ID: ${id}` : "Create a new goods receipt for incoming inventory.";
    
    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <PageHeader title={title} description={description} />
            
            <Form form={form} layout="vertical" initialValues={{ transaction_type: 'PURCHASE' }}>
                <Card title="Information">
                     <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="transaction_type" label="Transaction Type" rules={[{ required: true }]}>
                                <Select options={GR_TRANSACTION_TYPES.map(t => ({ label: t.replace(/_/g, ' '), value: t }))} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="warehouse_id" label="Warehouse" rules={[{ required: true }]}>
                                <Select placeholder="Select warehouse" options={warehouses.map(w => ({ label: w.name, value: w.id }))} />
                            </Form.Item>
                        </Col>
                         <Col span={8}>
                            <Form.Item name="reference_number" label="Reference No.">
                                <Input placeholder="e.g., ASN-123, PO-456..." />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                             <Form.Item name="partner_name" label="Partner">
                               <Select
                                    showSearch
                                    allowClear
                                    mode="tags"
                                    placeholder="Select or enter partner name"
                                    options={partners.map(p => ({ label: p.name, value: p.name }))}
                                    filterOption={(inputValue, option) =>
                                        option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                                    }
                                />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                             <Form.Item name="notes" label="Notes">
                                <Input.TextArea rows={2} placeholder="Add any relevant notes here..." />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>
            </Form>

            <Card title="Line Items" extra={<Button icon={<PlusOutlined />} onClick={handleAddLine} type="dashed">Add Item</Button>}>
                <Table dataSource={lines} columns={lineColumns} pagination={false} rowKey="key" size="small" />
            </Card>

            <Row justify="end">
                <Space>
                    <Button icon={<RollbackOutlined />} onClick={() => navigate('/operations/gr')} danger type="primary" ghost>Cancel</Button>
                    <Button type="primary" danger icon={<SaveOutlined />} onClick={() => handleSubmit('DRAFT')} loading={isSaving}>Save as Draft</Button>
                    <Button type="primary" icon={<CheckOutlined />} onClick={() => handleSubmit('CREATED')} loading={isSaving}>Create</Button>
                </Space>
            </Row>
        </Space>
    );
};

const GRCreatePage: React.FC<{ isEditMode?: boolean }> = ({ isEditMode }) => (
    <App>
        <GRCreatePageContent isEditMode={isEditMode} />
    </App>
);

export default GRCreatePage;
