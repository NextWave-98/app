import React, { useState, useEffect } from 'react';
import { X, Cog, FileText, Package, RefreshCw, Truck, Trash2 } from 'lucide-react';
import type { ProductReturn, ProcessReturnData } from '../../../hooks/useProductReturn';

interface ProcessReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: ProcessReturnData) => Promise<void>;
  returnItem: ProductReturn | null;
}

export default function ProcessReturnModal({
  isOpen,
  onClose,
  onSubmit,
  returnItem
}: ProcessReturnModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProcessReturnData>({
    resolutionType: 'RESTOCKED_BRANCH',
    resolutionDetails: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen && returnItem) {
      // Set default resolution type based on return category and source type
      let defaultType: ProcessReturnData['resolutionType'] = 'RESTOCKED_BRANCH';

      if (returnItem.sourceType === 'SALE') {
        defaultType = 'REFUND_PROCESSED';
      } else if (returnItem.returnCategory === 'DEFECTIVE' || returnItem.returnCategory === 'QUALITY_FAILURE') {
        defaultType = 'RETURNED_SUPPLIER';
      } else if (returnItem.returnCategory === 'DAMAGED' || returnItem.productCondition === 'DESTROYED') {
        defaultType = 'SCRAPPED';
      }

      // Pre-fill refund amount if available
      const defaultRefundAmount = returnItem.refundAmount && parseFloat(returnItem.refundAmount) > 0
        ? parseFloat(returnItem.refundAmount)
        : undefined;

      setFormData({
        resolutionType: defaultType,
        resolutionDetails: '',
        notes: '',
        refundAmount: defaultRefundAmount,
        refundMethod: undefined
      });
    }
  }, [isOpen, returnItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!returnItem) return;

    // Additional validation for refund processing
    if (formData.resolutionType === 'REFUND_PROCESSED') {
      if (!formData.refundAmount || formData.refundAmount <= 0) {
        alert('Please enter a valid refund amount');
        return;
      }
      if (!formData.refundMethod) {
        alert('Please select a refund method');
        return;
      }
      if (returnItem.sourceType !== 'SALE') {
        alert('Refunds can only be processed for returns from sales');
        return;
      }
    }

    try {
      setLoading(true);
      const res = await onSubmit(returnItem.id, formData);
      if (res?.success === true) {
        onClose();
      }
    } catch (error) {
      console.error('Error processing return:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (updates: Partial<ProcessReturnData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  if (!isOpen || !returnItem) return null;

  const resolutionTypes = [
    { value: 'RESTOCKED_BRANCH', label: 'Restock to Branch', icon: Package, description: 'Add product back to branch inventory' },
    { value: 'REFUND_PROCESSED', label: 'Process Refund', icon: RefreshCw, description: 'Process customer refund and restock' },
    { value: 'RETURNED_SUPPLIER', label: 'Return to Supplier', icon: Truck, description: 'Create supplier return for defective/damaged goods' },
    { value: 'TRANSFERRED_WAREHOUSE', label: 'Transfer to Warehouse', icon: Package, description: 'Transfer product to warehouse' },
    { value: 'SCRAPPED', label: 'Scrap Product', icon: Trash2, description: 'Write off product as scrap/destroyed' }
  ] as const;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">Process Return</h2>
              <span className="text-lg font-semibold text-gray-600">#{returnItem.returnNumber}</span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Return Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Cog className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">Return Processing</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-800">Product</label>
                  <p className="text-blue-900">{returnItem.productName}</p>
                  <p className="text-sm text-blue-700">{returnItem.productCode}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-800">Customer</label>
                  <p className="text-blue-900">{returnItem.customerName || 'N/A'}</p>
                  <p className="text-sm text-blue-700">{returnItem.customerPhone || ''}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-800">Value</label>
                  <p className="text-blue-900">LKR {returnItem.productValue.toLocaleString('en-US')}</p>
                  <p className="text-sm text-blue-700">Quantity: {returnItem.quantity}</p>
                </div>
              </div>
              {returnItem.notes && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-blue-800">Approval Notes</label>
                  <p className="text-blue-900">{returnItem.notes}</p>
                </div>
              )}
            </div>

            {/* Resolution Type Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Select Resolution Type
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {resolutionTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => updateFormData({ resolutionType: type.value as ProcessReturnData['resolutionType'] })}
                      className={`p-4 border rounded-lg text-left transition-all ${
                        formData.resolutionType === type.value
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm opacity-75">{type.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conditional Form Fields */}
            {formData.resolutionType === 'REFUND_PROCESSED' && (
              <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900">Refund Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Refund Amount (LKR) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={
                        returnItem.refundAmount && parseFloat(returnItem.refundAmount) > 0
                          ? returnItem.refundAmount
                          : (formData.refundAmount || '')
                      }
                      onChange={(e) => {
                        if (!(returnItem.refundAmount && parseFloat(returnItem.refundAmount) > 0)) {
                          updateFormData({ refundAmount: e.target.value ? parseFloat(e.target.value) : undefined });
                        }
                      }}
                      readOnly={returnItem.refundAmount && parseFloat(returnItem.refundAmount) > 0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Enter refund amount"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Refund Method *
                    </label>
                    <select
                      required
                      value={formData.refundMethod || ''}
                      onChange={(e) => updateFormData({ refundMethod: e.target.value as ProcessReturnData['refundMethod'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select method</option>
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="MOBILE_PAYMENT">Mobile Payment</option>
                      <option value="CHECK">Check</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
                {returnItem.sourceType !== 'SALE' && (
                  <div className="text-red-600 text-sm mt-2">
                    ⚠️ Refunds can only be processed for returns from sales.
                  </div>
                )}
              </div>
            )}

            {formData.resolutionType === 'RETURNED_SUPPLIER' && (
              <div className="space-y-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-900">Supplier Return Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.supplierReturnData?.supplierId || ''}
                      onChange={(e) => updateFormData({
                        supplierReturnData: {
                          ...formData.supplierReturnData,
                          supplierId: e.target.value,
                          reason: formData.supplierReturnData?.reason || '',
                          reasonDescription: formData.supplierReturnData?.reasonDescription || ''
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter supplier ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Return Reason *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.supplierReturnData?.reason || ''}
                      onChange={(e) => updateFormData({
                        supplierReturnData: {
                          ...formData.supplierReturnData,
                          supplierId: formData.supplierReturnData?.supplierId || '',
                          reason: e.target.value,
                          reasonDescription: formData.supplierReturnData?.reasonDescription || ''
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Defective product"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason Description (Optional)
                    </label>
                    <textarea
                      value={formData.supplierReturnData?.reasonDescription || ''}
                      onChange={(e) => updateFormData({
                        supplierReturnData: {
                          ...formData.supplierReturnData,
                          supplierId: formData.supplierReturnData?.supplierId || '',
                          reason: formData.supplierReturnData?.reason || '',
                          reasonDescription: e.target.value
                        }
                      })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Additional details about the return reason..."
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.resolutionType === 'TRANSFERRED_WAREHOUSE' && (
              <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900">Stock Transfer Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Destination Location ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.transferToLocationId || ''}
                      onChange={(e) => updateFormData({ transferToLocationId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter destination location ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transfer Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.transferNotes || ''}
                      onChange={(e) => updateFormData({ transferNotes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Return to warehouse"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Resolution Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution Details *
              </label>
              <textarea
                required
                value={formData.resolutionDetails || ''}
                onChange={(e) => updateFormData({ resolutionDetails: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the resolution steps taken..."
              />
            </div>

            {/* Processing Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Processing Notes (Optional)
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => updateFormData({ notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes about the processing..."
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Processing...' : 'Process Return'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}