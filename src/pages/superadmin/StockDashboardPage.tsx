/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState, useCallback } from 'react';
import { Package, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import LocationSelector from '../../components/common/LocationSelector';
import { useInventory } from '../../hooks/useInventory';
import ProductTransferModal from '../../components/superadmin/products/ProductTransferModal';

interface DashboardStats {
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
  inStockItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  overstockedItems: number;
  totalShops: number;
  categoryBreakdown: Array<{ category: string; count: number }>;
}

interface ProductWithStock {
  id: string;
  productId: string;
  productCode: string;
  sku: string;
  name: string;
  brand?: string;
  model?: string;
  category: {
    id: string;
    name: string;
    categoryCode: string;
  };
  quantity: number;
  availableQuantity: number;
  unitPrice: number;
  totalValue: number;
  locationId: string;
  location: {
    id: string;
    name: string;
    locationCode: string;
    locationType: string;
  };
}

export default function StockDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    totalQuantity: 0,
    totalValue: 0,
    inStockItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    overstockedItems: 0,
    totalShops: 0,
    categoryBreakdown: [],
  });
  const [productsWithStock, setProductsWithStock] = useState<ProductWithStock[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isProductTransferModalOpen, setIsProductTransferModalOpen] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const inventoryHook = useInventory();

  // Load dashboard data
  const loadDashboardData = useCallback(async (locationId?: string, page?: number, limit?: number) => {
    try {
      setLoading(true);
      const response = await inventoryHook.getDashboardStats(locationId, page, limit);
      
      if (response?.data) {
        const data = response.data as {
          stats: DashboardStats;
          productsWithStock: ProductWithStock[];
          pagination?: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
          };
        };
        setStats(data.stats);
        setProductsWithStock(data.productsWithStock || []);
        
        // Update pagination from backend response if available
        if (data.pagination) {
          setTotalItems(data.pagination.total);
          setTotalPages(data.pagination.totalPages);
        } else {
          // Fallback if backend doesn't return pagination
          const total = data.productsWithStock?.length || 0;
          setTotalItems(total);
          setTotalPages(Math.ceil(total / (limit || itemsPerPage)));
        }
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [inventoryHook, itemsPerPage]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData(selectedLocation || undefined, currentPage, itemsPerPage);
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadDashboardData(selectedLocation || undefined, page, itemsPerPage);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
    loadDashboardData(selectedLocation || undefined, 1, value);
  };

  // Use products directly from API (already paginated by backend)
  const paginatedProducts = productsWithStock;

  // Initial load
  useEffect(() => {
    loadDashboardData(selectedLocation || undefined, currentPage, itemsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload when location changes
  useEffect(() => {
    if (selectedLocation) {
      loadDashboardData(selectedLocation, currentPage, itemsPerPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation]);

  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 px-5 mb-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            View products with available stock across branches
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsProductTransferModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Transfer Products
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Location Filter */}
      {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <LocationSelector
          value={selectedLocation}
          onChange={setSelectedLocation}
          label="Filter by Location"
          showAll={true}
          placeholder="All Locations"
        />
      </div> */}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Items with Stock</p>
              <p className="text-2xl font-bold text-green-600">{stats.inStockItems}</p>
              <p className="text-xs text-gray-500 mt-1">
                Total Quantity: {stats.totalQuantity.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <Package className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Value</p>
              <p className="text-2xl font-bold text-blue-600">
                LKR {(stats.totalValue / 1000000).toFixed(2)}M
              </p>
              <p className="text-xs text-gray-500 mt-1">Current valuation</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.lowStockItems}</p>
              <p className="text-xs text-gray-500 mt-1">Needs restocking</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <Package className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Branches</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalShops}</p>
              <p className="text-xs text-gray-500 mt-1">Across system</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {stats.categoryBreakdown.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.categoryBreakdown.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600">{item.category}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{item.count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products with Stock Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Products with Stock ({productsWithStock.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch
                </th> */}

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No products with stock found
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.productCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      {(product.brand || product.model) && (
                        <div className="text-xs text-gray-500">
                          {[product.brand, product.model].filter(Boolean).join(' - ')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {product.category.name}
                    </td>
                    {/* <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.branch.name}</div>
                      <div className="text-xs text-gray-500">{product.branch.code}</div>
                    </td> */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {product.quantity}
                      </span>
                    </td>
                    {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {product.availableQuantity}
                    </td> */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      LKR {product.unitPrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      LKR {product.totalValue.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </div>

        {/* Results count */}
        {paginatedProducts.length > 0 && (
          <div className="px-6 pb-4 text-sm text-gray-600 text-center">
            Showing {paginatedProducts.length} of {totalItems} products
          </div>
        )}
      </div>
      
      {/* Product Transfer Modal */}
      <ProductTransferModal
        isOpen={isProductTransferModalOpen}
        onClose={() => setIsProductTransferModalOpen(false)}
        onSuccess={() => {
          setIsProductTransferModalOpen(false);
          loadDashboardData(selectedLocation || undefined, currentPage, itemsPerPage);
        }}
        warehouseOr={true}
      />
    </div>
  );
}
