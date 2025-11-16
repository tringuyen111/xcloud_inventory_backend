import React from 'react';
import { App, Card, Empty } from 'antd';

const OnhandDetailPage: React.FC = () => {
    return (
        <Card>
            <Empty description="Content cleared as requested. This component is ready for new implementation." />
        </Card>
    );
};

const OnhandDetailPageWrapper: React.FC = () => (
    <App><OnhandDetailPage /></App>
);

export default OnhandDetailPageWrapper;
