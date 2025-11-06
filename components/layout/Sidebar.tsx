import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import useUIStore from '../../stores/uiStore';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  subItems?: NavItem[];
}

const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const CubeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const CogIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const ChartBarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const ChevronDownIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className || ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;

const navItems: NavItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { name: 'Onhand', path: '/onhand', icon: <CubeIcon /> },
    { name: 'Operations', path: '/operations', icon: <CogIcon />, subItems: [
        { name: 'Goods Receipt', path: '/operations/gr', icon: <div/> },
        { name: 'Goods Issue', path: '/operations/gi', icon: <div/> },
        { name: 'Inventory Count', path: '/operations/ic', icon: <div/> },
        { name: 'Goods Transfer', path: '/operations/gt', icon: <div/> },
        { name: 'Putaway', path: '/operations/pa', icon: <div/> },
    ]},
    { name: 'Goods', path: '/goods', icon: <CubeIcon />, subItems: [
        { name: 'Goods Types', path: '/goods/types', icon: <div/> },
        { name: 'Goods Models', path: '/goods/models', icon: <div/> },
    ]},
    { name: 'Master Data', path: '/master', icon: <CubeIcon />, subItems: [
        { name: 'Organizations', path: '/master/organizations', icon: <div/> },
        { name: 'Branches', path: '/master/branches', icon: <div/> },
        { name: 'Warehouses', path: '/master/warehouses', icon: <div/> },
        { name: 'Locations', path: '/master/locations', icon: <div/> },
        { name: 'UoM Categories', path: '/master/uom-categories', icon: <div/> },
        { name: 'Units of Measure', path: '/master/uoms', icon: <div/> },
        { name: 'Partners', path: '/master/partners', icon: <div/> },
    ]},
    { name: 'Reports', path: '/reports', icon: <ChartBarIcon /> },
    { name: 'Settings', path: '/settings', icon: <CogIcon /> },
];

const Sidebar: React.FC = () => {
    const isOpen = useUIStore((state) => state.isSidebarOpen);
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState<string[]>([]);

    React.useEffect(() => {
        const parentPath = '/' + location.pathname.split('/')[1];
        if(!openMenus.includes(parentPath)){
            setOpenMenus(prev => [...prev, parentPath]);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    const toggleMenu = (path: string) => {
        setOpenMenus(prev => prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]);
    };

    const renderNavItems = (items: NavItem[]) => {
        return items.map(item => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            const isMenuOpen = openMenus.includes(item.path);

            if (item.subItems) {
                return (
                    <div key={item.name}>
                        <button onClick={() => toggleMenu(item.path)} className={`w-full flex justify-between items-center text-left py-3 px-4 rounded-md transition-colors duration-200 ${isActive ? 'bg-[#1976d2] text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
                            <div className="flex items-center space-x-3">
                                {item.icon}
                                <span>{item.name}</span>
                            </div>
                            <ChevronDownIcon className={`transform transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isMenuOpen && (
                            <div className="pl-8 py-2 space-y-1">
                                {item.subItems.map(subItem => {
                                    const isSubActive = location.pathname === subItem.path;
                                    return (
                                        <NavLink
                                            key={subItem.name}
                                            to={subItem.path}
                                            className={`block py-2 px-3 rounded-md text-sm transition-colors duration-200 ${isSubActive ? 'bg-[#1976d2] text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
                                            {subItem.name}
                                        </NavLink>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                );
            }

            return (
                <NavLink
                    key={item.name}
                    to={item.path}
                    className={`flex items-center space-x-3 py-3 px-4 rounded-md transition-colors duration-200 ${isActive ? 'bg-[#1976d2] text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                >
                    {item.icon}
                    <span>{item.name}</span>
                </NavLink>
            );
        });
    };

    return (
        <aside className={`bg-[#1E1F23] text-white transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-0'} md:w-64 h-full flex flex-col`}>
            <div className="flex items-center justify-center h-16 border-b border-slate-700">
                <h1 className="text-2xl font-bold text-white">XCloud</h1>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                {renderNavItems(navItems)}
            </nav>
        </aside>
    );
};

export default Sidebar;
