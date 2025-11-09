import React, { useEffect, useState, useMemo } from 'react';
import {
    App, Button, Card, Form, Input, Spin, Select, Row, Col, Affix, DatePicker, Table, InputNumber, Popconfirm,
    // FIX: Added 'Space' to the antd import list to resolve reference errors.
    Space
} from 'antd';
import { SaveOutlined, CloseOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { goodsReceiptAPI, warehouseAPI, partnerAPI, goodsModelAPI, uomAPI } from '../../../utils/apiClient';
import { transactionsClient } from '../../../lib/supabase';
import { Database } from '../../../types/supabase';
import { useUserProfile } from '../../../hooks/useUserProfile';
import dayjs from 'dayjs';

// Define types from Supabase schema
type GRHeaderInsert = Database['transactions']['Tables']['gr_header']['Insert'];
type GRLineInsert = Database['transactions']['Tables']['gr_lines']['Insert'];
type Warehouse = Database['master']['Tables']['warehouses']['Row'];
type Partner = Database['master']['Tables']['partners']['Row'];
type GoodsModel = Database['master']['Tables']['goods_models']['Row'];
type Uom = Database['master']['Tables']['uoms']['Row'];

// Local state type for line items
interface LineItem {
    key: string; // Unique key for React rendering
    goods_model_id: string | null;
    quantity_expected: number;
}

const GRCreatePage: React.FC = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { notification } = App.useApp();
    const { profile, loading: profileLoading } = useUserProfile();

    // Data loading states
    const [loading, setLoading] = useState(false);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [suppliers, setSuppliers] = useState<Partner[]>([]);
    const [goodsModels, setGoodsModels] = useState<GoodsModel[]>([]);
    const [uoms, setUoms] = useState<Uom[]>([]);

    // Form state for line items
    const [lines, setLines] = useState<LineItem[]>([]);
    
    // Create maps for quick data lookup to avoid repeated searches
    const goodsModelsMap = useMemo(() => new Map(goodsModels.map(gm => [gm.id, gm])), [goodsModels]);
    const uomsMap = useMemo(() => new Map(uoms.map(u => [u.id, u.name])), [uoms]);

    // Fetch initial master data for dropdowns
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [whRes, pRes, gmRes, uomRes] = await Promise.all([
                    warehouseAPI.list(),
                    partnerAPI.list(),
                    goodsModelAPI.list(),
                    uomAPI.list()
                ]);
                setWarehouses(whRes || []);
                setSuppliers(pRes.filter(p => p.is_supplier) || []);
                setGoodsModels(gmRes || []);
                setUoms(uomRes || []);
                form.setFieldsValue({ document_date: dayjs() }); // Set default document date to today
            } catch (error: any) {
                notification.error({ message: 'Error fetching initial data', description: error.message });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [form, notification]);
    
    const handleAddLine = () => {
        const newLine: LineItem = {
            key: `new_${Math.random()}`, // Use a simple random key for new lines
            goods_model_id: null,
            quantity_expected: 1,
        };
        setLines([...lines, newLine]);
    };

    const handleLineChange = (key: string, field: keyof LineItem, value: any) => {
        const newLines = lines.map(line => 
            line.key === key ? { ...line, [field]: value } : line
        );
        setLines(newLines);
    };

    const handleRemoveLine = (key: string) => {
        setLines(lines.filter(line => line.key !== key));
    };

    // Main submission logic for both 'Draft' and 'Create'
    const handleSubmit = async (status: GRHeaderInsert['status']) => {
        if (!profile?.organization_uuid || !profile.id) {
            notification.error({ message: 'Error', description: 'User profile and organization context are required.' });
            return;
        }
        if (lines.length === 0 || lines.some(l => !l.goods_model_id)) {
            notification.warning({ message: 'Validation Error', description: 'Please add at least one item and select a model for each line.' });
            return;
        }

        try {
            const headerValues = await form.validateFields();
            setLoading(true);

            const headerPayload: GRHeaderInsert = {
                ...headerValues,
                document_date: dayjs(headerValues.document_date).toISOString(),
                status,
                organization_id: profile.organization_uuid,
                created_by: profile.id,
            };

            const createdHeader = await goodsReceiptAPI.create(headerPayload);
            if (!createdHeader?.id) throw new Error("Failed to create Goods Receipt header.");

            const linesPayload: GRLineInsert[] = lines.map(line => {
                const model = goodsModelsMap.get(line.goods_model_id!);
                if (!model) throw new Error(`Details for model ID ${line.goods_model_id} not found.`);
                return {
                    gr_header_id: createdHeader.id,
                    goods_model_id: line.goods_model_id!,
                    uom_id: model.base_uom_id,
                    quantity_expected: line.quantity_expected || 0,
                    quantity_received: 0,
                };
            });

            if (linesPayload.length > 0) {
                const { error: linesError } = await transactionsClient.from('gr_lines').insert(linesPayload);
                if (linesError) {
                    throw new Error(`Failed to save line items: ${linesError.message}`);
                }
            }

            notification.success({ message: 'Success', description: `Goods Receipt saved as ${status} successfully.` });
            navigate('/operations/gr');

        } catch (error: any) {
            notification.error({ message: 'Operation Failed', description: error.message || 'Please check the form for errors.' });
        } finally {
            setLoading(false);
        }
    };
    
    const lineItemColumns = [
        {
            title: 'Model Asset',
            dataIndex: 'goods_model_id',
            key: 'goods_model_id',
            width: '20%',
            render: (_: any, record: LineItem) => (
                <Select
                    showSearch
                    placeholder="Select Model"
                    style={{ width: '100%' }}
                    value={record.goods_model_id}
                    onChange={(value) => handleLineChange(record.key, 'goods_model_id', value)}
                    optionFilterProp="label"
                    options={goodsModels.map(gm => ({ value: gm.id, label: gm.code }))}
                />
            )
        },
        { 
            title: 'Model Asset Name', 
            key: 'name', 
            width: '30%', 
            render: (_: any, record: LineItem) => record.goods_model_id ? goodsModelsMap.get(record.goods_model_id)?.name : '-'
        },
        { 
            title: 'Tracking Type', 
            key: 'tracking', 
            width: '15%', 
            render: (_: any, record: LineItem) => record.goods_model_id ? goodsModelsMap.get(record.goods_model_id)?.tracking_type : '-'
        },
        { 
            title: 'Unit', 
            key: 'uom', 
            width: '10%', 
            render: (_: any, record: LineItem) => {
                const model = record.goods_model_id ? goodsModelsMap.get(record.goods_model_id) : null;
                return model ? uomsMap.get(model.base_uom_id) : '-';
            }
        },
        {
            title: 'Qty Planned',
            dataIndex: 'quantity_expected',
            key: 'quantity_expected',
            width: '15%',
            render: (_: any, record: LineItem) => (
                <InputNumber
                    min={1}
                    style={{ width: '100%' }}
                    value={record.quantity_expected}
                    onChange={(value) => handleLineChange(record.key, 'quantity_expected', value!)}
                />
            )
        },
        {
            title: 'Action',
            key: 'action',
            width: '10%',
            render: (_: any, record: LineItem) => (
                <Popconfirm title="Sure to delete this line?" onConfirm={() => handleRemoveLine(record.key)}>
                    <Button icon={<DeleteOutlined />} danger type="text" />
                </Popconfirm>
            )
        }
    ];

    const totalQty = useMemo(() => lines.reduce((sum, line) => sum + (line.quantity_expected || 0), 0), [lines]);

    return (
        <Spin spinning={loading || profileLoading}>
            <Form form={form} layout="vertical" onFinish={() => handleSubmit('CREATED')}>
                <Card title="Create Goods Receipt" className="mb-4">
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="warehouse_id" label="Warehouse" rules={[{ required: true }]}>
                                <Select showSearch placeholder="Select Warehouse" options={warehouses.map(w => ({ value: w.id, label: w.name }))} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                             <Form.Item name="supplier_id" label="Supplier">
                                <Select showSearch placeholder="Select Supplier" options={suppliers.map(s => ({ value: s.id, label: s.name }))} allowClear/>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="document_date" label="Expected Date" rules={[{ required: true }]}>
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                             <Form.Item name="gr_type" label="GR Type" rules={[{ required: true }]} initialValue="STANDARD_PO">
                                <Select
                                    options={[
                                        { value: 'STANDARD_PO', label: 'Standard PO' },
                                        { value: 'RETURN', label: 'Return' },
                                        { value: 'TRANSFER', label: 'Transfer' },
                                        { value: 'OTHER', label: 'Other' }
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item name="notes" label="Notes">
                                <Input.TextArea rows={2} placeholder="Enter any notes for this receipt" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                <Card
                    title="Items"
                    extra={<Button icon={<PlusOutlined />} onClick={handleAddLine}>Add line</Button>}
                >
                    <Table
                        columns={lineItemColumns}
                        dataSource={lines}
                        rowKey="key"
                        pagination={false}
                        bordered
                        size="small"
                        footer={() => (
                            <div className="text-right font-bold pr-4">
                                Total Item: {totalQty}
                            </div>
                        )}
                    />
                </Card>

                <Affix offsetBottom={0}>
                    <Card className="mt-4 p-0 border-t">
                        <Row justify="end">
                            <Col>
                                <Space>
                                    <Button danger icon={<CloseOutlined />} onClick={() => navigate('/operations/gr')}>
                                        Cancel
                                    </Button>
                                    <Button icon={<SaveOutlined />} onClick={() => handleSubmit('DRAFT')} loading={loading}>
                                        Save Draft
                                    </Button>
                                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                                        Create
                                    </Button>
                                </Space>
                            </Col>
                        </Row>
                    </Card>
                </Affix>
            </Form>
        </Spin>
    );
};

const GRCreatePageWrapper: React.FC = () => (
    <App><GRCreatePage /></App>
);

export default GRCreatePageWrapper;