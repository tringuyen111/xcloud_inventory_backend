import React, { useEffect, useState, useMemo } from 'react';
import { App, Button, Card, Input, Space, Spin, Table, Tag, Tooltip, Row, Col, Select, Dropdown, Menu, Checkbox } from 'antd';
import { EyeOutlined, PlusOutlined, FileExcelOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../../hooks/useDebounce';
import { putawayAPI, warehouseAPI, goodsReceiptAPI } from '../../../utils/apiClient';
import { Database } from '../../../types/supabase';

type PutawayHeader = Database['transactions']['Tables']['putaway_header']['Row'];
type Warehouse = Database['master']['Tables']['warehouses']['Row'];
type GoodsReceipt = Database['transactions']['Tables']['gr_header']['Row'];

type PutawayWithData = PutawayHeader & {
  warehouseName?: string;
  grCode?: string;
};

// FIX: Replaced 'IN_PROGRESS' with 'MOVING' to match the valid enum values from the Supabase schema.
const PUTAWAY_STATUSES: PutawayHeader['status'][] = ['DRAFT', 'MOVING', 'COMPLETED', 'CANCELLED'];

const getStatusColor = (status: PutawayHeader['status']) => {
  switch (status) {
    case 'DRAFT': return 'default';
    // FIX: Replaced 'IN_PROGRESS' with 'MOVING' to match the valid enum values from the Supabase schema.
    case 'MOVING': return 'processing';
    case 'COMPLETED': return 'success';
    case 'CANCELLED': return 'error';
    default: return 'default';
  }
};

const PutawayListPage: React.FC = () => {
  const [putaways, setPutaways] = useState<PutawayWithData[]>([]);
  const [filteredPutaways, setFilteredPutaways] = useState<PutawayWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const navigate = useNavigate();
  const { notification } = App.useApp();

  const columns = useMemo(() => [
    { title: 'Document No', dataIndex: 'code', key: 'code' },
    { title: 'GR No', dataIndex: 'grCode', key: 'grCode', render: (code?: string) => code || 'N/A' },
    { title: 'Warehouse', dataIndex: 'warehouseName', key: 'warehouseName', render: (name?: string) => name || 'N/A' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: PutawayHeader['status']) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: PutawayHeader) => (
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
        const [putawayData, warehouseData, grData] = await Promise.all([
          putawayAPI.list(),
          warehouseAPI.list(),
          goodsReceiptAPI.list()
        ]);

        const warehouseMap = new Map(warehouseData.map(w => [w.id, w.name]));
        const grMap = new Map(grData.map(gr => [gr.id, gr.code]));

        const enrichedData = putawayData.map(p => ({
          ...p,
          warehouseName: warehouseMap.get(p.warehouse_id),
          grCode: p.gr_header_id ? grMap.get(p.gr_header_id) : undefined,
        }));
        
        setPutaways(enrichedData);
      } catch (error: any) {
        notification.error({ message: 'Error fetching putaway tasks', description: error.message });
      } finally {
        setLoading(false);
      }
    };
    fetchPutaways();
  }, [notification]);

  useEffect(() => {
    let filtered = [...putaways];
    if (debouncedSearchTerm) {
      filtered = filtered.filter(item =>
        item.code.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        item.grCode?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }
    if (statusFilter.length > 0) {
        filtered = filtered.filter(item => statusFilter.includes(item.status));
    }
    setFilteredPutaways(filtered);
  }, [debouncedSearchTerm, statusFilter, putaways]);

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
            placeholder="Search by document or GR no..." 
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