import { NavLink, useParams } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  TrendingUp,
  Users,
  FileText,
  Settings,
  PanelRightClose,
  PanelRightOpen,
  Shield,
  RotateCcw,
  PackagePlus
} from 'lucide-react';
import { useState } from 'react';

const BranchSidebar = () => {
  const { branchCode } = useParams();
  const [isExpanded, setIsExpanded] = useState(true);

  const menuItems = [
    { name: 'Dashboard', path: `/${branchCode}/system/dashboard`, icon: LayoutDashboard },
    { name: 'PoS', path: `/${branchCode}/system/pos`, icon: ShoppingCart },
    { name: 'Products', path: `/${branchCode}/system/products`, icon: Package },
    { name: 'Addon Requests', path: `/${branchCode}/system/addon-requests`, icon: PackagePlus },
    { name: 'Sales', path: `/${branchCode}/system/sales`, icon: TrendingUp },
    { name: 'Customers', path: `/${branchCode}/system/customers`, icon: Users },
    { name: 'Job Sheets', path: `/${branchCode}/system/jobsheets`, icon: FileText },
    { name: 'Returns', path: `/${branchCode}/system/returns`, icon: RotateCcw },
    { name: 'Warranty', path: `/${branchCode}/system/warranty`, icon: Shield },
    // { name: 'Settings', path: `/${branchCode}/system/settings`, icon: Settings },
  ];

  return (
    <aside
      className={`${
        isExpanded ? 'w-64' : 'w-20'
      } bg-white text-gray-800 h-screen sticky top-0 transition-all duration-300 flex flex-col border-r border-gray-200 shadow-sm`}
    >
      {/* Sidebar Header */}
      <div className="p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          {isExpanded && (
            <h2 className="text-lg font-bold text-gray-800">Menu</h2>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-auto cursor-pointer text-gray-600"
            title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isExpanded ? (
              <PanelRightOpen className="w-5 h-5" />
            ) : (
              <PanelRightClose className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center ${
                      isExpanded ? 'space-x-3 px-4' : 'justify-center px-2'
                    } py-3 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? 'bg-[#1e3a8a] text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                  title={!isExpanded ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {isExpanded && (
                    <span className="font-medium">{item.name}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sidebar Footer */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <div className="text-xs text-gray-600">
            <p className="font-semibold mb-1 text-gray-800">GC Manager</p>
            <p>Branch System v1.0</p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default BranchSidebar;
