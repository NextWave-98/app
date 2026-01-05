import React, { useMemo } from 'react';
import {
  Search,
  Plus,
  Package,
  AlertTriangle
} from 'lucide-react';
import type { Product } from '../../../pages/branch/POSPage';
import { formatCurrency } from '../../../utils/currency';

interface ProductGridProps {
  products: Product[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  onAddToCart: (product: Product) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  onAddToCart
}) => {
  // Get unique categories from products
  const categories = useMemo(() => {
    const uniqueCategories = new Set(products.map(p => p.category));
    return [
      { id: 'all', label: 'All Products' },
      ...Array.from(uniqueCategories).map(cat => ({
        id: cat,
        label: cat.charAt(0).toUpperCase() + cat.slice(1)
      }))
    ];
  }, [products]);

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.productCode?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get stock status color
  const getStockStatusColor = (stock: number) => {
    if (stock === 0) return 'text-red-600';
    if (stock < 10) return 'text-orange-600';
    if (stock < 20) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Header with Search and Filters */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Products</h3>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search products by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border focus:outline-none border-gray-300 rounded-lg focus:ring-1 focus:ring-[#1e3a8a]-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const isSelected = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-[#1e3a8a] text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid */}
      <div className="p-4 flex-1 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <div className="text-center flex flex-col items-center justify-center h-full">
            <div className="text-gray-400 mb-4">
              <Package className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProducts.map((product) => {
              const stockColor = getStockStatusColor(product.stock);
              const isOutOfStock = product.stock === 0;

              return (
                <div
                  key={product.id}
                  className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all ${
                    isOutOfStock
                      ? 'border-red-200 bg-gray-50 opacity-60'
                      : 'border-gray-200 cursor-pointer hover:border-orange-300'
                  }`}
                  onClick={() => !isOutOfStock && onAddToCart(product)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`${isOutOfStock ? 'bg-gray-200' : 'bg-orange-100'} p-3 rounded-lg`}>
                        <Package className={`w-6 h-6 ${isOutOfStock ? 'text-gray-400' : 'text-[#1e3a8a]'}`} />
                      </div>
                      <div>
                        <h4 className={`text-sm font-semibold ${isOutOfStock ? 'text-gray-500' : 'text-gray-900'}`}>
                          {product.name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">{product.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <div>
                      <p className={`text-lg font-bold ${isOutOfStock ? 'text-gray-500' : 'text-[#1e3a8a]'}`}>
                        {formatCurrency(product.price)}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {product.stock < 10 && product.stock > 0 && (
                          <AlertTriangle className="w-3 h-3 text-orange-600" />
                        )}
                        <p className={`text-xs font-medium ${stockColor}`}>
                          {isOutOfStock ? 'Out of Stock' : `Stock: ${product.stock}`}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isOutOfStock) onAddToCart(product);
                      }}
                      disabled={isOutOfStock}
                      className={`p-2 rounded-lg transition-all ${
                        isOutOfStock
                          ? 'bg-gray-200 cursor-not-allowed'
                          : 'bg-[#1e3a8a] hover:bg-orange-700 text-white shadow-sm hover:shadow-md'
                      }`}
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Results Count */}
      {filteredProducts.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <p className="text-sm text-gray-600 text-center">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
