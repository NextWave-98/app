import { useEffect, useState } from 'react';
import { X, TrendingUp, TrendingDown, RefreshCw, PackageX, History, Calendar } from 'lucide-react';
import LoadingSpinner from '../../common/LoadingSpinner';

interface StockMovement {
  id: string;
  productId: string;
  movementType: string;
  quantity: number;
  quantityBefore?: number;
  quantityAfter?: number;
  notes?: string;
  createdAt: string;
  product?: {
    name: string;
    productCode: string;
    sku: string;
  };
}

interface StockMovementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
  branchId?: string;
  onLoadMovements: (productId?: string, branchId?: string) => Promise<{ data: StockMovement[] }>;
}

export default function StockMovementsModal({
  isOpen,
  onClose,
  productId,
  branchId,
  onLoadMovements,
}: StockMovementsModalProps) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadMovements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, productId, branchId]);

  const loadMovements = async () => {
    setLoading(true);
    try {
      const response = await onLoadMovements(productId, branchId);
      if (response?.data) {
        setMovements(response.data);
      }
    } catch (error) {
      console.error('Failed to load movements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'PURCHASE':
      case 'TRANSFER_IN':
      case 'ADJUSTMENT_IN':
      case 'RETURN_FROM_CUSTOMER':
      case 'FOUND':
      case 'RELEASE':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'SALES':
      case 'TRANSFER_OUT':
      case 'ADJUSTMENT_OUT':
      case 'RETURN_TO_SUPPLIER':
      case 'USAGE':
      case 'RESERVATION':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      case 'DAMAGED':
      case 'EXPIRED':
      case 'STOLEN':
      case 'WRITE_OFF':
        return <PackageX className="w-5 h-5 text-orange-600" />;
      default:
        return <History className="w-5 h-5 text-gray-600" />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'PURCHASE':
      case 'TRANSFER_IN':
      case 'ADJUSTMENT_IN':
      case 'RETURN_FROM_CUSTOMER':
      case 'FOUND':
      case 'RELEASE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'SALES':
      case 'TRANSFER_OUT':
      case 'ADJUSTMENT_OUT':
      case 'RETURN_TO_SUPPLIER':
      case 'USAGE':
      case 'RESERVATION':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'DAMAGED':
      case 'EXPIRED':
      case 'STOLEN':
      case 'WRITE_OFF':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredMovements = movements.filter((movement) => {
    if (!filter) return true;
    return movement.movementType === filter;
  });

  const movementTypes = Array.from(new Set(movements.map((m) => m.movementType)));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      
        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="w-6 h-6 text-white" />
                <h3 className="text-xl font-semibold text-white">Stock Movement History</h3>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {/* Filters and Stats */}
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">All Movements</option>
                  {movementTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <button
                  onClick={loadMovements}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
              <div className="text-sm text-gray-600">
                {filteredMovements.length} movement{filteredMovements.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Movements List */}
            <div className="max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : filteredMovements.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No stock movements found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMovements.map((movement) => (
                    <div
                      key={movement.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1">{getMovementIcon(movement.movementType)}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getMovementColor(
                                  movement.movementType
                                )}`}
                              >
                                {movement.movementType.replace(/_/g, ' ')}
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {movement.product?.name || 'Unknown Product'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {movement.product?.productCode || 'N/A'} | {movement.product?.sku || 'N/A'}
                            </p>
                            {(movement.quantityBefore !== undefined && movement.quantityAfter !== undefined) && (
                              <p className="text-xs text-gray-500">
                                {movement.quantityBefore} → {movement.quantityAfter} units
                              </p>
                            )}
                            {movement.notes && (
                              <p className="text-sm text-gray-500 italic mt-1">{movement.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div
                            className={`text-lg font-bold ${
                              ['PURCHASE', 'TRANSFER_IN', 'ADJUSTMENT_IN', 'RETURN_FROM_CUSTOMER', 'FOUND', 'RELEASE'].includes(movement.movementType)
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {['PURCHASE', 'TRANSFER_IN', 'ADJUSTMENT_IN', 'RETURN_FROM_CUSTOMER', 'FOUND', 'RELEASE'].includes(movement.movementType)
                              ? '+'
                              : '-'}
                            {Math.abs(movement.quantity)}
                          </div>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(movement.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
