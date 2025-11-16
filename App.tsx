

import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Spin, ConfigProvider, App as AntdApp } from 'antd';
import useAuthStore from './stores/authStore';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import RouteGuard from './components/auth/RouteGuard';
import AccessDeniedPage from './pages/auth/AccessDeniedPage';


// Import Page Components
import OrganizationsListPage from './pages/master-data/Organizations/OrganizationsListPage';
import OrganizationFormPage from './pages/master-data/Organizations/OrganizationFormPage';
import OrganizationDetailPage from './pages/master-data/Organizations/OrganizationDetailPage';

import BranchesListPage from './pages/master-data/Branches/BranchesListPage';
import BranchFormPage from './pages/master-data/Branches/BranchFormPage';
import BranchDetailPage from './pages/master-data/Branches/BranchDetailPage';

import WarehousesListPage from './pages/master-data/Warehouses/WarehousesListPage';
import WarehouseFormPage from './pages/master-data/Warehouses/WarehouseFormPage';
import WarehouseDetailPage from './pages/master-data/Warehouses/WarehouseDetailPage';

import LocationsListPage from './pages/master-data/Locations/LocationsListPage';
import LocationFormPage from './pages/master-data/Locations/LocationFormPage';
import LocationDetailPage from './pages/master-data/Locations/LocationDetailPage';

import PartnersListPage from './pages/master-data/Partners/PartnersListPage';
import PartnerFormPage from './pages/master-data/Partners/PartnerFormPage';
import PartnerDetailPage from './pages/master-data/Partners/PartnerDetailPage';

import UomCategoriesListPage from './pages/master-data/UOMCategories/UomCategoriesListPage';
import UomCategoryFormPage from './pages/master-data/UOMCategories/UomCategoryFormPage';
import UomCategoryDetailPage from './pages/master-data/UOMCategories/UomCategoryDetailPage';

import UomsListPage from './pages/master-data/UOMs/UomsListPage';
import UomFormPage from './pages/master-data/UOMs/UomFormPage';
import UomDetailPage from './pages/master-data/UOMs/UomDetailPage';

import GoodsTypesListPage from './pages/master-data/GoodsTypes/GoodsTypesListPage';
import GoodsTypeFormPage from './pages/master-data/GoodsTypes/GoodsTypeFormPage';
import GoodsTypeDetailPage from './pages/master-data/GoodsTypes/GoodsTypeDetailPage';

import GoodsModelsListPage from './pages/master-data/GoodsModels/GoodsModelsListPage';
import GoodsModelFormPage from './pages/master-data/GoodsModels/GoodsModelFormPage';
import GoodsModelDetailPage from './pages/master-data/GoodsModels/GoodsModelDetailPage';

import OnhandListPage from './pages/operations/Onhand/OnhandListPage';
import OnhandDetailPage from './pages/operations/Onhand/OnhandDetailPage';

import GRListPage from './pages/operations/GoodsReceipts/GRListPage';
import GRCreatePage from './pages/operations/GoodsReceipts/GRCreatePage';
import GRViewPage from './pages/operations/GoodsReceipts/GRViewPage';

import GIListPage from './pages/operations/GoodsIssues/GIListPage';
import GICreatePage from './pages/operations/GoodsIssues/GICreatePage';
import GIViewPage from './pages/operations/GoodsIssues/GIViewPage';

import GTListPage from './pages/operations/GoodsTransfers/GTListPage';
import GTCreatePage from './pages/operations/GoodsTransfers/GTCreatePage';
import GTViewPage from './pages/operations/GoodsTransfers/GTViewPage';

import ICListPage from './pages/operations/InventoryCounts/ICListPage';
import ICCreatePage from './pages/operations/InventoryCounts/ICCreatePage';
import ICViewPage from './pages/operations/InventoryCounts/ICViewPage';

import PutawayListPage from './pages/operations/Putaway/PutawayListPage';
import PutawayCreatePage from './pages/operations/Putaway/PutawayCreatePage';

import ReportsPage from './pages/reports/ReportsPage';
import UserListPage from './pages/settings/UserListPage';
import UserFormPage from './pages/settings/UserFormPage';
import RolesListPage from './pages/settings/RolesListPage';
import RoleFormPage from './pages/settings/RoleFormPage';
import PermissionMatrixPage from './pages/settings/PermissionMatrixPage';
import ProfilePage from './pages/settings/ProfilePage';
import LotsSerialsListPage from './pages/settings/LotsSerialsListPage';


import DbSchemaPage from './pages/dev/DbSchemaPage';
import SupabaseMcpPage from './pages/dev/SupabaseMcpPage';


// This component provides the main layout (sidebar, topbar) for all protected pages.
const ProtectedLayout: React.FC = () => {
    const { signOut } = useAuthStore();
    return (
        <AppLayout onLogout={signOut}>
            <Outlet />
        </AppLayout>
    );
};

