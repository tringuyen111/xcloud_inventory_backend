import React from 'react';
import { App, Card, Empty } from 'antd';

const UomFormPage: React.FC = () => {
    return (
        <Card>
            <Empty description="Content cleared as requested. This component is ready for new implementation." />
        </Card>
    );
};

const UomFormPageWrapper: React.FC = () => (
    <App><UomFormPage /></App>
);

export default UomFormPageWrapper;
