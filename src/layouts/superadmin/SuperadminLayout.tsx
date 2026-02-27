import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';


export default function SuperadminLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();

  // Function to get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;

    if (path === '/superadmin' || path === '/superadmin/') {
      return 'Dashboard Overview';
    } else if (path.startsWith('/superadmin/shops')) {
      return 'Shops Management';
    } else if (path.startsWith('/superadmin/staff')) {
      return 'Staff Management';
    } else if (path.startsWith('/superadmin/stock')) {
      return 'Stock Management';
    } else if (path.startsWith('/superadmin/transfers')) {
      return 'Stock Transfers';
    } else if (path.startsWith('/superadmin/sales')) {
      return 'Sales Monitor';
    } else if (path.startsWith('/superadmin/jobsheets')) {
      return 'Job Sheets Monitor';
    } else if (path.startsWith('/superadmin/inventory')) {
      return 'Inventory Monitor';
    } else if (path.startsWith('/superadmin/notifications/dashboard')) {
      return 'Notification Dashboard';
    } else if (path.startsWith('/superadmin/notifications/settings')) {
      return 'Notification Settings';
    } else if (path.startsWith('/superadmin/notifications')) {
      return 'Notifications';
    } else if (path.startsWith('/superadmin/settings')) {
      return 'Settings';
    }

    return 'Super Admin Panel';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={setIsSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className={`transition-all duration-300 w-full flex-1 flex flex-col ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}>
        {/* Top Navigation Bar */}
        <TopNavbar
          title={getPageTitle()}
          isSidebarCollapsed={isSidebarCollapsed}
          onMobileMenuClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* Page Content */}
        <main className="pt-20 px-4 pb-8 min-h-screen overflow-x-hidden">
          <div className="container mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
    </div>
  );
}