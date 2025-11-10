import React, { useEffect, useState, useMemo } from 'react';
import { App, Button, Card, Input, Space, Spin, Table, Tag, Tooltip, Row, Col, Select, DatePicker, Dropdown, Menu, Checkbox } from 'antd';
import { EyeOutlined, PlusOutlined, EditOutlined, FileExcelOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../../hooks/useDebounce';
import { locationAPI, warehouseAPI } from '../../../utils/apiClient';
import { Database } from '../../../types/supabase';
import Can from '../../../components/auth/Can';

const { RangePicker } = DatePicker;

type Warehouse = Database['master']['Tables']['warehouses']['Row'];
type Location = Database['master']['Tables']['locations']['Row'];

const LocationsListPage: React.FC = () => {
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState<Pick<Warehouse, 'id' | 'name'>[]>([]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  const [warehouseFilter, setWarehouseFilter] = useState<string[]>([]);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const navigate = useNavigate();
  const { notification } = App.useApp();
  
  const warehousesMap = useMemo(() => new Map(warehouses.map(w => [w.id, w.name])), [warehouses]);

  const columns = useMemo(() => [
    { title: 'Location Code', dataIndex: 'code', key: 'code', sorter: (a: Location, b: Location) => a.code.localeCompare(b.code) },
    { title: 'Location Name', dataIndex: 'name', key: 'name', sorter: (a: Location, b: Location) => a.name.localeCompare(b.name) },
    { title: 'Warehouse', dataIndex: 'warehouse_id', key: 'warehouse_id', render: (id: string) => warehousesMap.get(id) || id },
    { title: 'Type', dataIndex: 'location_type', key: 'location_type' },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'ACTIVE' : 'INACTIVE'}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Location) => (
        <Space size="middle">
          <Tooltip title="View Details"><Button icon={<EyeOutlined />} onClick={() => navigate(`/master-data/locations/${record.id}`)} /></Tooltip>
          <Can module="masterData" action="edit">
            <Tooltip title="Edit"><Button icon={<EditOutlined />} onClick={() => navigate(`/master-data/locations/${record.id}/edit`)} /></Tooltip>
          </Can>
        </Space>
      ),
    },
  ], [navigate, warehousesMap]);
  
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => columns.map(c => c.key as string));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [locData, whData] = await Promise.all([
          locationAPI.list(),
          warehouseAPI.list()
        ]);
        
        setAllLocations(locData || []);
        setWarehouses(whData || []);
      } catch (error: any) {
        notification.error({ message: 'Error fetching locations', description: error.message });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [notification]);

  useEffect(() => {
    let filtered = [...allLocations];
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
    if (warehouseFilter.length > 0) {
        filtered = filtered.filter(item => warehouseFilter.includes(item.warehouse_id));
    }
    setFilteredLocations(filtered);
  }, [debouncedSearchTerm, statusFilter, warehouseFilter, allLocations]);

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
        title="Locations"
        extra={
            <Space>
                {columnSelector}
                <Button icon={<FileExcelOutlined />}>Export</Button>
                <Can module="masterData" action="create">
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/master-data/locations/create')}>
                      Create
                  </Button>
                </Can>
            </Space>
        }
    >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
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
                <Col xs={24} sm={12} md={8}>
                    <Select
                        mode="multiple"
                        allowClear
                        style={{ width: '100%' }}
                        placeholder="Filter by Warehouse..."
                        onChange={setWarehouseFilter}
                        options={warehouses.map(w => ({ label: w.name, value: w.id }))}
                    />
                </Col>
                 <Col xs={24} sm={12} md={8}>
                    <RangePicker style={{ width: '100%' }} disabled />
                </Col>
            </Row>
            <Spin spinning={loading}>
            <Table
                dataSource={filteredLocations}
                columns={columns.filter(c => visibleColumns.includes(c.key as string))}
                rowKey="id"
                size="small"
                bordered
                pagination={{ defaultPageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
            />
            </Spin>
        </Space>
      </Card>
  );
};

const LocationsListPageWrapper: React.FC = () => (
    <App><LocationsListPage /></App>
);

export default LocationsListPageWrapper;