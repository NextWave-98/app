import { Routes, Route, Navigate } from 'react-router-dom';
import SuperadminLayout from '../layouts/superadmin/SuperadminLayout';
import DashboardPage from '../pages/superadmin/DashboardPage';
import HomePage from '../pages/home/HomePage';
import MainLayout from '../layouts/main/MainLayout';
import ShopPage from '../pages/superadmin/ShopPage';
import StaffPage from '../pages/superadmin/StaffPage';
import StockPage from '../pages/superadmin/StockPage';
import CategoriesPage from '../pages/superadmin/CategoriesPage';
import SalesPage from '../pages/superadmin/SalesPage';
import JobSheetsPage from '../pages/superadmin/JobSheetsPage';
import InventoryPage from '../pages/superadmin/InventoryPage';
import CustomersPage from '../pages/superadmin/CustomersPage';
import WarrantyPage from '../components/superadmin/warranty/WarrantyPage';
import SuppliersPage from '../pages/superadmin/SuppliersPage';
import GoodsReceiptsPage from '../pages/superadmin/GoodsReceiptsPage';
import StockTransfersPage from '../pages/superadmin/StockTransfersPage';
import ReportsPage from '../pages/superadmin/ReportsPage';
import AddonRequestsPage from '../pages/admin/AddonRequestsPage';
// import NotificationsPage from '../pages/superadmin/NotificationsPage';
import StockDashboardPage from '../pages/superadmin/StockDashboardPage';
import PaymentsPage from '../pages/superadmin/PaymentsPage';
import ReturnsPage from '../pages/superadmin/ReturnsPage';
import NotificationSettings from '../components/superadmin/notifications/NotificationSettings';
import NotificationDashboard from '../components/superadmin/notifications/NotificationDashboard';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '../pages/auth/LoginPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import { ROLES } from '../constants/roles';
import BranchLayout from '../layouts/branch/BranchLayout';
import BranchDashboardPage from '../pages/branch/BranchDashboardPage';
import POSPage from '../pages/branch/POSPage';
import ProductsPage from '../pages/branch/ProductsPage';
import BranchAddonRequestsPage from '../pages/branch/AddonRequestsPage';
import BranchCustomersPage from '../pages/branch/CustomersPage';
import BranchSalesPage from '../pages/branch/BranchSalesPage';
import BranchJobSheetsPage from '../pages/branch/JobSheetsPage';
import BranchReturnsPage from '../pages/branch/ReturnsPage';
import BranchWarrantyPage from '../pages/branch/BranchWarrantyPage';
import ProfilePage from '../pages/superadmin/ProfilePage';




const AppRouter = () => (
  <Routes>

      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
      </Route>

      {/* Auth Routes */}
      <Route path="/ditech/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Super Admin Routes - Protected (Only Super Admins can access) */}
      <Route
        path="/superadmin"
        element={
          <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <SuperadminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/superadmin/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="shops/management" element={<ShopPage />} />
        <Route path="staff/management" element={<StaffPage />} />
        <Route path="stock/management" element={<StockPage />} />
        <Route path="stock/dashboard" element={<StockDashboardPage />} />
        <Route path="categories/management" element={<CategoriesPage />} />
        <Route path="sales/monitor" element={<SalesPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="job-sheets/monitor" element={<JobSheetsPage />} />
        <Route path="payments/management" element={<PaymentsPage />} />
        <Route path="inventory/monitor" element={<InventoryPage />} />
        <Route path="customers/management" element={<CustomersPage />} />
        <Route path="warranty/management" element={<WarrantyPage />} />
        <Route path="suppliers/management" element={<SuppliersPage />} />
        <Route path="goods-receipts" element={<GoodsReceiptsPage />} />
        <Route path="addon-requests" element={<AddonRequestsPage />} />
        <Route path="transfers" element={<StockTransfersPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="returns" element={<ReturnsPage />} />
        <Route path="notifications/dashboard" element={<NotificationDashboard />} />
        <Route path="notifications/settings" element={<NotificationSettings />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200"><h2 className="text-2xl font-bold text-gray-900">Settings - Coming Soon</h2></div>} />
      </Route>

      {/* Branch Routes - Protected (Branch Managers) */}
      <Route
        path="/:branchCode/system"
        element={
          <ProtectedRoute allowedRoles={[ROLES.MANAGER,ROLES.SUPER_ADMIN]}>
            <BranchLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<BranchDashboardPage />} />
        <Route path="pos" element={<POSPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="addon-requests" element={<BranchAddonRequestsPage />} />
        <Route path="sales" element={<BranchSalesPage />} />
        <Route path="customers" element={<BranchCustomersPage />} />
        <Route path="jobsheets" element={<BranchJobSheetsPage />} />
        <Route path="returns" element={<BranchReturnsPage />} />
        <Route path="warranty" element={<BranchWarrantyPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200"><h2 className="text-2xl font-bold text-gray-900">Settings - Coming Soon</h2></div>} />
      </Route>

    </Routes>
);

export default AppRouter;