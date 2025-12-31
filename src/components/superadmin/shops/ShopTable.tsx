import type { Shop, BranchResponse } from '../../../types/shop.types';
import type { Location } from '../../../types/location.types';
import ShopStatusBadge from './ShopStatusBadge';
import { MapPin, Phone, Edit, Trash2, MoreVertical, ChevronDown, ChevronRight, Users, Eye } from 'lucide-react';
import { useState } from 'react';
import Pagination from '../../common/Pagination';

type ShopOrLocation = Shop | Location;

interface ShopTableProps {
  shops: ShopOrLocation[];
  onEdit?: (shop: ShopOrLocation) => void;
  onDelete?: (shop: ShopOrLocation) => void;
  onView?: (shop: ShopOrLocation) => void;
  // Server-side pagination props (optional)
  pagination?: BranchResponse['pagination'];
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  // Selection props
  selectable?: boolean;
  selectedShops?: ShopOrLocation[];
  onSelectionChange?: (shops: ShopOrLocation[]) => void;
}

// Helper to get code from Shop or Location
const getShopCode = (shop: ShopOrLocation): string => {
  return 'locationCode' in shop ? shop.locationCode : shop.code;
};

export default function ShopTable({ shops, onEdit, onDelete, onView, pagination, onPageChange, onLimitChange, selectable = false, selectedShops = [], onSelectionChange }: ShopTableProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Decide whether to use server-side pagination
  const useServerPagination = Boolean(pagination && onPageChange && onLimitChange);

  // Calculate pagination
  const totalItems = useServerPagination ? pagination!.total : shops.length;
  const totalPages = useServerPagination ? Math.max(1, pagination!.totalPages) : Math.ceil(totalItems / itemsPerPage);
  const serverPage = useServerPagination ? pagination!.page : currentPage;
  const serverLimit = useServerPagination ? pagination!.limit : itemsPerPage;
  const startIndex = (serverPage - 1) * serverLimit;
  const endIndex = startIndex + (useServerPagination ? shops.length : serverLimit);
  const paginatedShops = useServerPagination ? shops : shops.slice(startIndex, endIndex);

  // Reset to page 1 when items per page changes
  const handleItemsPerPageChange = (value: number) => {
    if (useServerPagination) {
      onLimitChange?.(value);
      // server resets page to 1 in parent
      return;
    }

    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const toggleMenu = (shopId: string) => {
    setActiveMenu(activeMenu === shopId ? null : shopId);
  };

  const toggleExpanded = (shopId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(shopId)) {
      newExpanded.delete(shopId);
    } else {
      newExpanded.add(shopId);
    }
    setExpandedRows(newExpanded);
  };

  const isSelected = (shop: ShopOrLocation) => {
    return selectedShops.some(selected => selected.id === shop.id);
  };

  const handleSelectShop = (shop: ShopOrLocation) => {
    if (!onSelectionChange) return;

    if (isSelected(shop)) {
      onSelectionChange(selectedShops.filter(selected => selected.id !== shop.id));
    } else {
      onSelectionChange([...selectedShops, shop]);
    }
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;

    if (selectedShops.length === paginatedShops.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(paginatedShops);
    }
  };

  if (shops.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-gray-400 mb-4">
          <MapPin className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No shops found</h3>
        <p className="text-gray-600">Try adjusting your filters or search query</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {selectable && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedShops.length === paginatedShops.length && paginatedShops.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expand
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Branch Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Users
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedShops.map((shop) => {
              const isExpanded = expandedRows.has(shop.id);
              const users = (shop as Location).users || [];
              
              return (
                <>
                  <tr
                    key={shop.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {selectable && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected(shop)}
                          onChange={() => handleSelectShop(shop)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleExpanded(shop.id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{shop.name}</div>
                          <div className="text-sm text-gray-500">{getShopCode(shop)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{shop.address || 'N/A'}</div>
                      <div className="flex flex-col gap-1 mt-1">
                        {shop.phone && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {shop.phone}
                          </div>
                        )}
                        {!shop.phone && (
                          <div className="text-sm text-gray-500">N/A</div>
                        )}
                      </div>
                      {shop.email && (
                        <div className="text-sm text-gray-500 mt-1">{shop.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ShopStatusBadge status={shop.isActive} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900 font-medium">{users.length}</div>
                        <div className="text-sm text-gray-500 ml-1">users</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(shop.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(shop.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                  </tr>
                  
                  {isExpanded && users.length > 0 && (
                    <tr>
                      <td colSpan={selectable ? 7 : 6} className="px-6 py-4 bg-gray-50">
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
                            <h4 className="text-sm font-medium text-gray-900 flex items-center">
                              <Users className="w-4 h-4 mr-2" />
                              Assigned Users ({users.length})
                            </h4>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Login
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((user) => (
                                  <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">
                                        {user.name || 'N/A'}
                                      </div>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                      <div className="text-sm text-gray-500">
                                        {user.email || 'N/A'}
                                      </div>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">
                                        {user.role?.name || 'N/A'}
                                      </div>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        user.isActive
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {user.isActive ? 'Active' : 'Inactive'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                      <div className="text-sm text-gray-500">
                                        {user.lastLogin
                                          ? new Date(user.lastLogin).toLocaleDateString()
                                          : 'Never'
                                        }
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  
                  {isExpanded && users.length === 0 && (
                    <tr>
                      <td colSpan={selectable ? 7 : 6} className="px-6 py-4 bg-gray-50">
                        <div className="text-center py-8 text-gray-500">
                          <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">No users assigned to this location</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={useServerPagination ? serverPage : currentPage}
        totalPages={totalPages}
        itemsPerPage={useServerPagination ? serverLimit : itemsPerPage}
        totalItems={totalItems}
        onPageChange={(page) => {
          if (useServerPagination) onPageChange?.(page);
          else setCurrentPage(page);
        }}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
    </div>
  );
}
