/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { X, CheckCircle, Receipt, Printer, Calendar, Hash, Download } from 'lucide-react';
import type { OrderData } from './PaymentModal';
import { formatDateTime } from '../../../utils/dateUtils';
import useSales from '../../../hooks/useSales';
import { formatCurrency } from '../../../utils/currency';

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: OrderData | null;
  responseData: any;
}

const BillModal: React.FC<BillModalProps> = ({ isOpen, onClose, orderData, responseData }) => {
  const { downloadInvoice,printInvoice } = useSales();

  if (!isOpen || !orderData || !orderData.payment) return null;

  const handlePrintInvoice = () => {
    printInvoice(responseData.saleId);
  };



  const handleDownloadPDF = () => {
    console.log(responseData.saleId);
    downloadInvoice(responseData.saleId)
  };

  const calculateSubtotal = () => {
    return orderData.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateDiscountAmount = () => {
    return orderData.discount || 0;
  };

  const calculateChange = () => {
    if (orderData.payment.method === 'cash' && orderData.payment.cashReceived) {
      return orderData.payment.cashReceived - orderData.payment.totalAmount;
    }
    return 0;
  };

  const formatDate = (dateString: string) => {
    return formatDateTime(dateString);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-md transition-opacity no-print"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 no-print">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-2 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Payment Successful</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 no-print">
            <div className="space-y-6">
              {/* Success Message */}
              <div className="flex flex-col items-center justify-center">
                <div className="bg-green-50 p-6 rounded-full mb-4">
                  <CheckCircle className="w-15 h-15 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
                <p className="text-gray-600 mb-2">Transaction completed successfully</p>
              </div>

              {/* Invoice Summary */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Invoice Summary</h3>
                  <Receipt className="w-5 h-5 text-gray-500" />
                </div>

                {/* Bill Details */}
                <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Bill Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Bill Number</p>
                        <p className="text-sm font-medium text-gray-900">
                          {responseData?.saleNumber || responseData?.saleId || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Date & Time</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(orderData.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="border-t border-gray-300 pt-4">
                  <div className="space-y-2">
                    {/* Subtotal */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-gray-900">{formatCurrency(calculateSubtotal())}</span>
                    </div>

                    {/* Discount */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        Discount
                        {parseFloat(String(orderData.discount || 0)) > 0 && (
                          <>
                            ({orderData.discountType === 'PERCENTAGE'
                              ? `${((parseFloat(String(orderData.discount)) / calculateSubtotal()) * 100).toFixed(2)}%`
                              : `${formatCurrency(parseFloat(orderData.discount))}`})
                          </>
                        )}
                        {/* {orderData.discountReason && (
                          <span className="text-xs text-gray-500">({orderData.discountReason})</span>
                        )} */}
                      </span>
                      <span className={`font-medium ${parseFloat(String(orderData.discount || 0)) > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {parseFloat(String(orderData.discount || 0)) > 0 ? '-' : ''}{formatCurrency(calculateDiscountAmount())}
                      </span>
                    </div>

                    {/* Payment Method */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Payment Method</span>
                      <span className="font-medium text-gray-900 capitalize">
                        {orderData.payment.method}
                      </span>
                    </div>

                    {orderData.payment.method === 'cash' && orderData.payment.cashReceived && (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Cash Received</span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(orderData.payment.cashReceived)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-base font-semibold text-gray-900">Change</span>
                          <span className="text-2xl font-bold text-green-600">
                            {formatCurrency(calculateChange())}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="h-px bg-gray-300 my-2"></div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total Paid</span>
                      <span className="text-3xl font-bold text-blue-600">
                        {formatCurrency(orderData.payment.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePrintInvoice}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm hover:shadow-md"
                >
                  <Printer className="w-5 h-5" />
                  Print Invoice
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors shadow-sm hover:shadow-md"
                >
                  <Download className="w-5 h-5" />
                  Download Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillModal;