import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { Module } from '../../config/roles';
import { useAuth } from '../../hooks/useAuth';
import { Spin } from 'antd';

interface RouteGuardProps {
    module: Module;
    action: string;
    children: React.ReactElement;
}

const RouteGuard: React.FC<RouteGuardProps> = ({ module, action, children }) => {
    const { can } = usePermissions(module);
    const { isLoading, isAuthenticated } = useAuth();
    const location = useLocation();

    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-screen">
          <Spin size="large" />
        </div>
      );
    }
    
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!can(action)) {
        return <Navigate to="/access-denied" replace />;
    }

    return children;
};

export default RouteGuard;
