import React from 'react';
import { App, Card, Empty } from 'antd';

const PutawayCreatePage: React.FC = () => {
    return (
        <Card>
            <Empty description="Content cleared as requested. This component is ready for new implementation." />
        </Card>
    );
};

const PutawayCreatePageWrapper: React.FC = () => (
    <App><PutawayCreatePage /></App>
);

export default PutawayCreatePageWrapper;
