import React from 'react';
import { App, Card, Empty } from 'antd';

const GTCreatePage: React.FC = () => {
    return (
        <Card>
            <Empty description="Content cleared as requested. This component is ready for new implementation." />
        </Card>
    );
};

const GTCreatePageWrapper: React.FC = () => (
    <App><GTCreatePage /></App>
);

export default GTCreatePageWrapper;
