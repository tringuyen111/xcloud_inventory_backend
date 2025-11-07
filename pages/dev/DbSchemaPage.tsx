import React, { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Button, Card, Typography, Spin, Alert, Table, Tabs, Tag, Space
} from 'antd';
import { ExportOutlined, DatabaseOutlined } from '@ant-design/icons';
import type { TabsProps } from 'antd';

// --- Type Definitions for Schema Details ---

interface ColumnDetail {
  name: string;
  type: string;
  is_nullable: boolean;
  default: string | null;
}

interface TableDetail {
  schema: string;
  name: string;
  columns: ColumnDetail[];
}

interface FunctionDetail {
    schema: string;
    name: string;
    return_type: string;
    definition: string;
}

interface TriggerDetail {
    name: string;
    table: string;
    event: string;
    timing: string;
    orientation: string;
    statement: string;
}

interface PolicyDetail {
    schema: string;
    table: string;
    name: string;
    command: string;
    roles: string[] | null;
    qualifier: string;
    with_check: string;
}

interface SchemaDetails {
  tables: TableDetail[];
  functions: FunctionDetail[];
  triggers: TriggerDetail[];
  policies: PolicyDetail[];
}

// --- Main Component ---

const DbSchemaPage: React.FC = () => {
  const [schema, setSchema] = useState<SchemaDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchema = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSchema(null);

    const { data, error: rpcError } = await supabase.rpc('get_schema_details');

    if (rpcError) {
      console.error('Error fetching schema:', rpcError);
      setError(`Failed to fetch schema. Make sure you have created/updated the 'get_schema_details' function in your Supabase SQL Editor. Error: ${rpcError.message}`);
    } else if (data) {
      setSchema(data);
    }
    
    setLoading(false);
  }, []);

  const handleExport = () => {
    if (!schema) return;
    const jsonString = JSON.stringify(schema, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `db_schema_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tableColumns = [
    { title: 'Column Name', dataIndex: 'name', key: 'name', render: (text: string) => <strong>{text}</strong> },
    { title: 'Data Type', dataIndex: 'type', key: 'type' },
    { title: 'Nullable', dataIndex: 'is_nullable', key: 'is_nullable', render: (nullable: boolean) => (nullable ? 'Yes' : 'No') },
    { title: 'Default Value', dataIndex: 'default', key: 'default', render: (text: string) => <code>{text || 'NULL'}</code> },
  ];

  const tableItems: TabsProps['items'] = schema?.tables.map(table => ({
    key: `${table.schema}.${table.name}`,
    label: `${table.schema}.${table.name}`,
    children: (
      <>
        <Table
          columns={tableColumns}
          dataSource={table.columns}
          rowKey="name"
          pagination={false}
          size="small"
        />
      </>
    )
  }));
  
  const mainItems: TabsProps['items'] = [
    {
      key: '1',
      label: `Tables (${schema?.tables?.length || 0})`,
      children: schema?.tables ? <Tabs defaultActiveKey="0" tabPosition="left" items={tableItems} /> : null,
    },
    {
      key: '2',
      label: `Functions (${schema?.functions?.length || 0})`,
      children: <Table size="small" pagination={false} rowKey={(record, index) => `${record.schema}.${record.name}-${index}`} dataSource={schema?.functions} columns={[ { title: 'Function Name', dataIndex: 'name', key: 'name' }, { title: 'Return Type', dataIndex: 'return_type', key: 'return_type' } ]} />,
    },
    {
      key: '3',
      label: `Triggers (${schema?.triggers?.length || 0})`,
      children: <Table size="small" pagination={false} rowKey={(record) => `${record.table}-${record.name}`} dataSource={schema?.triggers} columns={[ { title: 'Trigger Name', dataIndex: 'name' }, { title: 'Table', dataIndex: 'table' }, { title: 'Event', dataIndex: 'event', render: (e: string) => <Tag color={e === 'INSERT' ? 'success' : e === 'UPDATE' ? 'processing' : 'error'}>{e}</Tag> }, { title: 'Timing', dataIndex: 'timing' } ]} />,
    },
    {
      key: '4',
      label: `Policies (${schema?.policies?.length || 0})`,
      children: <Table size="small" pagination={false} rowKey={(record) => `${record.table}-${record.name}`} dataSource={schema?.policies} columns={[ { title: 'Policy Name', dataIndex: 'name' }, { title: 'Table', dataIndex: 'table' }, { title: 'Command', dataIndex: 'command', render: (c: string) => <Tag>{c}</Tag> } , { title: 'Roles', dataIndex: 'roles', render: (r: string[] | null) => r ? r.join(', ') : 'public' } ]} />,
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Typography.Title level={3} style={{ marginTop: 0 }}>Database Schema Inspector</Typography.Title>
        <Typography.Paragraph type="secondary">
          This tool inspects the database schema using an RPC function to visualize Tables, Functions, Triggers, and RLS Policies. You can also export the results to a JSON file for offline analysis.
        </Typography.Paragraph>
        <Space>
          <Button type="primary" icon={<DatabaseOutlined />} onClick={fetchSchema} loading={loading} size="large">
            Load Database Schema
          </Button>
          <Button icon={<ExportOutlined />} onClick={handleExport} disabled={!schema || loading} size="large">
              Export as JSON
          </Button>
        </Space>
      </Card>

      {error && <Alert message="Error" description={error} type="error" showIcon />}
      
      {loading && <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>}

      {schema && (
        <Card>
          <Tabs defaultActiveKey="1" items={mainItems} />
        </Card>
      )}
    </Space>
  );
};

export default DbSchemaPage;
