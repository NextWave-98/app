/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useInventory } from '../../hooks/useInventory';
import useSales from '../../hooks/useSales';
import useCustomer from '../../hooks/useCustomer';
import ProductGrid from '../../components/branch/pos/ProductGrid';
import CartSummary from '../../components/branch/pos/CartSummary';
import PaymentModal, { type OrderData } from '../../components/branch/pos/PaymentModal';
import BillModal from '../../components/branch/pos/BillModal';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  image?: string;
  category: string;
  productId: string;
  warrantyMonths?: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image?: string;
  description?: string;
  productId: string;
  brand?: string;
  model?: string;
  warrantyMonths?: number;
  productCode?: string;
}

interface InventoryItem {
  id: string;
  productId: string;
  product?: {
    name: string;
    unitPrice: number;
    category?: { name: string };
    primaryImage?: string;
    model?: string;
    brand?: string;
    isActive: boolean;
    warrantyMonths?: number;
    productCode?: string;
  };
  quantity: number;
  availableQuantity: number;
}

interface ApiResponse {
  status: boolean;
  message: string;
  saleId: string;
  saleNumber: string;
  sale: unknown;
  order: OrderData;
}

const POSPage: React.FC = () => {
  const { user } = useAuth();
  const { getAllInventory } = useInventory();
  const { createSale } = useSales();
  const { searchCustomers, createCustomer } = useCustomer();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [completedOrderData, setCompletedOrderData] = useState<OrderData | null>(null);
  const [responseData, setResponseData] = useState<ApiResponse | null>(null);

  // Load products on mount
  useEffect(() => {
    if (user?.locationId || user?.branchId) {
      loadProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.locationId, user?.branchId]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      const userLocationId = user?.locationId || user?.branchId;
      if (!userLocationId) {
        throw new Error('Location information not available');
      }

      const response = await getAllInventory({
        locationId: userLocationId,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      if (response?.data) {
        const payload = response.data as any;
        const items: InventoryItem[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.inventory)
            ? payload.inventory
            : Array.isArray(payload?.items)
              ? payload.items
              : [];

        const transformedProducts = items
          .filter((item: InventoryItem) => item.quantity > 0 && item.product?.isActive)
          .map((item: InventoryItem) => ({
            id: item.id,
            productId: item.productId,
            name: item.product?.name || 'Unknown Product',
            price: Number(item.product?.unitPrice) || 0,
            stock: item.availableQuantity || 0,
            category: item.product?.category?.name?.toLowerCase() || 'other',
            image: item.product?.primaryImage,
            description: item.product?.model || item.product?.brand || '',
            brand: item.product?.brand,
            model: item.product?.model,
            warrantyMonths: item.product?.warrantyMonths || 0,
            productCode: item.product?.productCode,
          }));
        
        setProducts(transformedProducts);
        if (transformedProducts.length === 0) {
          // toast.error('No products available in inventory', { duration: 4000 });
        } else {
          // toast.success(`Loaded ${transformedProducts.length} products`, { duration: 2000 });
        }
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load products';
      toast.error(
        <div>
          <p>{errorMessage}</p>
          <button 
            onClick={loadProducts} 
            className="mt-2 text-sm underline"
          >
            Retry
          </button>
        </div>,
        { duration: 6000 }
      );
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Add item to cart
  const handleAddToCart = (product: Product) => {
    // Check if product is available
    if (product.stock <= 0) {
      toast.error(`${product.name} is out of stock`, { duration: 3000 });
      return;
    }

    const existingItem = cartItems.find(item => item.id === product.id);

    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCartItems(cartItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
        toast.success(`Added ${product.name} to cart`, { duration: 2000 });
      } else {
        toast.error(`Only ${product.stock} units available for ${product.name}`, { duration: 3000 });
      }
    } else {
      setCartItems([...cartItems, {
        id: product.id,
        productId: product.productId,
        name: product.name,
        price: product.price,
        quantity: 1,
        stock: product.stock,
        category: product.category,
        image: product.image,
        warrantyMonths: product.warrantyMonths || 0
      }]);
      toast.success(`${product.name} added to cart`, { duration: 2000 });
    }
  };

  // Update cart item quantity
  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(cartItems.filter(item => item.id !== id));
      toast.success('Item removed from cart', { duration: 2000 });
      return;
    }

    // Validate stock before updating quantity
    const product = products.find(p => p.id === id);
    if (product && quantity > product.stock) {
      toast.error(`Only ${product.stock} units available`, { duration: 3000 });
      return;
    }

    setCartItems(cartItems.map(item =>
      item.id === id ? { ...item, quantity } : item
    ));
  };

  // Remove item from cart
  const handleRemoveItem = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  // Clear cart
  const handleClearCart = () => {
    setCartItems([]);
  };

  // Handle checkout
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty. Please add items before checkout.', { duration: 3000 });
      return;
    }

    // Validate stock availability for all cart items
    const outOfStock = cartItems.filter(item => {
      const product = products.find(p => p.id === item.id);
      return !product || product.stock < item.quantity;
    });

    if (outOfStock.length > 0) {
      toast.error(
        `Some items are out of stock or quantity exceeds available stock: ${outOfStock.map(i => i.name).join(', ')}`,
        { duration: 5000 }
      );
      return;
    }

    setIsPaymentModalOpen(true);
  };

  // Handle payment completion
  const handlePaymentComplete = async (orderData: OrderData) => {
    console.log('==================== PAYMENT COMPLETED ====================');
    console.log('Order received in POSPage:', orderData);
    console.log('===========================================================');

    try {
      // Validate required data
      const userLocationId = user?.locationId || user?.branchId;
      if (!userLocationId) {
        throw new Error('Location information not found');
      }

      if (!user?.id) {
        throw new Error('User information not found');
      }

      if (cartItems.length === 0) {
        throw new Error('Cart is empty');
      }

      // Step 1: Find or create customer (optional for POS)
      let customerId: string | undefined = orderData.customer.id;
      
      if (orderData.customer.phone && !customerId) {
        // Process phone number: remove +94 prefix if present
        let processedPhone = orderData.customer.phone;
        if (processedPhone.startsWith('+94')) {
          processedPhone = processedPhone.substring(3); // Remove +94
        }

        // Search for existing customer by phone
        const searchResponse = await searchCustomers(processedPhone, 1);
        const customers: Array<{ id: string; name: string; phone: string; email?: string }> = (searchResponse?.data as Array<{ id: string; name: string; phone: string; email?: string }>) || [];
        
        if (customers.length > 0) {
          customerId = customers[0].id;
          console.log('Existing customer found:', customerId);
        } else {
          // Create new customer
          const createResponse = await createCustomer({
            name: orderData.customer.name,
            phone: processedPhone,
            email: orderData.customer.email || undefined,
            locationId: userLocationId,
            customerType: 'WALK_IN',
          });
          const createData = createResponse?.data as { id?: string } | undefined;
          
          if (createData?.id) {
            customerId = createData.id;
            console.log('New customer created:', customerId);
          }
        }
      }

      // Step 2: Prepare sale items
      const saleItems = cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: Number(item.price),
        costPrice: Number(item.price * 0.7), // Assume 30% margin if not specified
        discount: 0,
        discountType: 'FIXED' as const,
        tax: 0,
        warrantyMonths: item.warrantyMonths || 0,
      }));

      // Step 3: Prepare payment
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const discountAmount = orderData.discount || 0;
      const finalAmount = totalAmount - discountAmount;

      const payments = [{
        method: orderData.paymentMethod as 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE' | 'MOBILE_MONEY',
        amount: finalAmount,
        reference: orderData.reference || `POS-${Date.now()}`,
      }];

      // Step 4: Create sale via API
      console.log('Creating sale with data:', {
        branchId: user.branchId,
        customerId,
        items: saleItems,
        payments,
        type: 'DIRECT_SALE',
        discount: discountAmount,
        notes: `POS Sale - ${orderData.customer.name}`,
      });

      const saleResponse = await createSale({
        locationId: userLocationId,
        soldById: user.id,
        customerId,
        items: saleItems,
        payments,
        type: 'DIRECT_SALE',
        discount: discountAmount,
        discountType: orderData.discountType,
        notes: `POS Sale - ${orderData.customer.name}`,
      });

      console.log('Sale created:', saleResponse?.data);

      if (!saleResponse?.data) {
        throw new Error('No response from sale creation');
      }

      const saleData = saleResponse.data as { 
        sale?: { id: string; saleNumber: string };
        id?: string;
        saleNumber?: string;
      };

      const saleId = saleData.sale?.id || saleData.id;
      const saleNumber = saleData.sale?.saleNumber || saleData.saleNumber;

      if (!saleId || !saleNumber) {
        throw new Error('Invalid sale response');
      }

      // Step 5: Return successful response
      const response: { data: ApiResponse } = {
        data: {
          status: true,
          message: 'Sale completed successfully',
          saleId,
          saleNumber,
          sale: saleData,
          order: { ...orderData, customer: { ...orderData.customer, id: customerId } },
        },
      };

      toast.success(`Sale completed successfully! Sale Number: ${saleNumber}`, { duration: 5000 });
      
      // Reload products to update stock
      await loadProducts();

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process sale';
      console.error('Sale processing failed:', error);
      
      // Provide detailed error feedback
      if (errorMessage.includes('stock') || errorMessage.includes('inventory')) {
        toast.error('Stock error: ' + errorMessage, { duration: 5000 });
      } else if (errorMessage.includes('customer')) {
        toast.error('Customer error: ' + errorMessage, { duration: 5000 });
      } else if (errorMessage.includes('payment')) {
        toast.error('Payment error: ' + errorMessage, { duration: 5000 });
      } else {
        toast.error('Sale failed: ' + errorMessage, { duration: 5000 });
      }
      
      throw error;
    }
  };

  // Handle payment success (opens BillModal)
  const handlePaymentSuccess = (orderData: OrderData, apiResponseData: ApiResponse) => {
    console.log('Payment successful, opening bill modal');
    console.log('API Response:', apiResponseData);

    // Store order data for BillModal
    setCompletedOrderData(orderData);
    setResponseData(apiResponseData);

    // Reset cart
    setCartItems([]);

    // Open BillModal
    setIsBillModalOpen(true);
  };

  // Handle bill modal close
  const handleBillModalClose = () => {
    setIsBillModalOpen(false);
    setCompletedOrderData(null);
    setResponseData(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <Loader2 className="w-12 h-12 animate-spin text-[#1e3a8a] mx-auto mb-4" />
          <p className="text-gray-900 font-semibold mb-1">Loading POS System</p>
          <p className="text-gray-600 text-sm">Fetching branch inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-2 pb-8">
      {/* Main POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection Area - 2 columns */}
        <div className="lg:col-span-2">
          <ProductGrid
            products={products}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onAddToCart={handleAddToCart}
          />
        </div>

        {/* Cart Summary Area - 1 column */}
        <div className="lg:col-span-1">
          <CartSummary
            cartItems={cartItems}
            total={total}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onCheckout={handleCheckout}
          />
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onPaymentComplete={handlePaymentComplete}
          onPaymentSuccess={handlePaymentSuccess}
          cartItems={cartItems}
          total={total}
        />
      )}

      {/* Bill Modal */}
      <BillModal
        isOpen={isBillModalOpen}
        onClose={handleBillModalClose}
        orderData={completedOrderData}
        responseData={responseData}
      />
    </div>
  );
};

export default POSPage;
