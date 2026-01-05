import { AlertTriangle, X } from 'lucide-react';
import type { Shop } from '../../../types/shop.types';
import type { Location } from '../../../types/location.types';

type ShopOrLocation = Shop | Location;

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  shop: ShopOrLocation | null;
  isDeleting: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  shop,
  isDeleting,
}: DeleteConfirmModalProps) {
  if (!isOpen || !shop) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm bg-opacity-50 transition-opacity"
        onClick={!isDeleting ? onClose : undefined}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Delete Branch</h2>
            </div>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete the branch <strong>"{shop.name}"</strong>?
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> This action cannot be undone. All data associated with
                this branch will be permanently deleted.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Location Code:</span>
                <span className="font-medium text-gray-900">{'locationCode' in shop ? shop.locationCode : shop.code}</span>
              </div>
              {shop.address && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Address:</span>
                  <span className="font-medium text-gray-900 text-right">{shop.address}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Total Users:</span>
                <span className="font-medium text-gray-900">{shop.users?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isDeleting ? 'Deleting...' : 'Delete Branch'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
