import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Typography, Space, Alert } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import PageHeader from '../../components/layout/PageHeader';

const { Text } = Typography;

const DEFAULT_PROJECT_REF = 'thnlgskiaemfqpkjwynp';

const SupabaseMcpPage: React.FC = () => {
  const [projectRef, setProjectRef] = useState(DEFAULT_PROJECT_REF);
  const [iframeUrl, setIframeUrl] = useState('');
  const [key, setKey] = useState(Date.now()); // To force iframe reload

  const loadProject = () => {
    if (projectRef.trim()) {
      setIframeUrl(`https://app.supabase.com/project/${projectRef.trim()}`);
      setKey(Date.now()); // Update key to re-render iframe
    } else {
      setIframeUrl('');
    }
  };

  useEffect(() => {
    loadProject();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Load on initial render with default project ref

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        title="Supabase Management Console"
        description="View and manage your Supabase project directly from this dashboard."
      />
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Alert
            message="Authentication Required"
            description="For this embedded view to work, you must be logged into your Supabase account in another browser tab."
            type="info"
            showIcon
          />
          <Space.Compact style={{ width: '100%' }}>
            <Input
              addonBefore="Project Ref"
              value={projectRef}
              onChange={(e) => setProjectRef(e.target.value)}
              onPressEnter={loadProject}
              placeholder="e.g., thnlgskiaemfqpkjwynp"
            />
            <Button type="primary" onClick={loadProject}>
              Load Project
            </Button>
             <Button icon={<ReloadOutlined />} onClick={loadProject} title="Reload Iframe" />
          </Space.Compact>

          {iframeUrl ? (
            <iframe
              key={key}
              src={iframeUrl}
              title="Supabase Project Dashboard"
              style={{
                width: '100%',
                height: 'calc(100vh - 350px)', // Adjust height based on surrounding elements
                border: '1px solid #d9d9d9',
                borderRadius: '8px',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: 'calc(100vh - 350px)',
                border: '1px dashed #d9d9d9',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fafafa',
              }}
            >
              <Text type="secondary">Enter a Project Ref and click "Load Project" to begin.</Text>
            </div>
          )}
        </Space>
      </Card>
    </Space>
  );
};

export default SupabaseMcpPage;
