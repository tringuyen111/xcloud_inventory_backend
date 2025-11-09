
import React from 'react';
import { App, Card, Empty } from 'antd';

const ReportsPage: React.FC = () => {
    return (
        <Card title="Reports">
            <Empty description="Content cleared as requested. This component is ready for new implementation." />
        </Card>
    );
};

const ReportsPageWrapper: React.FC = () => (
    <App><ReportsPage /></App>
);

export default ReportsPageWrapper;
