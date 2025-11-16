import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Dropdown, MenuProps, Avatar } from 'antd';
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    BellOutlined,
    LogoutOutlined,
    SettingOutlined,
    UserOutlined,
} from '@ant-design/icons';

import useUIStore from '../../stores/uiStore';
import { useAuth } from '../../hooks/useAuth';
import Can from '../auth/Can';
import Breadcrumb from './Breadcrumb';

interface TopbarProps {
  onLogout: () => void;
}

const VNFlagIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="20" viewBox="0 0 900 600" className="rounded-sm">
        <rect width="900" height="600" fill="#da251d"/>
        <path d="M450 150l93 279-243-172h300L357 429z" fill="#ff0"/>
    </svg>
);

const Topbar: React.FC<TopbarProps> = ({ onLogout }) => {
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const { profile, isLoading } = useAuth();

  const displayName = profile?.full_name || profile?.email || 'User';

  const items: MenuProps['items'] = [
    {
      key: '1',
      label: <Link to="/profile">Profile</Link>,
      icon: <UserOutlined />,
    },
    {
      key: '2',
      label: (
        <Can module="navigation" action="viewSettings">
          <Link to="/settings">Settings</Link>
        </Can>
      ),
      icon: <SettingOutlined />,
      // Disable if the user cannot view settings (non-admin roles)
      disabled: !profile?.role || !['ADMIN'].includes(profile.role),
    },
    {
      type: 'divider',
    },
    {
      key: '3',
      label: 'Logout',
      icon: <LogoutOutlined />,
      onClick: onLogout,
      danger: true,
    },
  ];

  return (
    <header className="bg-white shadow-sm z-10 h-16 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center space-x-4">
            <Button
                type="text"
                icon={isSidebarOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
                onClick={toggleSidebar}
                className="!w-10 !h-10 !text-lg bg-gray-100 hover:!bg-gray-200"
            />
            <Breadcrumb />
        </div>
        
        <div className="flex items-center space-x-2">
            <Button type="text" icon={<BellOutlined className="text-xl" />} className="!w-10 !h-10" />
            <Button type="text" icon={<VNFlagIcon />} className="!w-12 !h-10" />
            
            <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
                <Button type="text" className="!h-auto !px-3 !py-2 hover:!bg-gray-100">
                    <div className="flex items-center space-x-2">
                        {isLoading ? (
                            <>
                                <Avatar className="bg-gray-300 animate-pulse" icon={<UserOutlined />} />
                                <div className="hidden md:block">
                                    <div className="h-4 w-24 bg-gray-300 rounded animate-pulse"></div>
                                </div>
                            </>
                        ) : (
                            <>
                                <Avatar className="bg-gray-200 text-gray-600" icon={<UserOutlined />} />
                                <span className="font-semibold text-sm text-gray-800 hidden md:block">{displayName}</span>
                            </>
                        )}
                    </div>
                </Button>
            </Dropdown>
        </div>
    </header>
  );
};

export default Topbar;