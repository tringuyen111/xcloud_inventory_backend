import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import OnhandPage from './pages/onhand/OnhandPage';
import GRPage from './pages/operations/GRPage';
import GIPage from './pages/operations/GIPage';
import ICPage from './pages/operations/ICPage';
import GTPage from './pages/operations/GTPage';
import PAPage from './pages/operations/PAPage';
import GoodsTypesPage from './pages/goods/GoodsTypesPage';
import GoodsModelsPage from './pages/goods/GoodsModelsPage';
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
                                    <Route path="/goods/types" element={<GoodsTypesPage />} />
                                    <Route path="/goods/models" element={<GoodsModelsPage />} />
                                    <Route path="/master/organizations" element={<OrganizationsListPage />} />
                                    <Route path="/master/branches" element={<BranchesListPage />} />
                                    <Route path="/master/warehouses" element={<WarehousesListPage />} />
                                    <Route path="/master/locations" element={<LocationsListPage />} />
                                    <Route path="/master/uom-categories" element={<UomCategoriesListPage />} />
                                    <Route path="/master/uoms" element={<UomsListPage />} />
                                    <Route path="/master/partners" element={<PartnersListPage />} />
                                    <Route path="/reports" element={<ReportsPage />} />
                                    <Route path="/settings" element={<SettingsPage />} />
                                    <Route path="/" element={<Navigate to="/dashboard" />} />
                                </Routes>
                            </AppLayout>
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </HashRouter>
    );
};

export default App;