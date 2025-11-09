import React, { useEffect, useState, useMemo } from 'react';
import { App, Button, Card, Input, Space, Spin, Table, Tag, Tooltip, Row, Col, Select, DatePicker, Dropdown, Menu, Checkbox } from 'antd';
import { EyeOutlined, PlusOutlined, EditOutlined, FileExcelOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../../hooks/useDebounce';
import { partnerAPI } from '../../../utils/apiClient';
import { Database } from '../../../types/supabase';

const { RangePicker } = DatePicker;

type Partner = Database['master']['Tables']['partners']['Row'];

const PARTNER_TYPES = [
    { label: 'Supplier', value: 'supplier' },
    { label: 'Customer', value: 'customer' },
    { label: 'Carrier', value: 'carrier' },
];

const PartnersListPage: React.FC = () => {
  const [allPartners, setAllPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const navigate = useNavigate();
  const { notification } = App.useApp();

  const columns = useMemo(() => [
    { title: 'Code', dataIndex: 'code', key: 'code', sorter: (a: Partner, b: Partner) => a.code.localeCompare(b.code) },
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a: Partner, b: Partner) => a.name.localeCompare(b.name) },
    {
      title: 'Type',
      key: 'type',
      render: (_: any, record: Partner) => (
        <Space>
          {record.is_supplier && <Tag color="blue">SUPPLIER</Tag>}
          {record.is_customer && <Tag color="purple">CUSTOMER</Tag>}
          {record.is_carrier && <Tag color="orange">CARRIER</Tag>}
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'ACTIVE' : 'INACTIVE'}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Partner) => (
        <Space size="middle">
          <Tooltip title="View Details"><Button icon={<EyeOutlined />} onClick={() => navigate(`/master-data/partners/${record.id}`)} /></Tooltip>
          <Tooltip title="Edit"><Button icon={<EditOutlined />} onClick={() => navigate(`/master-data/partners/${record.id}/edit`)} /></Tooltip>
        </Space>
      ),
    },
  ], [navigate]);
  
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => columns.map(c => c.key as string));

  useEffect(() => {
    const fetchPartners = async () => {
      setLoading(true);
      try {
        const data = await partnerAPI.list();
        setAllPartners(data || []);
      } catch (error: any) {
        notification.error({ message: 'Error fetching partners', description: error.message });
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, [notification]);

  useEffect(() => {
    let filtered = [...allPartners];
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
    if (typeFilter.length > 0) {
        filtered = filtered.filter(item => {
            return typeFilter.some(type => {
                if (type === 'supplier') return item.is_supplier;
                if (type === 'customer') return item.is_customer;
                if (type === 'carrier') return item.is_carrier;
                return false;
            });
        });
    }
    setFilteredPartners(filtered);
  }, [debouncedSearchTerm, statusFilter, typeFilter, allPartners]);

  const columnSelector = (
    <Dropdown
      overlay={
        <Menu>
          <Checkbox.Group
            className="flex flex-col p-2"
            options={columns.map(({ key, title }) => ({ label: title as string, value: key as string }))}
            value={visibleColumns}
            onChange={(values) => setVisibleColumns(values as string[])}
          />
        </Menu>
      }
      trigger={['click']}
    >
      <Button icon={<EyeOutlined />}>Columns</Button>
    </Dropdown>
  );

  return (
    <Card
        title="Partners"
        extra={
            <Space>
                {columnSelector}
                <Button icon={<FileExcelOutlined />}>Export</Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/master-data/partners/create')}>Create</Button>
            </Space>
        }
    >
        <Row gutter={[16, 16]} className="mb-4">
            <Col xs={24} sm={12} md={8}>
                <Input.Search 
                    placeholder="Search by code or name..." 
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
                    placeholder="Filter by Partner Type..."
                    onChange={setTypeFilter}
                    options={PARTNER_TYPES}
                />
            </Col>
             <Col xs={24} sm={12} md={8}>
                <RangePicker style={{ width: '100%' }} disabled />
            </Col>
        </Row>
        <Spin spinning={loading}>
          <Table 
            dataSource={filteredPartners} 
            columns={columns.filter(c => visibleColumns.includes(c.key as string))} 
            rowKey="id" 
            size="small" 
            bordered 
            pagination={{ defaultPageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
          />
        </Spin>
    </Card>
  );
};

const PartnersListPageWrapper: React.FC = () => (
    <App><PartnersListPage /></App>
);

export default PartnersListPageWrapper;
