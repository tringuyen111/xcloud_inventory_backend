import React from 'react';
import { App, Card, Empty } from 'antd';

const GoodsTypeFormPage: React.FC = () => {
    return (
        <Card>
            <Empty description="Content cleared as requested. This component is ready for new implementation." />
        </Card>
    );
};

const GoodsTypeFormPageWrapper: React.FC = () => (
    <App><GoodsTypeFormPage /></App>
);

export default GoodsTypeFormPageWrapper;
