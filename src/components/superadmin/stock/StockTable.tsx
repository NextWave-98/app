import { Package, Edit, Trash2, MoreVertical, Eye } from 'lucide-react';
import { useState } from 'react';
import type { ProductItem } from '../../../hooks/useProduct';
import Pagination from '../../common/Pagination';

interface StockTableProps {
  items: ProductItem[];
  onEdit?: (item: ProductItem) => void;
  onDelete?: (item: ProductItem) => void;
  onView?: (item: ProductItem) => void;
  onRestock?: (item: ProductItem) => void;
  // Controlled pagination props
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

export default function StockTable({ items, onEdit, onDelete, onView, onRestock, currentPage, itemsPerPage, totalItems, totalPages, onPageChange, onItemsPerPageChange }: StockTableProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const formatCurrency = (amount: number) => {
    console.log('Formatting amount:', amount);
    return `USD ${amount}`;
  };

  const toggleMenu = (itemId: string) => {
    setActiveMenu(activeMenu === itemId ? null : itemId);
  };
  
  const getStatus = (item: ProductItem) => {
    if (item.isDiscontinued) return 'discontinued';
    if (!item.isActive) return 'inactive';
    return 'active';
  };
  
  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      discontinued: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles] || styles.active}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(items.map(item => item.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (itemId: string, checked: boolean) => {
    const newSelectedRows = new Set(selectedRows);
    if (checked) {
      newSelectedRows.add(itemId);
    } else {
      newSelectedRows.delete(itemId);
    }
    setSelectedRows(newSelectedRows);
  };

  const getSelectedItems = () => {
    return items.filter(item => selectedRows.has(item.id));
  };

  const clearSelection = () => {
    setSelectedRows(new Set());
  };

  // Controlled: parent provides paginated items
  const currentItems = items;

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-gray-400 mb-4">
          <Package className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No stock items found</h3>
        <p className="text-gray-600">Try adjusting your filters or search query</p>
      </div>
    );
  }

  const selectedItems = getSelectedItems();
  const hasSelection = selectedRows.size > 0;
  const isAllSelected = items.length > 0 && selectedRows.size === items.length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Action Menu - Shows when rows are selected */}
      {hasSelection && (
        <div className="bg-orange-50 border-b border-orange-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-orange-900">
                {selectedRows.size} {selectedRows.size === 1 ? 'item' : 'items'} selected
              </span>
              <button
                onClick={clearSelection}
                className="text-sm text-orange-600 hover:text-orange-800 font-medium"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center gap-2">
              {selectedRows.size === 1 && onView && (
                <button
                  onClick={() => {
                    onView(selectedItems[0]);
                    clearSelection();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
              )}
              {selectedRows.size === 1 && onEdit && (
                <button
                  onClick={() => {
                    onEdit(selectedItems[0]);
                    clearSelection();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    selectedItems.forEach(item => onDelete(item));
                    clearSelection();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete {selectedRows.size === 1 ? 'Item' : 'Items'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock Levels
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pricing
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              {/* <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th> */}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                // onClick={() => onView?.(item)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(item.id)}
                    onChange={(e) => handleSelectRow(item.id, e.target.checked)}
                    className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.sku}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {item.brand} {item.model && `- ${item.model}`}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.category?.name || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    <div className="text-gray-900">Min: {item.minStockLevel}</div>
                    <div className="text-gray-900">Max: {item.maxStockLevel}</div>
                    <div className="text-orange-600 text-xs">Reorder: {item.reorderLevel}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    <div className="text-gray-900">Cost: {formatCurrency(item.costPrice)}</div>
                    <div className="font-semibold text-green-600">Unit: {formatCurrency(item.unitPrice)}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(getStatus(item))}
                </td>
                {/* <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMenu(item.id);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100 cursor-pointer"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {activeMenu === item.id && (
                    <div className="absolute right-0 mt-2 mr-2 w-48 rounded-md shadow-lg bg-white z-10">
                      <div className="py-1">
                        {onRestock && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRestock(item);
                              setActiveMenu(null);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-orange-600 hover:bg-orange-50"
                          >
                            <Package className="w-4 h-4 mr-2" />
                            Restock Item
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.(item);
                            setActiveMenu(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Item
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete?.(item);
                            setActiveMenu(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Item
                        </button>
                      </div>
                    </div>
                  )}
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        onPageChange={onPageChange}
        onItemsPerPageChange={(v) => onItemsPerPageChange(v)}
      />
    </div>
  );
}
