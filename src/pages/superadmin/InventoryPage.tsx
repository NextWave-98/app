/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from 'react';
import InventoryStatsCards from '../../components/superadmin/inventory/InventoryStatsCards';
import InventoryTable from '../../components/superadmin/inventory/InventoryTable';
import StockAdjustmentModal from '../../components/superadmin/inventory/StockAdjustmentModal';
import StockTransferModal from '../../components/superadmin/inventory/StockTransferModal';
import InventoryFormModal from '../../components/superadmin/inventory/InventoryFormModal';
import StockMovementsModal from '../../components/superadmin/inventory/StockMovementsModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {  RefreshCw, History } from 'lucide-react';
import LocationSelector from '../../components/common/LocationSelector';
import toast from 'react-hot-toast';
import DataRawModal from '../../components/common/DataRawModal';
import { useInventory } from '../../hooks/useInventory';
import ProductTransferModal from '../../components/superadmin/products/ProductTransferModal';
import { LocationType } from '../../types/location.types';

interface InventoryItem {
  id: string;
  productId: string;
  product?: {
    id: string;
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
    unitPrice: number;
    costPrice: number;
    primaryImage?: string;
    warrantyMonths: number;
    isActive: boolean;
    minStockLevel?: number;
  };
  locationId: string;
  location?: {
    id: string;
    name: string;
    locationCode: string;
    locationType: string;
  };
  quantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  warehouseLocation?: string;
  zone?: string;
  averageCost: number;
  totalValue: number;
  lastRestocked?: string;
  lastStockCheck?: string;
  createdAt: string;
  updatedAt: string;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    inStockItems: 0,
    totalShops: 0,
    totalQuantity: 0,
    categoryBreakdown: [] as { category: string; count: number }[],
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Array<{ id: string; name: string; productCode: string; sku: string; category: { id: string; name: string; }; }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isRawModalOpen, setIsRawModalOpen] = useState(false);
  const [rawData, setRawData] = useState<unknown | null>(null);
  
  // Modal states
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isProductTransferModalOpen, setIsProductTransferModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isMovementsModalOpen, setIsMovementsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked' | ''>('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [warehouseOr, setWarehouseOr] = useState<boolean | null>(null);

  // Hooks
  const inventoryHook = useInventory();

  // Load data
  const loadInventory = useCallback(async () => {
    try {
      const filters: Record<string, unknown> = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (searchQuery) filters.search = searchQuery;
      if (selectedLocation) filters.locationId = selectedLocation;
      if (selectedCategory) filters.category = selectedCategory;
      if (selectedStatus) filters.status = selectedStatus;

      const response = await inventoryHook.getAllInventory(filters);
      console.log(response);

      // Normalize various possible response shapes from the API.
      // The API may return either:
      // - an array directly in `response.data`
      // - a wrapper object where the array is at `response.data.data`
      // - other names like `items` etc. We try common variants.
      // Ensure we always set `inventory` and `filteredInventory` to an array.
      let items: InventoryItem[] = [];

      // response is the ApiResponse object returned by useFetch
      const apiData = response?.data;

      if (Array.isArray(apiData)) {
        items = apiData as InventoryItem[];
      } else if (apiData && Array.isArray((apiData as any).data)) {
        items = (apiData as any).data as InventoryItem[];
      } else if (apiData && Array.isArray((apiData as any).items)) {
        items = (apiData as any).items as InventoryItem[];
      } else if (response && Array.isArray((response as any).data)) {
        // fallback: sometimes the wrapper is one level shallower
        items = (response as any).data as InventoryItem[];
      } else {
        // If nothing matched, but apiData exists and is an object containing
        // a list under a single key, try to find the first array value.
        if (apiData && typeof apiData === 'object') {
          const firstArray = Object.values(apiData).find(v => Array.isArray(v));
          if (Array.isArray(firstArray)) items = firstArray as InventoryItem[];
        }
      }

      // Ensure we have an array before setting state (avoid map errors)
      setInventory(items);
      setFilteredInventory(items);

      // Extract pagination info from common locations
     
      const pagination = (response as any).pagination || (response?.data as any)?.pagination || (response as any)?.data?.pagination;
      if (pagination) {
        setTotalItems(pagination.total || 0);
        setTotalPages(pagination.totalPages || 0);
      } else {
        const dataLength = items.length;
        setTotalItems(dataLength);
        setTotalPages(Math.ceil(dataLength / itemsPerPage));
      }

      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(
          items
            .map(item => item.product?.category?.name)
            .filter((cat): cat is string => !!cat)
        )
      );
      setCategories(uniqueCategories);
    } catch (error) {
      toast.error('Failed to load inventory');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [inventoryHook, currentPage, itemsPerPage, searchQuery, selectedLocation, selectedCategory, selectedStatus]);

  const calculateStats = useCallback(() => {
    if (!inventory || inventory.length === 0) return;
    
    const totalItems = inventory.length;
    const totalValue = inventory.reduce((sum, item) => {
      const unitPrice = item.product?.unitPrice || 0;
      return sum + (item.quantity * unitPrice);
    }, 0);
    const lowStockItems = inventory.filter(item => {
      const minStock = item.minStockLevel ?? item.product?.minStockLevel ?? 0;
      return item.quantity <= minStock;
    }).length;
    const outOfStockItems = inventory.filter(item => item.quantity === 0).length;
    const inStockItems = inventory.filter(item => item.quantity > 0).length;
    const totalQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0);
    
    // Get unique shop count
    const uniqueShops = new Set(inventory.map(item => item.locationId).filter(Boolean));
    const totalShops = uniqueShops.size;
    
    // Create category breakdown
    const categoryMap: Record<string, number> = {};
    inventory.forEach(item => {
      const category = item.product?.category?.name || 'Unknown';
      categoryMap[category] = (categoryMap[category] || 0) + 1;
    });
    const categoryArray = Object.entries(categoryMap).map(
      ([category, count]) => ({ category, count })
    );
    
    setStats({
      totalItems,
      totalValue,
      lowStockItems,
      outOfStockItems,
      inStockItems,
      totalShops,
      totalQuantity,
      categoryBreakdown: categoryArray,
    });
  }, [inventory]);

  const loadProducts = useCallback(async () => {
    try {
      // Fetch products from API - using inventory data to extract unique products
      const productMap = new Map();
      
      inventory.forEach((inv) => {
        if (inv.product && !productMap.has(inv.productId)) {
          productMap.set(inv.productId, {
            id: inv.productId,
            name: inv.product.name,
            productCode: inv.product.productCode,
            sku: inv.product.sku || '',
            category: inv.product.category || { id: '', name: 'Uncategorized' }
          });
        }
      });
      
      setProducts(Array.from(productMap.values()));
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }, [inventory]);

  // Reload when pagination or filters change
  useEffect(() => {
    loadInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, searchQuery, selectedStatus, selectedLocation, selectedCategory]);

  // Load products when inventory changes
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);
  
  // Calculate stats when inventory changes
  useEffect(() => {
    calculateStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventory]);



  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadInventory();
      toast.success('Data refreshed successfully');
    } catch {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  }, [loadInventory]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('');
    setSelectedLocation('');
    setSelectedCategory('');
    setWarehouseOr(null);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadInventory(); // Reload with new page
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
    loadInventory(); // Reload with new items per page
  };

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormMode('edit');
    setIsFormModalOpen(true);
  };

  const handleDelete = async (item: InventoryItem) => {
    if (window.confirm(`Are you sure you want to delete inventory for ${item.product?.name}?`)) {
      try {
        await inventoryHook.deleteInventory(item.id);
        toast.success('Inventory deleted successfully');
        loadInventory();
      } catch {
        toast.error('Failed to delete inventory');
      }
    }
  };

  const handleView = (item: InventoryItem) => {
    setRawData(item);
    setIsRawModalOpen(true);
  };

  const handleAdjustStock = async (item: InventoryItem) => {
    setSelectedItem(item);
    setIsAdjustModalOpen(true);
  };

  const handleTransferStock = async (item: InventoryItem) => {
    setSelectedItem(item);
    setIsTransferModalOpen(true);
  };

  // const handleAddInventory = () => {
  //   setSelectedItem(null);
  //   setFormMode('create');
  //   setIsFormModalOpen(true);
  // };

  const handleViewMovements = () => {
    setIsMovementsModalOpen(true);
  };

  // Modal handlers
  const handleAdjustSubmit = async (id: string, adjustData: {
    quantity: number;
    movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGED';
    notes?: string;
  }) => {
    await inventoryHook.adjustStock(id, adjustData);
    await loadInventory();
  };

  const handleTransferSubmit = async (transferData: {
    fromBranchId: string;
    toBranchId: string;
    productId: string;
    quantity: number;
    notes?: string;
  }) => {
    const { fromBranchId, toBranchId, ...rest } = transferData;
    await inventoryHook.transferStock({
      fromLocationId: fromBranchId,
      toLocationId: toBranchId,
      ...rest
    });
    await loadInventory();
  };

  const handleFormSubmit = async (formData: {
    id?: string;
    productId: string;
    branchId: string;
    quantity: number;
    minStockLevel?: number;
    maxStockLevel?: number;
    location?: string;
    zone?: string;
  }) => {
    if (formMode === 'create') {
      const { branchId, ...rest } = formData;
      await inventoryHook.createInventory({
        locationId: branchId,
        ...rest
      });
    } else if (formData.id) {
      await inventoryHook.updateInventory({ ...formData, id: formData.id });
    }
    await loadInventory();
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
          <h1 className="text-3xl font-bold text-gray-900">Inventory Monitor</h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage inventory across all shops and branches
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
            onClick={handleViewMovements}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <History className="w-4 h-4 mr-2" />
            View Movements
          </button>
        
        </div>
      </div>

      {/* Stats Cards */}
      <InventoryStatsCards stats={stats} />

      {/* Filters */}
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="form-control w-full"
            />
          </div>
          
          {/* Location Filter */}
          <div>
            <LocationSelector
              value={selectedLocation}
              onChange={setSelectedLocation}
              filterType={LocationType.BRANCH}
              label="Filter by Location"
              showAll={true}
              placeholder="All Locations"
            />
          </div>
          
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-control w-full"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as typeof selectedStatus)}
              className="form-control w-full"
            >
              <option value="">All Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="overstocked">Overstocked</option>
            </select>
          </div>

          {/* Transfer Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Transfer Type</label>
            <select
              value={warehouseOr === null ? '' : warehouseOr.toString()}
              onChange={(e) => setWarehouseOr(e.target.value === '' ? null : e.target.value === 'true')}
              className="form-control w-full"
            >
              <option value="">All Types</option>
              <option value="true">Warehouse Transfer</option>
              <option value="false">Branch Transfer</option>
            </select>
          </div>
        </div>
        
        {/* Reset Button */}
        {(searchQuery || selectedLocation || selectedCategory || selectedStatus || warehouseOr !== null) && (
          <div className="mt-4 flex justify-end">
            <button onClick={handleResetFilters} className="btn-secondary">
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Inventory Table */}
      <InventoryTable
        inventory={filteredInventory}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onAdjustStock={handleAdjustStock}
        onTransferStock={handleTransferStock}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />

     

      {/* Results count */}
      {filteredInventory.length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          Showing {filteredInventory.length} of {totalItems} inventory items
        </div>
      )}

      {/* Raw Data Modal */}
      <DataRawModal
        isOpen={isRawModalOpen}
        onClose={() => {
          setIsRawModalOpen(false);
          setRawData(null);
        }}
        data={rawData}
        title="Inventory Item Raw Data"
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustModalOpen}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        onAdjust={handleAdjustSubmit}
      />

      {/* Stock Transfer Modal */}
      <StockTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        branches={[]}
        onTransfer={handleTransferSubmit}
      />

      {/* Product Transfer Modal */}
      <ProductTransferModal
        isOpen={isProductTransferModalOpen}
        onClose={() => setIsProductTransferModalOpen(false)}
        onSuccess={() => {
          setIsProductTransferModalOpen(false);
          loadInventory();
        }}
        warehouseOr={warehouseOr}
      />

      {/* Inventory Form Modal */}
      <InventoryFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem as any}
        branches={[]}
        products={products}
        onSubmit={handleFormSubmit}
        mode={formMode}
      />

      {/* Stock Movements Modal */}
      <StockMovementsModal
        isOpen={isMovementsModalOpen}
        onClose={() => setIsMovementsModalOpen(false)}
        onLoadMovements={async (productId, branchId) => {
          const result = await inventoryHook.getStockMovements(productId, branchId);
          return { data: (result?.data || []) as Array<{
            id: string;
            productId: string;
            movementType: string;
            quantity: number;
            quantityBefore: number;
            quantityAfter: number;
            notes?: string;
            createdAt: string;
            product?: { 
              id: string;
              productCode: string;
              sku: string;
              name: string;
              category: { name: string; };
            };
          }> };
        }}
      />
    </div>
  );
}
