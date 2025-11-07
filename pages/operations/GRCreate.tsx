import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
    uoms: { id: number; name: string } | null;
};
type PartnerWithOptions = { id: number; name: string };

type EditableLine = {
    key: number;
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
const GRCreatePageContent: React.FC = () => {
    const navigate = useNavigate();
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

    // --- Data Fetching ---
    const fetchInitialData = useCallback(async () => {
        setLoading(true);
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
            notification.error({
                message: 'Error fetching initial data',
                description: error.message
            });
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
                    notification.error({
                        message: 'Failed to fetch locations',
                        description: error.message
                    });
                } else {
                    setLocations(data || []);
                    // Reset location for existing lines if warehouse changes
                    setLines(prevLines => prevLines.map(line => ({ ...line,
                        location_id: undefined
                    })));
                }
            };
            fetchLocations();
        } else {
            setLocations([]);
        }
    }, [selectedWarehouseId, notification]);

    // --- UI Handlers for Lines ---
    const handleAddLine = () => {
        const newLine: EditableLine = {
            key: nextKey,
            expected_qty: 1
        };
        setLines(prev => [...prev, newLine]);
        setNextKey(prev => prev + 1);
    };

    const handleLineChange = (key: number, field: keyof EditableLine, value: any) => {
        const newLines = lines.map(line => {
            if (line.key === key) {
                const updatedLine = { ...line,
                    [field]: value
                };
                if (field === 'goods_model_id') {
                    const model = goodsModels.find(m => m.id === value);
                    updatedLine.uom_name = model?.uoms?.name;
                    updatedLine.tracking_type = model?.tracking_type;
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
    const handleSubmit = async (isDraft: boolean) => {
        setIsSaving(true);
        try {
            if (!user) throw new Error('You must be logged in to perform this action.');
            
            const headerValues = await form.validateFields();
             if (!isDraft) {
                 if (lines.length === 0) throw new Error('Please add at least one line item to create.');
                for (const line of lines) {
                    if (!line.goods_model_id || !line.expected_qty || line.expected_qty <= 0) {
                         throw new Error('All line items must have a Goods Model and an expected quantity greater than 0.');
                    }
                }
            }

            // 1. Insert Header
            const { data: gr, error: grError } = await supabase
                .from('goods_receipts')
                .insert({
                    warehouse_id: headerValues.warehouse_id,
                    receipt_date: dayjs(headerValues.receipt_date).toISOString(),
                    transaction_type: headerValues.transaction_type,
                    status: isDraft ? 'DRAFT' : 'CREATED',
                    notes: headerValues.notes,
                    partner_name: headerValues.partner_name,
                    partner_reference: headerValues.partner_reference,
                    created_by: user.id
                })
                .select()
                .single();

            if (grError) throw grError;

            // 2. Insert Lines
            if (lines.length > 0) {
                 const linesToInsert = lines
                    .filter(line => line.goods_model_id && line.expected_qty)
                    .map(line => ({
                        gr_id: gr.id,
                        goods_model_id: line.goods_model_id!,
                        location_id: line.location_id,
                        expected_qty: line.expected_qty!,
                     }));
                
                if (linesToInsert.length > 0) {
                    const { error: linesError } = await supabase.from('gr_lines').insert(linesToInsert);
                    if (linesError) {
                        // Attempt to roll back header insertion if lines fail
                        await supabase.from('goods_receipts').delete().eq('id', gr.id);
                        throw linesError;
                    }
                }
            }

            notification.success({ message: `Goods Receipt successfully ${isDraft ? 'saved as draft' : 'created'}` });
            navigate(`/operations/gr/${gr.id}`);

        } catch (error: any) {
            notification.error({
                message: 'Submission Failed',
                description: error.message || 'Please check all required fields and line items.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    // --- Memoized Options and Columns ---
    const goodsModelOptions = useMemo(() =>
        goodsModels.map(gm => ({
            value: gm.id,
            label: `[${gm.code}] ${gm.name}`
        })), [goodsModels]);

    const partnerOptions = useMemo(() =>
        partners.map(p => ({
            label: p.name,
            value: p.name
        })), [partners]);

    const lineColumns = useMemo(() => [{
        title: 'Goods Model',
        dataIndex: 'goods_model_id',
        width: '35%',
        render: (_: any, record: EditableLine) => (
            <Select
                showSearch
                allowClear
                value={record.goods_model_id}
                placeholder="Search by name or code..."
                options={goodsModelOptions}
                onChange={(value) => handleLineChange(record.key, 'goods_model_id', value)}
                filterOption={(inputValue, option) =>
                    (option?.label ?? '').toLowerCase().includes(inputValue.toLowerCase())
                }
                style={{ width: '100%' }}
            />
        )
    },
    { title: 'UoM', dataIndex: 'uom_name', width: '8%', render: (text: string) => <Typography.Text>{text || '-'}</Typography.Text> },
    { title: 'Tracking', dataIndex: 'tracking_type', width: '10%', render: (type: string) => type ? <Tag>{type}</Tag> : '-' },
    {
        title: 'Location',
        dataIndex: 'location_id',
        width: '22%',
        render: (_: any, record: EditableLine) => (
            <Select
                value={record.location_id}
                placeholder="Select location"
                options={locations.map(l => ({ label: l.name, value: l.id }))}
                onChange={(value) => handleLineChange(record.key, 'location_id', value)}
                style={{ width: '100%' }}
                allowClear
                disabled={!selectedWarehouseId}
            />
        )
    },
    {
        title: 'Expected Qty',
        dataIndex: 'expected_qty',
        width: '15%',
        align: 'right' as const,
        render: (_: any, record: EditableLine) => (
            <InputNumber
                min={1}
                value={record.expected_qty}
                onChange={(value) => handleLineChange(record.key, 'expected_qty', value)}
                style={{ width: '100%' }}
            />
        )
    },
    {
        title: 'Action',
        key: 'action',
        width: '10%',
        align: 'center' as const,
        render: (_: any, record: EditableLine) => (
            <Popconfirm title="Sure to delete?" onConfirm={() => handleRemoveLine(record.key)}>
                <Button icon={<DeleteOutlined />} danger type="text" />
            </Popconfirm>
        )
    },
    ], [lines, goodsModelOptions, locations, selectedWarehouseId]);

    // --- Render ---
    if (loading) return <Spin fullscreen />;
    
    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <PageHeader title="Create Goods Receipt" description="Create a new goods receipt for incoming inventory." />
            
            <Form form={form} layout="vertical" initialValues={{ transaction_type: 'PURCHASE', receipt_date: dayjs() }}>
                <Card title="Information">
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="transaction_type" label="Transaction Type" rules={[{ required: true }]}>
                                <Select options={GR_TRANSACTION_TYPES.map(t => ({ label: t.replace(/_/g, ' '), value: t }))} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="warehouse_id" label="Warehouse" rules={[{ required: true }]}>
                                <Select showSearch filterOption placeholder="Select warehouse" options={warehouses.map(w => ({ label: w.name, value: w.id }))} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="receipt_date" label="Receipt Date" rules={[{ required: true }]}>
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                           <Form.Item name="partner_name" label="Partner Name">
                               <AutoComplete
                                    options={partnerOptions}
                                    style={{ width: '100%' }}
                                    placeholder="Select or enter partner name"
                                    filterOption={(inputValue, option) =>
                                        option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                                    }
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                           <Form.Item name="partner_reference" label="Partner Reference">
                                <Input placeholder="e.g., PO-123, ASN-456" />
                            </Form.Item>
                        </Col>
                    </Row>
                     <Row>
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
                    <Button icon={<RollbackOutlined />} onClick={() => navigate('/operations/gr')} danger>Cancel</Button>
                    <Button icon={<SaveOutlined />} onClick={() => handleSubmit(true)} loading={isSaving}>Save as Draft</Button>
                    <Button type="primary" icon={<CheckOutlined />} onClick={() => handleSubmit(false)} loading={isSaving}>Create</Button>
                </Space>
            </Row>
        </Space>
    );
};

const GRCreatePage: React.FC = () => (
    <App>
        <GRCreatePageContent />
    </App>
);

export default GRCreatePage;
