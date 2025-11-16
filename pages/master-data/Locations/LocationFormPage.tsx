import React from 'react';
import { App, Card, Empty } from 'antd';

const LocationFormPage: React.FC = () => {
    return (
        <Card>
            <Empty description="Content cleared as requested. This component is ready for new implementation." />
        </Card>
    );
};

const LocationFormPageWrapper: React.FC = () => (
    <App><LocationFormPage /></App>
);

export default LocationFormPageWrapper;
