import React, { useEffect, useState, useMemo } from 'react';
import { App, Button, Card, Input, Space, Spin, Table, Tag, Tooltip, Row, Col, Select, DatePicker, Dropdown, Menu, Checkbox } from 'antd';
import { EyeOutlined, PlusOutlined, EditOutlined, FileExcelOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../../hooks/useDebounce';
import { uomCategoryAPI } from '../../../utils/apiClient';
import { Database } from '../../../types/supabase';
import Can from '../../../components/auth/Can';

const { RangePicker } = DatePicker;

type UomCategory = Database['master']['Tables']['uom_categories']['Row'];

const UomCategoriesListPage: React.FC = () => {
  const [allCategories, setAllCategories] = useState<UomCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<UomCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const navigate = useNavigate();
  const { notification } = App.useApp();

  const columns = useMemo(() => [
    { title: 'Code', dataIndex: 'code', key: 'code', sorter: (a: UomCategory, b: UomCategory) => a.code.localeCompare(b.code) },
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a: UomCategory, b: UomCategory) => a.name.localeCompare(b.name) },
    { title: 'Name (English)', dataIndex: 'name_en', key: 'name_en' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean | null) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'ACTIVE' : 'INACTIVE'}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: UomCategory) => (
        <Space size="middle">
          <Tooltip title="View Details"><Button icon={<EyeOutlined />} onClick={() => navigate(`/master-data/uom-categories/${record.id}`)} /></Tooltip>
          <Can module="masterData" action="edit">
            <Tooltip title="Edit"><Button icon={<EditOutlined />} onClick={() => navigate(`/master-data/uom-categories/${record.id}/edit`)} /></Tooltip>
          </Can>
        </Space>
      ),
    },
  ], [navigate]);
  
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => columns.map(c => c.key as string));

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const data = await uomCategoryAPI.list();
        setAllCategories(data || []);
      } catch (error: any) {
        notification.error({ message: 'Error fetching UoM categories', description: error.message });
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [notification]);

  useEffect(() => {
    let filtered = [...allCategories];
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
    setFilteredCategories(filtered);
  }, [debouncedSearchTerm, statusFilter, allCategories]);

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
        title="UoM Categories"
        extra={
            <Space>
                {columnSelector}
                <Button icon={<FileExcelOutlined />}>Export</Button>
                <Can module="masterData" action="create">
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/master-data/uom-categories/create')}>Create</Button>
                </Can>
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
                <RangePicker style={{ width: '100%' }} disabled />
            </Col>
        </Row>
        <Spin spinning={loading}>
          <Table 
            dataSource={filteredCategories} 
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

const UomCategoriesListPageWrapper: React.FC = () => (
    <App><UomCategoriesListPage /></App>
);

export default UomCategoriesListPageWrapper;