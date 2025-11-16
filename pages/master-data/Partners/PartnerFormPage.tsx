import React from 'react';
import { App, Card, Empty } from 'antd';

const PartnerFormPage: React.FC = () => {
    return (
        <Card>
            <Empty description="Content cleared as requested. This component is ready for new implementation." />
        </Card>
    );
};

const PartnerFormPageWrapper: React.FC = () => (
    <App><PartnerFormPage /></App>
);

export default PartnerFormPageWrapper;
