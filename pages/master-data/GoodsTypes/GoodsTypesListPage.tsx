import React, { useEffect, useState, useMemo } from 'react';
import { App, Button, Card, Input, Space, Spin, Table, Tag, Tooltip, Row, Col, Select, Dropdown, Menu, Checkbox } from 'antd';
import { EyeOutlined, PlusOutlined, EditOutlined, FileExcelOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../../hooks/useDebounce';
import { goodsTypeAPI } from '../../../utils/apiClient';
import { Database } from '../../../types/supabase';

type GoodsType = Database['master']['Tables']['goods_types']['Row'];

// Type for the Ant Design Tree Table node, which includes tree-specific props.
type GoodsTypeTreeNode = GoodsType & {
  children?: GoodsTypeTreeNode[];
  key: string;
};

const buildTreeData = (items: GoodsType[], parentId: string | null = null): GoodsTypeTreeNode[] => {
    return items
        .filter(item => item.parent_id === parentId)
        .map(item => {
            const children = buildTreeData(items, item.id);
            return {
                ...item,
                key: item.id,
                ...(children.length > 0 && { children }),
            };
        });
};

const GoodsTypesListPage: React.FC = () => {
  const [allGoodsTypes, setAllGoodsTypes] = useState<GoodsType[]>([]);
  const [treeData, setTreeData] = useState<GoodsTypeTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const navigate = useNavigate();
  const { notification } = App.useApp();

  const goodsTypesMap = useMemo(() => new Map(allGoodsTypes.map(item => [item.id, item.name])), [allGoodsTypes]);

  const columns = useMemo(() => [
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a: GoodsType, b: GoodsType) => a.name.localeCompare(b.name) },
    { title: 'Code', dataIndex: 'code', key: 'code', sorter: (a: GoodsType, b: GoodsType) => a.code.localeCompare(b.code) },
    { 
      title: 'Parent', 
      dataIndex: 'parent_id', 
      key: 'parent', 
      render: (parentId: string | null) => parentId ? goodsTypesMap.get(parentId) || '-' : '-'
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
      render: (_: any, record: GoodsType) => (
        <Space size="middle">
          <Tooltip title="View Details"><Button icon={<EyeOutlined />} onClick={() => navigate(`/master-data/goods-types/${record.id}`)} /></Tooltip>
          <Tooltip title="Edit"><Button icon={<EditOutlined />} onClick={() => navigate(`/master-data/goods-types/${record.id}/edit`)} /></Tooltip>
        </Space>
      ),
    },
  ], [navigate, goodsTypesMap]);
  
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => columns.map(c => c.key as string));

  useEffect(() => {
    const fetchGoodsTypes = async () => {
      setLoading(true);
      try {
        const data = await goodsTypeAPI.list();
        setAllGoodsTypes(data as GoodsType[]);
      } catch (error: any) {
        notification.error({ message: 'Error fetching Goods Types', description: error.message });
      } finally {
        setLoading(false);
      }
    };
    fetchGoodsTypes();
  }, [notification]);

  useEffect(() => {
    if (!debouncedSearchTerm && statusFilter === null) {
      setTreeData(buildTreeData(allGoodsTypes));
      return;
    }

    const goodsTypesIdMap = new Map(allGoodsTypes.map(item => [item.id, item]));
    
    let matchedNodes = [...allGoodsTypes];

    if (debouncedSearchTerm) {
        const lowercasedFilter = debouncedSearchTerm.toLowerCase();
        matchedNodes = matchedNodes.filter(item =>
            item.code.toLowerCase().includes(lowercasedFilter) ||
            item.name.toLowerCase().includes(lowercasedFilter)
        );
    }
    
    if (statusFilter !== null) {
        matchedNodes = matchedNodes.filter(item => item.is_active === statusFilter);
    }
    
    const finalNodes = new Map<string, GoodsType>();

    const addWithAncestors = (node: GoodsType) => {
        if (!node || finalNodes.has(node.id)) return;
        
        finalNodes.set(node.id, node);
        
        if (node.parent_id) {
            const parent = goodsTypesIdMap.get(node.parent_id);
            if (parent) {
                // FIX: TypeScript's inference for recursive functions within closures can be unreliable.
                // Explicitly casting `parent` ensures its type is correctly recognized as `GoodsType`,
                // resolving the "Argument of type 'unknown' is not assignable" error.
                addWithAncestors(parent as GoodsType);
            }
        }
    };

    matchedNodes.forEach(node => addWithAncestors(node));
    
    const tree = buildTreeData(Array.from(finalNodes.values()));
    setTreeData(tree);
  }, [debouncedSearchTerm, statusFilter, allGoodsTypes]);

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
        title="Goods Types"
        extra={
            <Space>
                {columnSelector}
                <Button icon={<FileExcelOutlined />}>Export</Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/master-data/goods-types/create')}>Create</Button>
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
        </Row>
        <Spin spinning={loading}>
          <Table 
            dataSource={treeData} 
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

const GoodsTypesListPageWrapper: React.FC = () => (
    <App><GoodsTypesListPage /></App>
);

export default GoodsTypesListPageWrapper;