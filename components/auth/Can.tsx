import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { Module } from '../../config/roles';

interface CanProps {
    module: Module;
    action: string;
    children: React.ReactNode;
}

const Can: React.FC<CanProps> = ({ module, action, children }) => {
    const { can } = usePermissions(module);
    return can(action) ? <>{children}</> : null;
};

export default Can;
