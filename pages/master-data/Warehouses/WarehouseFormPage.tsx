import React from 'react';
import { App, Card, Empty } from 'antd';

const WarehouseFormPage: React.FC = () => {
    return (
        <Card>
            <Empty description="Content cleared as requested. This component is ready for new implementation." />
        </Card>
    );
};

const WarehouseFormPageWrapper: React.FC = () => (
    <App><WarehouseFormPage /></App>
);

export default WarehouseFormPageWrapper;
