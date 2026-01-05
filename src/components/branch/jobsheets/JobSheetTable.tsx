import { FileText, Eye, Edit, DollarSign, User, Smartphone, Download, Printer } from 'lucide-react';
import { useState } from 'react';
import Pagination from '../../common/Pagination';
import type { JobSheet } from '../../../hooks/useJobSheet';
import { formatDateTime } from '../../../utils/dateUtils';

interface JobSheetTableProps {
  jobSheets: JobSheet[];
  onView?: (jobSheet: JobSheet) => void;
  onEdit?: (jobSheet: JobSheet) => void;
  onPayment?: (jobSheet: JobSheet) => void;
  onDownloadPDF?: (jobSheet: JobSheet) => void;
  onPrintCard?: (jobSheet: JobSheet) => void;
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

export default function JobSheetTable({
  jobSheets,
  onView,
  onEdit,
  onPayment,
  pagination,
  onPageChange,
  onDownloadPDF,
  onPrintCard,
  onLimitChange
}: JobSheetTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount == null) return 'USD 0.00';
    return `USD ${amount.toLocaleString('en-US')}`;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(jobSheets.map(js => js.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (jobSheetId: string, checked: boolean) => {
    const newSelectedRows = new Set(selectedRows);
    if (checked) {
      newSelectedRows.add(jobSheetId);
    } else {
      newSelectedRows.delete(jobSheetId);
    }
    setSelectedRows(newSelectedRows);
  };

  const getSelectedJobSheets = () => {
    return jobSheets.filter(js => selectedRows.has(js.id));
  };

  const clearSelection = () => {
    setSelectedRows(new Set());
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      IN_PROGRESS: 'bg-orange-100 text-orange-800 border-orange-200',
      WAITING_FOR_PARTS: 'bg-orange-100 text-orange-800 border-orange-200',
      READY_FOR_PICKUP: 'bg-purple-100 text-purple-800 border-purple-200',
      COMPLETED: 'bg-green-100 text-green-800 border-green-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200',
      ON_HOLD: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-gray-100 text-gray-700',
      MEDIUM: 'bg-orange-100 text-orange-700',
      HIGH: 'bg-orange-100 text-orange-700',
      URGENT: 'bg-red-100 text-red-700',
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  };

  if (jobSheets.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-gray-400 mb-4">
          <FileText className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No job sheets found</h3>
        <p className="text-gray-600">Try adjusting your filters or create a new job sheet</p>
      </div>
    );
  }

  const selectedJobSheets = getSelectedJobSheets();
  const hasSelection = selectedRows.size > 0;
  const isAllSelected = jobSheets.length > 0 && selectedRows.size === jobSheets.length;

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
                    onView(selectedJobSheets[0]);
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
                    onEdit(selectedJobSheets[0]);
                    clearSelection();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}
              {selectedRows.size === 1 && onPayment && selectedJobSheets[0]?.balanceAmount > 0 && (
                <button
                  onClick={() => {
                    onPayment(selectedJobSheets[0]);
                    clearSelection();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  <DollarSign className="w-4 h-4" />
                  Add Payment
                </button>
              )}
              {selectedRows.size === 1  && onDownloadPDF && (
                <button
                  onClick={() => {
                    onDownloadPDF(selectedJobSheets[0]);
                    clearSelection();
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-orange-300 rounded-md text-sm font-medium text-orange-700 bg-white hover:bg-orange-50"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  Download
                </button>
              )}
              {selectedRows.size === 1 && onPrintCard && (
                <button
                  onClick={() => {
                    onPrintCard(selectedJobSheets[0]);
                    clearSelection();
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-orange-300 rounded-md text-sm font-medium text-orange-700 bg-white hover:bg-orange-50"
                >
                  <Printer className="w-4 h-4 mr-1.5" />
                  Print
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
                Job Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Device
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shop
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Issue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {jobSheets.map((jobSheet) => (
              <tr key={jobSheet.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(jobSheet.id)}
                    onChange={(e) => handleSelectRow(jobSheet.id, e.target.checked)}
                    className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">{jobSheet.jobNumber}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{jobSheet.customer?.name}</div>
                      <div className="text-sm text-gray-500">{jobSheet.customer?.phone}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Smartphone className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm text-gray-900">{jobSheet.device?.brand}</div>
                      <div className="text-sm text-gray-500">{jobSheet.device?.model}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{jobSheet.location?.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">{jobSheet.issueDescription}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(jobSheet.priority)}`}>
                    {jobSheet.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(jobSheet.status)}`}>
                    {jobSheet.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-900 font-medium">
                      Total: {formatCurrency(jobSheet.totalAmount)}
                    </div>
                    <div className="text-xs text-green-600">
                      Paid: {formatCurrency(jobSheet.paidAmount)}
                    </div>
                    {jobSheet.balanceAmount > 0 && (
                      <div className="text-xs text-red-600 font-semibold">
                        Balance: {formatCurrency(jobSheet.balanceAmount)}
                      </div>
                    )}
                    {jobSheet.balanceAmount === 0 && (
                      <div className="text-xs text-gray-500">
                        Balance: {formatCurrency(0)}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatDateTime(jobSheet.completedDate)}</div>
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
