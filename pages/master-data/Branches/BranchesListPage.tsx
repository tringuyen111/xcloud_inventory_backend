import React, { useEffect, useState, useMemo } from 'react';
import { App, Button, Card, Input, Space, Spin, Table, Tag, Tooltip, Row, Col, Select, Dropdown, Menu, Checkbox } from 'antd';
import { EyeOutlined, PlusOutlined, EditOutlined, FileExcelOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../../hooks/useDebounce';
import { branchAPI, organizationAPI } from '../../../utils/apiClient';
import { Database } from '../../../types/supabase';
import dayjs from 'dayjs';
import type { TableProps } from 'antd';
import Can from '../../../components/auth/Can';

type Branch = Database['master']['Tables']['branches']['Row'];
type Organization = Database['master']['Tables']['organizations']['Row'];

const BranchesListPage: React.FC = () => {
  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Pick<Organization, 'id' | 'name'>[]>([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  const [orgFilter, setOrgFilter] = useState<string[]>([]);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const navigate = useNavigate();
  const { notification } = App.useApp();
  
  const organizationsMap = useMemo(() => new Map(organizations.map(o => [o.id, o.name])), [organizations]);

  const initialColumns: TableProps<Branch>['columns'] = useMemo(() => [
    { title: 'Branch Code', dataIndex: 'code', key: 'code', sorter: (a, b) => a.code.localeCompare(b.code) },
    { title: 'Branch Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
    { 
      title: 'Organization', 
      dataIndex: 'organization_id', 
      key: 'organization_id', 
      render: (id: string) => organizationsMap.get(id) || id,
      sorter: (a, b) => (organizationsMap.get(a.organization_id) || '').localeCompare(organizationsMap.get(b.organization_id) || '')
    },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Manager', dataIndex: 'manager_name', key: 'manager_name' },
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
      render: (_: any, record: Branch) => (
        <Space size="middle">
          <Tooltip title="View Details"><Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/master-data/branches/${record.id}`)} /></Tooltip>
          <Can module="masterData" action="edit">
            <Tooltip title="Edit"><Button type="text" icon={<EditOutlined />} onClick={() => navigate(`/master-data/branches/${record.id}/edit`)} /></Tooltip>
          </Can>
        </Space>
      ),
    },
  ], [navigate, organizationsMap]);
  
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => initialColumns.map(c => c!.key as string));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [branchData, orgData] = await Promise.all([
            branchAPI.list(),
            organizationAPI.list()
        ]);

        setAllBranches(branchData || []);
        setOrganizations(orgData || []);
      } catch (error: any) {
        notification.error({ message: 'Error fetching data', description: error.message });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [notification]);

  useEffect(() => {
    let filtered = [...allBranches];
    if (debouncedSearchTerm) {
      const lowercasedFilter = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.code.toLowerCase().includes(lowercasedFilter) ||
        item.name.toLowerCase().includes(lowercasedFilter) ||
        (item.manager_name && item.manager_name.toLowerCase().includes(lowercasedFilter))
      );
    }
    if (statusFilter !== null) {
        filtered = filtered.filter(item => item.is_active === statusFilter);
    }
    if (orgFilter.length > 0) {
        filtered = filtered.filter(item => orgFilter.includes(item.organization_id));
    }
    setFilteredBranches(filtered);
  }, [debouncedSearchTerm, statusFilter, orgFilter, allBranches]);

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
        title="Branches"
        extra={
            <Space>
                {columnSelector}
                <Button icon={<FileExcelOutlined />}>Export</Button>
                <Can module="masterData" action="create">
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/master-data/branches/create')}>
                        Create
                    </Button>
                </Can>
            </Space>
        }
    >
        <Row gutter={[16, 16]} className="mb-4">
            <Col xs={24} sm={12} md={8}>
                <Input.Search 
                    placeholder="Search by code, name, manager..." 
                    onSearch={setSearchTerm}
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
            <Col xs={24} sm={12} md={8}>
                <Select
                    mode="multiple"
                    allowClear
                    style={{ width: '100%' }}
                    placeholder="Filter by Organization..."
                    onChange={setOrgFilter}
                    options={organizations.map(o => ({ label: o.name, value: o.id }))}
                    maxTagCount="responsive"
                />
            </Col>
        </Row>
        <Spin spinning={loading}>
          <Table
            dataSource={filteredBranches}
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

const BranchesListPageWrapper: React.FC = () => (
    <App><BranchesListPage /></App>
);

export default BranchesListPageWrapper;
