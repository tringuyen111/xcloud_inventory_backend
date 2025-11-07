
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { 
    App, Card, Table, Form, Row, Col, Input, Select, Button, Typography, Tag, Space 
} from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import { format } from 'date-fns';

const { Title, Text } = Typography;

// Type for the view v_onhand_details
type OnhandDetail = {
  id: number;
  warehouse_name: string;
  location_code: string;
  goods_model_code: string;
  goods_model_name: string;
  tracking_type: 'NONE' | 'LOT' | 'SERIAL';
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  serial_number: string | null;
  lot_number: string | null;
  received_date: string | null;
  expiry_date: string | null;
  days_to_expiry: number | null;
};

// Types for filters
type WarehouseFilter = { id: number; name: string; };
type GoodsModelFilter = { id: number; name: string; code: string; };


const OnhandPage: React.FC = () => {
    const [onhandData, setOnhandData] = useState<OnhandDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const { notification } = App.useApp();
    const [form] = Form.useForm();

    const [warehouses, setWarehouses] = useState<WarehouseFilter[]>([]);
    const [goodsModels, setGoodsModels] = useState<GoodsModelFilter[]>([]);
    
    const [filters, setFilters] = useState<any>({});
    const [pagination, setPagination] = useState({ current: 1, pageSize: 25, total: 0 });

    const fetchData = useCallback(async (page: number, pageSize: number, currentFilters: any) => {
        setLoading(true);
        try {
            // Using a view is more efficient than client-side joins
            let query = supabase
                .from('v_onhand_details')
                .select('*', { count: 'exact' });

            if (currentFilters.warehouse_id) query = query.eq('warehouse_id', currentFilters.warehouse_id);
            if (currentFilters.goods_model_id) query = query.eq('goods_model_id', currentFilters.goods_model_id);
            if (currentFilters.searchTerm) query = query.or(`goods_model_name.ilike.%${currentFilters.searchTerm}%,goods_model_code.ilike.%${currentFilters.searchTerm}%,lot_number.ilike.%${currentFilters.searchTerm}%,serial_number.ilike.%${currentFilters.searchTerm}%`);

            const { data, error, count } = await query
                .order('warehouse_name', { ascending: true })
                .order('goods_model_name', { ascending: true })
                .order('received_date', { ascending: true, nullsFirst: false })
                .range((page - 1) * pageSize, page * pageSize - 1);
            
            if (error) throw error;

            setOnhandData(data as OnhandDetail[] || []);
            setPagination(prev => ({ ...prev, total: count || 0, current: page, pageSize }));

        } catch (error: any) {
            notification.error({ message: "Error fetching onhand inventory", description: error.message });
        } finally {
            setLoading(false);
        }
    }, [notification]);

    const fetchDropdownData = useCallback(async () => {
        try {
            const [whRes, gmRes] = await Promise.all([
                supabase.from('warehouses').select('id, name').eq('is_active', true),
                supabase.from('goods_models').select('id, name, code').eq('is_active', true)
            ]);
            if (whRes.error) throw whRes.error;
            if (gmRes.error) throw gmRes.error;
            setWarehouses(whRes.data || []);
            setGoodsModels(gmRes.data || []);
        } catch (error: any) {
            notification.error({ message: "Error fetching filter data", description: error.message });
        }
    }, [notification]);

    useEffect(() => {
        fetchData(pagination.current, pagination.pageSize, filters);
    }, [fetchData, pagination.current, pagination.pageSize, filters]);

    useEffect(() => {
        fetchDropdownData();
    }, [fetchDropdownData]);


    const handleTableChange = (paginationConfig: any) => {
        setPagination(prev => ({ ...prev, ...paginationConfig }));
    };

    const handleFilterSubmit = (values: any) => {
        setPagination(p => ({ ...p, current: 1 }));
        setFilters(values);
    };
    
    const handleFilterClear = () => {
        form.resetFields();
        setPagination(p => ({ ...p, current: 1 }));
        setFilters({});
    };

    const columns: any[] = [
        { title: 'Warehouse', dataIndex: 'warehouse_name', key: 'warehouse_name', fixed: 'left', width: 150 },
        { title: 'Goods Model', key: 'goods_model', fixed: 'left', width: 250, render: (_:any, r: OnhandDetail) => <><Text strong>{r.goods_model_name}</Text><br/><Text type="secondary">{r.goods_model_code}</Text></> },
        { title: 'Location', dataIndex: 'location_code', key: 'location_code', width: 120 },
        { title: 'Tracking Type', dataIndex: 'tracking_type', key: 'tracking_type', align: 'center', width: 120, render: (t:string) => <Tag>{t}</Tag> },
        { title: 'Lot Number', dataIndex: 'lot_number', key: 'lot_number', width: 150 },
        { title: 'Serial Number', dataIndex: 'serial_number', key: 'serial_number', width: 200 },
        { title: 'Onhand Qty', dataIndex: 'quantity', key: 'quantity', align: 'right', width: 120 },
        { title: 'Reserved Qty', dataIndex: 'reserved_quantity', key: 'reserved_quantity', align: 'right', width: 120 },
        { title: 'Available Qty', dataIndex: 'available_quantity', key: 'available_quantity', align: 'right', width: 120, render: (val:number) => <Text strong type={val > 0 ? 'success' : 'danger'}>{val}</Text> },
        { title: 'Received Date', dataIndex: 'received_date', key: 'received_date', width: 150, render: (d:string) => d ? format(new Date(d), 'yyyy-MM-dd') : '-' },
        { title: 'Expiry Date', dataIndex: 'expiry_date', key: 'expiry_date', width: 150, render: (d:string, r: OnhandDetail) => {
            if (!d) return '-';
            const days = r.days_to_expiry;
            let color = 'default';
            if (days !== null) {
                if (days <= 0) color = 'red';
                else if (days <= 30) color = 'orange';
                else if (days <= 90) color = 'gold';
            }
            return <Tag color={color}>{format(new Date(d), 'yyyy-MM-dd')}</Tag>
        }},
        { title: 'Days to Expiry', dataIndex: 'days_to_expiry', key: 'days_to_expiry', align: 'right', width: 120 },
    ];

    return (
        <Card>
             <Row justify="space-between" align="middle" className="mb-4">
                <Col>
                    <Title level={4} style={{ margin: 0 }}>📦 Onhand Inventory</Title>
                    <Text type="secondary">View detailed stock levels across all locations.</Text>
                </Col>
            </Row>
            <div className="p-4 mb-6 bg-gray-50 rounded-lg">
                 <Form form={form} onFinish={handleFilterSubmit} layout="inline" style={{ flexWrap: 'wrap', gap: '16px' }}>
                    <Form.Item name="warehouse_id" label="Warehouse" className="flex-1 min-w-[200px] mb-0">
                        <Select allowClear placeholder="All Warehouses" options={warehouses.map(w => ({label: w.name, value: w.id}))} />
                    </Form.Item>
                    <Form.Item name="goods_model_id" label="Goods Model" className="flex-1 min-w-[250px] mb-0">
                        <Select showSearch allowClear placeholder="Search Goods Model" options={goodsModels.map(gm => ({label: `[${gm.code}] ${gm.name}`, value: gm.id}))} filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}/>
                    </Form.Item>
                     <Form.Item name="searchTerm" label="Lot/Serial/Name" className="flex-1 min-w-[200px] mb-0">
                        <Input placeholder="Enter lot, serial, name..." />
                    </Form.Item>
                    <Form.Item className="mb-0">
                        <Space>
                            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>Search</Button>
                            <Button onClick={handleFilterClear} icon={<ClearOutlined />}>Clear</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </div>
            <Table
                columns={columns}
                dataSource={onhandData}
                rowKey="id"
                loading={loading}
                pagination={{...pagination, showSizeChanger: true, pageSizeOptions: ['10', '25', '50', '100'], showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`}}
                onChange={handleTableChange}
                scroll={{ x: 'max-content' }}
                size="small"
            />
        </Card>
    );
};

const OnhandPageWrapper: React.FC = () => (
    <App><OnhandPage /></App>
);

export default OnhandPageWrapper;
