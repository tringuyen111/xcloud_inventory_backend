

import React from 'react';
// FIX: Corrected react-router-dom import.
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { App as AntdApp, ConfigProvider, Spin } from 'antd';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import useAuthStore from './stores/authStore';

// Page imports
import DashboardPage from './pages/dashboard/DashboardPage';
import OnhandPage from './pages/onhand/OnhandPage';

// Operations Pages
import GRListPage from './pages/operations/GoodsReceipts/GRListPage';
import GRCreatePage from './pages/operations/GoodsReceipts/GRCreatePage';
import GRViewPage from './pages/operations/GoodsReceipts/GRViewPage';
import GIPage from './pages/operations/GIPage';
import ICPage from './pages/operations/ICPage';
import GTPage from './pages/operations/GTPage';
import PAPage from './pages/operations/PAPage';

// Master Data Pages
import GoodsTypesListPage from './pages/master-data/GoodsTypes/GoodsTypesListPage';
import GoodsTypeDetailPage from './pages/master-data/GoodsTypes/GoodsTypeDetailPage';
import GoodsModelsListPage from './pages/master-data/GoodsModels/GoodsModelsListPage';
import GoodsModelDetailPage from './pages/master-data/GoodsModels/GoodsModelDetailPage';
import OrganizationsListPage from './pages/master-data/Organizations/OrganizationsListPage';
import OrganizationDetailPage from './pages/master-data/Organizations/OrganizationDetailPage';
import BranchesListPage from './pages/master-data/Branches/BranchesListPage';
import BranchDetailPage from './pages/master-data/Branches/BranchDetailPage';
import WarehousesListPage from './pages/master-data/Warehouses/WarehousesListPage';
import WarehouseDetailPage from './pages/master-data/Warehouses/WarehouseDetailPage';
import LocationsListPage from './pages/master-data/Locations/LocationsListPage';
import LocationDetailPage from './pages/master-data/Locations/LocationDetailPage';
import UomCategoriesListPage from './pages/master-data/UOMCategories/UomCategoriesListPage';
import UomCategoryDetailPage from './pages/master-data/UOMCategories/UomCategoryDetailPage';
import UomsListPage from './pages/master/UomsListPage';
import UomDetailPage from './pages/master-data/UOMs/UomDetailPage';
import PartnersListPage from './pages/master-data/Partners/PartnersListPage';
import PartnerDetailPage from './pages/master-data/Partners/PartnerDetailPage';

// Other Pages
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
                                <Route path="/operations/gr" element={<GRListPage />} />
                                <Route path="/operations/gr/create" element={<GRCreatePage />} />
                                <Route path="/operations/gr/:id" element={<GRViewPage />} />
                                <Route path="/operations/gr/:id/edit" element={<GRCreatePage />} />
                                <Route path="/operations/gi" element={<GIPage />} />
                                <Route path="/operations/ic" element={<ICPage />} />
                                <Route path="/operations/gt" element={<GTPage />} />
                                <Route path="/operations/pa" element={<PAPage />} />
                                
                                {/* Master Data */}
                                <Route path="/master-data/goods-types" element={<GoodsTypesListPage />} />
                                <Route path="/master-data/goods-types/:id" element={<GoodsTypeDetailPage />} />
                                <Route path="/master-data/goods-models" element={<GoodsModelsListPage />} />
                                <Route path="/master-data/goods-models/:id" element={<GoodsModelDetailPage />} />
                                <Route path="/master-data/organizations" element={<OrganizationsListPage />} />
                                <Route path="/master-data/organizations/:id" element={<OrganizationDetailPage />} />
                                <Route path="/master-data/branches" element={<BranchesListPage />} />
                                <Route path="/master-data/branches/:id" element={<BranchDetailPage />} />
                                <Route path="/master-data/warehouses" element={<WarehousesListPage />} />
                                <Route path="/master-data/warehouses/:id" element={<WarehouseDetailPage />} />
                                <Route path="/master-data/locations" element={<LocationsListPage />} />
                                <Route path="/master-data/locations/:id" element={<LocationDetailPage />} />
                                <Route path="/master-data/uom-categories" element={<UomCategoriesListPage />} />
                                <Route path="/master-data/uom-categories/:id" element={<UomCategoryDetailPage />} />
                                <Route path="/master-data/uoms" element={<UomsListPage />} />
                                <Route path="/master-data/uoms/:id" element={<UomDetailPage />} />
                                <Route path="/master-data/partners" element={<PartnersListPage />} />
                                <Route path="/master-data/partners/:id" element={<PartnerDetailPage />} />
                                
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