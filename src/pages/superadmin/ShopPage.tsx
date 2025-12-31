import { useEffect, useState, useCallback } from 'react';
import type { Location, CreateLocationDTO, UpdateLocationDTO } from '../../types/location.types';
import { LocationType } from '../../types/location.types';
import type { Shop, CreateShopDTO } from '../../types/shop.types';
import ShopStatsCards from '../../components/superadmin/shops/ShopStatsCards';
import ShopTable from '../../components/superadmin/shops/ShopTable';
import ShopFilters from '../../components/superadmin/shops/ShopFilters';
import AddShopModal from '../../components/superadmin/shops/AddShopModal';
import EditShopModal from '../../components/superadmin/shops/EditShopModal';
import ViewShopModal from '../../components/superadmin/shops/ViewShopModal';
import DeleteConfirmModal from '../../components/superadmin/shops/DeleteConfirmModal';
import DataRawModal from '../../components/common/DataRawModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Plus, RefreshCw, Eye, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocation } from '../../hooks/useLocation';

interface ShopStats {
  totalShops: number;
  activeShops: number;
  inactiveShops: number;
  totalUsers: number;
}

export default function ShopPage() {
  const { getAllLocations, createLocation, updateLocation, deleteLocation } = useLocation();
  
  const [shops, setShops] = useState<Location[]>([]);
  const [filteredShops, setFilteredShops] = useState<Location[]>([]);
  const [stats, setStats] = useState<ShopStats>({
    totalShops: 0,
    activeShops: 0,
    inactiveShops: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
  });

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Location | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRawModalOpen, setIsRawModalOpen] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<boolean | undefined>(undefined);
  const [selectedType, setSelectedType] = useState<'all' | 'store' | 'shops'>('all');

  // Selection state
  const [selectedShops, setSelectedShops] = useState<Location[]>([]);

  const loadShops = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllLocations({
        page: pagination.page,
        limit: pagination.limit
      });
      
      if (response?.success && response.data) {
        const responseData = response.data as unknown as { locations?: Location[]; pagination?: { page: number; limit: number; total: number; totalPages: number } };
        const locations = Array.isArray(responseData) ? responseData : responseData.locations || [];
        setShops(locations);
        setFilteredShops(locations);
        
        // Handle pagination if present
        if (responseData.pagination) {
          setPagination({
            page: responseData.pagination.page,
            limit: responseData.pagination.limit,
            total: responseData.pagination.total,
            totalPages: responseData.pagination.totalPages,
          });
        }
        
        // Calculate stats
        const activeShops = locations.filter((loc: Location) => loc.isActive).length;
        const inactiveShops = locations.length - activeShops;
        const totalUsers = locations.reduce((sum: number, loc: Location) => sum + (loc._count?.users || 0), 0);
        
        setStats({
          totalShops: responseData.pagination?.total || locations.length,
          activeShops,
          inactiveShops,
          totalUsers,
        });
      }
    } catch (error) {
      toast.error('Failed to load locations');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [getAllLocations, pagination.page, pagination.limit]);

  const applyFilters = useCallback(() => {
    let filtered = [...shops];

    // Type filter
    if (selectedType !== 'all') {
      if (selectedType === 'store') {
        filtered = filtered.filter((shop) => shop.locationType === 'WAREHOUSE');
      } else if (selectedType === 'shops') {
        filtered = filtered.filter((shop) => shop.locationType === 'BRANCH');
      }
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (shop) =>
          shop.name.toLowerCase().includes(query) ||
          shop.locationCode.toLowerCase().includes(query) ||
          shop.address?.toLowerCase().includes(query) ||
          shop.email?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (selectedStatus !== undefined) {
      filtered = filtered.filter((shop) => shop.isActive === selectedStatus);
    }

    setFilteredShops(filtered);
  }, [shops, searchQuery, selectedStatus, selectedType]);

  // Fetch initial data
  useEffect(() => {
    loadShops();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]);

  // Apply client-side filters whenever shops or filter states change
  // Note: This should ideally be moved to API-side filtering
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadShops();
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh data');
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  };

  const handlePageChange = async (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
    // loadShops will be triggered by useEffect watching pagination.page
  };

  const handleLimitChange = async (limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
    // loadShops will be triggered by useEffect watching pagination.limit
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus(undefined);
    setSelectedType('all');
  };

  const handleEdit = (shop: Location | Shop) => {
    setSelectedShop(shop as Location);
    setIsEditModalOpen(true);
  };

  const handleDelete = (shop: Location | Shop) => {
    setSelectedShop(shop as Location);
    setIsDeleteModalOpen(true);
  };

  const handleView = (shop: Location | Shop) => {
    setSelectedShop(shop as Location);
    setIsViewModalOpen(true);
  };

  const handleAddShop = () => {
    setIsAddModalOpen(true);
  };

  const handleCreateShop = async (data: CreateShopDTO) => {
    try {
      // Convert CreateShopDTO to CreateLocationDTO
      const locationData: CreateLocationDTO = {
        name: data.name,
        // locationCode: data.code || data.name.toUpperCase().replace(/\s+/g, '_'),
        locationType: LocationType.BRANCH,
        address: data.address,
        phone: data.phone,
        email: data.email,
      };
      
      const result = await createLocation(locationData);
      
      if (result?.success) {
        setIsAddModalOpen(false);
        await loadShops();
      }
    } catch (error) {
      console.error('Create error:', error);
    }
  };

  const handleUpdateShop = async (id: string, data: UpdateLocationDTO) => {
    try {
      const result = await updateLocation(id, data);
      
      if (result?.success) {
        setIsEditModalOpen(false);
        setSelectedShop(null);
        setSelectedShops([]); // Clear selection after update
        await loadShops();
      }
    } catch (error) {
      console.error('Update error:', error);
      throw error;
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedShop) return;

    setIsDeleting(true);
    try {
      const result = await deleteLocation(selectedShop.id);

      if (result?.success) {
        setIsDeleteModalOpen(false);
        setSelectedShop(null);
        setSelectedShops([]); // Clear selection after delete
        await loadShops();
      }
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectionChange = (shops: Location[]) => {
    setSelectedShops(shops);
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
          <h1 className="text-3xl font-bold text-gray-900">Shop Management</h1>
          <p className="text-gray-600 mt-1">
            Manage all your shops, branches, and their operations
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
            onClick={handleAddShop}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Shop
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <ShopStatsCards stats={stats} />

      {/* Type Filter Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedType === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setSelectedType('store')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedType === 'store'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Store
        </button>
        <button
          onClick={() => setSelectedType('shops')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedType === 'shops'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Shops
        </button>
      </div>

      {/* Filters */}
      <ShopFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        onReset={handleResetFilters}
      />

      {/* Action Bar - Shown when shops are selected */}
      {selectedShops.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-900">
                {selectedShops.length} shop{selectedShops.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              {selectedShops.length === 1 && (
                <>
                  <button
                    onClick={() => handleView(selectedShops[0])}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(selectedShops[0])}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(selectedShops[0])}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shop Table */}
      <ShopTable
        shops={filteredShops}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        pagination={pagination}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        selectable={true}
        selectedShops={selectedShops}
        onSelectionChange={handleSelectionChange}
      />

      {/* Results count */}
      {filteredShops.length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          Showing {filteredShops.length} of {pagination.total} shops
        </div>
      )}

      {/* Add Shop Modal */}
      <AddShopModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateShop}
      />

      {/* Edit Shop Modal */}
      <EditShopModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedShop(null);
          setSelectedShops([]);
        }}
        onSubmit={handleUpdateShop}
        shop={selectedShop}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedShop(null);
        }}
        onConfirm={handleConfirmDelete}
        shop={selectedShop}
        isDeleting={isDeleting}
      />

      {/* View Shop Modal */}
      <ViewShopModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedShop(null);
          setSelectedShops([]);
        }}
        shop={selectedShop}
        onAddBranch={() => {
          // Handle add branch logic
          console.log('Add branch clicked');
        }}
        onViewBranch={(branchId) => {
          // Handle view branch logic
          console.log('View branch clicked:', branchId);
        }}
      />

      {/* Raw Data Modal */}
      <DataRawModal
        isOpen={isRawModalOpen}
        onClose={() => {
          setIsRawModalOpen(false);
          setSelectedShop(null);
        }}
        data={selectedShop}
        title="Location Raw Data"
      />
    </div>
  );
}
