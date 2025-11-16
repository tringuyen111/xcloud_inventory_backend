import React from 'react';
import { App, Card, Empty } from 'antd';

const BranchFormPage: React.FC = () => {
    return (
        <Card>
            <Empty description="Content cleared as requested. This component is ready for new implementation." />
        </Card>
    );
};

const BranchFormPageWrapper: React.FC = () => (
    <App><BranchFormPage /></App>
);

export default BranchFormPageWrapper;
