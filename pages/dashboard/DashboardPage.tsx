import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { 
    App, Card, Row, Col, Typography, Space, Statistic, Table, Tag, Spin, Alert, Empty
} from 'antd';
import { 
    DatabaseOutlined, RiseOutlined, ArrowsAltOutlined, ClockCircleOutlined, SwapOutlined 
} from '@ant-design/icons';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import BarChart from '../../components/charts/BarChart';
import LineChart from '../../components/charts/LineChart';

const { Title, Text, Paragraph } = Typography;

interface DashboardStats {
    total_skus: number;
    total_warehouses: number;
    transactions_today: number;
    pending_approvals: number;
    inventory_by_warehouse: { warehouse_name: string; total_quantity: number }[];
    activity_last_7_days: { date: string; gr_count: number; gi_count: number }[];
    recent_transactions: { type: 'GR' | 'GI'; id: number; code: string; status: string; created_at: string; warehouse_name: string }[];
}

const GR_STATUS_COLOR_MAP: Record<string, string> = {
    DRAFT: 'gold', CREATED: 'blue', RECEIVING: 'orange', PARTIAL_RECEIVED: 'purple', APPROVED: 'cyan', COMPLETED: 'green',
};
const GI_STATUS_COLOR_MAP: Record<string, string> = {
    DRAFT: 'gold', CREATED: 'blue', PICKING: 'orange', PICKED: 'purple', COMPLETED: 'green', CANCELLED: 'red',
};

const DashboardPage: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { notification } = App.useApp();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: rpcError } = await supabase.rpc('get_dashboard_stats');
            if (rpcError) throw rpcError;
            setStats(data);
        } catch (err: any) {
            setError(err.message);
            notification.error({ message: 'Failed to load dashboard data', description: err.message });
        } finally {
            setLoading(false);
        }
    }, [notification]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    if (loading) {
        return <div className="flex justify-center items-center h-full"><Spin size="large" tip="Loading Dashboard..."/></div>;
    }

    if (error) {
        return <Alert message="Error" description={error} type="error" showIcon />;
    }
    
    if (!stats) {
        return <Empty description="Could not load dashboard statistics." />;
    }

    const recentTransactionsColumns = [
        { title: 'Type', dataIndex: 'type', key: 'type', render: (type: string) => <Tag color={type === 'GR' ? 'success' : 'processing'}>{type}</Tag> },
        { title: 'Code', dataIndex: 'code', key: 'code', render: (text: string, record: any) => <Link to={`/operations/${record.type.toLowerCase()}/${record.id}`}>{text || `${record.type}-${record.id}`}</Link> },
        { title: 'Warehouse', dataIndex: 'warehouse_name', key: 'warehouse_name' },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string, record: any) => <Tag color={record.type === 'GR' ? GR_STATUS_COLOR_MAP[status] : GI_STATUS_COLOR_MAP[status]}>{status}</Tag> },
        { title: 'Time', dataIndex: 'created_at', key: 'created_at', render: (text: string) => format(new Date(text), 'pp') },
    ];
    
    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Row gutter={[24, 24]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic title="Total SKUs" value={stats.total_skus} prefix={<DatabaseOutlined />} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic title="Total Warehouses" value={stats.total_warehouses} prefix={<ArrowsAltOutlined />} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic title="Transactions Today" value={stats.transactions_today} prefix={<SwapOutlined />} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic title="Pending Approvals" value={stats.pending_approvals} prefix={<ClockCircleOutlined />} />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <Card title="Inventory by Warehouse">
                       <BarChart data={stats.inventory_by_warehouse} xKey="warehouse_name" yKey="total_quantity" />
                    </Card>
                </Col>
                 <Col xs={24} lg={8}>
                    <Card title="Recent Transactions">
                        <Table
                            dataSource={stats.recent_transactions}
                            columns={recentTransactionsColumns}
                            rowKey="id"
                            pagination={false}
                            size="small"
                        />
                    </Card>
                </Col>
            </Row>
            
             <Row gutter={[24, 24]}>
                <Col xs={24}>
                    <Card title="Transaction Activity (Last 7 Days)">
                        <LineChart
                            data={stats.activity_last_7_days}
                            series={[
                                { key: 'gr_count', label: 'Goods Receipts', color: '#4CAF50' },
                                { key: 'gi_count', label: 'Goods Issues', color: '#2196F3' }
                            ]}
                        />
                    </Card>
                </Col>
            </Row>
        </Space>
    );
};

const DashboardPageWrapper: React.FC = () => (
    <App><DashboardPage /></App>
);

export default DashboardPageWrapper;
