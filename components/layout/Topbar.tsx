

import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import useUIStore from '../../stores/uiStore';
import useAuthStore from '../../stores/authStore';

interface TopbarProps {
  onLogout: () => void;
}

const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const VNFlagIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="20" viewBox="0 0 900 600" className="rounded-sm">
        <rect width="900" height="600" fill="#da251d"/>
        <path d="M450 150l93 279-243-172h300L357 429z" fill="#ff0"/>
    </svg>
);

const Topbar: React.FC<TopbarProps> = ({ onLogout }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const user = useAuthStore((state) => state.user);

  return (
    <header className="bg-white shadow-sm z-10 h-16 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center space-x-4">
            <button onClick={toggleSidebar} className="text-gray-500 focus:outline-none">
                <MenuIcon />
            </button>
        </div>
        
        <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon />
                </span>
                <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
            </div>

            <button className="focus:outline-none">
                <VNFlagIcon />
            </button>
            <button className="relative text-gray-500 focus:outline-none">
                <BellIcon />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">3</span>
            </button>
            
            <div className="relative">
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center space-x-2 focus:outline-none p-1 rounded-lg">
                    <img className="h-9 w-9 rounded-full" src={`https://ui-avatars.com/api/?name=${user?.email || 'User'}&background=random`} alt="User avatar" />
                    <div className="text-left hidden md:block">
                        <div className="font-semibold text-sm text-gray-800">{user?.email?.split('@')[0] || 'User'}</div>
                        <div className="text-xs text-gray-500">Administrator</div>
                    </div>
                </button>
                {dropdownOpen && (
                    <div 
                        className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl z-20"
                        onMouseLeave={() => setDropdownOpen(false)}
                    >
                        <a href="#profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</a>
                        <a href="#settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</a>
                        <div className="border-t border-gray-100"></div>
                        <button
                            onClick={onLogout}
                            className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            <LogoutIcon />
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </div>
    </header>
  );
};

export default Topbar;
