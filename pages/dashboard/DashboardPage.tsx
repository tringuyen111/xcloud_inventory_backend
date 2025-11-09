import React, { useEffect, useState } from 'react';
import { App, Card, Col, Row, Space, Spin, Statistic, Table, Tag, Typography, Alert } from 'antd';
import { InboxOutlined, ShoppingCartOutlined, TruckOutlined, BoxPlotOutlined } from '@ant-design/icons';
// FIX: Replaced the generic 'supabase' client with the schema-specific 'reportingClient' to correctly call RPCs in the reporting schema.
import { reportingClient } from '../../lib/supabase';
import dayjs from 'dayjs';

// Updated data structure to match the get_recent_activities RPC response
interface RecentActivity {
  key: string;
  documentNo: string;
  type: 'Receipt' | 'Issue'; // Matches RPC return type
  status: string;
  date: string;
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
                // Fetch data using direct Supabase RPC calls.
                // FIX: Explicitly call RPCs in the 'reporting' schema as they are not found in 'public'.
                // Using the schema-specific client correctly targets the RPCs without needing an invalid 'schema' option.
                const [countsRes, onhandRes, activitiesRes] = await Promise.all([
                    reportingClient.rpc('get_dashboard_counts', {}),
                    reportingClient.rpc('get_total_onhand', {}),
                    reportingClient.rpc('get_recent_activities', { limit_count: 5 })
                ]);

                if (countsRes.error) throw new Error(`Failed to get counts: ${countsRes.error.message}`);
                if (onhandRes.error) throw new Error(`Failed to get total onhand: ${onhandRes.error.message}`);
                if (activitiesRes.error) throw new Error(`Failed to get recent activities: ${activitiesRes.error.message}`);
                
                const countsData = countsRes.data?.[0];

                setKpi({
                    total_quantity_onhand: onhandRes.data || 0,
                    total_goods_count: countsData?.goods_count || 0,
                    total_receipts: countsData?.receipts_count || 0,
                    total_issues: countsData?.issues_count || 0,
                });
                
                setRecentActivities(activitiesRes.data || []);

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
                let text = type;
                if (type === 'Receipt') {
                    color = 'success';
                    text = 'GR';
                }
                if (type === 'Issue') {
                    color = 'error';
                    text = 'GI';
                }
                return <Tag color={color}>{text}</Tag>;
            }
        },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag>{status}</Tag> },
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
                        rowKey="key"
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