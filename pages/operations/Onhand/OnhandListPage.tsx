import React, { useEffect, useState, useMemo } from 'react';
import { App, Card, Input, Space, Spin, Table, Button, Row, Col, Select, Tooltip } from 'antd';
import { FileExcelOutlined, EyeOutlined } from '@ant-design/icons';
import { useDebounce } from '../../../hooks/useDebounce';
import { inventoryClient } from '../../../lib/supabase';
import { warehouseAPI, goodsModelAPI, uomAPI } from '../../../utils/apiClient';
import { Database } from '../../../types/supabase';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

type Warehouse = Database['master']['Tables']['warehouses']['Row'];
// FIX: Added local type definitions for GoodsModel and Uom.
// This helps TypeScript correctly infer the types from the API responses within Promise.all,
// preventing properties from being accessed on an 'unknown' type.
type GoodsModel = Database['master']['Tables']['goods_models']['Row'];
type Uom = Database['master']['Tables']['uoms']['Row'];
type StockSummary = Database['inventory']['Views']['v_stock_summary']['Row'] & {
    warehouses: Pick<Warehouse, 'name'>;
    goods_models: {
        code: string;
        name: string;
        tracking_type: string;
        uoms: { name: string } | null;
    } | null;
};

const OnhandSummaryPage: React.FC = () => {
    const [allOnhand, setAllOnhand] = useState<StockSummary[]>([]);
    const [filteredOnhand, setFilteredOnhand] = useState<StockSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [warehouses, setWarehouses] = useState<Pick<Warehouse, 'id' | 'name'>[]>([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState<string[]>([]);

    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const navigate = useNavigate();
    const { notification } = App.useApp();

    const columns = useMemo(() => [
        { title: 'Warehouse', dataIndex: ['warehouses', 'name'], key: 'warehouse' },
        { title: 'Goods Code', dataIndex: ['goods_models', 'code'], key: 'goodsCode' },
        { title: 'Goods Name', dataIndex: ['goods_models', 'name'], key: 'goodsName' },
        { title: 'Tracking Type', dataIndex: ['goods_models', 'tracking_type'], key: 'trackingType' },
        { title: 'UoM', key: 'uom', render: (_: any, record: StockSummary) => record.goods_models?.uoms?.name || 'N/A' },
        { title: 'Total Onhand', dataIndex: 'total_quantity_onhand', key: 'total_quantity_onhand', sorter: (a: StockSummary, b: StockSummary) => (a.total_quantity_onhand ?? 0) - (b.total_quantity_onhand ?? 0) },
        { title: 'Total Reserved', dataIndex: 'total_quantity_reserved', key: 'total_quantity_reserved', sorter: (a: StockSummary, b: StockSummary) => (a.total_quantity_reserved ?? 0) - (b.total_quantity_reserved ?? 0) },
        { title: 'Total Available', dataIndex: 'total_quantity_available', key: 'total_quantity_available', sorter: (a: StockSummary, b: StockSummary) => (a.total_quantity_available ?? 0) - (b.total_quantity_available ?? 0) },
        { title: 'Last Updated', dataIndex: 'last_updated_at', key: 'last_updated_at', render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : 'N/A' },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: StockSummary) => (
                <Tooltip title="View Details">
                    <Button icon={<EyeOutlined />} onClick={() => navigate(`/operations/onhand/${record.warehouse_id}/${record.goods_model_id}`)} />
                </Tooltip>
            ),
        }
    ], [navigate]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [summaryRes, whData, gmData, uomData] = await Promise.all([
                    inventoryClient.from('v_stock_summary').select('*'),
                    warehouseAPI.list(),
                    goodsModelAPI.list(),
                    uomAPI.list()
                ]);
    
                if (summaryRes.error) throw summaryRes.error;
                
                // FIX: Explicitly cast the results from Promise.all to ensure correct type inference.
                // This resolves issues where TypeScript infers these arrays as `unknown[]` or `any[]`.
                const warehousesMap = new Map((whData as Warehouse[]).map(w => [w.id, w]));
                const uomsMap = new Map((uomData as Uom[]).map(u => [u.id, u]));
                const goodsModelsMap = new Map((gmData as GoodsModel[]).map(gm => [gm.id, gm]));
    
                const enrichedData = (summaryRes.data || []).map(summary => {
                    const warehouse = warehousesMap.get(summary.warehouse_id!);
                    const goodsModel = goodsModelsMap.get(summary.goods_model_id!);
                    const uom = goodsModel ? uomsMap.get(goodsModel.base_uom_id) : null;
                    
                    return {
                        ...summary,
                        warehouses: warehouse ? { name: warehouse.name } : { name: 'N/A' },
                        goods_models: goodsModel ? {
                            code: goodsModel.code,
                            name: goodsModel.name,
                            tracking_type: goodsModel.tracking_type,
                            uoms: uom ? { name: uom.name } : null
                        } : null
                    };
                });
                
                setAllOnhand(enrichedData as StockSummary[]);
                setWarehouses((whData as Warehouse[]) || []);
            } catch (error: any) {
                notification.error({ message: 'Error fetching onhand summary', description: error.message });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [notification]);

    useEffect(() => {
        let filteredData = allOnhand.filter(item => {
            const searchMatch = debouncedSearchTerm
                ? (item.goods_models?.code?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
                  (item.goods_models?.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
                : true;

            const warehouseMatch = warehouseFilter.length > 0 ? warehouseFilter.includes(item.warehouse_id!) : true;

            return searchMatch && warehouseMatch;
        });
        setFilteredOnhand(filteredData);
    }, [debouncedSearchTerm, allOnhand, warehouseFilter]);

    return (
        <Card
            title="Onhand Summary Report"
            extra={
                <Space>
                    <Button icon={<FileExcelOutlined />}>Export</Button>
                </Space>
            }
        >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={8}>
                        <Input.Search
                            placeholder="Search by goods code or name..."
                            onChange={(e) => setSearchTerm(e.target.value)}
                            allowClear
                        />
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Select
                            mode="multiple"
                            allowClear
                            style={{ width: '100%' }}
                            placeholder="Filter by warehouse..."
                            onChange={setWarehouseFilter}
                            options={warehouses.map(w => ({ label: w.name, value: w.id }))}
                        />
                    </Col>
                </Row>
                <Spin spinning={loading}>
                    <Table
                        dataSource={filteredOnhand}
                        columns={columns}
                        rowKey={(record) => `${record.warehouse_id}-${record.goods_model_id}`}
                        size="small"
                        bordered
                        scroll={{ x: 1300 }}
                        pagination={{ defaultPageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
                    />
                </Spin>
            </Space>
        </Card>
    );
};

const OnhandSummaryPageWrapper: React.FC = () => (
    <App><OnhandSummaryPage /></App>
);

export default OnhandSummaryPageWrapper;