import React, { useEffect, useState, useMemo } from 'react';
import { App, Button, Card, Input, Space, Spin, Table, Tag, Tooltip, Row, Col, Select, DatePicker, Dropdown, Menu, Checkbox } from 'antd';
import { EyeOutlined, PlusOutlined, EditOutlined, FileExcelOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../../hooks/useDebounce';
import { uomAPI, uomCategoryAPI } from '../../../utils/apiClient';
import { Database } from '../../../types/supabase';
import Can from '../../../components/auth/Can';

const { RangePicker } = DatePicker;

type UomCategory = Database['master']['Tables']['uom_categories']['Row'];
type Uom = Database['master']['Tables']['uoms']['Row'];

const UomsListPage: React.FC = () => {
  const [allUoms, setAllUoms] = useState<Uom[]>([]);
  const [filteredUoms, setFilteredUoms] = useState<Uom[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Pick<UomCategory, 'id' | 'name'>[]>([]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [isBaseFilter, setIsBaseFilter] = useState<boolean | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const navigate = useNavigate();
  const { notification } = App.useApp();
  
  const categoriesMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);

  const columns = useMemo(() => [
    { title: 'Code', dataIndex: 'code', key: 'code', sorter: (a: Uom, b: Uom) => a.code.localeCompare(b.code) },
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a: Uom, b: Uom) => a.name.localeCompare(b.name) },
    { title: 'Symbol', dataIndex: 'symbol', key: 'symbol' },
    { title: 'Category', dataIndex: 'uom_category_id', key: 'category', render: (id: string) => categoriesMap.get(id) || id },
    { title: 'Base Unit?', dataIndex: 'is_base_unit', key: 'is_base_unit', render: (isBase: boolean) => (isBase ? <Tag color="cyan">Yes</Tag> : 'No') },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'ACTIVE' : 'INACTIVE'}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Uom) => (
        <Space size="middle">
          <Tooltip title="View Details"><Button icon={<EyeOutlined />} onClick={() => navigate(`/master-data/uoms/${record.id}`)} /></Tooltip>
          <Can module="masterData" action="edit">
            <Tooltip title="Edit"><Button icon={<EditOutlined />} onClick={() => navigate(`/master-data/uoms/${record.id}/edit`)} /></Tooltip>
          </Can>
        </Space>
      ),
    },
  ], [navigate, categoriesMap]);
  
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => columns.map(c => c.key as string));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [uomData, catData] = await Promise.all([
          uomAPI.list(),
          uomCategoryAPI.list()
        ]);
        setAllUoms(uomData || []);
        setCategories(catData || []);
      } catch (error: any) {
        notification.error({ message: 'Error fetching UoMs', description: error.message });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [notification]);

  useEffect(() => {
    let filtered = [...allUoms];
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
    if (categoryFilter.length > 0) {
        filtered = filtered.filter(item => categoryFilter.includes(item.uom_category_id));
    }
    if (isBaseFilter !== null) {
        filtered = filtered.filter(item => item.is_base_unit === isBaseFilter);
    }
    setFilteredUoms(filtered);
  }, [debouncedSearchTerm, statusFilter, categoryFilter, isBaseFilter, allUoms]);

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
        title="Units of Measure"
        extra={
            <Space>
                {columnSelector}
                <Button icon={<FileExcelOutlined />}>Export</Button>
                <Can module="masterData" action="create">
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/master-data/uoms/create')}>Create</Button>
                </Can>
            </Space>
        }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Row gutter={[16, 16]}>
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
                    placeholder="Filter by Category..."
                    onChange={setCategoryFilter}
                    options={categories.map(c => ({ label: c.name, value: c.id }))}
                />
            </Col>
             <Col xs={24} sm={12} md={8}>
                <Select
                    allowClear
                    style={{ width: '100%' }}
                    placeholder="Filter by Base Unit..."
                    onChange={(value) => setIsBaseFilter(value === undefined ? null : value)}
                    options={[
                        { label: 'Is Base Unit', value: true },
                        { label: 'Not Base Unit', value: false },
                    ]}
                />
            </Col>
             <Col xs={24} sm={12} md={8}>
                <RangePicker style={{ width: '100%' }} disabled />
            </Col>
        </Row>
        <Spin spinning={loading}>
          <Table 
            dataSource={filteredUoms} 
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

const UomsListPageWrapper: React.FC = () => (
    <App><UomsListPage /></App>
);

export default UomsListPageWrapper;