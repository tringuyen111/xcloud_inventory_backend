
import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { App as AntdApp, ConfigProvider, Spin } from 'antd';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import useAuthStore from './stores/authStore';

// Page imports
import DashboardPage from './pages/dashboard/DashboardPage';
import OnhandPage from './pages/onhand/OnhandPage';

// Operations Pages
import GRListPage from './pages/operations/GRPage';
import GRCreatePage from './pages/operations/GRCreatePage';
import GRViewPage from './pages/operations/GRDetailPage';
import GIListPage from './pages/operations/GIPage';
import GICreatePage from './pages/operations/GoodsIssues/GICreatePage';
import GIViewPage from './pages/operations/GoodsIssues/GIViewPage';
import ICPage from './pages/operations/ICPage';
import GTPage from './pages/operations/GTPage';
import PAPage from './pages/operations/PAPage';

// Master Data Pages
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

// Other Pages
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/settings/SettingsPage';
import DbSchemaPage from './pages/dev/DbSchemaPage';
import SupabaseMcpPage from './pages/dev/SupabaseMcpPage';

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
                                <Route path="/operations/gi" element={<GIListPage />} />
                                <Route path="/operations/gi/create" element={<GICreatePage />} />
                                <Route path="/operations/gi/:id" element={<GIViewPage />} />
                                <Route path="/operations/gi/:id/edit" element={<GICreatePage />} />
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
                                <Route path="/supabase-mcp" element={<SupabaseMcpPage />} />
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
