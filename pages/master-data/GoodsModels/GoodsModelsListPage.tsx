import React, { useEffect, useState, useMemo } from 'react';
import { App, Button, Card, Input, Space, Spin, Table, Tag, Tooltip, Row, Col, Select, Dropdown, Menu, Checkbox } from 'antd';
import { EyeOutlined, PlusOutlined, EditOutlined, FileExcelOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../../hooks/useDebounce';
import { goodsModelAPI, goodsTypeAPI, uomAPI } from '../../../utils/apiClient';
// FIX: Import Supabase Database types to correctly type API responses.
import { Database } from '../../../types/supabase';

// FIX: Define types for related data to ensure type safety.
type GoodsType = Database['master']['Tables']['goods_types']['Row'];
type Uom = Database['master']['Tables']['uoms']['Row'];

interface GoodsModel {
  id: string;
  code: string;
  name: string;
  sku: string;
  goods_type_id: string;
  base_uom_id: string;
  tracking_type: string;
  is_active: boolean;
}

const TRACKING_TYPES = ['NONE', 'LOT', 'SERIAL'];

const GoodsModelsListPage: React.FC = () => {
  const [allModels, setAllModels] = useState<GoodsModel[]>([]);
  const [filteredModels, setFilteredModels] = useState<GoodsModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [goodsTypes, setGoodsTypes] = useState<{ id: string, name: string }[]>([]);
  const [uoms, setUoms] = useState<{ id: string, name: string }[]>([]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  const [goodsTypeFilter, setGoodsTypeFilter] = useState<string[]>([]);
  const [trackingTypeFilter, setTrackingTypeFilter] = useState<string[]>([]);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const navigate = useNavigate();
  const { notification } = App.useApp();

  const goodsTypesMap = useMemo(() => new Map(goodsTypes.map(gt => [gt.id, gt.name])), [goodsTypes]);
  const uomsMap = useMemo(() => new Map(uoms.map(u => [u.id, u.name])), [uoms]);

  const columns = useMemo(() => [
    { title: 'Code', dataIndex: 'code', key: 'code', sorter: (a: GoodsModel, b: GoodsModel) => a.code.localeCompare(b.code) },
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a: GoodsModel, b: GoodsModel) => a.name.localeCompare(b.name) },
    { title: 'SKU', dataIndex: 'sku', key: 'sku' },
    { title: 'Goods Type', dataIndex: 'goods_type_id', key: 'goods_type_id', render: (id: string) => goodsTypesMap.get(id) || id },
    { title: 'Base UoM', dataIndex: 'base_uom_id', key: 'base_uom_id', render: (id: string) => uomsMap.get(id) || id },
    { title: 'Tracking', dataIndex: 'tracking_type', key: 'tracking_type', render: (type: string) => <Tag>{type}</Tag> },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'ACTIVE' : 'INACTIVE'}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: GoodsModel) => (
        <Space size="middle">
          <Tooltip title="View Details"><Button icon={<EyeOutlined />} onClick={() => navigate(`/master-data/goods-models/${record.id}`)} /></Tooltip>
          <Tooltip title="Edit"><Button icon={<EditOutlined />} onClick={() => navigate(`/master-data/goods-models/${record.id}/edit`)} /></Tooltip>
        </Space>
      ),
    },
  ], [navigate, goodsTypesMap, uomsMap]);
  
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => columns.map(c => c.key as string));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [modelData, goodsTypeData, uomData] = await Promise.all([
            goodsModelAPI.list(),
            goodsTypeAPI.list(),
            uomAPI.list()
        ]);
        setAllModels(modelData as GoodsModel[]);
        // FIX: Cast API responses to the correct types before mapping to avoid errors.
        setGoodsTypes((goodsTypeData as GoodsType[]).map(g => ({ id: g.id, name: g.name })));
        setUoms((uomData as Uom[]).map(u => ({ id: u.id, name: u.name })));
      } catch (error: any) {
        notification.error({ message: 'Error fetching goods models', description: error.message });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [notification]);

  useEffect(() => {
    let filtered = [...allModels];
    if (debouncedSearchTerm) {
      const lowercasedFilter = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.code.toLowerCase().includes(lowercasedFilter) ||
        item.name.toLowerCase().includes(lowercasedFilter) ||
        (item.sku && item.sku.toLowerCase().includes(lowercasedFilter))
      );
    }
    if (statusFilter !== null) {
        filtered = filtered.filter(item => item.is_active === statusFilter);
    }
    if (goodsTypeFilter.length > 0) {
        filtered = filtered.filter(item => goodsTypeFilter.includes(item.goods_type_id));
    }
    if (trackingTypeFilter.length > 0) {
        filtered = filtered.filter(item => trackingTypeFilter.includes(item.tracking_type));
    }
    setFilteredModels(filtered);
  }, [debouncedSearchTerm, statusFilter, goodsTypeFilter, trackingTypeFilter, allModels]);

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
        title="Goods Models"
        extra={
          <Space>
            {columnSelector}
            <Button icon={<FileExcelOutlined />}>Export</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/master-data/goods-models/create')}>
                Create
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>
                    <Input.Search 
                        placeholder="Search by code, name, or SKU..." 
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
                        placeholder="Filter by Goods Type..."
                        onChange={setGoodsTypeFilter}
                        options={goodsTypes.map(gt => ({ label: gt.name, value: gt.id }))}
                    />
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Select
                        mode="multiple"
                        allowClear
                        style={{ width: '100%' }}
                        placeholder="Filter by Tracking Type..."
                        onChange={setTrackingTypeFilter}
                        options={TRACKING_TYPES.map(t => ({ label: t, value: t }))}
                    />
                </Col>
            </Row>
            <Spin spinning={loading}>
            <Table 
                dataSource={filteredModels} 
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

const GoodsModelsListPageWrapper: React.FC = () => (
    <App><GoodsModelsListPage /></App>
);

export default GoodsModelsListPageWrapper;