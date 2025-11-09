import React, { useEffect, useState, useMemo } from 'react';
import { App, Button, Card, Input, Space, Spin, Table, Tag, Tooltip, Row, Col, Select, Dropdown, Menu, Checkbox } from 'antd';
import { EyeOutlined, PlusOutlined, EditOutlined, FileExcelOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../../hooks/useDebounce';
import { organizationAPI } from '../../../utils/apiClient';
import type { TableProps } from 'antd';
import dayjs from 'dayjs';

// Define the type for an Organization row based on the schema
interface Organization {
  id: string;
  code: string;
  name: string;
  tax_code: string | null;
  phone: string | null;
  is_active: boolean;
  updated_at: string;
}

const OrganizationsListPage: React.FC = () => {
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const navigate = useNavigate();
  const { notification } = App.useApp();

  const initialColumns: TableProps<Organization>['columns'] = useMemo(() => [
    { title: 'Code', dataIndex: 'code', key: 'code', sorter: (a, b) => a.code.localeCompare(b.code) },
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: 'Tax Code', dataIndex: 'tax_code', key: 'tax_code' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'ACTIVE' : 'INACTIVE'}</Tag>,
    },
    {
      title: 'Last Updated',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => dayjs(a.updated_at).unix() - dayjs(b.updated_at).unix(),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, record: Organization) => (
        <Space size="middle">
          <Tooltip title="View Details"><Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/master-data/organizations/${record.id}`)} /></Tooltip>
          <Tooltip title="Edit"><Button type="text" icon={<EditOutlined />} onClick={() => navigate(`/master-data/organizations/${record.id}/edit`)} /></Tooltip>
        </Space>
      ),
    },
  ], [navigate]);
  
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => initialColumns.map(c => c!.key as string));

  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoading(true);
      try {
        // FIX: Reverted to using apiClient, which is the correct way to fetch data from non-public schemas.
        const data = await organizationAPI.list();
        setAllOrganizations(data as Organization[]);
      } catch (error: any) {
        notification.error({ message: 'Error fetching organizations', description: error.message });
      } finally {
        setLoading(false);
      }
    };
    fetchOrganizations();
  }, [notification]);

  useEffect(() => {
    let filtered = [...allOrganizations];
    if (debouncedSearchTerm) {
      const lowercasedFilter = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.code.toLowerCase().includes(lowercasedFilter) ||
        item.name.toLowerCase().includes(lowercasedFilter)
      );
    }
    if (statusFilter !== null) {
        filtered = filtered.filter(item => item.is_active === statusFilter);
    }
    setFilteredOrganizations(filtered);
  }, [debouncedSearchTerm, statusFilter, allOrganizations]);
  
  const columnSelector = (
    <Dropdown
      overlay={
        <Menu>
          <Checkbox.Group
            className="flex flex-col p-2 bg-white rounded shadow-lg"
            options={initialColumns.filter(c => c.key !== 'actions').map(({ key, title }) => ({ label: title as string, value: key as string }))}
            value={visibleColumns}
            onChange={(values) => setVisibleColumns(['actions', ...values as string[]])}
          />
        </Menu>
      }
      trigger={['click']}
    >
      <Button icon={<EyeOutlined />}>Columns</Button>
    </Dropdown>
  );
  
  const visibleTableColumns = useMemo(
      () => initialColumns.filter(c => visibleColumns.includes(c!.key as string)),
      [initialColumns, visibleColumns]
  );

  return (
    <Card
      title="Organizations"
      extra={
        <Space>
          {columnSelector}
          <Button icon={<FileExcelOutlined />}>Export</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/master-data/organizations/create')}>
            Create
          </Button>
        </Space>
      }
    >
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} md={8}>
          <Input.Search 
            placeholder="Search by code or name..." 
            onSearch={(value) => setSearchTerm(value)}
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
          dataSource={filteredOrganizations}
          columns={visibleTableColumns}
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

const OrganizationsListPageWrapper: React.FC = () => (
    <App><OrganizationsListPage /></App>
);

export default OrganizationsListPageWrapper;