import { useCallback } from 'react';
import useFetch from './useFetch';

export interface ProductItem {
  id: string;
  sku?: string;
  barcode?: string;
  productCode: string;
  name: string;
  description?: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    categoryCode: string;
  };
  brand?: string;
  model?: string;
  compatibility?: string;
  specifications?: Record<string, unknown>;
  unitPrice: number;
  costPrice: number;
  wholesalePrice?: number;
  profitMargin?: number;
  taxRate: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderLevel: number;
  reorderQuantity: number;
  weight?: number;
  dimensions?: string;
  warrantyMonths: number;
  warrantyType: string;
  qualityGrade: string;
  terms?: string;
  coverage?: string;
  exclusions?: string;
  isActive: boolean;
  isDiscontinued: boolean;
  images?: string[];
  primaryImage?: string;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  id: string;
  sku?: string;
  barcode?: string;
  productCode: string;
  name: string;
  description?: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
  };
  brand?: string;
  model?: string;
  compatibility?: string;
  specifications?: Record<string, unknown>;
  unitPrice: number;
  costPrice: number;
  wholesalePrice?: number;
  profitMargin?: number;
  taxRate: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderLevel: number;
  reorderQuantity: number;
  weight?: number;
  dimensions?: string;
  warrantyMonths: number;
  warrantyType: string;
  qualityGrade: string;
  terms?: string;
  coverage?: string;
  exclusions?: string;
  isActive: boolean;
  isDiscontinued: boolean;
  images?: string[];
  primaryImage?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  branchId?: string;
  brand?: string;
  qualityGrade?: string;
  isActive?: boolean;
  isDiscontinued?: boolean;
  lowStock?: boolean;
  sortBy?: 'name' | 'productCode' | 'unitPrice' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  discontinuedProducts: number;
  lowStockProducts: number;
  totalValue: number;
  categoryBreakdown: Record<string, number>;
}

interface CreateProductData {
  sku?: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId: string;
  brand?: string;
  model?: string;
  compatibility?: string;
  specifications?: Record<string, unknown>;
  unitPrice: number;
  costPrice: number;
  wholesalePrice?: number;
  profitMargin?: number;
  taxRate?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderLevel?: number;
  reorderQuantity?: number;
  weight?: number;
  dimensions?: string;
  warrantyMonths?: number;
  warrantyType?: string;
  qualityGrade?: string;
  terms?: string;
  coverage?: string;
  exclusions?: string;
  isActive?: boolean;
  images?: string[];
  primaryImage?: string;
}

interface UpdateProductData extends Partial<CreateProductData> {
  id: string;
}

interface BulkPriceUpdateData {
  productIds: string[];
  priceType: 'unitPrice' | 'costPrice' | 'wholesalePrice';
  updateType: 'percentage' | 'fixed';
  value: number;
}

export const useProduct = () => {
  const { fetchData, loading, error, data, reset } = useFetch();

  // Get all products with filters
  const getAllProducts = useCallback(async (filters?: ProductFilters) => {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }
    const endpoint = `/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await fetchData({
      endpoint,
      method: 'GET',  silent:true 
    });
  }, [fetchData]);

  // Get product by ID
  const getProductById = useCallback(async (id: string) => {
    return await fetchData({
      endpoint: `/products/${id}`,
      method: 'GET',  silent:true
    });
  }, [fetchData]);

  // Get low stock products
  const getLowStockProducts = useCallback(async () => {
    return await fetchData({
      endpoint: '/products/low-stock',
      method: 'GET',  silent:true
    });
  }, [fetchData]);

  // Get product statistics
  const getProductStats = useCallback(async () => {
    return await fetchData({
      endpoint: '/products/stats',
      method: 'GET',  silent:true
    });
  }, [fetchData]);

  // Create product
  const createProduct = useCallback(async (productData: CreateProductData) => {
    return await fetchData({
      endpoint: '/products',
      method: 'POST',
      data: productData,
      successMessage: 'Product created successfully',
    });
  }, [fetchData]);

  // Update product
  const updateProduct = useCallback(async (productData: UpdateProductData) => {
    const { id, ...updateData } = productData;
    return await fetchData({
      endpoint: `/products/${id}`,
      method: 'PUT',
      data: updateData,
      successMessage: 'Product updated successfully',
    });
  }, [fetchData]);

  // Delete product
  const deleteProduct = useCallback(async (id: string) => {
    return await fetchData({
      endpoint: `/products/${id}`,
      method: 'DELETE',
      successMessage: 'Product deleted successfully',
    });
  }, [fetchData]);

  // Bulk price update
  const bulkPriceUpdate = useCallback(async (updateData: BulkPriceUpdateData) => {
    return await fetchData({
      endpoint: '/products/bulk-price-update',
      method: 'POST',
      data: updateData,
      successMessage: 'Product prices updated successfully',
    });
  }, [fetchData]);

  // Transfer product between branches
  const transferProduct = useCallback(async (transferData: {
    productId: string;
    fromBranchId: string;
    toBranchId: string;
    quantity: number;
    notes?: string;
  }) => {
    return await fetchData({
      endpoint: '/products/transfer',
      method: 'POST',
      data: transferData,
      successMessage: 'Product transferred successfully',
    });
  }, [fetchData]);

  // Bulk transfer products
  const bulkTransferProducts = useCallback(async (transferData: {
    fromLocationId: string;
    toLocationId: string;
    notes?: string;
    products: {
      productId: string;
      quantity: number;
    }[];
  }) => {
    return await fetchData({
      endpoint: '/products/bulk-transfer',
      method: 'POST',
      data: transferData,
      successMessage: 'Products transferred successfully',
    });
  }, [fetchData]);

  // Adjust product stock
  const adjustProductStock = useCallback(async (adjustData: {
    productId: string;
    branchId: string;
    quantity: number;
    type: 'IN' | 'OUT';
    reason: string;
    notes?: string;
  }) => {
    return await fetchData({
      endpoint: '/products/adjust-stock',
      method: 'POST',
      data: adjustData,
      successMessage: 'Product stock adjusted successfully',
    });
  }, [fetchData]);

  // Bulk upload products
  const bulkUploadProducts = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return await fetchData({
      endpoint: '/products/bulk-upload',
      method: 'POST',
      file: file,
      successMessage: 'Products uploaded successfully',
    });
  }, [fetchData]);

  // Get stock movement history
  const getStockMovements = useCallback(async (filters?: {
    productId?: string;
    branchId?: string;
    movementType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }
    const endpoint = `/products/stock-movements${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await fetchData({
      endpoint,
      method: 'GET',
      silent: true
    });
  }, [fetchData]);

  return {
    // State
    products: data?.data as Product[] | undefined,
    product: data?.data as Product | undefined,
    stats: data?.data as ProductStats | undefined,
    loading,
    error,
    
    // Methods
    getAllProducts,
    getProductById,
    getLowStockProducts,
    getProductStats,
    createProduct,
    updateProduct,
    deleteProduct,
    bulkPriceUpdate,
    transferProduct,
    bulkTransferProducts,
    adjustProductStock,
    bulkUploadProducts,
    getStockMovements,
    reset,
  };
};

export default useProduct;
