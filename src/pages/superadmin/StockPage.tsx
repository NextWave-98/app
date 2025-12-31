import { useEffect, useState, useCallback } from 'react';
import StockStatsCards from '../../components/superadmin/stock/StockStatsCards';
import StockTable from '../../components/superadmin/stock/StockTable';
import StockFilters from '../../components/superadmin/stock/StockFilters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Plus, RefreshCw, Upload, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import LocationSelector from '../../components/common/LocationSelector';
import DataRawModal from '../../components/common/DataRawModal';
import { useProduct } from '../../hooks/useProduct';
import { useProductCategory } from '../../hooks/useProductCategory';
import AddStockModal from '../../components/superadmin/stock/AddStockModal';
import EditStockModal from '../../components/superadmin/stock/EditStockModal';
import ViewStockModal from '../../components/superadmin/stock/ViewStockModal';
import DeleteStockModal from '../../components/superadmin/stock/DeleteStockModal';
import StockTransferModal from '../../components/superadmin/stock/StockTransferModal';
import ProductTransferModal from '../../components/superadmin/products/ProductTransferModal';
import BulkUploadModal from '../../components/superadmin/stock/BulkUploadModal';

// Import ProductItem type from hook
import type { ProductItem } from '../../hooks/useProduct';

interface StockStats {
  totalProducts: number;
  activeProducts: number;
  discontinuedProducts: number;
  lowStockProducts: number;
  totalValue: number;
  categoryBreakdown: { name: string; count: number }[];
}

