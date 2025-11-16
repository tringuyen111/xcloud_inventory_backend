import React from 'react';
import { App, Card, Empty } from 'antd';

const GICreatePage: React.FC = () => {
    return (
        <Card>
            <Empty description="Content cleared as requested. This component is ready for new implementation." />
        </Card>
    );
};

const GICreatePageWrapper: React.FC = () => (
    <App><GICreatePage /></App>
);

export default GICreatePageWrapper;
