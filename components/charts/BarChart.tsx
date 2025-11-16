
import React from 'react';
import { Card, Empty, Typography } from 'antd';

const { Title } = Typography;

const BarChartPlaceholder: React.FC = () => (
    <Card bordered={false} className="shadow-sm h-full">
        <Title level={5}>Top 10 Products by Onhand Quantity</Title>
        <div className="flex items-center justify-center h-64">
             <Empty description="Chart implementation is pending." />
        </div>
    </Card>
);

export default BarChartPlaceholder;
