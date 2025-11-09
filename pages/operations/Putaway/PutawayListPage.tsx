import React, { useEffect, useState, useMemo } from 'react';
import { App, Button, Card, Input, Space, Spin, Table, Tag, Tooltip, Row, Col, Select, Dropdown, Menu, Checkbox } from 'antd';
import { EyeOutlined, PlusOutlined, FileExcelOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../../hooks/useDebounce';
import { putawayAPI } from '../../../utils/apiClient';

interface Putaway {
  id: string;
  documentNo: string;
  goodsCode: string;
  goodsName: string;
  quantity: number;
  fromLocation: string;
  toLocation: string;
  status: 'DRAFT' | 'MOVING' | 'COMPLETED' | 'CANCELLED';
}

const PUTAWAY_STATUSES: Putaway['status'][] = ['DRAFT', 'MOVING', 'COMPLETED', 'CANCELLED'];

const getStatusColor = (status: Putaway['status']) => {
  switch (status) {
    case 'DRAFT': return 'default';
    case 'MOVING': return 'processing';
    case 'COMPLETED': return 'success';
    case 'CANCELLED': return 'error';
    default: return 'default';
  }
};

const PutawayListPage: React.FC = () => {
  const [allPutaways, setAllPutaways] = useState<Putaway[]>([]);
  const [filteredPutaways, setFilteredPutaways] = useState<Putaway[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const navigate = useNavigate();
  const { notification } = App.useApp();

  const columns = useMemo(() => [
    { title: 'Document No', dataIndex: 'documentNo', key: 'documentNo' },
    { title: 'Goods Code', dataIndex: 'goodsCode', key: 'goodsCode' },
    { title: 'Goods Name', dataIndex: 'goodsName', key: 'goodsName' },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
    { title: 'From Location', dataIndex: 'fromLocation', key: 'fromLocation' },
    { title: 'To Location', dataIndex: 'toLocation', key: 'toLocation' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: Putaway['status']) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Putaway) => (
        <Space size="middle">
          <Tooltip title="View Details">
            <Button icon={<EyeOutlined />} onClick={() => navigate(`/operations/pa/${record.id}`)} />
          </Tooltip>
        </Space>
      ),
    },
  ], [navigate]);

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => columns.map(c => c.key as string));

  useEffect(() => {
    const fetchPutaways = async () => {
      setLoading(true);
      try {
        const data = await putawayAPI.list();
        setAllPutaways(data);
      } catch (error: any) {
        notification.error({ message: 'Error fetching putaway tasks', description: error.message });
      } finally {
        setLoading(false);
      }
    };
    fetchPutaways();
  }, [notification]);

  useEffect(() => {
    let filtered = [...allPutaways];
    if (debouncedSearchTerm) {
      filtered = filtered.filter(item =>
        item.documentNo.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }
    if (statusFilter.length > 0) {
        filtered = filtered.filter(item => statusFilter.includes(item.status));
    }
    setFilteredPutaways(filtered);
  }, [debouncedSearchTerm, statusFilter, allPutaways]);

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
      title="Putaway"
      extra={
        <Space>
          {columnSelector}
          <Button icon={<FileExcelOutlined />}>Export</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/operations/pa/create')}>
            Create
          </Button>
        </Space>
      }
    >
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} md={8}>
          <Input.Search 
            placeholder="Search by document no..." 
            onSearch={setSearchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
            <Select
                mode="multiple"
                allowClear
                style={{ width: '100%' }}
                placeholder="Filter by status..."
                onChange={setStatusFilter}
                options={PUTAWAY_STATUSES.map(status => ({ label: status, value: status }))}
            />
        </Col>
      </Row>
      <Spin spinning={loading}>
        <Table 
            dataSource={filteredPutaways} 
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

const PutawayListPageWrapper: React.FC = () => (
    <App><PutawayListPage /></App>
);

export default PutawayListPageWrapper;
