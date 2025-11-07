import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { App as AntdApp, ConfigProvider, Spin } from 'antd';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import useAuthStore from './stores/authStore';

// Page imports
import DashboardPage from './pages/dashboard/DashboardPage';
import OnhandPage from './pages/onhand/OnhandPage';
import GRPage from './pages/operations/GRPage';
import GRCreate from './pages/operations/GRCreate'; // This will now handle both create and edit
import GRDetailPage from './pages/operations/GRDetailPage';
import GIPage from './pages/operations/GIPage';
import ICPage from './pages/operations/ICPage';
import GTPage from './pages/operations/GTPage';
import PAPage from './pages/operations/PAPage';
import GoodsTypesListPage from './pages/goods/GoodsTypesListPage';
import GoodsTypeDetailPage from './pages/goods/GoodsTypeDetailPage';
import GoodsModelsListPage from './pages/goods/GoodsModelsListPage';
import GoodsModelDetailPage from './pages/goods/GoodsModelDetailPage';
import OrganizationsListPage from './pages/master/OrganizationsListPage';
import OrganizationDetailPage from './pages/master/OrganizationDetailPage';
import BranchesListPage from './pages/master/BranchesListPage';
import BranchDetailPage from './pages/master/BranchDetailPage';
import WarehousesListPage from './pages/master/WarehousesListPage';
import WarehouseDetailPage from './pages/master/WarehouseDetailPage';
import LocationsListPage from './pages/master/LocationsListPage';
import LocationDetailPage from './pages/master/LocationDetailPage';
import UomCategoriesListPage from './pages/master/UomCategoriesListPage';
import UomCategoryDetailPage from './pages/master/UomCategoryDetailPage';
import UomsListPage from './pages/master/UomsListPage';
import UomDetailPage from './pages/master/UomDetailPage';
import PartnersListPage from './pages/master/PartnersListPage';
import PartnerDetailPage from './pages/master/PartnerDetailPage';
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/settings/SettingsPage';
import DbSchemaPage from './pages/dev/DbSchemaPage';

const PrivateRoute: React.FC = () => {
    const { session, loading } = useAuthStore();
    const location = useLocation();
    const signOut = useAuthStore((state) => state.signOut);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Spin size="large" />
            </div>
        );
    }
    
    if (!session) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return (
        <AppLayout onLogout={signOut}>
            <Outlet />
        </AppLayout>
    );
};


const App: React.FC = () => {
    const { session, loading } = useAuthStore();
    
    const FullScreenLoader: React.FC = () => (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" />
      </div>
    );
    
    return (
        <ConfigProvider>
            <AntdApp>
                <HashRouter>
                    {loading ? <FullScreenLoader /> : (
                        <Routes>
                            <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
                            <Route element={<PrivateRoute />}>
                                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                                <Route path="/dashboard" element={<DashboardPage />} />
                                <Route path="/onhand" element={<OnhandPage />} />
                                
                                {/* Operations */}
                                <Route path="/operations/gr" element={<GRPage />} />
                                <Route path="/operations/gr/create" element={<GRCreate />} />
                                <Route path="/operations/gr/:id" element={<GRDetailPage />} />
                                <Route path="/operations/gr/:id/edit" element={<GRCreate isEditMode={true} />} />
                                <Route path="/operations/gi" element={<GIPage />} />
                                <Route path="/operations/ic" element={<ICPage />} />
                                <Route path="/operations/gt" element={<GTPage />} />
                                <Route path="/operations/pa" element={<PAPage />} />
                                
                                {/* Goods */}
                                <Route path="/goods/types" element={<GoodsTypesListPage />} />
                                <Route path="/goods/types/:id" element={<GoodsTypeDetailPage />} />
                                <Route path="/goods/models" element={<GoodsModelsListPage />} />
                                <Route path="/goods/models/:id" element={<GoodsModelDetailPage />} />

                                {/* Master Data */}
                                <Route path="/master/organizations" element={<OrganizationsListPage />} />
                                <Route path="/master/organizations/:id" element={<OrganizationDetailPage />} />
                                <Route path="/master/branches" element={<BranchesListPage />} />
                                <Route path="/master/branches/:id" element={<BranchDetailPage />} />
                                <Route path="/master/warehouses" element={<WarehousesListPage />} />
                                <Route path="/master/warehouses/:id" element={<WarehouseDetailPage />} />
                                <Route path="/master/locations" element={<LocationsListPage />} />
                                <Route path="/master/locations/:id" element={<LocationDetailPage />} />
                                <Route path="/master/uom-categories" element={<UomCategoriesListPage />} />
                                <Route path="/master/uom-categories/:id" element={<UomCategoryDetailPage />} />
                                <Route path="/master/uoms" element={<UomsListPage />} />
                                <Route path="/master/uoms/:id" element={<UomDetailPage />} />
                                <Route path="/master/partners" element={<PartnersListPage />} />
                                <Route path="/master/partners/:id" element={<PartnerDetailPage />} />
                                
                                {/* Other */}
                                <Route path="/reports" element={<ReportsPage />} />
                                <Route path="/settings" element={<SettingsPage />} />
                                <Route path="/db-schema" element={<DbSchemaPage />} />
                            </Route>
                            <Route path="*" element={<Navigate to="/" />} />
                        </Routes>
                    )}
                </HashRouter>
            </AntdApp>
        </ConfigProvider>
    );
};

export default App;