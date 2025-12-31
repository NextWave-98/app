import type { InventoryItem } from '../../../hooks/useInventory';
import InventoryStatusBadge from './InventoryStatusBadge';
import { Package, MapPin, Edit, Trash2, MoreVertical, Eye } from 'lucide-react';
import { useState } from 'react';
import Pagination from '../../common/Pagination';

interface InventoryTableProps {
  inventory: InventoryItem[];
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (item: InventoryItem) => void;
  onView?: (item: InventoryItem) => void;
  onAdjustStock?: (item: InventoryItem) => void;
  onTransferStock?: (item: InventoryItem) => void;
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

export default function InventoryTable({
  inventory,
  onEdit,
  onDelete,
  onView,
  // onAdjustStock,
  // onTransferStock,
  currentPage,
  itemsPerPage,
  totalItems,
  totalPages,
  onPageChange,
  onItemsPerPageChange,
}: InventoryTableProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return 'LKR 0';
    return `LKR ${amount.toLocaleString('en-US')}`;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const toggleMenu = (itemId: string) => {
    setActiveMenu(activeMenu === itemId ? null : itemId);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(inventory.map(item => item.id)));
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
    return inventory.filter(item => selectedRows.has(item.id));
  };

  const clearSelection = () => {
    setSelectedRows(new Set());
  };

  const getStockHealthColor = (quantity: number, minStock: number, maxStock: number) => {
    if (quantity === 0) return 'bg-red-500';
    if (quantity < minStock) return 'bg-yellow-500';
    if (quantity > maxStock) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const calculateStockPercentage = (quantity: number, maxStock: number) => {
    if (!maxStock || maxStock <= 0) return 100;
    return Math.min(100, (quantity / maxStock) * 100);
  };

  // Controlled: parent provides paginated inventory
  const currentInventory = inventory;

  if (inventory.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-gray-400 mb-4">
          <Package className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No inventory items found</h3>
        <p className="text-gray-600">Try adjusting your filters or search query</p>
      </div>
    );
  }

  const selectedItems = getSelectedItems();
  const hasSelection = selectedRows.size > 0;
  const isAllSelected = inventory.length > 0 && selectedRows.size === inventory.length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Action Menu - Shows when rows are selected */}
      {hasSelection && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedRows.size} {selectedRows.size === 1 ? 'item' : 'items'} selected
              </span>
              <button
                onClick={clearSelection}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
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
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Restocked
              </th>
              {/* <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th> */}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentInventory.map((item) => (
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
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{item.product?.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{item.product?.productCode || item.product?.sku || 'N/A'}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{item.product?.category?.name || 'N/A'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm text-gray-900">{item.location?.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{item.location?.locationCode || 'N/A'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <InventoryStatusBadge status={
                    item.quantity === 0 ? 'out_of_stock' :
                    // fallback to product reorderLevel if inventory-level value is not present
                    item.quantity <= (item.minStockLevel ?? item.product?.minStockLevel ?? 0) ? 'low_stock' :
                    item.quantity > (item.maxStockLevel ?? item.product?.maxStockLevel ?? 0) ? 'overstocked' :
                    'in_stock'
                  } />
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900">{item.quantity} units</span>
                      <span className="text-xs text-gray-500">
                        {calculateStockPercentage(item.quantity, (item.maxStockLevel ?? item.product?.maxStockLevel ?? 0)).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${getStockHealthColor(
                          item.quantity,
                          (item.minStockLevel ?? item.product?.minStockLevel ?? 0),
                          (item.maxStockLevel ?? item.product?.maxStockLevel ?? 0)
                        )}`}
                        style={{
                          width: `${calculateStockPercentage(item.quantity, (item.maxStockLevel ?? item.product?.maxStockLevel ?? 0))}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Min: {item.minStockLevel ?? item.product?.minStockLevel ?? 'N/A'} | Max: {item.maxStockLevel ?? item.product?.maxStockLevel ?? 'N/A'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(item.quantity * (Number(item.product?.unitPrice) || 0))}
                  </div>
                  <div className="text-sm text-gray-500">
                    @{formatCurrency(Number(item.product?.unitPrice) || 0)}/unit
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatDate(item.lastRestocked)}</div>
                  <div className="text-xs text-gray-500">
                    Updated: {formatDate(item.updatedAt)}
                  </div>
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
                    <div className="absolute right-0 mt-2 mr-2 w-56 rounded-md shadow-lg bg-white z-10">
                      <div className="py-1">
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
                            onAdjustStock?.(item);
                            setActiveMenu(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                        >
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Adjust Stock
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTransferStock?.(item);
                            setActiveMenu(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-purple-700 hover:bg-purple-50"
                        >
                          <TrendingDown className="w-4 h-4 mr-2" />
                          Transfer Stock
                        </button>
                        <div className="border-t border-gray-100"></div>
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
