



import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    App, Button, Card, Col, Form, Input, Row, Spin, Typography, Space, Select, DatePicker,
    InputNumber, Table, Tag, Modal
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, DeleteOutlined, PlusOutlined, MoreOutlined } from '@ant-design/icons';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { useDebounce } from '../../../hooks/useDebounce';
import { Database } from '../../../types/supabase';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import useUIStore from '../../../stores/uiStore';

const { Title, Text } = Typography;

// --- Types ---
type GIType = Database['public']['Enums']['gi_type_enum'] | 'TRANSFER_OUT';
type GIMode = Database['public']['Enums']['issue_mode_enum'];
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

type StockDetail = {
    location_id: number;
    location_code: string;
    lot_id: number | null;
    lot_number: string | null;
    serial_id: number | null;
    serial_number: string | null;
    quantity_available: number;
    picked_qty?: number; // For UI state
    picked?: boolean; // For UI state (serials)
};

type LineItem = {
    key: number;
    product_id: number | null;
    product_name: string;
    product_code: string;
    qty_requested: number;
    uom_id: number | null;
    uom_name: string;
    tracking_type: Database['public']['Enums']['tracking_type_enum'] | null;
    details: StockDetail[]; // For DETAIL mode
};

// --- Detail Modal ---
interface DetailModalProps {
    visible: boolean;
    onCancel: () => void;
    onSave: (lineKey: number, details: StockDetail[], totalQty: number) => void;
    lineItem: LineItem | null;
    warehouseId: number | null;
}

const DetailModal: React.FC<DetailModalProps> = ({ visible, onCancel, onSave, lineItem, warehouseId }) => {
    const { notification } = App.useApp();
    const [loading, setLoading] = useState(false);
    const [stockDetails, setStockDetails] = useState<StockDetail[]>([]);

    useEffect(() => {
        if (visible && warehouseId && lineItem?.product_id) {
            const fetchDetails = async () => {
                setLoading(true);
                try {
                    const { data, error } = await supabase.rpc('get_stock_details', {
                        p_warehouse_id: warehouseId,
                        p_product_id: lineItem.product_id,
                    });
                    if (error) throw error;
                    
                    // Pre-populate picked state from existing details on the line item
                    const detailsMap = new Map(lineItem.details.map(d => [
                        `${d.location_id}-${d.lot_id}-${d.serial_id}`, d
                    ]));

                    const enrichedData = (data as StockDetail[]).map(d => {
                        const key = `${d.location_id}-${d.lot_id}-${d.serial_id}`;
                        const existingDetail = detailsMap.get(key);
                        if (lineItem.tracking_type === 'SERIAL') {
                            return { ...d, picked: !!existingDetail };
                        }
                        return { ...d, picked_qty: existingDetail?.picked_qty || 0 };
                    });

                    setStockDetails(enrichedData);
                } catch (error: any) {
                    notification.error({ message: 'Lỗi tải chi tiết tồn kho', description: error.message });
                } finally {
                    setLoading(false);
                }
            };
            fetchDetails();
        } else {
            setStockDetails([]); // Clear on close
        }
    }, [visible, warehouseId, lineItem, notification]);

    const handleSave = () => {
        if (!lineItem) return;

        const pickedDetails = stockDetails.filter(d => 
            (lineItem.tracking_type === 'SERIAL' && d.picked) ||
            (lineItem.tracking_type === 'LOT' && d.picked_qty && d.picked_qty > 0)
        );

        const totalQty = pickedDetails.reduce((sum, d) => sum + (d.picked_qty || (d.picked ? 1 : 0)), 0);
        onSave(lineItem.key, pickedDetails, totalQty);
    };

    const handleQtyChange = (value: number | null, record: StockDetail) => {
        setStockDetails(prev => prev.map(d => 
            d.location_id === record.location_id && d.lot_id === record.lot_id
                ? { ...d, picked_qty: Math.min(value || 0, d.quantity_available) }
                : d
        ));
    };

    const handleCheckboxChange = (checked: boolean, record: StockDetail) => {
         setStockDetails(prev => prev.map(d => 
            d.serial_id === record.serial_id ? { ...d, picked: checked } : d
        ));
    };

    const columns: ColumnsType<StockDetail> = [
        { title: 'Vị trí', dataIndex: 'location_code', key: 'location_code' },
        { title: 'Lô', dataIndex: 'lot_number', key: 'lot_number', render: t => t || 'N/A' },
        { title: 'Serial', dataIndex: 'serial_number', key: 'serial_number', render: t => t || 'N/A' },
        { title: 'SL Khả dụng', dataIndex: 'quantity_available', key: 'quantity_available' },
        { 
            title: 'SL Chọn', 
            key: 'picking',
            // FIX: Explicitly type the 'record' parameter as 'StockDetail' to resolve type inference issues where it was being treated as 'unknown'.
            render: (_, record: StockDetail) => {
                if (lineItem?.tracking_type === 'LOT') {
                    return <InputNumber min={0} max={record.quantity_available} value={record.picked_qty} onChange={val => handleQtyChange(val, record)} style={{ width: 80 }} />;
                }
                 if (lineItem?.tracking_type === 'SERIAL') {
                    // FIX: Coerce 'record.picked' to boolean to satisfy the 'checked' prop type.
                    return <input type="checkbox" checked={!!record.picked} onChange={e => handleCheckboxChange(e.target.checked, record)} />;
                }
                return null;
            }
        },
    ];

    return (
        <Modal
            title={`Chọn chi tiết cho: ${lineItem?.product_name || ''}`}
            visible={visible}
            onCancel={onCancel}
            onOk={handleSave}
            width={800}
            destroyOnClose
        >
            <Spin spinning={loading}>
                <Table rowKey={r => `${r.location_id}-${r.lot_id}-${r.serial_id}`} columns={columns} dataSource={stockDetails} pagination={false} size="small" />
            </Spin>
        </Modal>
    );
};

