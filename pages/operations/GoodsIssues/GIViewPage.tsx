import React from 'react';
import { App, Card, Empty } from 'antd';

const GIViewPage: React.FC = () => {
    return (
        <Card>
            <Empty description="Content cleared as requested. This component is ready for new implementation." />
        </Card>
    );
};

const GIViewPageWrapper: React.FC = () => (
    <App><GIViewPage /></App>
);

export default GIViewPageWrapper;
