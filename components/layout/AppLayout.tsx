import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface AppLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

const Footer: React.FC = () => {
    return (
        <footer className="text-sm text-gray-500 flex justify-between items-center px-6 py-4 bg-white border-t border-gray-200">
            <span>2025 © nguyenmanhtri2907@gmail.com</span>
            <span>Design & Develop by Tri Nguyen</span>
        </footer>
    );
};

const AppLayout: React.FC<AppLayoutProps> = ({ children, onLogout }) => {
  return (
    <div className="flex h-screen bg-[#F3F3F9]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onLogout={onLogout} />
        <div className="flex-1 flex flex-col overflow-y-auto">
            <main className="flex-1 p-6">
              {children}
            </main>
            <Footer />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;