// --- Main Page Component ---
const GICreatePage: React.FC = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const { notification } = App.useApp();
    const { user } = useAuth();
    const { isSidebarOpen } = useUIStore();

    // --- State ---
    const [submitting, setSubmitting] = useState(false);
    const [lines, setLines] = useState<LineItem[]>([]);
    const [lineCounter, setLineCounter] = useState(0);
    const [issueMode, setIssueMode] = useState<GIMode>('SUMMARY');

    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [currentLineEdit, setCurrentLineEdit] = useState<LineItem | null>(null);

    // --- Form Watchers ---
    const issueType = Form.useWatch('type', form) as GIType | undefined;
    const warehouseId = Form.useWatch('warehouse_id', form);
    
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
            
            setOptions((current: any[]) => {
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
    useEffect(() => { 
        if(warehouseId) {
            fetchDropdownData(
                'get_available_products_list', 
                { 
                    p_warehouse_id: warehouseId, 
                    p_search_text: debouncedSearch.product || null,
                    p_page_number: 1,
                    p_page_size: 20
                }, 
                setProductOptions, 
                'product', 
                true
            ); 
        }
    }, [debouncedSearch.product, warehouseId, fetchDropdownData]);

    // --- UI Handlers ---
    const handleAddLine = () => {
        if (!warehouseId) {
            notification.warning({ message: 'Vui lòng chọn kho xuất trước khi thêm sản phẩm.'});
            return;
        }
        const newLine: LineItem = {
            key: lineCounter, product_id: null, product_name: '', product_code: '',
            qty_requested: 1, uom_id: null, uom_name: '', tracking_type: null, details: [],
        };
        setLines(prev => [...prev, newLine]);
        setLineCounter(c => c + 1);
    };

    const handleRemoveLine = (key: number) => setLines(prev => prev.filter(line => line.key !== key));
    
    const handleProductSelect = (key: number, productId: string) => {
        const option = productOptions.find(opt => opt.value === productId);
        if (option) {
            const { product } = option;
            setLines(prev => prev.map(line => line.key === key ? {
                    ...line, product_id: product.id, product_name: product.name, product_code: product.code,
                    uom_id: product.base_uom_id, uom_name: product.base_uom_name, tracking_type: product.tracking_type,
                } : line
            ));
        }
    };

    const handleQtyChange = (value: number | null, key: number) => {
         setLines(prev => prev.map(line => line.key === key ? { ...line, qty_requested: value || 0 } : line));
    };

    const openDetailModal = (record: LineItem) => {
        setCurrentLineEdit(record);
        setIsDetailModalVisible(true);
    };

    const handleSaveDetails = (lineKey: number, details: StockDetail[], totalQty: number) => {
        setLines(prev => prev.map(line => line.key === lineKey ? { ...line, details, qty_requested: totalQty } : line));
        setIsDetailModalVisible(false);
        setCurrentLineEdit(null);
    };

    // --- Form Submission ---
    const handleSave = async (status: 'DRAFT' | 'CREATED') => {
        let values;
        try {
          values = await form.validateFields();
        } catch (info) {
          notification.warning({ message: 'Thông tin chưa hợp lệ', description: 'Vui lòng kiểm tra lại các trường dữ liệu bắt buộc.'});
          return;
        }
    
        if (lines.length === 0 || lines.some(l => !l.product_id || l.qty_requested <= 0)) {
            notification.error({ message: 'Dữ liệu không hợp lệ', description: 'Vui lòng thêm sản phẩm và nhập số lượng hợp lệ (> 0).' });
            return;
        }
    
        setSubmitting(true);
        try {
            const headerPayload = {
                warehouse_id: parseInt(values.warehouse_id, 10),
                type: values.type === 'TRANSFER_OUT' ? 'TRANSFER' : values.type,
                partner_id: values.partner_id ? parseInt(values.partner_id, 10) : null,
                ref_no: values.ref_no || null,
                expected_date: values.expected_date ? dayjs(values.expected_date).toISOString() : null,
                notes: values.notes || null,
                status: status,
                issue_mode: issueMode,
                created_by: user?.id,
            };
    
            const { data: giHeader, error: headerError } = await supabase
                .from('goods_issues').insert(headerPayload as any).select('id').single();
            
            if (headerError) throw headerError;
            if (!giHeader) throw new Error("Không thể tạo header phiếu xuất.");
    
            const lineItemsPayload = lines.map(line => ({
                gi_id: giHeader.id, product_id: line.product_id, qty_requested: line.qty_requested,
                uom_id: line.uom_id, tracking_type: line.tracking_type,
            }));
    
            const { data: insertedLines, error: linesError } = await supabase.from('gi_line_items').insert(lineItemsPayload).select();
            if (linesError) throw linesError;

            if (issueMode === 'DETAIL') {
                const detailPayloads: any[] = [];
                insertedLines?.forEach(insertedLine => {
                    const originalLine = lines.find(l => l.product_id === insertedLine.product_id);
                    if (originalLine && originalLine.details.length > 0) {
                        originalLine.details.forEach(detail => {
                            detailPayloads.push({
                                gi_line_id: insertedLine.id,
                                location_id: detail.location_id,
                                lot_id: detail.lot_id,
                                serial_id: detail.serial_id,
                                qty_issued: detail.picked_qty || (detail.picked ? 1 : 0),
                            });
                        });
                    }
                });

                if (detailPayloads.length > 0) {
                    const { error: detailsError } = await supabase.from('gi_line_details').insert(detailPayloads);
                    if (detailsError) throw detailsError;
                }
            }

            notification.success({ message: `Phiếu xuất đã được ${status === 'DRAFT' ? 'lưu nháp' : 'tạo'} thành công` });
            navigate('/operations/gi');
    
        } catch (error: any) {
            notification.error({ message: `Lỗi khi ${status === 'DRAFT' ? 'lưu nháp' : 'tạo'} phiếu xuất`, description: error.message });
        } finally {
            setSubmitting(false);
        }
    };


    const lineColumns: ColumnsType<LineItem> = useMemo(() => [
        { 
            title: 'Sản phẩm', dataIndex: 'product_id', key: 'product', width: '35%',
            render: (productId, record) => (
                 <Select
                    showSearch placeholder="Tìm & chọn sản phẩm..." value={productId}
                    onSearch={(v) => setSearchText(p => ({ ...p, product: v }))}
                    loading={isSearching.product} filterOption={false} options={productOptions}
                    onChange={(value) => handleProductSelect(record.key, value)}
                    style={{ width: '100%' }} notFoundContent={isSearching.product ? <Spin size="small" /> : 'Không tìm thấy sản phẩm'}
                />
            )
        },
        { title: 'Mã SP', dataIndex: 'product_code', key: 'product_code', width: '15%' },
        { title: 'Tracking', dataIndex: 'tracking_type', key: 'tracking_type', width: '10%', render: (type) => type ? <Tag>{type}</Tag> : null },
        { title: 'ĐVT', dataIndex: 'uom_name', key: 'uom', width: '10%' },
        { 
            title: 'Số lượng Yêu cầu', dataIndex: 'qty_requested', key: 'qty_requested', width: '15%',
            render: (qty, record) => (
                <InputNumber min={1} value={qty} onChange={(val) => handleQtyChange(val, record.key)} style={{ width: '100%' }} disabled={issueMode === 'DETAIL'} />
            )
        },
        {
            title: 'Hành động', key: 'action', width: '10%', align: 'center',
            render: (_, record) => (
                <Space>
                    {issueMode === 'DETAIL' && <Button icon={<MoreOutlined />} onClick={() => openDetailModal(record)} />}
                    <Button icon={<DeleteOutlined />} danger onClick={() => handleRemoveLine(record.key)} />
                </Space>
            ),
        },
    ], [isSearching.product, productOptions, issueMode, handleProductSelect, handleQtyChange, handleRemoveLine, openDetailModal]);

    return (
        <div className="pb-24">
            <Form form={form} layout="vertical" initialValues={{ type: 'SALE' }}>
                <Card title={<Title level={4} style={{ margin: 0 }}>Tạo Kế hoạch Xuất kho</Title>} className="mb-6">
                    <Row gutter={24}>
                        <Col xs={24} md={8}>
                            <Form.Item name="warehouse_id" label="Kho xuất" rules={[{ required: true, message: 'Kho là bắt buộc' }]}>
                                <Select showSearch placeholder="Tìm kho..." onSearch={(v) => setSearchText(p => ({ ...p, wh: v }))} loading={isSearching.wh} filterOption={false} options={warehouseOptions} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                             <Form.Item name="type" label="Loại xuất" rules={[{ required: true }]}>
                                <Select>
                                    <Select.Option value="SALE">Sale Order</Select.Option>
                                    <Select.Option value="RETURN">Return</Select.Option>
                                    <Select.Option value="TRANSFER_OUT">Transfer Out</Select.Option>
                                    <Select.Option value="ADJUSTMENT">Adjustment</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                         { (issueType === 'SALE' || issueType === 'RETURN') &&
                            <Col xs={24} md={8}>
                                <Form.Item name="partner_id" label="Đối tác" rules={[{ required: true, message: 'Đối tác là bắt buộc' }]}>
                                    <Select showSearch placeholder="Tìm đối tác..." onSearch={(v) => setSearchText(p => ({ ...p, partner: v }))} loading={isSearching.partner} filterOption={false} options={partnerOptions} />
                                </Form.Item>
                            </Col>
                        }
                        { issueType === 'TRANSFER_OUT' &&
                             <Col xs={24} md={8}>
                                <Form.Item name="to_warehouse_id" label="Kho nhận" rules={[{ required: true, message: 'Kho nhận là bắt buộc' }]}>
                                    <Select showSearch placeholder="Tìm kho nhận..." onSearch={(v) => setSearchText(p => ({ ...p, wh: v }))} loading={isSearching.wh} filterOption={false} options={warehouseOptions} />
                                </Form.Item>
                            </Col>
                        }
                        <Col xs={24} md={8}>
                            <Form.Item name="ref_no" label="Số tham chiếu"><Input /></Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="expected_date" label="Ngày dự kiến"><DatePicker style={{ width: '100%' }} /></Form.Item>
                        </Col>
                         <Col span={24}>
                            <Form.Item name="notes" label="Ghi chú"><Input.TextArea rows={2} /></Form.Item>
                        </Col>
                    </Row>
                </Card>
            </Form>
            
            <Card title={
                <div className="flex justify-between items-center">
                    <Text strong>Danh sách hàng hóa</Text>
                    <Space>
                        <Select value={issueMode} onChange={setIssueMode}>
                            <Select.Option value="SUMMARY">Summary Mode</Select.Option>
                            <Select.Option value="DETAIL">Detail Mode</Select.Option>
                        </Select>
                        <Button onClick={handleAddLine} icon={<PlusOutlined />}>Thêm dòng</Button>
                    </Space>
                </div>
            }>
                <Table
                    columns={lineColumns} dataSource={lines} rowKey="key" pagination={false}
                    locale={{ emptyText: "Chưa có sản phẩm nào được thêm" }} className="modern-table-container custom-scrollbar"
                />
            </Card>

            <DetailModal visible={isDetailModalVisible} onCancel={() => setIsDetailModalVisible(false)} onSave={handleSaveDetails} lineItem={currentLineEdit} warehouseId={warehouseId ? Number(warehouseId) : null} />

            <div 
              className="fixed bottom-0 right-0 bg-white p-4 border-t border-gray-200 flex justify-end z-10 shadow-[0_-2px_6px_-1px_rgba(0,0,0,0.1)] transition-all duration-300"
              style={{ left: isSidebarOpen ? '16rem' : '0rem' }}
            >
                <Space>
                    <Button size="large" icon={<ArrowLeftOutlined />} onClick={() => navigate('/operations/gi')}>Hủy</Button>
                    <Button size="large" icon={<SaveOutlined />} loading={submitting} onClick={() => handleSave('DRAFT')}>Lưu nháp</Button>
                    <Button size="large" type="primary" icon={<SaveOutlined />} loading={submitting} onClick={() => handleSave('CREATED')}>Tạo mới Phiếu</Button>
                </Space>
            </div>
        </div>
    );
};


const GICreatePageWrapper: React.FC = () => (
    <App>
        <GICreatePage />
    </App>
);

export default GICreatePageWrapper;