import React, { useEffect, useState, useMemo } from 'react';
import { App, Card, Spin, Row, Col, Descriptions, Statistic, Tabs, Table, Alert, Tag } from 'antd';
import { useParams } from 'react-router-dom';
import { inventoryClient } from '../../../lib/supabase';
import { goodsModelAPI, uomAPI } from '../../../utils/apiClient';
import { Database } from '../../../types/supabase';
import dayjs from 'dayjs';

type OnhandItem = Database['inventory']['Tables']['onhand']['Row'] & { locations: { code: string } | null };
type MovementItem = Database['inventory']['Tables']['onhand_movements']['Row'];
type GoodsModel = Database['master']['Tables']['goods_models']['Row'] & { uoms: { name: string } | null };
type StockSummary = Database['inventory']['Views']['v_stock_summary']['Row'];

const OnhandDetailPage: React.FC = () => {
    const { warehouseId, goodsModelId } = useParams<{ warehouseId: string; goodsModelId: string }>();
    const { notification } = App.useApp();

    const [goodsModel, setGoodsModel] = useState<GoodsModel | null>(null);
    const [stockDetails, setStockDetails] = useState<OnhandItem[]>([]);
    const [movements, setMovements] = useState<MovementItem[]>([]);
    const [summary, setSummary] = useState<StockSummary | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!warehouseId || !goodsModelId) {
            setError("Warehouse ID or Goods Model ID is missing from the URL.");
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [stockRes, movementRes, summaryRes] = await Promise.all([
                    inventoryClient.from('onhand').select('*, locations(code)').eq('warehouse_id', warehouseId).eq('goods_model_id', goodsModelId),
                    inventoryClient.from('onhand_movements').select('*').eq('warehouse_id', warehouseId).eq('goods_model_id', goodsModelId).order('movement_date', { ascending: false }),
                    inventoryClient.from('v_stock_summary').select('*').eq('warehouse_id', warehouseId).eq('goods_model_id', goodsModelId).single()
                ]);

                if (stockRes.error) throw new Error(`Stock Details: ${stockRes.error.message}`);
                if (movementRes.error) throw new Error(`Movement History: ${movementRes.error.message}`);
                if (summaryRes.error) throw new Error(`Stock Summary: ${summaryRes.error.message}`);

                // Fetch model and UoM separately to ensure UoM name is available
                const modelData = await goodsModelAPI.get(goodsModelId);
                let fullModelData: GoodsModel | null = null;
                if (modelData) {
                    const uomData = await uomAPI.get(modelData.base_uom_id);
                    fullModelData = {
                        ...modelData,
                        uoms: uomData ? { name: uomData.name } : null
                    };
                }

                setGoodsModel(fullModelData);
                setStockDetails(stockRes.data as OnhandItem[]);
                setMovements(movementRes.data as MovementItem[]);
                setSummary(summaryRes.data as StockSummary);

            } catch (err: any) {
                setError(err.message);
                notification.error({ message: "Failed to load data", description: err.message });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [warehouseId, goodsModelId, notification]);
    
    const stockDetailColumns = [
        { title: 'Location', dataIndex: ['locations', 'code'], key: 'location', render: (code: string) => code || 'N/A' },
        { title: 'Lot Number', dataIndex: 'lot_number', key: 'lot_number', render: (lot: string) => lot || '-' },
        { title: 'Serial Number', dataIndex: 'serial_number', key: 'serial_number', render: (serial: string) => serial || '-' },
        { title: 'Onhand Qty', dataIndex: 'quantity_onhand', key: 'quantity_onhand' },
        { title: 'Reserved Qty', dataIndex: 'quantity_reserved', key: 'quantity_reserved' },
        { title: 'Available Qty', dataIndex: 'quantity_available', key: 'quantity_available' },
        { title: 'Received Date', dataIndex: 'received_date', key: 'received_date', render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-' }
    ];

    const movementHistoryColumns = [
        { title: 'Date', dataIndex: 'movement_date', key: 'movement_date', render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'), sorter: (a: MovementItem, b: MovementItem) => dayjs(a.movement_date).unix() - dayjs(b.movement_date).unix() },
        { title: 'Type', dataIndex: 'movement_type', key: 'movement_type', render: (type: string) => <Tag>{type}</Tag> },
        { title: 'Qty Change', dataIndex: 'quantity_change', key: 'quantity_change' },
        { title: 'Ref. Document', dataIndex: 'reference_document_code', key: 'reference_document_code', render: (code: string) => code || '-' },
        { title: 'From Location', dataIndex: 'from_location_id', key: 'from_location_id', render: () => 'N/A' }, // Placeholder
        { title: 'To Location', dataIndex: 'to_location_id', key: 'to_location_id', render: () => 'N/A' }, // Placeholder
    ];

    if (loading) return <Spin size="large" className="flex justify-center items-center h-full" />;
    if (error) return <Alert message="Error" description={error} type="error" showIcon />;
    if (!goodsModel || !summary) return <Alert message="Data not found" description="The requested inventory details could not be found." type="warning" />;

    const tabs = [
        {
            key: '1',
            label: `Stock Details (${stockDetails.length})`,
            children: <Table dataSource={stockDetails} columns={stockDetailColumns} rowKey="id" size="small" pagination={{ pageSize: 5 }} />,
        },
        {
            key: '2',
            label: `Movement History (${movements.length})`,
            children: <Table dataSource={movements} columns={movementHistoryColumns} rowKey="id" size="small" pagination={{ pageSize: 5 }} />,
        },
    ];

    return (
        <Row gutter={[16, 16]}>
            <Col span={24}>
                <Card>
                    <Row>
                        <Col flex="auto">
                            <Descriptions title="Goods Model Information" bordered column={2}>
                                <Descriptions.Item label="Code">{goodsModel.code}</Descriptions.Item>
                                <Descriptions.Item label="Name">{goodsModel.name}</Descriptions.Item>
                                <Descriptions.Item label="SKU">{goodsModel.sku || '-'}</Descriptions.Item>
                                <Descriptions.Item label="Tracking Type"><Tag>{goodsModel.tracking_type}</Tag></Descriptions.Item>
                                <Descriptions.Item label="Base UoM">{goodsModel.uoms?.name || '-'}</Descriptions.Item>
                            </Descriptions>
                        </Col>
                        <Col flex="250px" className="pl-8">
                            <Row gutter={[16,16]}>
                                <Col span={12}><Statistic title="Total Onhand" value={summary.total_quantity_onhand} /></Col>
                                <Col span={12}><Statistic title="Total Reserved" value={summary.total_quantity_reserved} /></Col>
                                <Col span={24}><Statistic title="Total Available" value={summary.total_quantity_available} valueStyle={{ color: '#3f8600' }} /></Col>
                            </Row>
                        </Col>
                    </Row>
                </Card>
            </Col>
            <Col span={24}>
                <Card>
                    <Tabs defaultActiveKey="1" items={tabs} />
                </Card>
            </Col>
        </Row>
    );
};

const OnhandDetailPageWrapper: React.FC = () => (
    <App><OnhandDetailPage /></App>
);

export default OnhandDetailPageWrapper;