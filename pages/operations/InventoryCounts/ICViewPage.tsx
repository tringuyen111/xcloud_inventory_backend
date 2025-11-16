import React from 'react';
import { App, Card, Empty } from 'antd';

const ICViewPage: React.FC = () => {
    return (
        <Card>
            <Empty description="Content cleared as requested. This component is ready for new implementation." />
        </Card>
    );
};

const ICViewPageWrapper: React.FC = () => (
    <App><ICViewPage /></App>
);

export default ICViewPageWrapper;
