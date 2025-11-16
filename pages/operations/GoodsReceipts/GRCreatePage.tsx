import React from 'react';
import { App, Card, Empty } from 'antd';

const GRCreatePage: React.FC = () => {
    return (
        <Card>
            <Empty description="Content cleared as requested. This component is ready for new implementation." />
        </Card>
    );
};

const GRCreatePageWrapper: React.FC = () => (
    <App><GRCreatePage /></App>
);

export default GRCreatePageWrapper;
