import type { Sale } from '../../../types/sales.types';
import SalesStatusBadge from './SalesStatusBadge';
import PaymentMethodBadge from './PaymentMethodBadge';
import { Receipt, Eye, X, RotateCcw, MoreVertical, User, MapPin, Download, Printer, CheckSquare, Square } from 'lucide-react';
import { useState } from 'react';
import Pagination from '../../common/Pagination';

interface SalesTableProps {
  sales: Sale[];
  onView?: (sale: Sale) => void;
  onCancel?: (sale: Sale) => void;
  onRefund?: (sale: Sale) => void;
  onDownload?: (sale: Sale) => void;
  onPrint?: (sale: Sale) => void;
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

export default function SalesTable({ sales, onView, onCancel, onRefund, onDownload, onPrint, currentPage, itemsPerPage, totalItems, totalPages, onPageChange, onItemsPerPageChange }: SalesTableProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedSales, setSelectedSales] = useState<Set<string>>(new Set());
  console.log('SalesTable received sales:', sales);

  const formatCurrency = (amount: number) => {
    return `LKR ${amount.toLocaleString('en-US')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleMenu = (saleId: string) => {
    setActiveMenu(activeMenu === saleId ? null : saleId);
  };

  const getTotalItems = (sale: Sale) => {
    return sale.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleSelectAllSales = (checked: boolean) => {
    if (checked) {
      const allSaleIds = sales.map(sale => sale.id);
      setSelectedSales(new Set(allSaleIds));
    } else {
      setSelectedSales(new Set());
    }
  };

  const handleSelectSale = (saleId: string, checked: boolean) => {
    const newSelectedSales = new Set(selectedSales);
    if (checked) {
      newSelectedSales.add(saleId);
    } else {
      newSelectedSales.delete(saleId);
    }
    setSelectedSales(newSelectedSales);
  };

  const handleViewSelectedSale = () => {
    const selectedSaleIds = Array.from(selectedSales);
    console.log('handleViewSelectedSale - selectedSaleIds:', selectedSaleIds);
    if (selectedSaleIds.length === 1) {
      const selectedSale = sales.find(sale => sale.id === selectedSaleIds[0]);
      if (selectedSale) {
        onView?.(selectedSale);
        setSelectedSales(new Set()); // Clear selection after action
      }
    }
  };

  const handleDownloadSelectedSale = () => {
    const selectedSaleIds = Array.from(selectedSales);
    if (selectedSaleIds.length === 1) {
      const selectedSale = sales.find(sale => sale.id === selectedSaleIds[0]);
      if (selectedSale) {
        onDownload?.(selectedSale);
        setSelectedSales(new Set()); // Clear selection after action
      }
    }
  };

  const handlePrintSelectedSale = () => {
    const selectedSaleIds = Array.from(selectedSales);
    if (selectedSaleIds.length === 1) {
      const selectedSale = sales.find(sale => sale.id === selectedSaleIds[0]);
      if (selectedSale) {
        onPrint?.(selectedSale);
        setSelectedSales(new Set()); // Clear selection after action
      }
    }
  };

  const clearSelection = () => {
    setSelectedSales(new Set());
  };

  // Controlled: parent provides paginated sales
  const currentSales = sales;

  if (sales.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-gray-400 mb-4">
          <Receipt className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No sales found</h3>
        <p className="text-gray-600">Try adjusting your filters or search query</p>
      </div>
    );
  }
 console.log('Rendering SalesTable with sales:', sales);
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Bulk Actions */}
      {selectedSales.size > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedSales.size} sale{selectedSales.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleViewSelectedSale}
                  disabled={selectedSales.size !== 1}
                  className="inline-flex items-center px-3 py-1.5 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </button>
                <button
                  onClick={handleDownloadSelectedSale}
                  disabled={selectedSales.size !== 1}
                  className="inline-flex items-center px-3 py-1.5 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </button>
                <button
                  onClick={handlePrintSelectedSale}
                  disabled={selectedSales.size !== 1}
                  className="inline-flex items-center px-3 py-1.5 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer className="w-4 h-4 mr-1" />
                  Print
                </button>
              </div>
            </div>
            <button
              onClick={clearSelection}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectedSales.size === sales.length && sales.length > 0}
                  onChange={(e) => handleSelectAllSales(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shop
              </th>
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Items
              </th> */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentSales.map((sale) => (
              <tr
                key={sale.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedSales.has(sale.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSelectSale(sale.id, e.target.checked);
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{sale.invoiceNumber}</div>
                      {/* <div className="text-xs text-gray-500">ID: {sale.id}</div> */}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{sale.customerName}</div>
                      {sale.customerPhone && (
                        <div className="text-xs text-gray-500">{sale.customerPhone}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm text-gray-900">{sale.location.name}</div>
                      <div className="text-xs text-gray-500">{sale.branchCode}</div>
                    </div>
                  </div>
                </td>
                {/* <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{getTotalItems(sale)} items</div>
                  <div className="text-xs text-gray-500">{sale.items.length} products</div>
                </td> */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(sale.totalAmount)}
                  </div>
                  {sale.discount > 0 && (
                    <div className="text-xs text-green-600">-{formatCurrency(sale.discount)} disc</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <PaymentMethodBadge method={sale.paymentMethod} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <SalesStatusBadge status={sale.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatDate(sale.saleDate)}</div>
                  <div className="text-xs text-gray-500">{formatTime(sale.createdAt)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMenu(sale.id);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100 cursor-pointer"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {activeMenu === sale.id && (
                    <div className="absolute right-0 mt-2 mr-2 w-48 rounded-md shadow-lg bg-white z-10">
                      <div className="py-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onView?.(sale);
                            setActiveMenu(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownload?.(sale);
                            setActiveMenu(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPrint?.(sale);
                            setActiveMenu(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Printer className="w-4 h-4 mr-2" />
                          Print
                        </button>
                        {sale.status !== 'cancelled' && sale.status !== 'refunded' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCancel?.(sale);
                                setActiveMenu(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancel Sale
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRefund?.(sale);
                                setActiveMenu(null);
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-orange-600 hover:bg-orange-50"
                            >
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Refund Sale
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </td>
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
