
import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { App as AntdApp, ConfigProvider, Spin } from 'antd';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import useAuthStore from './stores/authStore';

// Page imports
import DashboardPage from './pages/dashboard/DashboardPage';

// Operations Pages
import GRListPage from './pages/operations/GoodsReceipts/GRListPage';
import GRCreatePage from './pages/operations/GoodsReceipts/GRCreatePage';
import GRViewPage from './pages/operations/GoodsReceipts/GRViewPage';
import GIListPage from './pages/operations/GoodsIssues/GIListPage';
import GICreatePage from './pages/operations/GoodsIssues/GICreatePage';
import GIViewPage from './pages/operations/GoodsIssues/GIViewPage';
import OnhandListPage from './pages/operations/Onhand/OnhandListPage';
import ICPage from './pages/operations/ICPage';
import GTPage from './pages/operations/GTPage';
import PutawayListPage from './pages/operations/Putaway/PutawayListPage';

// Master Data Pages (Consolidated and Corrected Paths)
import GoodsTypesListPage from './pages/master-data/GoodsTypes/GoodsTypesListPage';
import GoodsTypeDetailPage from './pages/master-data/GoodsTypes/GoodsTypeDetailPage';
import GoodsTypeFormPage from './pages/master-data/GoodsTypes/GoodsTypeFormPage';
import GoodsModelsListPage from './pages/master-data/GoodsModels/GoodsModelsListPage';
import GoodsModelDetailPage from './pages/master-data/GoodsModels/GoodsModelDetailPage';
import GoodsModelFormPage from './pages/master-data/GoodsModels/GoodsModelFormPage';
import OrganizationsListPage from './pages/master-data/Organizations/OrganizationsListPage';
import OrganizationDetailPage from './pages/master-data/Organizations/OrganizationDetailPage';
import OrganizationFormPage from './pages/master-data/Organizations/OrganizationFormPage';
import BranchesListPage from './pages/master-data/Branches/BranchesListPage';
import BranchDetailPage from './pages/master-data/Branches/BranchDetailPage';
import BranchFormPage from './pages/master-data/Branches/BranchFormPage';
import WarehousesListPage from './pages/master-data/Warehouses/WarehousesListPage';
import WarehouseDetailPage from './pages/master-data/Warehouses/WarehouseDetailPage';
import WarehouseFormPage from './pages/master-data/Warehouses/WarehouseFormPage';
import LocationsListPage from './pages/master-data/Locations/LocationsListPage';
import LocationDetailPage from './pages/master-data/Locations/LocationDetailPage';
import LocationFormPage from './pages/master-data/Locations/LocationFormPage';
import UomCategoriesListPage from './pages/master-data/UOMCategories/UomCategoriesListPage';
import UomCategoryDetailPage from './pages/master-data/UOMCategories/UomCategoryDetailPage';
import UomCategoryFormPage from './pages/master-data/UOMCategories/UomCategoryFormPage';
import UomsListPage from './pages/master-data/UOMs/UomsListPage';
import UomDetailPage from './pages/master-data/UOMs/UomDetailPage';
import UomFormPage from './pages/master-data/UOMs/UomFormPage';
import PartnersListPage from './pages/master-data/Partners/PartnersListPage';
import PartnerDetailPage from './pages/master-data/Partners/PartnerDetailPage';
import PartnerFormPage from './pages/master-data/Partners/PartnerFormPage';

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
                                
                                {/* Operations */}
                                <Route path="/operations/gr" element={<GRListPage />} />
                                <Route path="/operations/gr/create" element={<GRCreatePage />} />
                                <Route path="/operations/gr/:id" element={<GRViewPage />} />
                                <Route path="/operations/gi" element={<GIListPage />} />
                                <Route path="/operations/gi/create" element={<GICreatePage />} />
                                <Route path="/operations/gi/:id" element={<GIViewPage />} />
                                <Route path="/operations/onhand" element={<OnhandListPage />} />
                                <Route path="/operations/ic" element={<ICPage />} />
                                <Route path="/operations/gt" element={<GTPage />} />
                                <Route path="/operations/pa" element={<PutawayListPage />} />
                                
                                {/* Master Data */}
                                <Route path="/master-data/goods-types" element={<GoodsTypesListPage />} />
                                <Route path="/master-data/goods-types/create" element={<GoodsTypeFormPage />} />
                                <Route path="/master-data/goods-types/:id" element={<GoodsTypeDetailPage />} />
                                <Route path="/master-data/goods-types/:id/edit" element={<GoodsTypeFormPage />} />

                                <Route path="/master-data/goods-models" element={<GoodsModelsListPage />} />
                                <Route path="/master-data/goods-models/create" element={<GoodsModelFormPage />} />
                                <Route path="/master-data/goods-models/:id" element={<GoodsModelDetailPage />} />
                                <Route path="/master-data/goods-models/:id/edit" element={<GoodsModelFormPage />} />

                                <Route path="/master-data/organizations" element={<OrganizationsListPage />} />
                                <Route path="/master-data/organizations/create" element={<OrganizationFormPage />} />
                                <Route path="/master-data/organizations/:id" element={<OrganizationDetailPage />} />
                                <Route path="/master-data/organizations/:id/edit" element={<OrganizationFormPage />} />

                                <Route path="/master-data/branches" element={<BranchesListPage />} />
                                <Route path="/master-data/branches/create" element={<BranchFormPage />} />
                                <Route path="/master-data/branches/:id" element={<BranchDetailPage />} />
                                <Route path="/master-data/branches/:id/edit" element={<BranchFormPage />} />

                                <Route path="/master-data/warehouses" element={<WarehousesListPage />} />
                                <Route path="/master-data/warehouses/create" element={<WarehouseFormPage />} />
                                <Route path="/master-data/warehouses/:id" element={<WarehouseDetailPage />} />
                                <Route path="/master-data/warehouses/:id/edit" element={<WarehouseFormPage />} />
                                
                                <Route path="/master-data/locations" element={<LocationsListPage />} />
                                <Route path="/master-data/locations/create" element={<LocationFormPage />} />
                                <Route path="/master-data/locations/:id" element={<LocationDetailPage />} />
                                <Route path="/master-data/locations/:id/edit" element={<LocationFormPage />} />

                                <Route path="/master-data/uom-categories" element={<UomCategoriesListPage />} />
                                <Route path="/master-data/uom-categories/create" element={<UomCategoryFormPage />} />
                                <Route path="/master-data/uom-categories/:id" element={<UomCategoryDetailPage />} />
                                <Route path="/master-data/uom-categories/:id/edit" element={<UomCategoryFormPage />} />

                                <Route path="/master-data/uoms" element={<UomsListPage />} />
                                <Route path="/master-data/uoms/create" element={<UomFormPage />} />
                                <Route path="/master-data/uoms/:id" element={<UomDetailPage />} />
                                <Route path="/master-data/uoms/:id/edit" element={<UomFormPage />} />

                                <Route path="/master-data/partners" element={<PartnersListPage />} />
                                <Route path="/master-data/partners/create" element={<PartnerFormPage />} />
                                <Route path="/master-data/partners/:id" element={<PartnerDetailPage />} />
                                <Route path="/master-data/partners/:id/edit" element={<PartnerFormPage />} />
                                
                                {/* Other */}
                                <Route path="/reports" element={<ReportsPage />} />
                                <Route path="/settings" element={<SettingsPage />} />

                                {/* Developer Tools */}
                                <Route path="/dev/db-schema" element={<DbSchemaPage />} />
                                
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
