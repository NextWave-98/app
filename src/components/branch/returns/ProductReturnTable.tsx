import { FileText, Eye, CheckCircle, XCircle, Clock, Package, User, Smartphone } from 'lucide-react';
import { useState } from 'react';
import Pagination from '../../common/Pagination';
import type { ProductReturn } from '../../../hooks/useProductReturn';
import { formatDateTime } from '../../../utils/dateUtils';
import { formatCurrency } from '../../../utils/currency';

interface ProductReturnTableProps {
  returns: ProductReturn[];
  onView?: (returnItem: ProductReturn) => void;
  onInspect?: (returnItem: ProductReturn) => void;
  onApprove?: (returnItem: ProductReturn) => void;
  onReject?: (returnItem: ProductReturn) => void;
  onProcess?: (returnItem: ProductReturn) => void;
  // Server-side pagination props (optional)
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  isAdmin?: boolean;
}

export default function ProductReturnTable({
  returns,
  onView,
  onInspect,
  onApprove,
  onReject,
  onProcess,
  pagination,
  onPageChange,
  onLimitChange,
  isAdmin,
}: ProductReturnTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());



  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      RECEIVED: 'bg-blue-100 text-blue-800 border-blue-200',
      INSPECTING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      PENDING_APPROVAL: 'bg-orange-100 text-orange-800 border-orange-200',
      APPROVED: 'bg-green-100 text-green-800 border-green-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200',
      PROCESSING: 'bg-purple-100 text-purple-800 border-purple-200',
      COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
      REPLACEMENT_SENT: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      CUSTOMER_RETURN: 'bg-blue-100 text-blue-800',
      WARRANTY_RETURN: 'bg-green-100 text-green-800',
      DEFECTIVE: 'bg-red-100 text-red-800',
      EXCESS_STOCK: 'bg-yellow-100 text-yellow-800',
      QUALITY_FAILURE: 'bg-orange-100 text-orange-800',
      DAMAGED: 'bg-red-100 text-red-800',
      INTERNAL_TRANSFER: 'bg-purple-100 text-purple-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getSourceTypeIcon = (sourceType: string) => {
    const icons: Record<string, any> = {
      SALE: <Package className="w-4 h-4" />,
      WARRANTY_CLAIM: <CheckCircle className="w-4 h-4" />,
      JOB_SHEET: <FileText className="w-4 h-4" />,
      STOCK_CHECK: <Package className="w-4 h-4" />,
      DIRECT: <User className="w-4 h-4" />,
      GOODS_RECEIPT: <Package className="w-4 h-4" />,
    };
    return icons[sourceType] || <Package className="w-4 h-4" />;
  };

  const canInspect = (returnItem: ProductReturn) => {
    return ['RECEIVED', 'INSPECTING'].includes(returnItem.status);
  };

  const canApprove = (returnItem: ProductReturn) => {
    return ['PENDING_APPROVAL', 'INSPECTING'].includes(returnItem.status);
  };

  const canReject = (returnItem: ProductReturn) => {
    return ['RECEIVED', 'INSPECTING', 'PENDING_APPROVAL'].includes(returnItem.status);
  };

  const canProcess = (returnItem: ProductReturn) => {
    return returnItem.status === 'APPROVED';
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(returns.map(r => r.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (returnId: string, checked: boolean) => {
    const newSelectedRows = new Set(selectedRows);
    if (checked) {
      newSelectedRows.add(returnId);
    } else {
      newSelectedRows.delete(returnId);
    }
    setSelectedRows(newSelectedRows);
  };

  const getSelectedReturns = () => {
    return returns.filter(r => selectedRows.has(r.id));
  };

  const clearSelection = () => {
    setSelectedRows(new Set());
  };

  const selectedReturns = getSelectedReturns();
  const hasSelection = selectedRows.size > 0;
  const isAllSelected = returns.length > 0 && selectedRows.size === returns.length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
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
                    onView(selectedReturns[0]);
                    clearSelection();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
              )}
              {selectedRows.size === 1 && onInspect && canInspect(selectedReturns[0]) && (
                <button
                  onClick={() => {
                    onInspect(selectedReturns[0]);
                    clearSelection();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Clock className="w-4 h-4" />
                  Inspect
                </button>
              )}
              {selectedRows.size === 1 && onApprove && canApprove(selectedReturns[0]) && isAdmin && (
                <button
                  onClick={() => {
                    onApprove(selectedReturns[0]);
                    clearSelection();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
              )}
              {selectedRows.size === 1 && onReject && canReject(selectedReturns[0]) && isAdmin && (
                <button
                  onClick={() => {
                    onReject(selectedReturns[0]);
                    clearSelection();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              )}
              {selectedRows.size === 1 && onProcess && canProcess(selectedReturns[0]) && (
                <button
                  onClick={() => {
                    onProcess(selectedReturns[0]);
                    clearSelection();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  <Package className="w-4 h-4" />
                  Process
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
                Return Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {returns.map((returnItem) => (
              <tr key={returnItem.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(returnItem.id)}
                    onChange={(e) => handleSelectRow(returnItem.id, e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {returnItem.returnNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {returnItem.returnReason}
                      </div>
                      <div className="flex items-center mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(returnItem.returnCategory)}`}>
                          {returnItem.returnCategory.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Smartphone className="w-8 h-8 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {returnItem.productName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {returnItem.productCode}
                      </div>
                      {returnItem.productSerialNumber && (
                        <div className="text-xs text-gray-400">
                          SN: {returnItem.productSerialNumber}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {returnItem.customerName || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {returnItem.customerPhone || ''}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getSourceTypeIcon(returnItem.sourceType)}
                    <span className="ml-2 text-sm text-gray-900">
                      {returnItem.sourceType.replace('_', ' ')}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(returnItem.status)}`}>
                    {returnItem.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>{formatCurrency(returnItem.productValue)}</div>
                  {returnItem.refundAmount && (
                    <div className="text-xs text-gray-500">
                      Refund: {formatCurrency(returnItem.refundAmount)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDateTime(returnItem.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="px-6 py-4 border-t border-gray-200">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={onPageChange!}
            onItemsPerPageChange={onLimitChange!}
          />
        </div>
      )}
    </div>
  );
}