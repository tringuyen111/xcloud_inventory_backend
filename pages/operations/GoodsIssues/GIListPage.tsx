

import React, { useEffect, useState, useMemo } from 'react';
import { App, Button, Card, Input, Space, Spin, Table, Tag, Tooltip, Row, Col, Select, DatePicker, Dropdown, Menu, Checkbox } from 'antd';
import { EyeOutlined, PlusOutlined, FileExcelOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../../hooks/useDebounce';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { goodsIssueAPI, warehouseAPI, partnerAPI } from '../../../utils/apiClient';
import { Database } from '../../../types/supabase';

dayjs.extend(isBetween);
const { RangePicker } = DatePicker;

type GoodsIssue = Database['transactions']['Tables']['gi_header']['Row'];
type Warehouse = Database['master']['Tables']['warehouses']['Row'];
type Partner = Database['master']['Tables']['partners']['Row'];

const GI_STATUSES: GoodsIssue['status'][] = ['DRAFT', 'WAITING_FOR_APPROVAL', 'APPROVED', 'COMPLETED', 'CANCELLED'];

const getStatusColor = (status: GoodsIssue['status']) => {
  switch (status) {
    case 'DRAFT': return 'default';
    case 'WAITING_FOR_APPROVAL': return 'warning';
    case 'APPROVED': return 'processing';
    case 'COMPLETED': return 'success';
    case 'CANCELLED': return 'error';
    default: return 'default';
  }
};

const GIListPage: React.FC = () => {
  const [allGiList, setAllGiList] = useState<GoodsIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState<Pick<Warehouse, 'id' | 'name'>[]>([]);
  const [customers, setCustomers] = useState<Pick<Partner, 'id' | 'name'>[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [warehouseFilter, setWarehouseFilter] = useState<string[]>([]);
  const [customerFilter, setCustomerFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const navigate = useNavigate();
  const { notification } = App.useApp();
  
  const warehousesMap = useMemo(() => new Map(warehouses.map(w => [w.id, w.name])), [warehouses]);
  const customersMap = useMemo(() => new Map(customers.map(c => [c.id, c.name])), [customers]);

  const columns = useMemo(() => [
    { title: 'GI Code', dataIndex: 'code', key: 'code', sorter: (a: GoodsIssue, b: GoodsIssue) => a.code.localeCompare(b.code) },
    { 
      title: 'Document Date', 
      dataIndex: 'document_date', 
      key: 'document_date',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : 'N/A',
      sorter: (a: GoodsIssue, b: GoodsIssue) => dayjs(a.document_date).unix() - dayjs(b.document_date).unix(),
    },
    { title: 'Warehouse', dataIndex: 'warehouse_id', key: 'warehouse_id', render: (id: string) => warehousesMap.get(id) || 'N/A' },
    { title: 'Customer', dataIndex: 'customer_id', key: 'customer_id', render: (id: string | null) => id ? customersMap.get(id) || 'N/A' : 'N/A' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: GoodsIssue['status']) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: GoodsIssue) => (
        <Space size="middle">
          <Tooltip title="View Details">
            <Button icon={<EyeOutlined />} onClick={() => navigate(`/operations/gi/${record.id}`)} />
          </Tooltip>
        </Space>
      ),
    },
  ], [navigate, warehousesMap, customersMap]);

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => columns.map(c => c.key as string));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [giData, whData, partnerData] = await Promise.all([
          goodsIssueAPI.list(),
          warehouseAPI.list(),
          partnerAPI.list()
        ]);

        setAllGiList(giData || []);
        setWarehouses(whData || []);
        setCustomers(partnerData.filter(p => p.is_customer) || []);
      } catch (error: any) {
        notification.error({ message: 'Error fetching data', description: error.message });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [notification]);

  const filteredGiList = useMemo(() => {
    let filtered = [...allGiList];
    if (debouncedSearchTerm) {
      filtered = filtered.filter(item =>
        item.code.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }
    if (statusFilter.length > 0) {
        filtered = filtered.filter(item => statusFilter.includes(item.status));
    }
    if (warehouseFilter.length > 0) {
        filtered = filtered.filter(item => warehouseFilter.includes(item.warehouse_id));
    }
    if (customerFilter.length > 0) {
        filtered = filtered.filter(item => item.customer_id && customerFilter.includes(item.customer_id));
    }
    if (dateFilter && dateFilter[0] && dateFilter[1]) {
        const [start, end] = dateFilter;
        filtered = filtered.filter(item => dayjs(item.document_date).isBetween(start, end, 'day', '[]'));
    }
    return filtered;
  }, [debouncedSearchTerm, statusFilter, warehouseFilter, customerFilter, dateFilter, allGiList]);
  
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
      title="Goods Issues"
      extra={
        <Space>
          {columnSelector}
          <Button icon={<FileExcelOutlined />}>Export</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/operations/gi/create')}>
            Create
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Input.Search 
              placeholder="Search by GI code..." 
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
                  options={GI_STATUSES.map(status => ({ label: status, value: status }))}
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
          <Col xs={24} sm={12} md={8}>
              <Select
                  mode="multiple"
                  allowClear
                  style={{ width: '100%' }}
                  placeholder="Filter by customer..."
                  onChange={setCustomerFilter}
                  options={customers.map(c => ({ label: c.name, value: c.id }))}
              />
          </Col>
        </Row>
        <Spin spinning={loading}>
          <Table 
              dataSource={filteredGiList} 
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

const GIListPageWrapper: React.FC = () => (
    <App><GIListPage /></App>
);

export default GIListPageWrapper;
