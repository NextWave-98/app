/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { X, Package, TrendingUp, TrendingDown } from 'lucide-react';
import { useProduct, type ProductItem } from '../../../hooks/useProduct';
import LoadingSpinner from '../../common/LoadingSpinner';
import toast from 'react-hot-toast';
import useStock from '../../../hooks/useStock';

interface ViewStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockItem: ProductItem | null;
}

export default function ViewStockModal({ isOpen, onClose, stockItem }: ViewStockModalProps) {
  const stockHook = useStock();
  const [loading, setLoading] = useState(false);
  const [stockData, setStockData] = useState<StockItem | null>(null);

  useEffect(() => {
    if (stockItem && isOpen) {
      loadStockDetails();
    }
  }, [stockItem, isOpen]);

  const loadStockDetails = async () => {
    if (!stockItem?.id) return;
    
    setLoading(true);
    try {
      const response = await stockHook.getInventoryById(stockItem.id);
      if (response?.data) {
        setStockData(response.data as unknown as StockItem);
      }
    } catch (error) {
      console.error('Error loading stock details:', error);
      toast.error('Failed to load stock details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStockStatus = () => {
    const data = stockData || stockItem;
    if (!data) return { label: 'Unknown', color: 'gray' };
    
    if (data.quantity === 0) {
      return { label: 'Out of Stock', color: 'red' };
    } else if (data.quantity <= data.reorderLevel) {
      return { label: 'Low Stock', color: 'yellow' };
    } else if (data.quantity <= data.minStockLevel) {
      return { label: 'Low Stock', color: 'yellow' };
    } else if (data.quantity >= data.maxStockLevel) {
      return { label: 'Overstocked', color: 'orange' };
    } else {
      return { label: 'In Stock', color: 'green' };
    }
  };

  if (!isOpen) return null;

  const data = stockData || stockItem;
  const status = getStockStatus();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Stock Item Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : data ? (
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="bg-orange-50 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-orange-600 rounded-lg flex items-center justify-center">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{data.part?.name || 'Unknown Part'}</h3>
                    <p className="text-sm text-gray-600">Part Number: {data.part?.partNumber || 'N/A'}</p>
                    <p className="text-sm text-gray-600">Category: {data.part?.category || 'N/A'}</p>
                  </div>
                </div>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  status.color === 'green' ? 'bg-green-100 text-green-800' :
                  status.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  status.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {status.label}
                </span>
              </div>
            </div>

            {/* Stock Levels */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Stock Levels</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Current Quantity</p>
                  <p className="text-2xl font-bold text-gray-900">{data.quantity}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Min Level</p>
                  <p className="text-2xl font-bold text-gray-900">
                    <TrendingDown className="w-5 h-5 inline mr-1 text-red-500" />
                    {data.minStockLevel}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Max Level</p>
                  <p className="text-2xl font-bold text-gray-900">
                    <TrendingUp className="w-5 h-5 inline mr-1 text-green-500" />
                    {data.maxStockLevel}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Reorder Level</p>
                  <p className="text-2xl font-bold text-gray-900">{data.reorderLevel}</p>
                </div>
              </div>
            </div>

            {/* Location & Branch */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Location</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Branch Name</label>
                  <p className="text-gray-900 font-medium">{data.branch?.name || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Branch Code</label>
                  <p className="text-gray-900 font-medium">{data.branch?.code || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Pricing & Inventory Info */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Inventory</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.part?.unitPrice !== undefined && (
                  <div>
                    <label className="text-sm text-gray-600">Unit Price</label>
                    <p className="text-gray-900 font-medium">USD {data.part.unitPrice.toLocaleString()}</p>
                  </div>
                )}
                {data.part?.unitPrice !== undefined && (
                  <div>
                    <label className="text-sm text-gray-600">Total Value</label>
                    <p className="text-gray-900 font-medium">
                      USD {(data.part.unitPrice * data.quantity).toLocaleString()}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-600">Reorder Quantity</label>
                  <p className="text-gray-900 font-medium">{data.reorderQuantity} units</p>
                </div>
              </div>
            </div>

            {/* Stock Health Indicator */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Stock Health</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="mb-2">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Current: {data.quantity}</span>
                    <span>Target: {data.minStockLevel}-{data.maxStockLevel}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full ${
                        data.quantity === 0 ? 'bg-red-500' :
                        data.quantity <= data.reorderLevel ? 'bg-yellow-500' :
                        data.quantity >= data.maxStockLevel ? 'bg-orange-500' :
                        'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min((data.quantity / data.maxStockLevel) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
                {data.quantity <= data.reorderLevel && (
                  <p className="text-sm text-yellow-700 mt-2">
                    ⚠️ Stock is below reorder level. Consider restocking {data.reorderQuantity} units.
                  </p>
                )}
              </div>
            </div>

            {/* Timestamps */}
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {data.lastRestocked && (
                  <div>
                    <label className="text-gray-600">Last Restocked</label>
                    <p className="text-gray-900">{formatDate(data.lastRestocked)}</p>
                  </div>
                )}
                <div>
                  <label className="text-gray-600">Created</label>
                  <p className="text-gray-900">{formatDate(data.createdAt)}</p>
                </div>
                <div>
                  <label className="text-gray-600">Last Updated</label>
                  <p className="text-gray-900">{formatDate(data.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-600">
            No stock data available
          </div>
        )}

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
