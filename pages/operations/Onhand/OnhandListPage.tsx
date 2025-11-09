import React, { useEffect, useState, useMemo } from 'react';
import { App, Card, Input, Space, Spin, Table, Button, Row, Col, Dropdown, Menu, Checkbox, Select } from 'antd';
import { FileExcelOutlined, EyeOutlined } from '@ant-design/icons';
import { useDebounce } from '../../../hooks/useDebounce';
import { inventoryAPI, warehouseAPI, locationAPI, goodsModelAPI } from '../../../utils/apiClient';
// FIX: Import Supabase Database types to correctly type API responses.
import { Database } from '../../../types/supabase';

// FIX: Define types for related data to ensure type safety.
type Warehouse = Database['master']['Tables']['warehouses']['Row'];
type Location = Database['master']['Tables']['locations']['Row'];
type GoodsModel = Database['master']['Tables']['goods_models']['Row'];

interface OnhandItem {
  id: string;
  warehouse_id: string;
  location_id: string;
  goods_model_id: string;
  lot_number?: string;
  serial_number?: string;
  quantity_onhand: number;
  quantity_reserved: number;
  quantity_available: number;
}

const OnhandListPage: React.FC = () => {
  const [allOnhand, setAllOnhand] = useState<OnhandItem[]>([]);
  const [filteredOnhand, setFilteredOnhand] = useState<OnhandItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [warehouses, setWarehouses] = useState<{ id: string, name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: string, code: string }[]>([]);
  const [goodsModels, setGoodsModels] = useState<{ id: string, code: string, name: string }[]>([]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState<string[]>([]);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { notification } = App.useApp();
  
  const warehousesMap = useMemo(() => new Map(warehouses.map(w => [w.id, w.name])), [warehouses]);
  const locationsMap = useMemo(() => new Map(locations.map(l => [l.id, l.code])), [locations]);
  const goodsModelsMap = useMemo(() => new Map(goodsModels.map(g => [g.id, { code: g.code, name: g.name }])), [goodsModels]);

  const columns = useMemo(() => [
    { title: 'Warehouse', dataIndex: 'warehouse_id', key: 'warehouse_id', render: (id: string) => warehousesMap.get(id) || id },
    { title: 'Location', dataIndex: 'location_id', key: 'location_id', render: (id: string) => locationsMap.get(id) || id },
    { title: 'Goods Code', dataIndex: 'goods_model_id', key: 'goodsCode', render: (id: string) => goodsModelsMap.get(id)?.code || id },
    { title: 'Goods Name', dataIndex: 'goods_model_id', key: 'goodsName', render: (id: string) => goodsModelsMap.get(id)?.name || '' },
    { title: 'Lot Number', dataIndex: 'lot_number', key: 'lot_number' },
    { title: 'Serial Number', dataIndex: 'serial_number', key: 'serial_number' },
    { title: 'Onhand', dataIndex: 'quantity_onhand', key: 'quantity_onhand', sorter: (a: OnhandItem, b: OnhandItem) => a.quantity_onhand - b.quantity_onhand, },
    { title: 'Reserved', dataIndex: 'quantity_reserved', key: 'quantity_reserved', sorter: (a: OnhandItem, b: OnhandItem) => a.quantity_reserved - b.quantity_reserved, },
    { title: 'Available', dataIndex: 'quantity_available', key: 'quantity_available', sorter: (a: OnhandItem, b: OnhandItem) => a.quantity_available - b.quantity_available, },
  ], [warehousesMap, locationsMap, goodsModelsMap]);
  
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => columns.map(c => c.key as string));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [onhandData, whData, locData, goodsData] = await Promise.all([
          inventoryAPI.list(),
          warehouseAPI.list(),
          locationAPI.list(),
          goodsModelAPI.list()
        ]);
        setAllOnhand(onhandData as OnhandItem[]);
        // FIX: Cast API responses to the correct types before mapping to avoid errors.
        setWarehouses((whData as Warehouse[]).map(w => ({ id: w.id, name: w.name })));
        setLocations((locData as Location[]).map(l => ({ id: l.id, code: l.code })));
        setGoodsModels((goodsData as GoodsModel[]).map(g => ({ id: g.id, code: g.code, name: g.name })));
      } catch(error: any) {
        notification.error({ message: 'Error fetching onhand stock', description: error.message });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [notification]);

  useEffect(() => {
    let filteredData = allOnhand.filter(item => {
      const goods = goodsModelsMap.get(item.goods_model_id);
      const searchMatch = debouncedSearchTerm
        ? (goods?.code?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
          (goods?.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
          (item.lot_number?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
          (item.serial_number?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
        : true;
      
      const warehouseMatch = warehouseFilter.length > 0 ? warehouseFilter.includes(item.warehouse_id) : true;
      const locationMatch = locationFilter.length > 0 ? locationFilter.includes(item.location_id) : true;
      
      return searchMatch && warehouseMatch && locationMatch;
    });
    setFilteredOnhand(filteredData);
  }, [debouncedSearchTerm, allOnhand, warehouseFilter, locationFilter, goodsModelsMap]);
  
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
      title="Onhand Stock"
      extra={
        <Space>
          {columnSelector}
          <Button icon={<FileExcelOutlined />}>Export</Button>
        </Space>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Input.Search 
              placeholder="Search by goods, lot, or serial..." 
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
                placeholder="Filter by location..."
                onChange={setLocationFilter}
                options={locations.map(l => ({ label: l.code, value: l.id }))}
            />
          </Col>
        </Row>
        <Spin spinning={loading}>
          <Table 
              dataSource={filteredOnhand} 
              columns={columns.filter(c => visibleColumns.includes(c.key as string))} 
              rowKey="id" 
              size="small" 
              bordered 
              scroll={{ x: 1300 }} 
              pagination={{ defaultPageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
          />
        </Spin>
      </Space>
    </Card>
  );
};

const OnhandListPageWrapper: React.FC = () => (
    <App><OnhandListPage /></App>
);

export default OnhandListPageWrapper;