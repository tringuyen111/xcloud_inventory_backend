import React, { useEffect, useState } from 'react';
import { App, Card, Col, Row, Space, Spin, Statistic, Table, Tag, Typography, Alert } from 'antd';
import { InboxOutlined, ShoppingCartOutlined, TruckOutlined, BoxPlotOutlined } from '@ant-design/icons';
import { apiCall } from '../../lib/api'; 
import dayjs from 'dayjs';

// Data structure from the /dashboard/summary API endpoint
interface DashboardSummary {
  totalStock: number;
  totalGoods: number;
  totalReceipts: number;
  totalIssues: number;
  totalTransfers: number;
  recentActivities: RecentActivity[];
}

// Assuming the structure for recent activities based on current UI needs
interface RecentActivity {
  id: string;
  date: string;
  type: 'GR' | 'GI' | 'GT';
  documentNo: string;
  warehouseName: string;
}

const DashboardPage: React.FC = () => {
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
    const [kpi, setKpi] = useState({
        total_quantity_onhand: 0,
        total_goods_count: 0,
        total_receipts: 0,
        total_issues: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { notification } = App.useApp();

    useEffect(() => {
        const fetchSummary = async () => {
            setLoading(true);
            setError(null);
            try {
                // Refactored to use the new apiCall helper and the /dashboard/summary endpoint
                const summaryData = await apiCall<DashboardSummary>('/dashboard/summary');
                
                setKpi({
                    total_quantity_onhand: summaryData.totalStock,
                    total_goods_count: summaryData.totalGoods,
                    total_receipts: summaryData.totalReceipts,
                    total_issues: summaryData.totalIssues,
                });
                
                setRecentActivities(summaryData.recentActivities || []);

            } catch (err: any) {
                setError(err.message);
                notification.error({
                    message: 'Failed to load dashboard data',
                    description: err.message,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, [notification]);

    const activityColumns = [
        { title: 'Document No', dataIndex: 'documentNo', key: 'documentNo' },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => {
                let color = 'default';
                if (type === 'GR') color = 'success';
                if (type === 'GI') color = 'error';
                if (type === 'GT') color = 'processing';
                return <Tag color={color}>{type?.toUpperCase()}</Tag>;
            }
        },
        { title: 'Warehouse', dataIndex: 'warehouseName', key: 'warehouseName' },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : 'N/A'
        },
    ];

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div className="mb-4">
                <Typography.Title level={3} style={{ margin: 0, color: '#1e293b' }}>
                  Dashboard
                </Typography.Title>
                <Typography.Text type="secondary">Overview of warehouse operations and key metrics.</Typography.Text>
            </div>

            {error && <Alert message="Error" description={error} type="error" showIcon />}

            <Spin spinning={loading}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                        <Card>
                            <Statistic title="Total Onhand" value={kpi.total_quantity_onhand} prefix={<InboxOutlined />} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                        <Card>
                            <Statistic title="Total Goods" value={kpi.total_goods_count} prefix={<BoxPlotOutlined />} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                        <Card>
                            <Statistic title="Receipts (30d)" value={kpi.total_receipts} prefix={<TruckOutlined style={{ transform: 'scaleX(-1)' }} />} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                        <Card>
                            <Statistic title="Issues (30d)" value={kpi.total_issues} prefix={<ShoppingCartOutlined />} />
                        </Card>
                    </Col>
                </Row>

                <Card title="Recent Activities" style={{ marginTop: 16 }}>
                    <Table
                        dataSource={recentActivities}
                        columns={activityColumns}
                        rowKey="id"
                        pagination={{ pageSize: 5 }}
                        size="small"
                    />
                </Card>
            </Spin>
        </Space>
    );
};

const DashboardPageWrapper: React.FC = () => (
    <App><DashboardPage /></App>
);

export default DashboardPageWrapper;
