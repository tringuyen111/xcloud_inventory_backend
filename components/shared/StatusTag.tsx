
import React from 'react';
import { Tag } from 'antd';

interface StatusTagProps {
  status: boolean;
  activeText?: string;
  inactiveText?: string;
}

const StatusTag: React.FC<StatusTagProps> = ({ status, activeText = 'Active', inactiveText = 'Inactive' }) => {
  const color = status ? 'green' : 'grey';
  const text = status ? activeText : inactiveText;

  return <Tag color={color}>{text}</Tag>;
};

export default StatusTag;
