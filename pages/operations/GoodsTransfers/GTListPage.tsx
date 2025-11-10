import React, { useEffect, useState, useMemo } from 'react';
import { App, Button, Card, Input, Space, Spin, Table, Tag, Tooltip, Row, Col, Select, DatePicker } from 'antd';
import { EyeOutlined, PlusOutlined, FileExcelOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../../hooks/useDebounce';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { goodsTransferAPI, warehouseAPI } from '../../../utils/apiClient';
import { Database } from '../../../types/supabase';

dayjs.extend(isBetween);
const { RangePicker } = DatePicker;

type GoodsTransfer = Database['transactions']['Tables']['gt_header']['Row'];
type Warehouse = Database['master']['Tables']['warehouses']['Row'];

const GT_STATUSES: GoodsTransfer['status'][] = ['DRAFT', 'CREATED', 'IN_PROGRESS', 'IN_TRANSIT', 'RECEIVING', 'COMPLETED', 'CANCELLED'];

const getStatusColor = (status: GoodsTransfer['status']) => {
  switch (status) {
    case 'DRAFT': return 'default';
    case 'CREATED': return 'processing';
    case 'IN_PROGRESS': return 'blue';
    case 'IN_TRANSIT': return 'purple';
    case 'RECEIVING': return 'orange';
    case 'COMPLETED': return 'success';
    case 'CANCELLED': return 'error';
    default: return 'default';
  }
};

const GTListPage: React.FC = () => {
  const [allGtList, setAllGtList] = useState<GoodsTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState<Pick<Warehouse, 'id' | 'name'>[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [warehouseFilter, setWarehouseFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const navigate = useNavigate();
  const { notification } = App.useApp();
  
  const warehousesMap = useMemo(() => new Map(warehouses.map(w => [w.id, w.name])), [warehouses]);

  const columns = useMemo(() => [
    { title: 'GT Code', dataIndex: 'code', key: 'code', sorter: (a: GoodsTransfer, b: GoodsTransfer) => a.code.localeCompare(b.code) },
    { 
      title: 'Document Date', 
      dataIndex: 'document_date', 
      key: 'document_date',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : 'N/A',
      sorter: (a: GoodsTransfer, b: GoodsTransfer) => dayjs(a.document_date).unix() - dayjs(b.document_date).unix(),
    },
    { title: 'From Warehouse', dataIndex: 'from_warehouse_id', key: 'from_warehouse_id', render: (id: string) => warehousesMap.get(id) || 'N/A' },
    { title: 'To Warehouse', dataIndex: 'to_warehouse_id', key: 'to_warehouse_id', render: (id: string) => warehousesMap.get(id) || 'N/A' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: GoodsTransfer['status']) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: GoodsTransfer) => (
        <Space size="middle">
          <Tooltip title="View Details">
            <Button icon={<EyeOutlined />} onClick={() => navigate(`/operations/gt/${record.id}`)} />
          </Tooltip>
        </Space>
      ),
    },
  ], [navigate, warehousesMap]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [gtData, whData] = await Promise.all([
          goodsTransferAPI.list(),
          warehouseAPI.list(),
        ]);

        setAllGtList(gtData || []);
        setWarehouses(whData || []);
      } catch (error: any) {
        notification.error({ message: 'Error fetching data', description: error.message });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [notification]);

  const filteredGtList = useMemo(() => {
    let filtered = [...allGtList];
    if (debouncedSearchTerm) {
      filtered = filtered.filter(item =>
        item.code.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }
    if (statusFilter.length > 0) {
        filtered = filtered.filter(item => statusFilter.includes(item.status));
    }
    if (warehouseFilter.length > 0) {
        filtered = filtered.filter(item => warehouseFilter.includes(item.from_warehouse_id) || warehouseFilter.includes(item.to_warehouse_id));
    }
    if (dateFilter && dateFilter[0] && dateFilter[1]) {
        const [start, end] = dateFilter;
        filtered = filtered.filter(item => dayjs(item.document_date).isBetween(start, end, 'day', '[]'));
    }
    return filtered;
  }, [debouncedSearchTerm, statusFilter, warehouseFilter, dateFilter, allGtList]);
  
  return (
    <Card
      title="Goods Transfers"
      extra={
        <Space>
          <Button icon={<FileExcelOutlined />}>Export</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/operations/gt/create')}>
            Create
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Input.Search 
              placeholder="Search by GT code..." 
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
                  options={GT_STATUSES.map(status => ({ label: status, value: status }))}
              />
          </Col>
           <Col xs={24} sm={12} md={8}>
            <RangePicker style={{ width: '100%' }} onChange={(dates) => setDateFilter(dates as any)} />
          </Col>
           <Col xs={24} sm={12} md={8}>
              <Select
                  mode="multiple"
                  allowClear
                  style={{ width: '100%' }}
                  placeholder="Filter by warehouse..."
                  onChange={setWarehouseFilter}
                  options={warehouses.map(w => ({ label: w.name, value: w.id }))}
              />
          </Col>
        </Row>
        <Spin spinning={loading}>
          <Table 
              dataSource={filteredGtList} 
              columns={columns} 
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

const GTListPageWrapper: React.FC = () => (
    <App><GTListPage /></App>
);

export default GTListPageWrapper;
