import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';

import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import OnhandPage from './pages/onhand/OnhandPage';
import GRPage from './pages/operations/GRPage';
import GIPage from './pages/operations/GIPage';
import ICPage from './pages/operations/ICPage';
import GTPage from './pages/operations/GTPage';
import PAPage from './pages/operations/PAPage';
import GoodsTypesListPage from './pages/goods/GoodsTypesListPage';
import GoodsModelsListPage from './pages/goods/GoodsModelsListPage';
import OrganizationsListPage from './pages/master/OrganizationsListPage';
import BranchesListPage from './pages/master/BranchesListPage';
import WarehousesListPage from './pages/master/WarehousesListPage';
import LocationsListPage from './pages/master/LocationsListPage';
import UomCategoriesListPage from './pages/master/UomCategoriesListPage';
import UomsListPage from './pages/master/UomsListPage';
import PartnersListPage from './pages/master/PartnersListPage';
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/settings/SettingsPage';
import AppLayout from './components/layout/AppLayout';
import useAuthStore from './stores/authStore';
import DbSchemaPage from './pages/dev/DbSchemaPage';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { session, loading } = useAuthStore();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Loading session...</div>
      </div>
    );
  }

  return session ? children : <Navigate to="/login" />;
};

const App: React.FC = () => {
    const { session, signOut } = useAuthStore();

    return (
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#2563eb', // Blue 600
              borderRadius: 8,
              fontFamily: "'Inter', sans-serif",
            },
            components: {
              Button: {
                  boxShadow: 'none',
              },
              Card: {
                borderRadiusLG: 12,
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              },
              Table: {
                headerBg: '#f8fafc',
                headerColor: '#334155',
                headerSortActiveBg: '#f1f5f9',
              },
              Modal: {
                borderRadiusLG: 12,
              }
            }
          }}
        >
            <HashRouter>
                <Routes>
                    <Route path="/login" element={session ? <Navigate to="/dashboard" /> : <LoginPage />} />
                    <Route
                        path="/*"
                        element={
                            <ProtectedRoute>
                                <AppLayout onLogout={signOut}>
                                    <Routes>
                                        <Route path="/dashboard" element={<DashboardPage />} />
                                        <Route path="/onhand" element={<OnhandPage />} />
                                        <Route path="/operations/gr" element={<GRPage />} />
                                        <Route path="/operations/gi" element={<GIPage />} />
                                        <Route path="/operations/ic" element={<ICPage />} />
                                        <Route path="/operations/gt" element={<GTPage />} />
                                        <Route path="/operations/pa" element={<PAPage />} />
                                        <Route path="/goods/types" element={<GoodsTypesListPage />} />
                                        <Route path="/goods/models" element={<GoodsModelsListPage />} />
                                        <Route path="/master/organizations" element={<OrganizationsListPage />} />
                                        <Route path="/master/branches" element={<BranchesListPage />} />
                                        <Route path="/master/warehouses" element={<WarehousesListPage />} />
                                        <Route path="/master/locations" element={<LocationsListPage />} />
                                        <Route path="/master/uom-categories" element={<UomCategoriesListPage />} />
                                        <Route path="/master/uoms" element={<UomsListPage />} />
                                        <Route path="/master/partners" element={<PartnersListPage />} />
                                        <Route path="/reports" element={<ReportsPage />} />
                                        <Route path="/settings" element={<SettingsPage />} />
                                        <Route path="/db-schema" element={<DbSchemaPage />} />
                                        <Route path="/" element={<Navigate to="/dashboard" />} />
                                    </Routes>
                                </AppLayout>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </HashRouter>
        </ConfigProvider>
    );
};

export default App;