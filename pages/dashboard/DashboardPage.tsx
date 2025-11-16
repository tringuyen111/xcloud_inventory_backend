import React from 'react';
import { App, Card, Empty } from 'antd';

const DashboardPage: React.FC = () => {
    return (
        <Card>
            <Empty description="Content cleared as requested. This component is ready for new implementation." />
        </Card>
    );
};

const DashboardPageWrapper: React.FC = () => (
    <App><DashboardPage /></App>
);

export default DashboardPageWrapper;
