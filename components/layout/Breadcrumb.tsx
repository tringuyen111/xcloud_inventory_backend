
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Breadcrumb as AntBreadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';

const pathNameMapping: { [key: string]: string } = {
  dashboard: 'Dashboard',
  onhand: 'Onhand',
  operations: 'Operations',
  gr: 'Goods Receipt',
  gi: 'Goods Issue',
  ic: 'Inventory Count',
  gt: 'Goods Transfer',
  pa: 'Putaway',
  'master-data': 'Master Data',
  organizations: 'Organizations',
  branches: 'Branches',
  warehouses: 'Warehouses',
  locations: 'Locations',
  'uom-categories': 'UoM Categories',
  uoms: 'Units of Measure',
  partners: 'Partners',
  'goods-types': 'Goods Types',
  'goods-models': 'Goods Models',
  reports: 'Reports',
  settings: 'Settings',
  dev: 'Developer',
  'db-schema': 'DB Schema',
  'supabase-mcp': 'Supabase MCP',
  create: 'Create',
  edit: 'Edit'
};

const nonLinkablePaths = ['operations', 'master-data', 'dev'];

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathSnippets = location.pathname.split('/').filter(i => i);

  const breadcrumbItems = pathSnippets.map((snippet, index) => {
    const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
    const isLast = index === pathSnippets.length - 1;
    const name = pathNameMapping[snippet] || snippet.charAt(0).toUpperCase() + snippet.slice(1);
    const isNonLinkable = nonLinkablePaths.includes(snippet);

    if (!isNaN(Number(snippet))) {
      const prevSnippet = pathSnippets[index-1];
      const prevName = pathNameMapping[prevSnippet] || prevSnippet;
      // Show "Detail" for numeric IDs
      return (
        <AntBreadcrumb.Item key={url}>
          <span>{prevName} Detail</span>
        </AntBreadcrumb.Item>
      );
    }

    // Don't show create/edit in breadcrumbs as it's part of the page title
    if (snippet === 'create' || snippet === 'edit') return null;

    return (
      <AntBreadcrumb.Item key={url}>
        {isLast || isNonLinkable ? (
          <span>{name}</span>
        ) : (
          <Link to={url}>{name}</Link>
        )}
      </AntBreadcrumb.Item>
    );
  }).filter(Boolean);

  if (location.pathname === '/' || location.pathname === '/dashboard') {
    return null;
  }

  return (
    <AntBreadcrumb style={{ marginBottom: '24px' }}>
      <AntBreadcrumb.Item>
        <Link to="/dashboard"><HomeOutlined /></Link>
      </AntBreadcrumb.Item>
      {breadcrumbItems}
    </AntBreadcrumb>
  );
};

export default Breadcrumb;
