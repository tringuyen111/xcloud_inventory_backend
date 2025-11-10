import React, { useEffect, useState } from 'react';
import { App, Card, Col, Row, Space, Spin, Statistic, Table, Tag, Typography, Alert } from 'antd';
import { InboxOutlined, ShoppingCartOutlined, TruckOutlined, BoxPlotOutlined } from '@ant-design/icons';
import { reportingClient, transactionsClient } from '../../lib/supabase';
import dayjs from 'dayjs';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../config/roles';

interface RecentActivity {
  key: string;
  documentNo: string;
  type: 'Receipt' | 'Issue';
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
    const { role } = useAuth();

    const isDataEmpty = kpi.total_quantity_onhand === 0 && kpi.total_goods_count === 0 && kpi.total_receipts === 0 && kpi.total_issues === 0;
    const mightBeRlsIssue = isDataEmpty && (role === ROLES.ADMIN || role === ROLES.WAREHOUSE_MANAGER);

    useEffect(() => {
        const fetchSummary = async () => {
            setLoading(true);
            setError(null);
            try {
                // FIX: Replaced `.single()` with a safer query to prevent crashes when the view returns no rows.
                // The new approach fetches the result array and safely accesses the first element.
                const [summaryRes, grRes, giRes] = await Promise.all([
                    reportingClient.from('v_dashboard_summary').select('*'),
                    transactionsClient.from('gr_header').select('code, status, created_at').order('created_at', { ascending: false }).limit(5),
                    transactionsClient.from('gi_header').select('code, status, created_at').order('created_at', { ascending: false }).limit(5),
                ]);

                if (summaryRes.error) throw new Error(`Failed to get dashboard summary: ${summaryRes.error.message}`);
                if (grRes.error) throw new Error(`Failed to get recent Goods Receipts: ${grRes.error.message}`);
                if (giRes.error) throw new Error(`Failed to get recent Goods Issues: ${giRes.error.message}`);
                
                // Safely access the first (and only expected) row from the summary view result.
                const summaryData = summaryRes.data?.[0];

                if (summaryData) {
                    setKpi({
                        total_quantity_onhand: summaryData.total_quantity_onhand || 0,
                        total_goods_count: summaryData.active_goods_models || 0,
                        total_receipts: summaryData.gr_count_30d || 0,
                        total_issues: summaryData.gi_count_30d || 0,
                    });
                } else {
                    // If no data is returned, set KPIs to 0 to avoid display errors.
                    setKpi({
                        total_quantity_onhand: 0,
                        total_goods_count: 0,
                        total_receipts: 0,
                        total_issues: 0,
                    });
                }
                
                // Combine and sort recent activities from GR and GI tables
                const recentGRs = (grRes.data || []).map(item => ({
                    key: `gr-${item.code}`,
                    documentNo: item.code,
                    type: 'Receipt' as const,
                    status: item.status,
                    date: item.created_at,
                }));

                const recentGIs = (giRes.data || []).map(item => ({
                    key: `gi-${item.code}`,
                    documentNo: item.code,
                    type: 'Issue' as const,
                    status: item.status,
                    date: item.created_at,
                }));

                const combinedActivities = [...recentGRs, ...recentGIs]
                    .sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix())
                    .slice(0, 5);

                setRecentActivities(combinedActivities);

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
            
            {mightBeRlsIssue && !loading && !error && (
                 <Alert
                    message="Dashboard Data is Empty"
                    description="As an administrator, you are seeing no data. This is likely due to restrictive Row-Level Security (RLS) policies on the database. Please ask your DBA to verify the SELECT policies for `v_dashboard_summary`, `gr_header`, and `gi_header` for your role."
                    type="warning"
                    showIcon
                />
            )}


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