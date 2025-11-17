


import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    // FIX: Import 'Modal' component from 'antd' to fix 'Cannot find name Modal' error.
    App, Button, Card, Col, Form, Input, Row, Spin, Typography, Space, Select, DatePicker,
    InputNumber, Table, Drawer, Empty, Tag, Modal,
} from 'antd';
import { SaveOutlined, PlusOutlined, ArrowLeftOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { useDebounce } from '../../../hooks/useDebounce';
import { Database } from '../../../types/supabase';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// --- Types ---
type SelectOption = { label: string; value: string; };
type ProductOption = SelectOption & { product: ProductData };
// FIX: Add 'TRANSFER_IN' to the type definition to match the form's select options and prevent type errors.
type GRType = Database['public']['Enums']['gr_type_enum'] | 'TRANSFER_IN';

type ProductData = {
    id: number;
    name: string;
    code: string;
    tracking_type: Database['public']['Enums']['tracking_type_enum'];
    base_uom_id: number;
    base_uom_name: string;
};

type LineDetail = {
    key: string; // Unique key for UI rendering
    lot_id?: number | null;
    lot_number?: string;
    serial_ids?: number[] | null;
    serial_numbers?: string[];
    qty_expected: number;
    location_id: number;
    location_code?: string;
    manufacture_date: string | null;
    expiry_date: string | null;
};

// Represents a row in the main table
type LineItem = {
    key: number;
    product_id?: number;
    product?: ProductData; // The full product data object
    qty_expected?: number;
    details: LineDetail[];
};


const GRCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const { notification } = App.useApp();
    const { user } = useAuth();

    // --- Main State ---
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [lines, setLines] = useState<LineItem[]>([]);
    const [isDrawerVisible, setIsDrawerVisible] = useState(false);
    const [editingLineKey, setEditingLineKey] = useState<number | null>(null);

    // --- Form State ---
    const receiptType = Form.useWatch('type', form) as GRType | undefined;
    
    // --- Async Select State ---
    const [warehouseOptions, setWarehouseOptions] = useState<SelectOption[]>([]);
    const [partnerOptions, setPartnerOptions] = useState<SelectOption[]>([]);
    const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
    const [locationOptions, setLocationOptions] = useState<SelectOption[]>([]);
    const [lotOptions, setLotOptions] = useState<SelectOption[]>([]);
    const [serialOptions, setSerialOptions] = useState<SelectOption[]>([]);

    const [searchText, setSearchText] = useState({ wh: '', partner: '', product: '', loc: '', lot: '', serial: '' });
    const debouncedSearch = useDebounce(searchText, 500);
    const [isSearching, setIsSearching] = useState({ wh: false, partner: false, product: false, loc: false, lot: false, serial: false });

    // --- Data Fetching ---
    const fetchDropdownData = useCallback(async (rpcName: string, params: any, setOptions: Function, searchKey: keyof typeof isSearching, isProduct = false) => {
        setIsSearching(prev => ({ ...prev, [searchKey]: true }));
        try {
            const { data, error } = await supabase.rpc(rpcName as any, params);
            if (error) throw error;

            const items = (data as any)?.data || [];
            const newOptions = isProduct 
                ? items.map((p: any) => ({ label: `${p.name} (${p.code})`, value: p.id.toString(), product: p }))
                : items.map((i: any) => ({ label: i.name || i.lot_number || i.serial_number, value: i.id.toString() }));
            
            setOptions((current: SelectOption[]) => {
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
    
    useEffect(() => {
        const warehouseId = form.getFieldValue('warehouse_id');
        if (warehouseId) fetchDropdownData('get_locations_list', { p_search_text: debouncedSearch.loc, p_warehouse_id: warehouseId }, setLocationOptions, 'loc');
    }, [debouncedSearch.loc, form, fetchDropdownData]);

    const editingProduct = editingLineKey !== null ? lines.find(l => l.key === editingLineKey)?.product : null;

    useEffect(() => {
        if (editingProduct?.id) {
            const commonParams = { p_product_id: editingProduct.id, p_status_filter: 'CREATED' };
            fetchDropdownData('get_lots_list', { ...commonParams, p_search_text: debouncedSearch.lot }, setLotOptions, 'lot');
            fetchDropdownData('get_serials_list', { ...commonParams, p_search_text: debouncedSearch.serial }, setSerialOptions, 'serial');
        }
    }, [debouncedSearch.lot, debouncedSearch.serial, editingProduct, fetchDropdownData]);


    // --- UI Handlers ---
    const handleAddLine = () => {
        const newLine: LineItem = { key: Date.now(), details: [] };
        setLines(prev => [...prev, newLine]);
    };

    const handleProductChange = (productId: number, lineKey: number) => {
        const selectedOption = productOptions.find(opt => opt.value === productId.toString());
        if (selectedOption) {
            setLines(prevLines => prevLines.map(line => 
                line.key === lineKey ? { ...line, product_id: productId, product: selectedOption.product, qty_expected: 1, details: [] } : line
            ));
        }
    };

    const handleQtyChange = (value: number | null, lineKey: number) => {
         setLines(prevLines => prevLines.map(line => 
            line.key === lineKey ? { ...line, qty_expected: value || 0, details: [] } : line
        ));
    };

    const handleRemoveLine = (key: number) => {
        setLines(prev => prev.filter(line => line.key !== key));
    };
    
    const openDrawer = (lineKey: number) => {
        setEditingLineKey(lineKey);
        setIsDrawerVisible(true);
    };

    const handleDrawerClose = () => {
        setEditingLineKey(null);
        setIsDrawerVisible(false);
    };
    
    const handleDetailSubmit = (details: LineDetail[]) => {
        if (editingLineKey === null) return;

        setLines(prev => prev.map(line => {
            if (line.key === editingLineKey) {
                return { ...line, details: details };
            }
            return line;
        }));
        handleDrawerClose();
    };


    const onFinish = async (headerValues: any) => {
        if (lines.some(l => !l.product_id || !l.qty_expected || l.qty_expected <= 0)) {
            notification.error({ message: 'Dữ liệu không hợp lệ', description: 'Vui lòng chọn sản phẩm và nhập số lượng hợp lệ cho tất cả các dòng.' });
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase.rpc('create_goods_receipt_with_details', {
                p_header: {
                    ...headerValues,
                    warehouse_id: parseInt(headerValues.warehouse_id),
                    partner_id: headerValues.partner_id ? parseInt(headerValues.partner_id) : null,
                    from_warehouse_id: headerValues.from_warehouse_id ? parseInt(headerValues.from_warehouse_id) : null,
                    expected_date: headerValues.expected_date ? dayjs(headerValues.expected_date).toISOString() : null,
                    status: 'DRAFT',
                    created_by: user?.id
                },
                p_lines: lines.map(line => ({
                    product_id: line.product!.id,
                    qty_expected: line.qty_expected!,
                    uom_id: line.product!.base_uom_id,
                    tracking_type: line.product!.tracking_type,
                    details: line.details.map(d => ({
                        lot_id: d.lot_id,
                        serial_ids: d.serial_ids,
                        qty_expected: d.qty_expected,
                        location_id: d.location_id,
                        manufacture_date: d.manufacture_date,
                        expiry_date: d.expiry_date,
                    }))
                }))
            });

            if (error) throw error;
            notification.success({ message: 'Tạo phiếu nhập kho thành công' });
            navigate('/operations/gr');

        } catch (error: any) {
            notification.error({ message: 'Lỗi tạo phiếu nhập kho', description: error.message });
        } finally {
            setSubmitting(false);
        }
    };


    const lineColumns: ColumnsType<LineItem> = [
        { 
            title: 'Sản phẩm', 
            dataIndex: 'product_id', 
            key: 'product',
            width: '30%',
            render: (productId, record) => (
                <Select
                    showSearch
                    placeholder="Chọn sản phẩm..."
                    value={productId}
                    onSearch={(v) => setSearchText(p => ({ ...p, product: v }))}
                    loading={isSearching.product}
                    filterOption={false}
                    options={productOptions}
                    onChange={(val) => handleProductChange(val, record.key)}
                    style={{ width: '100%' }}
                    notFoundContent={isSearching.product ? <Spin size="small" /> : null}
                />
            )
        },
        { title: 'Mã SP', key: 'product_code', width: '15%', render: (_, record) => record.product?.code || '-' },
        { title: 'Loại tracking', key: 'tracking_type', width: '10%', render: (_, record) => record.product ? <Tag>{record.product.tracking_type}</Tag> : '-' },
        { title: 'ĐVT', key: 'uom', width: '10%', render: (_, record) => record.product?.base_uom_name || '-' },
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
                    disabled={!record.product}
                />
            )
        },
        {
            title: 'Hành động',
            key: 'action',
            width: '20%',
            render: (_, record) => (
                <Space size="middle">
                    <Button 
                        icon={<EditOutlined />} 
                        onClick={() => openDrawer(record.key)}
                        disabled={!record.product || !record.qty_expected || record.qty_expected <= 0}
                    >
                        Chi tiết
                    </Button>
                    <Button icon={<DeleteOutlined />} danger onClick={() => handleRemoveLine(record.key)} />
                </Space>
            ),
        },
    ];

    return (
        <div className="pb-24">
            <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ type: 'PURCHASE' }}>
                <Card title={<Title level={4} style={{ margin: 0 }}>Tạo Phiếu Nhập kho</Title>} className="mb-6">
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
            
            <Card 
                title="Danh sách hàng hóa" 
                extra={<Button icon={<PlusOutlined />} onClick={handleAddLine}>Thêm dòng</Button>}
            >
                <Table
                    columns={lineColumns}
                    dataSource={lines}
                    rowKey="key"
                    pagination={false}
                    locale={{ emptyText: "Nhấn 'Thêm dòng' để bắt đầu" }}
                />
            </Card>

            {editingLineKey !== null && (
                 <DetailDrawer
                    visible={isDrawerVisible}
                    onClose={handleDrawerClose}
                    onSubmit={handleDetailSubmit}
                    line={lines.find(l => l.key === editingLineKey)!}
                    isSearching={isSearching}
                    setSearchText={setSearchText}
                    locationOptions={locationOptions}
                    lotOptions={lotOptions}
                    serialOptions={serialOptions}
                />
            )}


            <div className="fixed bottom-6 right-6 z-50">
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
                        Tạo mới
                    </Button>
                </Space>
            </div>
        </div>
    );
};


// --- Detail Drawer Component ---
interface DetailDrawerProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (details: LineDetail[]) => void;
    line: LineItem;
    isSearching: any;
    setSearchText: Function;
    locationOptions: SelectOption[];
    lotOptions: SelectOption[];
    serialOptions: SelectOption[];
}
const DetailDrawer: React.FC<DetailDrawerProps> = (props) => {
    const { visible, onClose, onSubmit, line, isSearching, setSearchText, locationOptions, lotOptions, serialOptions } = props;
    const [form] = Form.useForm();

    const product = line.product!;
    const totalQty = line.qty_expected || 0;

    useEffect(() => {
        // Pre-fill form if details already exist
        if (line.details && line.details.length > 0) {
            if (product.tracking_type === 'NONE') {
                form.setFieldsValue({ location_id: line.details[0].location_id });
            } else if (product.tracking_type === 'LOT') {
                 form.setFieldsValue({ lot_details: line.details.map(d => ({ ...d, manufacture_date: d.manufacture_date ? dayjs(d.manufacture_date) : null, expiry_date: d.expiry_date ? dayjs(d.expiry_date) : null })) });
            } else if (product.tracking_type === 'SERIAL') {
                 form.setFieldsValue({ ...line.details[0], serial_ids: line.details[0].serial_ids?.map(String), manufacture_date: line.details[0].manufacture_date ? dayjs(line.details[0].manufacture_date) : null, expiry_date: line.details[0].expiry_date ? dayjs(line.details[0].expiry_date) : null });
            }
        } else {
            form.resetFields();
        }
    }, [visible, line, product, form]);

    const handleFinish = (values: any) => {
        let newDetails: LineDetail[] = [];
        let sumQty = 0;

        if (product.tracking_type === 'NONE') {
            newDetails.push({ key: 'detail-none', qty_expected: totalQty, location_id: values.location_id, manufacture_date: null, expiry_date: null });
            sumQty = totalQty;
        } else if (product.tracking_type === 'LOT') {
            newDetails = (values.lot_details || []).map((d: any, i: number) => {
                sumQty += d.qty_expected;
                return { ...d, key: `lot-${i}`, lot_number: lotOptions.find(o => o.value === d.lot_id)?.label };
            });
        } else if (product.tracking_type === 'SERIAL') {
            sumQty = (values.serial_ids || []).length;
            newDetails.push({ ...values, key: 'detail-serial', qty_expected: sumQty, serial_ids: values.serial_ids.map(Number), serial_numbers: serialOptions.filter(o => values.serial_ids.includes(o.value)).map(o => o.label) });
        }
        
        if (sumQty !== totalQty) {
            Modal.error({ title: 'Số lượng không khớp', content: `Tổng số lượng chi tiết (${sumQty}) phải bằng số lượng dự kiến (${totalQty}).` });
            return;
        }
        onSubmit(newDetails);
    };

    const renderContent = () => {
        switch (product.tracking_type) {
            case 'NONE':
                return (
                    <Form.Item name="location_id" label="Vị trí nhận hàng" rules={[{ required: true }]}>
                        <Select showSearch placeholder="Tìm vị trí..." onSearch={(v) => setSearchText((p:any) => ({ ...p, loc: v }))} loading={isSearching.loc} filterOption={false} options={locationOptions} />
                    </Form.Item>
                );
            case 'LOT':
                return (
                     <Form.List name="lot_details">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                        <Form.Item {...restField} name={[name, 'lot_id']} rules={[{ required: true }]}><Select showSearch placeholder="Chọn Lô..." onSearch={(v) => setSearchText((p:any) => ({ ...p, lot: v }))} style={{ width: 150 }} loading={isSearching.lot} filterOption={false} options={lotOptions} /></Form.Item>
                                        <Form.Item {...restField} name={[name, 'qty_expected']} rules={[{ required: true }]}><InputNumber placeholder="Số lượng" min={1} /></Form.Item>
                                        <Form.Item {...restField} name={[name, 'manufacture_date']}><DatePicker placeholder="NSX" /></Form.Item>
                                        <Form.Item {...restField} name={[name, 'expiry_date']}><DatePicker placeholder="HSD" /></Form.Item>
                                        <Form.Item {...restField} name={[name, 'location_id']} rules={[{ required: true }]}><Select showSearch placeholder="Vị trí..." onSearch={(v) => setSearchText((p:any) => ({ ...p, loc: v }))} style={{ width: 150 }} loading={isSearching.loc} filterOption={false} options={locationOptions} /></Form.Item>
                                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                    </Space>
                                ))}
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Thêm Lô</Button>
                            </>
                        )}
                    </Form.List>
                );
            case 'SERIAL':
                return (
                    <Row gutter={16}>
                        <Col span={24}><Form.Item name="serial_ids" label={`Chọn Serials (${totalQty})`} rules={[{ required: true }]}><Select mode="multiple" showSearch placeholder="Chọn Serials..." onSearch={(v) => setSearchText((p:any) => ({ ...p, serial: v }))} loading={isSearching.serial} filterOption={false} options={serialOptions} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="manufacture_date" label="NSX (chung)"><DatePicker style={{width: '100%'}} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="expiry_date" label="HSD (chung)"><DatePicker style={{width: '100%'}} /></Form.Item></Col>
                        <Col span={8}><Form.Item name="location_id" label="Vị trí (chung)" rules={[{ required: true }]}><Select showSearch placeholder="Tìm vị trí..." onSearch={(v) => setSearchText((p:any) => ({ ...p, loc: v }))} loading={isSearching.loc} filterOption={false} options={locationOptions} /></Form.Item></Col>
                    </Row>
                );
            default: return null;
        }
    }
    
    return (
        <Drawer
            title={`Chi tiết cho: ${product.name} (SL: ${totalQty})`}
            width={720}
            onClose={onClose}
            visible={visible}
            bodyStyle={{ paddingBottom: 80 }}
            footer={<Space style={{float: 'right'}}><Button onClick={onClose}>Hủy</Button><Button onClick={() => form.submit()} type="primary">Lưu</Button></Space>}
        >
            <Form form={form} layout="vertical" onFinish={handleFinish}>
                {renderContent()}
            </Form>
        </Drawer>
    );
};


const GRCreatePageWrapper: React.FC = () => (
    <App>
        <GRCreatePage />
    </App>
);

export default GRCreatePageWrapper;