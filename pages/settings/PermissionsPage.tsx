import React, { useEffect, useState, useCallback } from 'react';
import { App, Card, Col, List, Row, Select, Spin, Switch, Typography, Alert, Divider } from 'antd';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';

// FIX: Corrected schema from 'auth' to 'public' to match the actual location of these custom tables.
type Role = Database['public']['Tables']['roles']['Row'];
type Permission = Database['public']['Tables']['permissions']['Row'];
type RolePermission = Database['public']['Tables']['role_permissions']['Row'];

const PermissionsPage: React.FC = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
    
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const { notification } = App.useApp();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [rolesRes, permsRes, rolePermsRes] = await Promise.all([
                supabase.from('roles').select('*').in('id', ['ADMIN', 'WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF']),
                supabase.from('permissions').select('*'),
                supabase.from('role_permissions').select('*')
            ]);

            if (rolesRes.error) throw new Error(`Roles: ${rolesRes.error.message}`);
            if (permsRes.error) throw new Error(`Permissions: ${permsRes.error.message}`);
            if (rolePermsRes.error) throw new Error(`Role Permissions: ${rolePermsRes.error.message}`);
            
            setRoles(rolesRes.data || []);
            setPermissions(permsRes.data || []);
            setRolePermissions(rolePermsRes.data || []);

            // Set a default role to view
            if (rolesRes.data && rolesRes.data.length > 0 && !selectedRole) {
                setSelectedRole(rolesRes.data[0].id);
            }
            
        } catch (error: any) {
            notification.error({ message: "Failed to load permissions data", description: error.message });
        } finally {
            setLoading(false);
        }
    }, [notification, selectedRole]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePermissionChange = async (permissionId: string, roleId: string, checked: boolean) => {
        try {
            if (checked) {
                // Grant permission
                const { error } = await supabase.from('role_permissions').insert({ role: roleId, permission: permissionId });
                if (error) throw error;
                setRolePermissions([...rolePermissions, { role: roleId, permission: permissionId }]);
            } else {
                // Revoke permission
                const { error } = await supabase.from('role_permissions').delete().match({ role: roleId, permission: permissionId });
                if (error) throw error;
                setRolePermissions(rolePermissions.filter(rp => !(rp.role === roleId && rp.permission === permissionId)));
            }
            notification.success({ message: `Permission for ${roleId} updated.` });
        } catch (error: any) {
            notification.error({ message: 'Failed to update permission', description: error.message });
        }
    };
    
    const groupedPermissions = permissions.reduce((acc, perm) => {
        (acc[perm.module] = acc[perm.module] || []).push(perm);
        return acc;
    }, {} as Record<string, Permission[]>);

    return (
        <Card title="Permissions Management">
            <Spin spinning={loading}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                        <Typography.Title level={5}>Select a Role to Manage</Typography.Title>
                        <Select
                            style={{ width: '100%' }}
                            placeholder="Select a role"
                            value={selectedRole}
                            onChange={setSelectedRole}
                            options={roles.map(r => ({ value: r.id, label: r.id }))}
                        />
                    </Col>
                    <Col xs={24} md={16}>
                        {selectedRole ? (
                            Object.entries(groupedPermissions).map(([moduleName, perms]) => (
                                <Card key={moduleName} size="small" title={moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} style={{ marginBottom: 16 }}>
                                    <List
                                        dataSource={perms}
                                        renderItem={item => {
                                            const hasPerm = rolePermissions.some(rp => rp.role === selectedRole && rp.permission === item.id);
                                            return (
                                                <List.Item
                                                    actions={[
                                                        <Switch
                                                            checked={hasPerm}
                                                            onChange={(checked) => handlePermissionChange(item.id, selectedRole, checked)}
                                                            disabled={selectedRole === 'ADMIN'} // Admin has all rights, cannot be changed
                                                        />
                                                    ]}
                                                >
                                                    <List.Item.Meta
                                                        title={item.id}
                                                        description={item.description || 'No description'}
                                                    />
                                                </List.Item>
                                            )
                                        }}
                                    />
                                </Card>
                            ))
                        ) : (
                            <Alert message="Please select a role from the left to see its permissions." type="info" />
                        )}
                        {selectedRole === 'ADMIN' && (
                            <Alert message="The ADMIN role has all permissions by default. Its permissions cannot be modified." type="warning" showIcon />
                        )}
                    </Col>
                </Row>
            </Spin>
        </Card>
    );
};

const PermissionsPageWrapper: React.FC = () => (
    <App><PermissionsPage /></App>
);

export default PermissionsPageWrapper;
