

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    App,
    Button,
    Card,
    Input,
    Table,
    Space,
    Typography,
    Popover,
    Form,
    Select,
    Switch,
    Tooltip,
    Spin,
    Row,
    Col,
} from 'antd';
import {
    SearchOutlined,
    FilterOutlined,
    ArrowLeftOutlined,
    SaveOutlined,
} from '@ant-design/icons';
import { supabase } from '../../lib/supabase';
import { useDebounce } from '../../hooks/useDebounce';
import { ColumnsType } from 'antd/es/table';

// --- Types ---
type RoleDetails = {
    id: number;
    code: string;
    name: string;
    description: string | null;
    is_active: boolean;
    is_system: boolean;
};

type Permission = {
    id: number;
    code: string;
    is_assigned: boolean;
};

type ModulePermissions = {
    module: string;
    permissions: Permission[] | null; // Can be null from DB
};

// Hardcoded actions for table columns, matching the specification
const ACTIONS = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'CANCEL'];

const RoleFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification } = App.useApp();
    const [detailsForm] = Form.useForm();
    const [filterForm] = Form.useForm();

    const [roleDetails, setRoleDetails] = useState<RoleDetails | null>(null);
    const [permissionsByModule, setPermissionsByModule] = useState<ModulePermissions[]>([]);
    const [distinctModules, setDistinctModules] = useState<string[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [updatingSwitch, setUpdatingSwitch] = useState<{ permissionId: number } | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [moduleFilter, setModuleFilter] = useState<string | null>(null);
    const [filterPopoverVisible, setFilterPopoverVisible] = useState(false);

    // Fetch all data for the role editing page
    useEffect(() => {
        const currentRoleId = Number(id);
        if (!id || isNaN(currentRoleId)) {
            if (id !== undefined) { // Avoid error on initial render
                notification.error({ message: 'Invalid Role ID', description: 'No valid role ID was provided in the URL.' });
                navigate('/settings/roles');
            }
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const [roleDetailRes, permissionsRes, modulesRes] = await Promise.all([
                    supabase.from('roles').select('*').eq('id', currentRoleId).single(),
                    supabase.rpc('get_permissions_for_role', { p_role_id: currentRoleId, p_module: moduleFilter || undefined }),
                    supabase.rpc('get_distinct_permission_modules')
                ]);
                
                if (roleDetailRes.error) throw roleDetailRes.error;
                setRoleDetails(roleDetailRes.data);
                detailsForm.setFieldsValue(roleDetailRes.data);

                if (permissionsRes.error) throw permissionsRes.error;
                setPermissionsByModule(permissionsRes.data || []);

                if (modulesRes.error) throw modulesRes.error;
                setDistinctModules((modulesRes.data || []).map((m: {module: string}) => m.module).sort());

            } catch (error: any) {
                notification.error({ message: 'Error Fetching Role Data', description: error.message });
                navigate('/settings/roles');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, moduleFilter, navigate, notification, detailsForm]);

    // Derived state for filtered data with robust checks
    const filteredData = useMemo(() => {
        if (!debouncedSearchTerm) {
            return permissionsByModule;
        }
        const lowercasedFilter = debouncedSearchTerm.toLowerCase();

        if (!Array.isArray(permissionsByModule)) {
            return [];
        }

        return permissionsByModule.filter(item => {
            if (!item || typeof item !== 'object') {
                return false;
            }

            const moduleMatch = item.module && typeof item.module === 'string' && item.module.toLowerCase().includes(lowercasedFilter);
            
            const permissionsMatch = Array.isArray(item.permissions) && item.permissions.some(p => 
                p && p.code && typeof p.code === 'string' && p.code.toLowerCase().includes(lowercasedFilter)
            );
            
            return moduleMatch || permissionsMatch;
        });
    }, [debouncedSearchTerm, permissionsByModule]);

    const handleSwitchChange = async (checked: boolean, permissionId: number) => {
        const currentRoleId = Number(id);
        if (isNaN(currentRoleId)) return;

        setUpdatingSwitch({ permissionId });
        
        const originalData = JSON.parse(JSON.stringify(permissionsByModule));
        setPermissionsByModule(prev => 
            prev.map(mod => ({
                ...mod,
                permissions: Array.isArray(mod.permissions) ? mod.permissions.map(perm => 
                    perm.id === permissionId ? { ...perm, is_assigned: checked } : perm
                ) : null,
            }))
        );

        try {
            const { error } = await supabase.rpc('set_role_permission', { 
                p_role_id: currentRoleId, 
                p_permission_id: permissionId, 
                p_is_assigned: checked 
            });
            if (error) throw error;
        } catch (error: any) {
            notification.error({ message: 'Failed to update permission', description: error.message });
            setPermissionsByModule(originalData); // Revert on error
        } finally {
            setUpdatingSwitch(null);
        }
    };

    const onFinish = async (values: any) => {
        const currentRoleId = Number(id);
        if (isNaN(currentRoleId)) return;
        
        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('roles')
                .update({ name: values.name, description: values.description, is_active: values.is_active })
                .eq('id', currentRoleId);
            if (error) throw error;
            notification.success({ message: 'Role details updated successfully!' });
            const { data, error: roleError } = await supabase.from('roles').select('*').eq('id', currentRoleId).single();
             if (roleError) throw roleError;
             setRoleDetails(data);
             detailsForm.setFieldsValue(data);

        } catch(error: any) {
            notification.error({ message: 'Failed to update role', description: error.message });
        } finally {
            setSubmitting(false);
        }
    }
    
    const handleFilterFinish = (values: { module: string | null }) => {
        setModuleFilter(values.module || null);
        setFilterPopoverVisible(false);
    };

    const handleFilterReset = () => {
        filterForm.resetFields();
        setModuleFilter(null);
        setFilterPopoverVisible(false);
    };

    const columns = useMemo<ColumnsType<ModulePermissions>>(() => {
        const staticColumn: ColumnsType<ModulePermissions>[0] = {
            title: 'Module',
            dataIndex: 'module',
            key: 'module',
            width: 200,
            fixed: 'left',
            render: (text) => <Typography.Text strong>{text}</Typography.Text>,
        };

        const dynamicActionColumns: ColumnsType<ModulePermissions> = ACTIONS.map(action => ({
            title: action,
            key: action,
            align: 'center',
            width: 120,
            render: (_, record: ModulePermissions) => {
                if (!record || typeof record.module !== 'string') {
                    return <Switch disabled size="small" />;
                }

                const permissionCode = `${record.module}.${action}`;
                const perm = Array.isArray(record.permissions)
                    ? record.permissions.find(p => p && p.code === permissionCode)
                    : undefined;

                if (!perm) {
                    return <Switch disabled size="small" />;
                }

                const isUpdating = updatingSwitch?.permissionId === perm.id;
                const isAdmin = roleDetails?.code === 'ADMIN';

                return (
                    <Tooltip title={perm.code}>
                        <Switch
                            checked={isAdmin || perm.is_assigned}
                            loading={isUpdating}
                            disabled={isAdmin}
                            size="small"
                            onChange={(checked) => handleSwitchChange(checked, perm.id)}
                        />
                    </Tooltip>
                );
            },
        }));

        return [staticColumn, ...dynamicActionColumns];
    }, [updatingSwitch, roleDetails, handleSwitchChange]);

    const advancedFilterForm = (
        <div style={{ padding: 16, width: 300 }}>
            <Typography.Title level={5}>Filter by Module</Typography.Title>
            <Form form={filterForm} layout="vertical" onFinish={handleFilterFinish}>
                <Form.Item name="module" label="Module">
                    <Select placeholder="Select a module" allowClear options={distinctModules.map(m => ({ label: m, value: m }))} />
                </Form.Item>
                <Space>
                    <Button onClick={handleFilterReset}>Reset</Button>
                    <Button type="primary" htmlType="submit">Apply</Button>
                </Space>
            </Form>
        </div>
    );

    return (
        <Spin spinning={loading}>
            <Form form={detailsForm} layout="vertical" onFinish={onFinish}>
                <Card className="mb-6">
                    <Row gutter={24} align="middle" justify="space-between">
                        <Col>
                            <Typography.Title level={4} style={{ margin: 0 }}>
                                Edit Role: {roleDetails?.name || 'Loading...'}
                            </Typography.Title>
                        </Col>
                        <Col>
                            <Space>
                                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/settings/roles')}>Back</Button>
                                <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={submitting} disabled={roleDetails?.is_system}>Save Details</Button>
                            </Space>
                        </Col>
                    </Row>
                    <Row gutter={24} className="mt-4">
                        <Col xs={24} md={6}><Form.Item name="code" label="Code"><Input disabled /></Form.Item></Col>
                        <Col xs={24} md={6}><Form.Item name="name" label="Name" rules={[{required: true}]}><Input disabled={roleDetails?.is_system} /></Form.Item></Col>
                        <Col xs={24} md={8}><Form.Item name="description" label="Description"><Input disabled={roleDetails?.is_system} /></Form.Item></Col>
                        <Col xs={24} md={4}><Form.Item name="is_active" label="Status" valuePropName="checked"><Switch disabled={roleDetails?.is_system} /></Form.Item></Col>
                    </Row>
                </Card>
            </Form>
            
            <Card title="Permissions">
                <div className="flex justify-between items-center mb-4">
                    <Space>
                        <Popover content={advancedFilterForm} trigger="click" placement="bottomLeft" visible={filterPopoverVisible} onVisibleChange={setFilterPopoverVisible}>
                            <Tooltip title="Filter by Module"><Button icon={<FilterOutlined />} /></Tooltip>
                        </Popover>
                        <Input
                            placeholder="Search by module or permission code..."
                            prefix={<SearchOutlined />}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: 300 }}
                            allowClear
                        />
                    </Space>
                </div>
                <div className="modern-table-container">
                    <Table
                        rowKey="module"
                        columns={columns}
                        dataSource={filteredData}
                        loading={loading}
                        pagination={false}
                        scroll={{ x: 'max-content' }}
                        className="custom-scrollbar"
                        bordered
                        size="small"
                    />
                </div>
            </Card>
        </Spin>
    );
};

const RoleFormPageWrapper: React.FC = () => <App><RoleFormPage /></App>;
export default RoleFormPageWrapper;