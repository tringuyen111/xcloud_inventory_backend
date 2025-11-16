



import React from 'react';
import { useLocation } from 'react-router-dom';
import { Breadcrumb as AntBreadcrumb } from 'antd';

const pathNameMapping: { [key: string]: string } = {
  dashboard: 'Dashboard',
  profile: 'My Profile',
  onhand: 'Onhand',
  operations: 'Operations',
  product: 'Product',
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
  users: 'User Management',
  roles: 'Roles Management',
  permissions: 'Assign Permissions',
  'lots-serials': 'Lots & Serials',
  dev: 'Developer',
  'db-schema': 'DB Schema',
  'supabase-mcp': 'Supabase MCP',
};

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathSnippets = location.pathname.split('/').filter(i => i);

  const breadcrumbItems = pathSnippets
    .map(snippet => {
      // Exclude dynamic IDs and specific action words from the breadcrumb trail.
      // The page title should contain the specific detail (e.g., "Editing Organization #123").
      if (!isNaN(Number(snippet)) || snippet === 'create' || snippet === 'edit') {
        return null;
      }

      const name = pathNameMapping[snippet] || snippet.charAt(0).toUpperCase() + snippet.slice(1);
      return (
        <AntBreadcrumb.Item key={snippet}>
          <span>{name}</span>
        </AntBreadcrumb.Item>
      );
    })
    .filter(Boolean); // Remove any null entries

  // Don't render anything on the dashboard or if there are no valid breadcrumb items.
  if (breadcrumbItems.length === 0 || location.pathname === '/dashboard') {
    return null;
  }

  return (
    <AntBreadcrumb separator="›">
      {breadcrumbItems}
    </AntBreadcrumb>
  );
};

export default Breadcrumb;