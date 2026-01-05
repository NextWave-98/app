import type { Inventory } from '../../../types/inventory.types';
import { useState } from 'react';
import Pagination from '../../common/Pagination';

interface ProductsTableProps {
  items: Inventory[];
  selectedProducts: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  // Server-side pagination props (optional)
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export default function ProductsTable({ 
  items, 
  selectedProducts, 
  onSelectionChange,
  pagination,
  onPageChange,
  onLimitChange
}: ProductsTableProps) {
  const formatCurrency = (amount: number) => {
    return `USD ${amount.toLocaleString('en-US')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800';
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800';
      case 'overstocked':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'In Stock';
      case 'low_stock':
        return 'Low Stock';
      case 'out_of_stock':
        return 'Out of Stock';
      case 'overstocked':
        return 'Overstocked';
      default:
        return status;
    }
  };

  // Checkbox handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = items.map(item => item.id);
      onSelectionChange(allIds);
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      onSelectionChange(selectedProducts.filter(id => id !== productId));
    } else {
      onSelectionChange([...selectedProducts, productId]);
    }
  };

  const isAllSelected = items.length > 0 && items.every(item => selectedProducts.includes(item.id));
  const isIndeterminate = items.some(item => selectedProducts.includes(item.id)) && !isAllSelected;

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
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
              <th className="px-4 py-3 text-left w-12">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) {
                      el.indeterminate = isIndeterminate;
                    }
                  }}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2 cursor-pointer"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Product Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Category
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                Quantity
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                Unit Price
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {items.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(item.id)}
                    onChange={() => handleSelectProduct(item.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2 cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-700">{item.productCode}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    {item.category}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-gray-900">{item.quantity}</div>
                    <div className="text-xs text-gray-500">
                      {item.minStockLevel} - {item.maxStockLevel}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(item.unitPrice)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <span
                      className={`px-2.5 py-1 inline-flex text-xs font-medium rounded ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {getStatusText(item.status)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pagination && onPageChange && onLimitChange && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          itemsPerPage={pagination.limit}
          totalItems={pagination.total}
          onPageChange={onPageChange}
          onItemsPerPageChange={onLimitChange}
        />
      )}
    </div>
  );
}
