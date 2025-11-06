import React from 'react';
import { Row, Col, Typography, Space } from 'antd';

interface PageHeaderProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions }) => {
  return (
    <Row justify="space-between" align="middle" className="mb-6">
      <Col>
        <Typography.Title level={3} style={{ margin: 0, color: '#1e293b' }}>
          {title}
        </Typography.Title>
        <Typography.Text type="secondary">{description}</Typography.Text>
      </Col>
      {actions && (
        <Col>
          <Space>{actions}</Space>
        </Col>
      )}
    </Row>
  );
};

export default PageHeader;