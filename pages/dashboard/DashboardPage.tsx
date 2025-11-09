
import React, { useEffect, useState } from 'react';
import { App, Card, Col, Row, Space, Spin, Statistic, Table, Tag, Typography, Alert } from 'antd';
import { InboxOutlined, ShoppingCartOutlined, SwapOutlined, TruckOutlined, BoxPlotOutlined } from '@ant-design/icons';
import { dashboardAPI } from '../../utils/apiClient';
import dayjs from 'dayjs';

interface SummaryStats {
  totalStock: number;
  totalGoods: number;
  totalReceipts: number;
  totalIssues: number;
  totalTransfers: number;
  recentActivities: any[];
}

const DashboardPage: React.FC = () => {
    const [summary, setSummary] = useState<SummaryStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { notification } = App.useApp();

    useEffect(() => {
        const fetchSummary = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await dashboardAPI.getSummary();
                setSummary(data);
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
                if (type === 'Receipt') color = 'success';
                if (type === 'Issue') color = 'error';
                if (type === 'Transfer') color = 'processing';
                return <Tag color={color}>{type.toUpperCase()}</Tag>;
            }
        },
        { title: 'Status', dataIndex: 'status', key: 'status' },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
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
                            <Statistic title="Total Onhand" value={summary?.totalStock ?? 0} prefix={<InboxOutlined />} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                        <Card>
                            <Statistic title="Total Goods" value={summary?.totalGoods ?? 0} prefix={<BoxPlotOutlined />} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                        <Card>
                            <Statistic title="Receipts" value={summary?.totalReceipts ?? 0} prefix={<TruckOutlined style={{ transform: 'scaleX(-1)' }} />} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                        <Card>
                            <Statistic title="Issues" value={summary?.totalIssues ?? 0} prefix={<ShoppingCartOutlined />} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                        <Card>
                            <Statistic title="Transfers" value={summary?.totalTransfers ?? 0} prefix={<SwapOutlined />} />
                        </Card>
                    </Col>
                </Row>

                <Card title="Recent Activities" style={{ marginTop: 16 }}>
                    <Table
                        dataSource={summary?.recentActivities ?? []}
                        columns={activityColumns}
                        rowKey="documentNo"
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
