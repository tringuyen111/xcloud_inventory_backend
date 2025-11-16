import React from 'react';
import { App, Card, Empty } from 'antd';

const UomCategoryFormPage: React.FC = () => {
    return (
        <Card>
            <Empty description="Content cleared as requested. This component is ready for new implementation." />
        </Card>
    );
};

const UomCategoryFormPageWrapper: React.FC = () => (
    <App><UomCategoryFormPage /></App>
);

export default UomCategoryFormPageWrapper;
