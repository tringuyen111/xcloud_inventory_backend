import React from 'react';
import { App, Card, Empty } from 'antd';

const ICCreatePage: React.FC = () => {
    return (
        <Card>
            <Empty description="Content cleared as requested. This component is ready for new implementation." />
        </Card>
    );
};

const ICCreatePageWrapper: React.FC = () => (
    <App><ICCreatePage /></App>
);

export default ICCreatePageWrapper;
