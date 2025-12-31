import { useState } from 'react';
import { X, TrendingUp, TrendingDown, RefreshCw, PackageX, RotateCcw } from 'lucide-react';
import type { InventoryItem } from '../../../hooks/useInventory';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onAdjust: (id: string, data: AdjustStockData) => Promise<void>;
}

interface AdjustStockData {
  quantity: number;
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGED';
  notes?: string;
  referenceId?: string;
  referenceType?: string;
}

export default function StockAdjustmentModal({
  isOpen,
  onClose,
  item,
  onAdjust,
}: StockAdjustmentModalProps) {
  const [movementType, setMovementType] = useState<'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGED'>('IN');
  const [quantity, setQuantity] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    setLoading(true);
    try {
      await onAdjust(item.id, {
        quantity,
        movementType,
        notes,
      });
      handleClose();
    } catch (error) {
      console.error('Failed to adjust stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setQuantity(0);
    setNotes('');
    setMovementType('IN');
    onClose();
  };

  const currentStock = item.quantity;
  const newStock = movementType === 'IN' || movementType === 'RETURN' 
    ? currentStock + quantity 
    : currentStock - quantity;

  const movementOptions = [
    { value: 'IN', label: 'Stock In', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
    { value: 'OUT', label: 'Stock Out', icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100' },
    { value: 'ADJUSTMENT', label: 'Adjustment', icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-100' },
    { value: 'RETURN', label: 'Return', icon: RotateCcw, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { value: 'DAMAGED', label: 'Damaged', icon: PackageX, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
       
        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Adjust Stock</h3>
              <button
                onClick={handleClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Content */}
            <div className="px-6 py-4 space-y-6">
              {/* Product Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Product Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Product Name</p>
                    <p className="font-medium text-gray-900">{item.product?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Product Code</p>
                    <p className="font-medium text-gray-900">{item.product?.productCode}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">SKU</p>
                    <p className="font-medium text-gray-900">{item.product?.sku || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Branch</p>
                    <p className="font-medium text-gray-900">{item.branch?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Current Stock</p>
                    <p className="font-medium text-gray-900">{currentStock} units</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Available</p>
                    <p className="font-medium text-gray-900">{item.availableQuantity} units</p>
                  </div>
                </div>
              </div>

              {/* Movement Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Movement Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {movementOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = movementType === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setMovementType(option.value as 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGED')}
                        className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? `border-blue-500 ${option.bg}`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mb-2 ${isSelected ? option.color : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                          {option.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Input */}
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  value={quantity || ''}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter quantity"
                  required
                />
              </div>

              {/* Stock Preview */}
              {quantity > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Current Stock</p>
                      <p className="text-2xl font-bold text-gray-900">{currentStock}</p>
                    </div>
                    <div className="text-3xl text-gray-400">→</div>
                    <div>
                      <p className="text-sm text-gray-600">New Stock</p>
                      <p className={`text-2xl font-bold ${newStock >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {newStock}
                      </p>
                    </div>
                  </div>
                  {newStock < 0 && (
                    <p className="mt-2 text-sm text-red-600">
                      ⚠️ Warning: This adjustment will result in negative stock!
                    </p>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Add notes about this adjustment..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || quantity <= 0 || (movementType !== 'IN' && movementType !== 'RETURN' && quantity > currentStock)}
                className="px-6 py-2.5 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Adjust Stock'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
