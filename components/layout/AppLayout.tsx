


import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface AppLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

const Footer: React.FC = () => {
    return (
        <footer className="text-sm text-gray-500 flex justify-between items-center px-6 py-4 bg-white border-t border-gray-200 flex-shrink-0">
            <span>Copyright © 2025 Inventory XCloud</span>
            <span>Design &amp; Develop by Tri Nguyen</span>
        </footer>
    );
};

const AppLayout: React.FC<AppLayoutProps> = ({ children, onLogout }) => {
  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onLogout={onLogout} />
        <main className="flex-1 overflow-y-auto bg-[#F3F3F9] p-6">
            {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default AppLayout;