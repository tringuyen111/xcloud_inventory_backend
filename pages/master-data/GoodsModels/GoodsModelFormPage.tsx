import React from 'react';
import { App, Card, Empty } from 'antd';

const GoodsModelFormPage: React.FC = () => {
    return (
        <Card>
            <Empty description="Content cleared as requested. This component is ready for new implementation." />
        </Card>
    );
};

const GoodsModelFormPageWrapper: React.FC = () => (
    <App><GoodsModelFormPage /></App>
);

export default GoodsModelFormPageWrapper;
