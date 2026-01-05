import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import usePurchaseOrder from '../../../hooks/usePurchaseOrder';
import useSupplier from '../../../hooks/useSupplier';
import useProduct from '../../../hooks/useProduct';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface AddPurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialSupplierId?: string;
}

interface OrderItem {
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
}

const validationSchema = Yup.object({
  supplierId: Yup.string().required('Supplier is required'),
  orderDate: Yup.string().required('Order date is required'),
  expectedDate: Yup.string().optional(),
  priority: Yup.string().oneOf(['LOW', 'NORMAL', 'HIGH', 'URGENT']).required('Priority is required'),
  paymentTerms: Yup.string().optional(),
  shippingMethod: Yup.string().optional(),
  shippingAddress: Yup.string().optional(),
  shippingCost: Yup.number().min(0).optional(),
  discountAmount: Yup.number().min(0).optional(),
  taxAmount: Yup.number().min(0).optional(),
  notes: Yup.string().optional(),
});

export default function AddPurchaseOrderModal({ isOpen, onClose, onSuccess, initialSupplierId }: AddPurchaseOrderModalProps) {
  const purchaseOrderHook = usePurchaseOrder();
  const supplierHook = useSupplier();
  const productHook = useProduct();
  
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Array<{id: string; name: string; supplierCode: string}>>([]);
  const [products, setProducts] = useState<Array<{id: string; name: string; productCode: string; unitPrice: number; costPrice?: number}>>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [currentItem, setCurrentItem] = useState<OrderItem>({
    productId: '',
    quantity: 1,
    unitPrice: 0,
    discountPercent: 0,
    taxPercent: 0,
  });

  const formik = useFormik({
    initialValues: {
      supplierId: initialSupplierId || '',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: '',
      priority: 'NORMAL' as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
      paymentTerms: '',
      shippingMethod: '',
      shippingAddress: '',
      shippingCost: 0,
      discountAmount: 0,
      taxAmount: 0,
      notes: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      if (items.length === 0) {
        toast.error('Please add at least one item');
        return;
      }

      setLoading(true);
      try {
        // Convert date-only values to full ISO datetimes and coerce numeric fields
        const orderData = {
          ...values,
          orderDate: values.orderDate ? new Date(values.orderDate + 'T00:00:00Z').toISOString() : values.orderDate,
          expectedDate: values.expectedDate ? new Date(values.expectedDate + 'T00:00:00Z').toISOString() : values.expectedDate,
          shippingCost: Number(values.shippingCost) || 0,
          discountAmount: Number(values.discountAmount) || 0,
          taxAmount: Number(values.taxAmount) || 0,
          items: items.map(item => ({
            productId: item.productId,
            quantity: Number(item.quantity) || 0,
            unitPrice: Number(item.unitPrice) || 0,
            discountPercent: Number(item.discountPercent) || 0,
            taxPercent: Number(item.taxPercent) || 0,
          })),
        };

       const result = await purchaseOrderHook.createPurchaseOrder(orderData);
       console.log('Create Purchase Order Result:', result);
       if (result?.success===true) {
        onSuccess();
        handleClose();}
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to create purchase order';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
  });

  // Ensure supplier is pre-selected when modal opens or when initialSupplierId changes
  useEffect(() => {
    if (isOpen) {
      // set the supplierId in the form to the provided initial value (or empty string)
      formik.setFieldValue('supplierId', initialSupplierId || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSupplierId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadSuppliers();
      loadProducts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const loadSuppliers = async () => {
    try {
      const response = await supplierHook.getAllSuppliers({ limit: 1000, status: 'ACTIVE' });
      if (response?.data && Array.isArray(response.data)) {
        setSuppliers(response.data);
      }
    } catch (error) {
      console.error('Failed to load suppliers', error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productHook.getAllProducts({ limit: 1000, isActive: true });
      if (response?.data && Array.isArray(response.data)) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Failed to load products', error);
    }
  };

  const handleClose = () => {
    formik.resetForm();
    setItems([]);
    setCurrentItem({
      productId: '',
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      taxPercent: 0,
    });
    onClose();
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setCurrentItem({
        ...currentItem,
        productId,
        productName: product.name,
        unitPrice: Number(product.costPrice ?? product.unitPrice ?? 0),
      });
    }
  };

  const handleAddItem = () => {
    if (!currentItem.productId) {
      toast.error('Please select a product');
      return;
    }
    if (currentItem.quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    if (currentItem.unitPrice < 0) {
      toast.error('Unit price cannot be negative');
      return;
    }

    const existingIndex = items.findIndex(item => item.productId === currentItem.productId);
    if (existingIndex >= 0) {
      const updatedItems = [...items];
      updatedItems[existingIndex] = currentItem;
      setItems(updatedItems);
    } else {
      setItems([...items, currentItem]);
    }

    setCurrentItem({
      productId: '',
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      taxPercent: 0,
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateItemTotal = (item: OrderItem) => {
    const subtotal = item.quantity * item.unitPrice;
    const discount = (subtotal * item.discountPercent) / 100;
    const afterDiscount = subtotal - discount;
    const tax = (afterDiscount * item.taxPercent) / 100;
    return afterDiscount + tax;
  };

  const calculateOrderTotal = () => {
    const itemsTotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    const shipping = formik.values.shippingCost || 0;
    const discount = formik.values.discountAmount || 0;
    const tax = formik.values.taxAmount || 0;
    return itemsTotal + shipping - discount + tax;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Create Purchase Order</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={formik.handleSubmit} className="p-6 space-y-6">
          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier <span className="text-red-500">*</span>
              </label>
              <select
                name="supplierId"
                value={formik.values.supplierId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select Supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name} ({supplier.supplierCode})
                  </option>
                ))}
              </select>
              {formik.touched.supplierId && formik.errors.supplierId && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.supplierId}</p>
              )}
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="orderDate"
                value={formik.values.orderDate}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
              {formik.touched.orderDate && formik.errors.orderDate && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.orderDate}</p>
              )}
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Date</label>
              <input
                type="date"
                name="expectedDate"
                value={formik.values.expectedDate}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                name="priority"
                value={formik.values.priority}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
              <input
                type="text"
                name="paymentTerms"
                value={formik.values.paymentTerms}
                onChange={formik.handleChange}
                placeholder="e.g., Net 30"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Method</label>
              <input
                type="text"
                name="shippingMethod"
                value={formik.values.shippingMethod}
                onChange={formik.handleChange}
                placeholder="e.g., Standard Delivery"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address</label>
              <textarea
                name="shippingAddress"
                value={formik.values.shippingAddress}
                onChange={formik.handleChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Add Items */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Order Items</h3>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                  <select
                    value={currentItem.productId}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {product.productCode}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={currentItem.unitPrice}
                    onChange={(e) => setCurrentItem({ ...currentItem, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={currentItem.discountPercent}
                    onChange={(e) => setCurrentItem({ ...currentItem, discountPercent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={currentItem.taxPercent}
                    onChange={(e) => setCurrentItem({ ...currentItem, taxPercent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="mt-3 inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </button>
            </div>

            {/* Items List */}
            {items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Discount %</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tax %</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item, index) => {
                      const product = products.find(p => p.id === item.productId);
                      return (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm">{product?.name || item.productName}</td>
                          <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right">Rs. {item.unitPrice}</td>
                          <td className="px-4 py-3 text-sm text-right">{item.discountPercent}%</td>
                          <td className="px-4 py-3 text-sm text-right">{item.taxPercent}%</td>
                          <td className="px-4 py-3 text-sm text-right font-medium">
                            Rs. {calculateItemTotal(item).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="border-t pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Cost</label>
                <input
                  type="number"
                  name="shippingCost"
                  min="0"
                  step="0.01"
                  value={formik.values.shippingCost}
                  onChange={formik.handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Discount</label>
                <input
                  type="number"
                  name="discountAmount"
                  min="0"
                  step="0.01"
                  value={formik.values.discountAmount}
                  onChange={formik.handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Tax</label>
                <input
                  type="number"
                  name="taxAmount"
                  min="0"
                  step="0.01"
                  value={formik.values.taxAmount}
                  onChange={formik.handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-lg font-semibold">
                  Total Amount: <span className="text-orange-600">Rs. {calculateOrderTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={formik.values.notes}
              onChange={formik.handleChange}
              rows={3}
              placeholder="Additional notes or instructions..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Purchase Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