// This component acts as a guard for the protected routes.
const ProtectedRoutesGuard: React.FC = () => {
    const session = useAuthStore((state) => state.session);
    return session ? <ProtectedLayout /> : <Navigate to="/login" />;
};
  
const App: React.FC = () => {
    const session = useAuthStore((state) => state.session);
    const loading = useAuthStore((state) => state.loading);
  
    if (loading) {
      return (
        <div className="flex justify-center items-center h-screen">
          <Spin size="large" />
        </div>
      );
    }
  
    return (
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#5664d2',
            borderRadius: 6,
          },
          components: {
            Button: {
              controlHeight: 40,
            },
            Input: {
              controlHeight: 40,
            },
            Select: {
              controlHeight: 40,
            },
            Card: {
              headerBg: 'white',
              paddingLG: 24,
            }
          },
        }}
      >
        <AntdApp>
          <HashRouter>
            <Routes>
                <Route path="/login" element={session ? <Navigate to="/dashboard" /> : <LoginPage />} />
                <Route path="/access-denied" element={<AccessDeniedPage />} />

                <Route element={<ProtectedRoutesGuard />}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    

                    {/* Operations */}
                    <Route path="/operations/onhand" element={<OnhandListPage />} />
                    <Route path="/operations/onhand/:warehouseId/:goodsModelId" element={<OnhandDetailPage />} />
                    <Route path="/operations/gr" element={<GRListPage />} />
                    <Route path="/operations/gr/create" element={<GRCreatePage />} />
                    <Route path="/operations/gr/:id" element={<GRViewPage />} />
                    <Route path="/operations/gi" element={<GIListPage />} />
                    <Route path="/operations/gi/create" element={<GICreatePage />} />
                    <Route path="/operations/gi/:id" element={<GIViewPage />} />
                    <Route path="/operations/gt" element={<GTListPage />} />
                    <Route path="/operations/gt/create" element={<GTCreatePage />} />
                    <Route path="/operations/gt/:id" element={<GTViewPage />} />
                    <Route path="/operations/ic" element={<ICListPage />} />
                    <Route path="/operations/ic/create" element={<ICCreatePage />} />
                    <Route path="/operations/ic/:id" element={<ICViewPage />} />
                    <Route path="/operations/pa" element={<PutawayListPage />} />
                    <Route path="/operations/pa/create" element={<PutawayCreatePage />} />

                    {/* Master Data */}
                    <Route path="/master-data/organizations" element={<RouteGuard module="navigation" action="viewMasterData"><OrganizationsListPage /></RouteGuard>} />
                    <Route path="/master-data/organizations/create" element={<RouteGuard module="masterData" action="create"><OrganizationFormPage /></RouteGuard>} />
                    <Route path="/master-data/organizations/:id" element={<RouteGuard module="navigation" action="viewMasterData"><OrganizationDetailPage /></RouteGuard>} />
                    <Route path="/master-data/organizations/:id/edit" element={<RouteGuard module="masterData" action="edit"><OrganizationFormPage /></RouteGuard>} />
                    
                    <Route path="/master-data/branches" element={<RouteGuard module="navigation" action="viewMasterData"><BranchesListPage /></RouteGuard>} />
                    <Route path="/master-data/branches/create" element={<RouteGuard module="masterData" action="create"><BranchFormPage /></RouteGuard>} />
                    <Route path="/master-data/branches/:id" element={<RouteGuard module="navigation" action="viewMasterData"><BranchDetailPage /></RouteGuard>} />
                    <Route path="/master-data/branches/:id/edit" element={<RouteGuard module="masterData" action="edit"><BranchFormPage /></RouteGuard>} />
                    
                    <Route path="/master-data/warehouses" element={<RouteGuard module="navigation" action="viewMasterData"><WarehousesListPage /></RouteGuard>} />
                    <Route path="/master-data/warehouses/create" element={<RouteGuard module="masterData" action="create"><WarehouseFormPage /></RouteGuard>} />
                    <Route path="/master-data/warehouses/:id" element={<RouteGuard module="navigation" action="viewMasterData"><WarehouseDetailPage /></RouteGuard>} />
                    <Route path="/master-data/warehouses/:id/edit" element={<RouteGuard module="masterData" action="edit"><WarehouseFormPage /></RouteGuard>} />
                    
                    <Route path="/master-data/locations" element={<RouteGuard module="navigation" action="viewMasterData"><LocationsListPage /></RouteGuard>} />
                    <Route path="/master-data/locations/create" element={<RouteGuard module="masterData" action="create"><LocationFormPage /></RouteGuard>} />
                    <Route path="/master-data/locations/:id" element={<RouteGuard module="navigation" action="viewMasterData"><LocationDetailPage /></RouteGuard>} />
                    <Route path="/master-data/locations/:id/edit" element={<RouteGuard module="masterData" action="edit"><LocationFormPage /></RouteGuard>} />
                    
                    <Route path="/master-data/partners" element={<RouteGuard module="navigation" action="viewMasterData"><PartnersListPage /></RouteGuard>} />
                    <Route path="/master-data/partners/create" element={<RouteGuard module="masterData" action="create"><PartnerFormPage /></RouteGuard>} />
                    <Route path="/master-data/partners/:id" element={<RouteGuard module="navigation" action="viewMasterData"><PartnerDetailPage /></RouteGuard>} />
                    <Route path="/master-data/partners/:id/edit" element={<RouteGuard module="masterData" action="edit"><PartnerFormPage /></RouteGuard>} />
                    
                    {/* Product Data */}
                    <Route path="/product/uom-categories" element={<RouteGuard module="navigation" action="viewProduct"><UomCategoriesListPage /></RouteGuard>} />
                    <Route path="/product/uom-categories/create" element={<RouteGuard module="masterData" action="create"><UomCategoryFormPage /></RouteGuard>} />
                    <Route path="/product/uom-categories/:id" element={<RouteGuard module="navigation" action="viewProduct"><UomCategoryDetailPage /></RouteGuard>} />
                    <Route path="/product/uom-categories/:id/edit" element={<RouteGuard module="masterData" action="edit"><UomCategoryFormPage /></RouteGuard>} />
                    
                    <Route path="/product/uoms" element={<RouteGuard module="navigation" action="viewProduct"><UomsListPage /></RouteGuard>} />
                    <Route path="/product/uoms/create" element={<RouteGuard module="masterData" action="create"><UomFormPage /></RouteGuard>} />
                    <Route path="/product/uoms/:id" element={<RouteGuard module="navigation" action="viewProduct"><UomDetailPage /></RouteGuard>} />
                    <Route path="/product/uoms/:id/edit" element={<RouteGuard module="masterData" action="edit"><UomFormPage /></RouteGuard>} />
                    
                    <Route path="/product/goods-types" element={<RouteGuard module="navigation" action="viewProduct"><GoodsTypesListPage /></RouteGuard>} />
                    <Route path="/product/goods-types/create" element={<RouteGuard module="masterData" action="create"><GoodsTypeFormPage /></RouteGuard>} />
                    <Route path="/product/goods-types/:id" element={<RouteGuard module="navigation" action="viewProduct"><GoodsTypeDetailPage /></RouteGuard>} />
                    <Route path="/product/goods-types/:id/edit" element={<RouteGuard module="masterData" action="edit"><GoodsTypeFormPage /></RouteGuard>} />
                   
                    <Route path="/product/goods-models" element={<RouteGuard module="navigation" action="viewProduct"><GoodsModelsListPage /></RouteGuard>} />
                    <Route path="/product/goods-models/create" element={<RouteGuard module="masterData" action="create"><GoodsModelFormPage /></RouteGuard>} />
                    <Route path="/product/goods-models/:id" element={<RouteGuard module="navigation" action="viewProduct"><GoodsModelDetailPage /></RouteGuard>} />
                    <Route path="/product/goods-models/:id/edit" element={<RouteGuard module="masterData" action="edit"><GoodsModelFormPage /></RouteGuard>} />

                    {/* Other */}
                    <Route path="/reports" element={<RouteGuard module="navigation" action="viewReports"><ReportsPage /></RouteGuard>} />
                    
                    <Route path="/settings" element={<Navigate to="/settings/users" replace />} />
                    <Route path="/settings/users" element={<RouteGuard module="navigation" action="viewSettings"><UserListPage /></RouteGuard>} />
                    <Route path="/settings/users/create" element={<RouteGuard module="settings" action="manageUsers"><UserFormPage /></RouteGuard>} />
                    <Route path="/settings/users/:id/edit" element={<RouteGuard module="settings" action="manageUsers"><UserFormPage /></RouteGuard>} />
                    <Route path="/settings/roles" element={<RouteGuard module="navigation" action="viewSettings"><RolesListPage /></RouteGuard>} />
                    <Route path="/settings/roles/:id/permissions" element={<RouteGuard module="settings" action="manageUsers"><RoleFormPage /></RouteGuard>} />
                    <Route path="/settings/lots-serials" element={<RouteGuard module="navigation" action="viewSettings"><LotsSerialsListPage /></RouteGuard>} />

                    
                    <Route path="/dev/db-schema" element={<RouteGuard module="navigation" action="viewDeveloper"><DbSchemaPage /></RouteGuard>} />
                    <Route path="/dev/supabase-mcp" element={<RouteGuard module="navigation" action="viewDeveloper"><SupabaseMcpPage /></RouteGuard>} />
                    
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>
            </Routes>
          </HashRouter>
        </AntdApp>
      </ConfigProvider>
    );
};
  
export default App;