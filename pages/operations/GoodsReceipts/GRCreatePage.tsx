
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    App, Button, Card, Col, Form, Input, Row, Spin, Typography, Space, Select, DatePicker,
    InputNumber, Table, Tag
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { useDebounce } from '../../../hooks/useDebounce';
import { Database } from '../../../types/supabase';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import useUIStore from '../../../stores/uiStore';

const { Title } = Typography;

// --- Types ---
type GRType = Database['public']['Enums']['gr_type_enum'] | 'TRANSFER_IN';
type SelectOption = { label: string; value: string; };

type ProductData = {
    id: number;
    name: string;
    code: string;
    base_uom_id: number;
    base_uom_name: string;
    tracking_type: Database['public']['Enums']['tracking_type_enum'];
};

type ProductOption = SelectOption & { product: ProductData };

type LineItem = {
    key: number;
    product_id: number | null;
    product_name: string;
    product_code: string;
    qty_expected: number | null;
    uom_id: number | null;
    uom_name: string;
    tracking_type: Database['public']['Enums']['tracking_type_enum'] | null;
};

const GRCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const { notification } = App.useApp();
    const { user } = useAuth();
    const { isSidebarOpen } = useUIStore();


    // --- Component State ---
    const [submitting, setSubmitting] = useState(false);
    const [lines, setLines] = useState<LineItem[]>([]);
    const [lineCounter, setLineCounter] = useState(0);

    // --- Form State & Watchers ---
    const receiptType = Form.useWatch('type', form) as GRType | undefined;

    // --- Async Selects State ---
    const [warehouseOptions, setWarehouseOptions] = useState<SelectOption[]>([]);
    const [partnerOptions, setPartnerOptions] = useState<SelectOption[]>([]);
    const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
    
    const [searchText, setSearchText] = useState({ wh: '', partner: '', product: '' });
    const debouncedSearch = useDebounce(searchText, 500);
    const [isSearching, setIsSearching] = useState({ wh: false, partner: false, product: false });

    // --- Data Fetching ---
    const fetchDropdownData = useCallback(async (rpcName: string, params: any, setOptions: Function, searchKey: keyof typeof isSearching, isProduct = false) => {
        setIsSearching(prev => ({ ...prev, [searchKey]: true }));
        try {
            const { data, error } = await supabase.rpc(rpcName as any, params);
            if (error) throw error;

            const items = (data as any)?.data || [];
            const newOptions = isProduct 
                ? items.map((p: any) => ({ label: `${p.name} (${p.code})`, value: p.id.toString(), product: p }))
                : items.map((i: any) => ({ label: i.name, value: i.id.toString() }));
            
            setOptions((current: (SelectOption | ProductOption)[]) => {
                const combined = [...current, ...newOptions];
                return Array.from(new Map(combined.map(item => [item.value, item])).values());
            });
        } catch (error: any) {
            notification.error({ message: `Lỗi tải danh sách cho ${rpcName}`, description: error.message });
        } finally {
            setIsSearching(prev => ({ ...prev, [searchKey]: false }));
        }
    }, [notification]);

    useEffect(() => { fetchDropdownData('get_warehouses_list', { p_search_text: debouncedSearch.wh }, setWarehouseOptions, 'wh'); }, [debouncedSearch.wh, fetchDropdownData]);
    useEffect(() => { fetchDropdownData('get_partners_list', { p_search_text: debouncedSearch.partner }, setPartnerOptions, 'partner'); }, [debouncedSearch.partner, fetchDropdownData]);
    useEffect(() => { fetchDropdownData('get_products_list', { p_search_text: debouncedSearch.product }, setProductOptions, 'product', true); }, [debouncedSearch.product, fetchDropdownData]);

    // --- UI Handlers ---
    const handleAddLine = () => {
        const newLine: LineItem = {
            key: lineCounter,
            product_id: null,
            product_name: '',
            product_code: '',
            qty_expected: 1,
            uom_id: null,
            uom_name: '',
            tracking_type: null,
        };
        setLines(prev => [...prev, newLine]);
        setLineCounter(c => c + 1);
    };

    const handleRemoveLine = (key: number) => {
        setLines(prev => prev.filter(line => line.key !== key));
    };
    
    const handleProductSelect = (key: number, productId: string) => {
        const selectedOption = productOptions.find(opt => opt.value === productId);
        if (selectedOption) {
            const product = selectedOption.product;
            setLines(prevLines => prevLines.map(line => 
                line.key === key ? {
                    ...line,
                    product_id: product.id,
                    product_name: product.name,
                    product_code: product.code,
                    uom_id: product.base_uom_id,
                    uom_name: product.base_uom_name,
                    tracking_type: product.tracking_type,
                } : line
            ));
        }
    };

    const handleQtyChange = (value: number | null, key: number) => {
         setLines(prevLines => prevLines.map(line => 
            line.key === key ? { ...line, qty_expected: value } : line
        ));
    };

    // --- Form Submission ---
    const onFinish = async (values: any) => {
        if (lines.length === 0) {
            notification.error({ message: 'Dữ liệu không hợp lệ', description: 'Vui lòng thêm ít nhất một sản phẩm vào phiếu nhập.' });
            return;
        }
        if (lines.some(l => !l.product_id || !l.qty_expected || l.qty_expected <= 0)) {
            notification.error({ message: 'Dữ liệu không hợp lệ', description: 'Vui lòng chọn sản phẩm và nhập số lượng hợp lệ (> 0) cho tất cả các dòng.' });
            return;
        }
    
        setSubmitting(true);
        try {
            // Create a mutable copy from the form's values.
            const payload = { ...values };
    
            // Explicitly delete the 'code' property. This is the crucial step
            // to ensure it is not sent to the database, allowing the trigger
            // to generate the code automatically. This resolves the 'not-null' constraint error.
            delete payload.code;
    
            // Prepare the final payload for insertion, ensuring correct types and nulls.
            const headerPayload = {
                ...payload,
                warehouse_id: parseInt(payload.warehouse_id, 10),
                type: payload.type === 'TRANSFER_IN' ? 'ADJUSTMENT' : payload.type,
                partner_id: payload.partner_id ? parseInt(payload.partner_id, 10) : null,
                ref_no: payload.ref_no || null,
                expected_date: payload.expected_date ? dayjs(payload.expected_date).toISOString() : null,
                notes: payload.notes || null,
                status: 'CREATED' as const,
                created_by: user?.id,
                updated_by: user?.id,
            };
    
            const { data: grHeader, error: headerError } = await supabase
                .from('goods_receipts')
                .insert(headerPayload as any)
                .select('id')
                .single();
            
            if (headerError) throw headerError;
            if (!grHeader) throw new Error("Không thể tạo header phiếu nhập.");
    
            const grLines = lines.map(line => ({
                gr_id: grHeader.id,
                product_id: line.product_id,
                qty_expected: line.qty_expected,
                uom_id: line.uom_id,
                tracking_type: line.tracking_type,
                qty_received: 0, // Default to 0 for planning phase
            }));
    
            const { error: linesError } = await supabase.from('gr_line_items').insert(grLines);
            if (linesError) throw linesError;
    
            notification.success({ message: 'Tạo phiếu nhập kho thành công' });
            navigate('/operations/gr');
    
        } catch (error: any) {
            notification.error({ message: 'Lỗi tạo phiếu nhập kho', description: `RPC Error: ${error.message}` });
        } finally {
            setSubmitting(false);
        }
    };

    const lineColumns: ColumnsType<LineItem> = [
        { 
            title: 'Sản phẩm',
            dataIndex: 'product_id',
            key: 'product',
            width: '35%',
            render: (productId, record) => (
                 <Select
                    showSearch
                    placeholder="Tìm & chọn sản phẩm..."
                    value={productId}
                    onSearch={(v) => setSearchText(p => ({ ...p, product: v }))}
                    loading={isSearching.product}
                    filterOption={false}
                    options={productOptions}
                    onChange={(value) => handleProductSelect(record.key, value)}
                    style={{ width: '100%' }}
                    notFoundContent={isSearching.product ? <Spin size="small" /> : 'Không tìm thấy sản phẩm'}
                />
            )
        },
        { title: 'Mã SP', dataIndex: 'product_code', key: 'product_code', width: '15%' },
        { 
            title: 'Tracking', 
            dataIndex: 'tracking_type', 
            key: 'tracking_type',
            width: '10%',
            render: (type) => type ? <Tag>{type}</Tag> : null
        },
        { title: 'ĐVT', dataIndex: 'uom_name', key: 'uom', width: '10%' },
        { 
            title: 'Số lượng Dự kiến', 
            dataIndex: 'qty_expected', 
            key: 'qty_expected',
            width: '15%',
            render: (qty, record) => (
                <InputNumber 
                    min={1} 
                    value={qty} 
                    onChange={(val) => handleQtyChange(val, record.key)} 
                    style={{ width: '100%' }}
                />
            )
        },
        {
            title: 'Hành động',
            key: 'action',
            width: '10%',
            align: 'center',
            render: (_, record) => (
                <Button icon={<DeleteOutlined />} danger onClick={() => handleRemoveLine(record.key)} />
            ),
        },
    ];

    return (
        <div className="pb-24">
            <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ type: 'PURCHASE' }}>
                <Card title={<Title level={4} style={{ margin: 0 }}>Tạo Kế hoạch Nhập kho</Title>} className="mb-6">
                    <Row gutter={24}>
                        <Col xs={24} md={8}>
                            <Form.Item name="warehouse_id" label="Kho nhận" rules={[{ required: true, message: 'Kho là bắt buộc' }]}>
                                <Select showSearch placeholder="Tìm kho..." onSearch={(v) => setSearchText(p => ({ ...p, wh: v }))} loading={isSearching.wh} filterOption={false} options={warehouseOptions} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                             <Form.Item name="type" label="Loại nhập" rules={[{ required: true }]}>
                                <Select>
                                    <Select.Option value="PURCHASE">Purchase Order</Select.Option>
                                    <Select.Option value="RETURN">Return</Select.Option>
                                    <Select.Option value="TRANSFER_IN">Transfer In</Select.Option>
                                    <Select.Option value="ADJUSTMENT">Adjustment</Select.Option>
                                    <Select.Option value="PRODUCTION">Production</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                         { (receiptType === 'PURCHASE' || receiptType === 'RETURN') &&
                            <Col xs={24} md={8}>
                                <Form.Item name="partner_id" label="Đối tác" rules={[{ required: true, message: 'Đối tác là bắt buộc' }]}>
                                    <Select showSearch placeholder="Tìm đối tác..." onSearch={(v) => setSearchText(p => ({ ...p, partner: v }))} loading={isSearching.partner} filterOption={false} options={partnerOptions} />
                                </Form.Item>
                            </Col>
                        }
                        { receiptType === 'TRANSFER_IN' &&
                             <Col xs={24} md={8}>
                                <Form.Item name="from_warehouse_id" label="Kho nguồn" rules={[{ required: true, message: 'Kho nguồn là bắt buộc' }]}>
                                    <Select showSearch placeholder="Tìm kho nguồn..." onSearch={(v) => setSearchText(p => ({ ...p, wh: v }))} loading={isSearching.wh} filterOption={false} options={warehouseOptions} />
                                </Form.Item>
                            </Col>
                        }
                        <Col xs={24} md={8}>
                            <Form.Item name="ref_no" label="Số tham chiếu">
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="expected_date" label="Ngày dự kiến">
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                         <Col span={24}>
                            <Form.Item name="notes" label="Ghi chú">
                                <Input.TextArea rows={2} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>
            </Form>
            
            <Card title={
                <div className="flex justify-between items-center">
                    <span>Danh sách hàng hóa</span>
                    <Button
                        onClick={handleAddLine}
                        icon={<PlusOutlined />}
                    >
                        Thêm dòng
                    </Button>
                </div>
            }>
                <Table
                    columns={lineColumns}
                    dataSource={lines}
                    rowKey="key"
                    pagination={false}
                    locale={{ emptyText: "Chưa có sản phẩm nào được thêm" }}
                    className="modern-table-container custom-scrollbar"
                />
            </Card>

            <div 
              className="fixed bottom-0 right-0 bg-white p-4 border-t border-gray-200 flex justify-end z-10 shadow-[0_-2px_6px_-1px_rgba(0,0,0,0.1)] transition-all duration-300"
              style={{ left: isSidebarOpen ? '16rem' : '0rem' }}
            >
                <Space>
                    <Button size="large" icon={<ArrowLeftOutlined />} onClick={() => navigate('/operations/gr')}>Hủy</Button>
                    <Button
                        size="large"
                        type="primary"
                        icon={<SaveOutlined />}
                        htmlType="submit"
                        loading={submitting}
                        onClick={() => form.submit()}
                    >
                        Tạo mới Phiếu
                    </Button>
                </Space>
            </div>
        </div>
    );
};


const GRCreatePageWrapper: React.FC = () => (
    <App>
        <GRCreatePage />
    </App>
);

export default GRCreatePageWrapper;
