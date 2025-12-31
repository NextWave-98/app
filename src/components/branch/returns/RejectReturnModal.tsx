import React, { useState } from 'react';
import { X, XCircle, FileText } from 'lucide-react';
import type { ProductReturn, RejectReturnData } from '../../../hooks/useProductReturn';

interface RejectReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: RejectReturnData) => Promise<void>;
  returnItem: ProductReturn | null;
}

export default function RejectReturnModal({
  isOpen,
  onClose,
  onSubmit,
  returnItem
}: RejectReturnModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RejectReturnData>({
    rejectionReason: '',
    notes: ''
  });

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        rejectionReason: '',
        notes: ''
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!returnItem) return;

    try {
      setLoading(true);
      await onSubmit(returnItem.id, formData);
      onClose();
    } catch (error) {
      console.error('Error rejecting return:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !returnItem) return null;

  const rejectionReasons = [
    'Product not eligible for return',
    'Return period expired',
    'Product damaged by customer',
    'Missing original packaging',
    'Product not matching return policy',
    'Invalid return request',
    'Other'
  ];

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
              <h2 className="text-2xl font-bold text-gray-900">Reject Return</h2>
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-semibold text-red-900">Return Rejected</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-red-800">Product</label>
                  <p className="text-red-900">{returnItem.productName}</p>
                  <p className="text-sm text-red-700">{returnItem.productCode}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-red-800">Customer</label>
                  <p className="text-red-900">{returnItem.customerName || 'N/A'}</p>
                  <p className="text-sm text-red-700">{returnItem.customerPhone || ''}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-red-800">Value</label>
                  <p className="text-red-900">LKR {returnItem.productValue.toLocaleString('en-US')}</p>
                  <p className="text-sm text-red-700">Quantity: {returnItem.quantity}</p>
                </div>
              </div>
              {returnItem.inspectionNotes && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-red-800">Inspection Notes</label>
                  <p className="text-red-900">{returnItem.inspectionNotes}</p>
                </div>
              )}
            </div>

            {/* Rejection Details */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Rejection Details
              </h3>

              {/* Rejection Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Rejection Reason *
                </label>
                <select
                  value={formData.rejectionReason}
                  onChange={(e) => setFormData(prev => ({ ...prev, rejectionReason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                >
                  <option value="">Select a reason</option>
                  {rejectionReasons.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>

              {/* Rejection Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Notes (Optional)
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Add any additional notes about the rejection decision..."
                />
              </div>
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
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Rejecting...' : 'Reject Return'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}