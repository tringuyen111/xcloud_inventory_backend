import React from 'react';
import { App, Card, Empty } from 'antd';

const GRViewPage: React.FC = () => {
    return (
        <Card>
            <Empty description="Content cleared as requested. This component is ready for new implementation." />
        </Card>
    );
};

const GRViewPageWrapper: React.FC = () => (
    <App><GRViewPage /></App>
);

export default GRViewPageWrapper;
