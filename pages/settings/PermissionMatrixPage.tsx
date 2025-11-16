

import React from 'react';
import { App, Card, Empty, Typography, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const ObsoletePermissionMatrixPage: React.FC = () => {
    const navigate = useNavigate();
    return (
        <Card>
            <Empty 
                description={
                    <>
                        <Typography.Title level={5}>This Page is Obsolete</Typography.Title>
                        <Typography.Text>
                            The permission matrix functionality has been integrated into the new Roles Management workflow. 
                            Please use the "Roles Management" screen to manage roles and assign permissions.
                        </Typography.Text>
                    </>
                }
            >
                <Button type="primary" onClick={() => navigate('/settings/roles')}>
                    Go to Roles Management
                </Button>
            </Empty>
        </Card>
    );
};

const PermissionMatrixPageWrapper: React.FC = () => <App><ObsoletePermissionMatrixPage /></App>;
export default PermissionMatrixPageWrapper;