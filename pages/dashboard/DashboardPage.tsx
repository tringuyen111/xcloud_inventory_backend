

import React, { useState, useEffect, useCallback } from 'react';
// FIX: Import 'Space' component from 'antd' to fix 'Cannot find name Space' error.
import { App, Card, Col, Row, Select, Spin, Table, Tag, Typography, DatePicker, Space } from 'antd';
import {
    ShoppingOutlined,
    ContainerOutlined,
    WarningOutlined,
    ClockCircleOutlined,
    BoxPlotOutlined,
    CheckSquareOutlined,
    FilterOutlined
} from '@ant-design/icons';
import { supabase } from '../../lib/supabase';
import LineChartPlaceholder from '../../components/charts/LineChart';
import BarChartPlaceholder from '../../components/charts/BarChart';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// --- Types ---
interface KpiData {
    total_skus: number;
    total_on_hand: number;
    total_reserved: number;
    total_available: number;
    low_stock_items: number;
    expiring_soon: number;
}

interface Warehouse {
    id: number;
    name: string;
}

// --- StatCard Component ---
interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: number | string;
    loading: boolean;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, loading, color }) => {
    // A simple map to Tailwind classes to avoid purging issues with dynamic class names.
    const colorClasses: Record<string, { bg: string, text: string }> = {
        blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
        green: { bg: 'bg-green-100', text: 'text-green-600' },
        purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
        cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600' },
        orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
        red: { bg: 'bg-red-100', text: 'text-red-600' },
    };

    const classes = colorClasses[color] || { bg: 'bg-gray-100', text: 'text-gray-600' };

    return (
        <Card bordered={false} className="shadow-sm">
            <Spin spinning={loading}>
                <div className="flex items-center">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${classes.bg} ${classes.text} text-2xl`}>
                        {icon}
                    </div>
                    <div className="ml-4">
                        <Text type="secondary" className="uppercase text-xs font-semibold">{title}</Text>
                        <Title level={3} className="!mt-0 !mb-0">{value}</Title>
                    </div>
                </div>
            </Spin>
        </Card>
    );
};


// --- Dashboard Page ---
const DashboardPage: React.FC = () => {
    const { notification } = App.useApp();
    const [kpis, setKpis] = useState<Partial<KpiData>>({});
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null);
    const [loadingKpis, setLoadingKpis] = useState(true);
    const [loadingActivities, setLoadingActivities] = useState(true);

    const fetchKpis = useCallback(async (warehouseId: number | null) => {
        setLoadingKpis(true);
        try {
            const { data, error } = await supabase.rpc('get_dashboard_kpis', {
                p_warehouse_id: warehouseId
            });

            if (error) throw error;
            
            if (data && data.length > 0) {
                setKpis(data[0]);
            } else {
                setKpis({}); // Reset if no data
            }

        } catch (error: any) {
            notification.error({
                message: 'Failed to load dashboard KPIs',
                description: error.message,
            });
        } finally {
            setLoadingKpis(false);
        }
    }, [notification]);

    useEffect(() => {
        const fetchFilterData = async () => {
            const { data, error } = await supabase.from('warehouses').select('id, name').order('name');
            if (error) {
                notification.error({ message: 'Failed to load warehouses', description: error.message });
            } else {
                setWarehouses(data || []);
            }
        };

        fetchFilterData();
    }, [notification]);

    useEffect(() => {
        fetchKpis(selectedWarehouse);
    }, [fetchKpis, selectedWarehouse]);
    
    // Placeholder for recent activities
    useEffect(() => {
        setLoadingActivities(true);
        // Simulate fetch
        setTimeout(() => {
            setLoadingActivities(false);
        }, 1000);
    }, []);

    const activityColumns = [
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => {
                const color = type === 'INBOUND' ? 'green' : type === 'OUTBOUND' ? 'red' : 'orange';
                return <Tag color={color}>{type}</Tag>
            }
        },
        { title: 'Document', dataIndex: 'document_code', key: 'document_code' },
        { title: 'Status', dataIndex: 'status', key: 'status' },
        { title: 'Time', dataIndex: 'timestamp', key: 'timestamp' },
    ];

    return (
        <div className="space-y-6">
            <Card bordered={false} className="shadow-sm">
                 <Row justify="space-between" align="middle">
                    <Col>
                        <Title level={4} className="!m-0">Dashboard</Title>
                        <Text type="secondary">Overview of your warehouse operations.</Text>
                    </Col>
                    <Col>
                        <Space>
                            <FilterOutlined />
                            <Select
                                placeholder="All Warehouses"
                                allowClear
                                style={{ width: 200 }}
                                value={selectedWarehouse}
                                onChange={(value) => setSelectedWarehouse(value)}
                                options={warehouses.map(w => ({ label: w.name, value: w.id }))}
                            />
                            <RangePicker />
                        </Space>
                    </Col>
                 </Row>
            </Card>

            <Row gutter={[24, 24]}>
                <Col xs={24} sm={12} lg={8} xl={4}>
                    <StatCard icon={<BoxPlotOutlined />} title="Total SKUs" value={kpis.total_skus ?? 0} loading={loadingKpis} color="blue" />
                </Col>
                <Col xs={24} sm={12} lg={8} xl={4}>
                    <StatCard icon={<ContainerOutlined />} title="On Hand" value={kpis.total_on_hand ?? 0} loading={loadingKpis} color="green" />
                </Col>
                <Col xs={24} sm={12} lg={8} xl={4}>
                    <StatCard icon={<ShoppingOutlined />} title="Reserved" value={kpis.total_reserved ?? 0} loading={loadingKpis} color="purple" />
                </Col>
                 <Col xs={24} sm={12} lg={8} xl={4}>
                    <StatCard icon={<CheckSquareOutlined />} title="Available" value={kpis.total_available ?? 0} loading={loadingKpis} color="cyan" />
                </Col>
                <Col xs={24} sm={12} lg={8} xl={4}>
                    <StatCard icon={<WarningOutlined />} title="Low Stock" value={kpis.low_stock_items ?? 0} loading={loadingKpis} color="orange" />
                </Col>
                <Col xs={24} sm={12} lg={8} xl={4}>
                    <StatCard icon={<ClockCircleOutlined />} title="Expiring Soon" value={kpis.expiring_soon ?? 0} loading={loadingKpis} color="red" />
                </Col>
            </Row>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                    <LineChartPlaceholder />
                </Col>
                <Col xs={24} lg={12}>
                    <BarChartPlaceholder />
                </Col>
            </Row>

             <Row>
                <Col span={24}>
                    <Card title="Recent Activities" bordered={false} className="shadow-sm">
                         <Table 
                            columns={activityColumns}
                            dataSource={[]} // Placeholder
                            loading={loadingActivities}
                            pagination={false}
                            locale={{ emptyText: "Recent transactions view (v_recent_transactions) not implemented yet." }}
                         />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

const DashboardPageWrapper: React.FC = () => (
    <App><DashboardPage /></App>
);

export default DashboardPageWrapper;