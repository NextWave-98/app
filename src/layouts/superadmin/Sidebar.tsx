/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  Users,
  Package,
  PackageCheck,
  DollarSign,
  FileText,
  Warehouse,
  Activity,
  PanelRightOpen,
  PanelRightClose,
  ChevronDown,
  Contact,
  BaggageClaim,
  FileCog,
  Bell,
  Shield,
  FolderTree,
  PackagePlus,
  Truck
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<any>;
  badge?: number;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/superadmin/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'shops',
    label: 'Shops Management',
    path: '/superadmin/shops/management',
    icon: Store,
  },
  {
    id: 'staff',
    label: 'Staff Management',
    path: '/superadmin/staff/management',
    icon: Users,
  },
  {
    id: 'suppliers',
    label: 'Supplier Management',
    path: '/superadmin/suppliers/management',
    icon: BaggageClaim,
  },
  {
    id: 'goods-receipts',
    label: 'Goods Receipts (GRN)',
    path: '/superadmin/goods-receipts',
    icon: PackageCheck,
  },
  {
    id: 'addon-requests',
    label: 'Addon Requests',
    path: '/superadmin/addon-requests',
    icon: PackagePlus,
  },
  {
    id: 'stock',
    label: 'Stock Management',
    path: '/superadmin/stock',
    icon: Activity,
    children: [
      {
        id: 'product',
        label: 'Product Management',
        path: '/superadmin/stock/management',
        icon: Package,
       
      },
      {
        id: 'stock-dashboard',
        label: 'Stock Dashboard',
        path: '/superadmin/stock/dashboard',
        icon: Activity,
      },
      {
        id: 'inventory',
        label: 'Inventory Monitor',
        path: '/superadmin/inventory/monitor',
        icon: Warehouse,
      },
      {
        id: 'categories',
        label: 'Categories',
        path: '/superadmin/categories/management',
        icon: FolderTree,
      },
    ],
  },
  {
    id: 'sales',
    label: 'Sales Monitor',
    path: '/superadmin/sales/monitor',
    icon: DollarSign,
  },
  {
    id: 'jobsheets',
    label: 'Job Sheets',
    path: '/superadmin/job-sheets/monitor',
    icon: FileText,
   
  },
  {
    id: 'payments',
    label: 'Payment Management',
    path: '/superadmin/payments/management',
    icon: DollarSign,
  },
  {
    id: 'customer',
    label: 'Customer Management',
    path: '/superadmin/customers/management',
    icon: Contact,
  },
  {
    id: 'warranty',
    label: 'Warranty Management',
    path: '/superadmin/warranty/management',
    icon: Shield,
  },
  {
    id: 'returns',
    label: 'Returns Management',
    path: '/superadmin/returns',
    icon: Truck,
  },
  {
    id: 'reports',
    label: 'Reports',
    path: '/superadmin/reports',
    icon: FileCog,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    path: '/superadmin/notifications/dashboard',
    icon: Bell,
  },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
}

export default function Sidebar({ isCollapsed: externalIsCollapsed, onToggleCollapse }: SidebarProps = {}) {
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);
  const location = useLocation();

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalIsCollapsed;

  const handleToggle = () => {
    const newValue = !isCollapsed;
    if (onToggleCollapse) {
      onToggleCollapse(newValue);
    } else {
      setInternalIsCollapsed(newValue);
    }
  };

  const isActiveRoute = (path: string) => {
    if (path === '/superadmin') {
      return location.pathname === '/superadmin' || location.pathname === '/superadmin/';
    }
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    // expand any parent menu if one of its children matches the current route
    const init: Record<string, boolean> = {};
    menuItems.forEach((it) => {
      if (it.children) {
        init[it.id] = it.children.some((child) => location.pathname.startsWith(child.path));
      }
    });
    setExpandedMenus(init);
  }, [location.pathname]);

  const toggleExpand = (id: string) => {
    setExpandedMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div
      className={`bg-gray-100 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-64'
        } h-screen flex flex-col fixed left-0 top-0 z-50 shadow-xl border-r border-gray-200`}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">LT Solutions</h1>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
            </div>
          )}
          <button
            onClick={handleToggle}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 text-gray-700 cursor-pointer"
          >
            {isCollapsed ? (
              <PanelRightClose className="w-5 h-5" />
            ) : (
              <PanelRightOpen className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-6 px-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isParent = !!item.children?.length;
            const isActive = isParent
              ? item.children!.some((c) => isActiveRoute(c.path))
              : isActiveRoute(item.path);

            // Parent with children (collapsible)
            if (isParent) {
              const isExpanded = !!expandedMenus[item.id];

              return (
                <div key={item.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 ${isActive ? 'bg-blue-950 text-white shadow-lg' : 'text-gray-900 hover:bg-gray-200'
                      }`}
                  >
                    <div className="flex items-center min-w-0 flex-1">
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
                      {!isCollapsed && (
                        <span className="text-sm font-medium truncate">{item.label}</span>
                      )}
                    </div>

                    {!isCollapsed && (
                      <ChevronDown className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    )}

                    {/* Collapsed Tooltip */}
                    {isCollapsed && (
                      <div className="absolute left-16 ml-2 px-3 py-2 bg-gray-700 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-gray-600">
                        {item.label}
                      </div>
                    )}
                  </button>

                  {/* Children links */}
                  {!isCollapsed && isExpanded && (
                    <div className="mt-1 space-y-1 pl-8">
                      {item.children!.map((child) => {
                        const ChildIcon = child.icon;
                        const childActive = isActiveRoute(child.path);

                        return (
                          <Link
                            key={child.id}
                            to={child.path}
                            className={`flex items-center px-3 py-2 rounded-lg transition-all duration-150 ${childActive ? 'bg-blue-800 text-white' : 'text-gray-800 hover:bg-gray-100'
                              }`}
                          >
                            <ChildIcon className="w-4 h-4 flex-shrink-0 mr-3 text-gray-600" />
                            <span className="text-sm truncate">{child.label}</span>

                            {child.badge && (
                              <span className={`ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none rounded-full ${childActive ? 'bg-white text-red-600' : 'bg-red-600 text-white'
                                }`}>
                                {child.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Regular (non-parent) item
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center px-3 py-3 rounded-lg transition-all duration-200 group relative ${isActive ? 'bg-blue-950 text-white shadow-lg' : 'text-gray-900 hover:bg-gray-200'
                  }`}
              >
                <div className="flex items-center min-w-0 flex-1">
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
                  {!isCollapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
                </div>

                {!isCollapsed && item.badge && (
                  <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full ${isActive ? 'bg-white text-red-600' : 'bg-red-600 text-white'
                    }`}>
                    {item.badge}
                  </span>
                )}

                {isCollapsed && item.badge && (
                  <div className="absolute -top-1 -right-1">
                    <span className="inline-flex items-center justify-center w-4 h-4 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  </div>
                )}

                {isCollapsed && (
                  <div className="absolute left-16 ml-2 px-3 py-2 bg-gray-700 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-gray-600">
                    {item.label}
                    {item.badge && (
                      <span className="ml-2 px-1.5 py-0.5 bg-red-600 rounded-full text-xs">{item.badge}</span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4">

        {!isCollapsed && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-800">
              <p>Lanka Tech Solutions</p>
              <p>v1.0.0</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}