export default function StockPage() {
  const [filteredProducts, setFilteredProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [stats, setStats] = useState<StockStats>({
    totalProducts: 0,
    activeProducts: 0,
    discontinuedProducts: 0,
    lowStockProducts: 0,
    totalValue: 0,
    categoryBreakdown: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isRawModalOpen, setIsRawModalOpen] = useState(false);
  const [rawData, setRawData] = useState<unknown | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isProductTransferModalOpen, setIsProductTransferModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  // Bulk upload states
  // const [isBulkUploading, setIsBulkUploading] = useState(false);

  // Hooks
  const productHook = useProduct();
  const categoryHook = useProductCategory();

  // Load data
  const loadProducts = useCallback(async () => {
    try {
      const filters: Record<string, unknown> = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (selectedLocation) filters.locationId = selectedLocation;
      if (searchQuery) filters.search = searchQuery;
      if (selectedCategory) filters.categoryId = selectedCategory;
      if (selectedStatus) filters.status = selectedStatus;

      const response = await productHook.getAllProducts(filters);
      if (response?.data) {
        setFilteredProducts(response.data as ProductItem[]);

        // Extract pagination info
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pagination = (response as any).pagination;
        if (pagination) {
          setTotalItems(pagination.total || 0);
          setTotalPages(pagination.totalPages || 0);
        } else {
          const dataLength = (response.data as ProductItem[]).length;
          setTotalItems(dataLength);
          setTotalPages(Math.ceil(dataLength / itemsPerPage));
        }
      }
    } catch (error) {
      toast.error('Failed to load products');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [productHook, currentPage, itemsPerPage, selectedLocation, searchQuery, selectedCategory, selectedStatus]);



  const loadCategories = useCallback(async () => {
    try {
      const response = await categoryHook.getAllCategories();
      if (response?.data) {
        setCategories(response.data as { id: string; name: string }[]);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, [categoryHook]);

  const loadStats = useCallback(async () => {
    try {
      const response = await productHook.getProductStats();
      if (response?.data) {
        const apiStats = response.data as {
          total: number;
          activeProducts: number;
          discontinued: number;
          lowStock: number;
          totalValue: number;
          categoryBreakdown: Record<string, number>;
        };

        // Convert categoryBreakdown to array
        const categoryArray = Object.entries(apiStats.categoryBreakdown || {}).map(
          ([name, count]) => ({ name, count })
        );

        setStats({
          totalProducts: apiStats.total || 0,
          activeProducts: apiStats.activeProducts || 0,
          discontinuedProducts: apiStats.discontinued || 0,
          lowStockProducts: apiStats.lowStock || 0,
          totalValue: apiStats.totalValue || 0,
          categoryBreakdown: categoryArray,
        });
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  }, [productHook]);

  // Initial load
  useEffect(() => {
    loadCategories();
    loadStats();
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload when pagination or filters change
  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, selectedLocation, searchQuery, selectedCategory, selectedStatus]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadProducts(), loadStats()]);
      toast.success('Data refreshed successfully');
    } catch {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  }, [loadProducts, loadStats]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // loadProducts will be triggered by useEffect watching currentPage
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
    // loadProducts will be triggered by useEffect watching itemsPerPage
  };

  const handleEdit = (item: ProductItem) => {
    setSelectedProduct(item);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (item: ProductItem) => {
    setSelectedProduct(item);
    setIsDeleteModalOpen(true);
  };

  const handleView = (item: ProductItem) => {
    setSelectedProduct(item);
    setIsViewModalOpen(true);
  };

  const handleAddProduct = () => {
    setIsAddModalOpen(true);
  };

  const handleModalSuccess = () => {
    loadProducts();
    loadStats();
  };



  const handleDownloadSample = () => {
    // Create a link to download the sample file from the public folder
    const link = document.createElement('a');
    link.href = '/samples/phone_shop_products.xlsx';
    link.download = 'sample_products.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600 mt-1">
            Manage products, pricing, and stock levels across your system
          </p>
        </div>
        <div className="flex items-center gap-3">

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsProductTransferModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Transfer Products
          </button>
          <button
            onClick={handleAddProduct}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </button>
        </div>
      </div>

      {/* Location Filter */}
      {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LocationSelector
            value={selectedLocation}
            onChange={setSelectedLocation}
            label="Filter by Location"
            showAll={true}
            placeholder="All Locations"
          />
        </div>
      </div> */}


      {/* Stats Cards */}
      <StockStatsCards stats={stats} />


      <div className="flex items-end  justify-end gap-4">
        <button
          onClick={handleDownloadSample}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Download className="w-4 h-4 mr-2" />
          Sample Excel
        </button>
        <button
          onClick={() => setIsBulkUploadModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Upload className="w-4 h-4 mr-2" />
          Bulk Upload
        </button>
      </div>

      {/* Category Breakdown */}
      {stats.categoryBreakdown.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Products by Category</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.categoryBreakdown.map((cat) => (
              <div key={cat.name} className="flex justify-between text-sm">
                <span className="text-gray-600">{cat.name}:</span>
                <span className="font-medium text-gray-900">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <StockFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        onReset={handleResetFilters}
        categories={categories}
      />

      {/* Product Table with Pagination */}
      <StockTable
        items={filteredProducts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onRestock={handleEdit}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />

      {/* Raw Data Modal */}
      <DataRawModal
        isOpen={isRawModalOpen}
        onClose={() => {
          setIsRawModalOpen(false);
          setRawData(null);
        }}
        data={rawData}
        title="Product Raw Data"
      />

      {/* Product Modals */}
      <AddStockModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      <EditStockModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProduct(null);
        }}
        stockItem={selectedProduct}
        onSuccess={handleModalSuccess}
      />

      <ViewStockModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedProduct(null);
        }}
        stockItem={selectedProduct}
      />

      <DeleteStockModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedProduct(null);
        }}
        stockItem={selectedProduct}
        onSuccess={handleModalSuccess}
      />

      {/* Stock Transfer Modal */}
      <StockTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSuccess={() => {
          setIsTransferModalOpen(false);
          handleModalSuccess();
        }}
      />

      {/* Product Transfer Modal */}
      <ProductTransferModal
        isOpen={isProductTransferModalOpen}
        onClose={() => setIsProductTransferModalOpen(false)}
        onSuccess={() => {
          setIsProductTransferModalOpen(false);
          handleModalSuccess();
        }}
      />

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        onSuccess={() => {
          setIsBulkUploadModalOpen(false);
          handleModalSuccess();
        }}
      />
    </div>
  );
}
