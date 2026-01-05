import { useEffect, useState, useCallback } from 'react';
import CategoryStatsCards from '../../components/superadmin/categories/CategoryStatsCards';
import CategoryTable from '../../components/superadmin/categories/CategoryTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Plus, RefreshCw, Search, X, Upload, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProductCategory } from '../../hooks/useProductCategory';
import AddCategoryModal from '../../components/superadmin/categories/AddCategoryModal';
import EditCategoryModal from '../../components/superadmin/categories/EditCategoryModal';
import ViewCategoryModal from '../../components/superadmin/categories/ViewCategoryModal';
import DeleteCategoryModal from '../../components/superadmin/categories/DeleteCategoryModal';
import BulkUploadModal from '../../components/superadmin/categories/BulkUploadModal';

interface CategoryItem {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  parent?: {
    name: string;
  };
  displayOrder: number;
  isActive: boolean;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoryStats {
  total: number;
  active: number;
  inactive: number;
  withProducts: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [stats, setStats] = useState<CategoryStats>({
    total: 0,
    active: 0,
    inactive: 0,
    withProducts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);



  // Hooks
  const categoryHook = useProductCategory();

  // Load data
  const loadCategories = useCallback(async (page = currentPage, limit = itemsPerPage) => {
    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filters: any = {
        page,
        limit,
      };

      // Add search filter
      if (searchQuery) {
        filters.search = searchQuery;
      }

      // Add status filters
      if (selectedStatus === 'active') {
        filters.isActive = true;
      } else if (selectedStatus === 'inactive') {
        filters.isActive = false;
      }
      // Note: parentId filter can be added if backend supports it

      const response = await categoryHook.getAllCategories(filters);
      if (response?.data) {
        const categoriesData = response.data as CategoryItem[];
        setCategories(categoriesData);
        // Extract pagination info if backend returns it
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pagination = (response as any).pagination;
        if (pagination) {
          setTotalItems(pagination.total || 0);
          setTotalPages(pagination.totalPages || 0);
        } else {
          // Fallback if pagination info not in response
          setTotalItems(categoriesData.length);
          setTotalPages(Math.ceil(categoriesData.length / limit));
        }
      }
    } catch (error) {
      toast.error('Failed to load categories');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [categoryHook, currentPage, itemsPerPage, searchQuery, selectedStatus]);

  const loadStats = useCallback(async () => {
    try {
      const response = await categoryHook.getCategoryStats();
      if (response?.data) {
        const apiStats = response.data as CategoryStats;
        setStats({
          total: apiStats.total || 0,
          active: apiStats.active || 0,
          inactive: apiStats.inactive || 0,
          withProducts: apiStats.withProducts || 0,
        });
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  }, [categoryHook]);

  // Initial load
  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload data when filters or pagination changes
  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, searchQuery, selectedStatus]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadCategories(), loadStats()]);
      toast.success('Data refreshed successfully');
    } catch {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  }, [loadCategories, loadStats]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleEdit = (item: CategoryItem) => {
    setSelectedCategory(item);
    setIsEditModalOpen(true);
  };

  const handleDelete = (item: CategoryItem) => {
    setSelectedCategory(item);
    setIsDeleteModalOpen(true);
  };

  const handleView = (item: CategoryItem) => {
    setSelectedCategory(item);
    setIsViewModalOpen(true);
  };

  const handleAddCategory = () => {
    setIsAddModalOpen(true);
  };

  const handleModalSuccess = () => {
    loadCategories();
    loadStats();
  };

  // const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (!file) return;

  //   // Validate file type
  //   const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
  //   if (!allowedTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.csv')) {
  //     toast.error('Please select a valid Excel (.xlsx) or CSV (.csv) file');
  //     return;
  //   }

  //   setIsBulkUploading(true);
  //   try {
  //     const response = await categoryHook.bulkUploadCategories(file);
  //     if (response?.success) {
  //       toast.success(`Bulk upload completed! Created: ${response.data?.created || 0}, Updated: ${response.data?.updated || 0}`);
  //       loadCategories();
  //       loadStats();
  //     } else {
  //       toast.error('Bulk upload failed');
  //     }
  //   } catch (error) {
  //     toast.error('Failed to upload categories');
  //     console.error(error);
  //   } finally {
  //     setIsBulkUploading(false);
  //     // Reset file input
  //     event.target.value = '';
  //   }
  // };

  const handleDownloadSample = () => {
    // Create a link to download the sample file from the public folder
    const link = document.createElement('a');
    link.href = '/samples/sample_categories.xlsx';
    link.download = 'sample_categories.xlsx';
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
          <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
          <p className="text-gray-600 mt-1">
            Organize and manage product categories across your system
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={ handleDownloadSample}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            <Download className="w-4 h-4 mr-2" />
            Sample Excel
          </button>
          <button
            onClick={() => setIsBulkUploadModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleAddCategory}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <CategoryStatsCards stats={stats} />

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search categories..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="root">Root Categories</option>
              <option value="subcategory">Subcategories</option>
            </select>
          </div>
        </div>

        {/* Reset Filters */}
        {(searchQuery || selectedStatus) && (
          <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-600">
              {totalItems} categories found
            </span>
            <button
              onClick={handleResetFilters}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Category Table */}
      <CategoryTable
        items={categories}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />

      {/* Category Modals */}
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      <EditCategoryModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onSuccess={handleModalSuccess}
      />

      <ViewCategoryModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
      />

      <DeleteCategoryModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onSuccess={handleModalSuccess}
      />

      <BulkUploadModal
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
