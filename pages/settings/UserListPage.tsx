

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { App, Button, Card, Input, Space, Spin, Table, Tag, Tooltip, Row, Col, Select } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';
import { supabase } from '../../lib/supabase';
import { warehouseAPI } from '../../utils/apiClient';
import { Database } from '../../types/supabase';
import dayjs from 'dayjs';

type User = Database['public']['Tables']['users']['Row'];
type Warehouse = Database['master']['Tables']['warehouses']['Row'];

const UserListPage: React.FC = () => {
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [warehouses, setWarehouses] = useState<Pick<Warehouse, 'id' | 'name'>[]>([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<boolean | null>(null);

    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const navigate = useNavigate();
    const { notification } = App.useApp();

    const warehousesMap = useMemo(() => new Map(warehouses.map(w => [w.id, w.name])), [warehouses]);

    const columns = useMemo(() => [
        { title: 'Email', dataIndex: 'email', key: 'email', sorter: (a: User, b: User) => (a.email || '').localeCompare(b.email || '') },
        { title: 'Full Name', dataIndex: 'full_name', key: 'full_name', sorter: (a: User, b: User) => (a.full_name || '').localeCompare(b.full_name || '') },
        { title: 'Role', dataIndex: 'role', key: 'role', render: (role: string) => <Tag>{role?.toUpperCase()}</Tag> },
        { title: 'Default Warehouse', dataIndex: 'warehouse_id', key: 'warehouse_id', render: (id: string | null) => id ? warehousesMap.get(id) || 'N/A' : 'N/A' },
        {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (isActive: boolean) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'ACTIVE' : 'INACTIVE'}</Tag>,
        },
        {
            title: 'Created At',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
            sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
        },
        {
            title: 'Updated At',
            dataIndex: 'updated_at',
            key: 'updated_at',
            render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
            sorter: (a, b) => dayjs(a.updated_at).unix() - dayjs(b.updated_at).unix(),
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'center',
            render: (_: any, record: User) => (
                <Space size="middle">
                    <Tooltip title="Edit"><Button type="text" icon={<EditOutlined />} onClick={() => navigate(`/settings/users/${record.id}/edit`)} /></Tooltip>
                </Space>
            ),
        },
    ], [navigate, warehousesMap]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [usersRes, whRes] = await Promise.all([
                supabase.from('users').select('*'),
                warehouseAPI.list()
            ]);
            if (usersRes.error) throw usersRes.error;

            setAllUsers(usersRes.data || []);
            setWarehouses(whRes || []);
        } catch (error: any) {
            notification.error({ message: 'Error fetching data', description: error.message });
        } finally {
            setLoading(false);
        }
    }, [notification]);

    useEffect(() => {
        fetchData(); // Initial data fetch

        // Set up real-time subscription
        const channel = supabase
            .channel('public:users')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
                console.log('User table change detected, refetching data:', payload);
                notification.info({ message: 'User list updated in real-time.' });
                fetchData();
            })
            .subscribe();

        // Cleanup subscription on component unmount
        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchData, notification]);


    const filteredUsers = useMemo(() => {
        let filtered = [...allUsers];
        if (debouncedSearchTerm) {
            const lowercasedFilter = debouncedSearchTerm.toLowerCase();
            filtered = filtered.filter(item =>
                (item.email && item.email.toLowerCase().includes(lowercasedFilter)) ||
                (item.full_name && item.full_name.toLowerCase().includes(lowercasedFilter))
            );
        }
        if (statusFilter !== null) {
            filtered = filtered.filter(item => item.is_active === statusFilter);
        }
        return filtered;
    }, [debouncedSearchTerm, statusFilter, allUsers]);

    return (
        <Card
            title="User Management"
            extra={
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/settings/users/create')}>
                        Create User
                    </Button>
                </Space>
            }
        >
            <Row gutter={[16, 16]} className="mb-4">
                <Col xs={24} sm={12} md={8}>
                    <Input.Search
                        placeholder="Search by email or name..."
                        onChange={(e) => setSearchTerm(e.target.value)}
                        allowClear
                    />
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Select
                        allowClear
                        style={{ width: '100%' }}
                        placeholder="Filter by status..."
                        onChange={(value) => setStatusFilter(value === undefined ? null : value)}
                        options={[
                            { label: 'Active', value: true },
                            { label: 'Inactive', value: false },
                        ]}
                    />
                </Col>
            </Row>
            <Spin spinning={loading}>
                <Table
                    dataSource={filteredUsers}
                    columns={columns}
                    rowKey="id"
                    size="small"
                    bordered
                    scroll={{ x: 'max-content' }}
                    pagination={{
                        defaultPageSize: 10,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50'],
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
                    }}
                />
            </Spin>
        </Card>
    );
};

const UserListPageWrapper: React.FC = () => (
    <App><UserListPage /></App>
);

export default UserListPageWrapper;