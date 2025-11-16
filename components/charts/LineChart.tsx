
import React from 'react';
import { Card, Empty, Typography } from 'antd';

const { Title } = Typography;

const LineChartPlaceholder: React.FC = () => (
    <Card bordered={false} className="shadow-sm h-full">
        <Title level={5}>Inbound vs. Outbound Trend</Title>
        <div className="flex items-center justify-center h-64">
             <Empty description="Chart implementation is pending." />
        </div>
    </Card>
);

export default LineChartPlaceholder;
