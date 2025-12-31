/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import type { ProductItem } from '../../../hooks/useProduct';
import { useProduct } from '../../../hooks/useProduct';
import { useProductCategory } from '../../../hooks/useProductCategory';
import LoadingSpinner from '../../common/LoadingSpinner';

interface EditStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  stockItem: ProductItem | null;
}

const validationSchema = Yup.object({
  name: Yup.string().required('Product name is required'),
  description: Yup.string(),
  categoryId: Yup.string().required('Category is required'),
  brand: Yup.string(),
  model: Yup.string(),
  unitPrice: Yup.number()
    .required('Unit price is required')
    .min(0, 'Unit price must be positive'),
  costPrice: Yup.number()
    .required('Cost price is required')
    .min(0, 'Cost price must be positive'),
  minStockLevel: Yup.number()
    .min(0, 'Min stock level must be positive')
    .integer('Min stock level must be a whole number'),
  maxStockLevel: Yup.number()
    .min(0, 'Max stock level must be positive')
    .integer('Max stock level must be a whole number'),
  reorderLevel: Yup.number()
    .min(0, 'Reorder level must be positive')
    .integer('Reorder level must be a whole number'),
  reorderQuantity: Yup.number()
    .min(0, 'Reorder quantity must be positive')
    .integer('Reorder quantity must be a whole number'),
  warrantyMonths: Yup.number()
    .min(0, 'Warranty months must be positive')
    .integer('Warranty months must be a whole number'),
  warrantyType: Yup.string(),
});

export default function EditStockModal({ isOpen, onClose, onSuccess, stockItem }: EditStockModalProps) {
  const productHook = useProduct();
  const categoryHook = useProductCategory();
  const [loading, setLoading] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      categoryId: '',
      brand: '',
      model: '',
      unitPrice: '',
      costPrice: '',
      minStockLevel: '',
      maxStockLevel: '',
      reorderLevel: '',
      reorderQuantity: '',
      warrantyMonths: '',
      warrantyType: 'STANDARD',
      terms: '',
      coverage: '',
      exclusions: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!stockItem?.id) {
        toast.error('Product ID is missing');
        return;
      }

      setLoading(true);
      try {
        const submitData = {
          id: stockItem.id,
          name: values.name,
          description: values.description || undefined,
          categoryId: values.categoryId,
          brand: values.brand || undefined,
          model: values.model || undefined,
          unitPrice: values.unitPrice ? parseFloat(values.unitPrice) : undefined,
          costPrice: values.costPrice ? parseFloat(values.costPrice) : undefined,
          minStockLevel: values.minStockLevel ? parseInt(values.minStockLevel) : undefined,
          maxStockLevel: values.maxStockLevel ? parseInt(values.maxStockLevel) : undefined,
          reorderLevel: values.reorderLevel ? parseInt(values.reorderLevel) : undefined,
          reorderQuantity: values.reorderQuantity ? parseInt(values.reorderQuantity) : undefined,
          warrantyMonths: values.warrantyMonths ? parseInt(values.warrantyMonths) : undefined,
          warrantyType: values.warrantyType || undefined,
          terms: values.terms || undefined,
          coverage: values.coverage || undefined,
          exclusions: values.exclusions || undefined,
        };

        const response = await productHook.updateProduct(submitData);
        
        if (response?.success) {
          toast.success('Product updated successfully');
          onSuccess();
          onClose();
        }
      } catch (error) {
        console.error('Error updating product:', error);
        toast.error('Failed to update product');
      } finally {
        setLoading(false);
      }
    },
  });

  const loadStockDetails = useCallback(async () => {
    if (!stockItem?.id) return;
    
    setFetchingDetails(true);
    try {
      // Load categories
      const categoryResponse = await categoryHook.getAllCategories({ limit: 100 });
      if (categoryResponse?.data) {
        setCategories(categoryResponse.data);
      }

      // Load product details
      const response = await productHook.getProductById(stockItem.id);
      const data = response?.data;
      
      if (data) {
        formik.setValues({
          name: data.name || '',
          description: data.description || '',
          categoryId: data.categoryId || '',
          brand: data.brand || '',
          model: data.model || '',
          unitPrice: data.unitPrice?.toString() || '',
          costPrice: data.costPrice?.toString() || '',
          minStockLevel: data.minStockLevel?.toString() || '',
          maxStockLevel: data.maxStockLevel?.toString() || '',
          reorderLevel: data.reorderLevel?.toString() || '',
          reorderQuantity: data.reorderQuantity?.toString() || '',
          warrantyMonths: data.warrantyMonths?.toString() || '0',
          warrantyType: data.warrantyType || 'STANDARD',
          terms: data.terms || '',
          coverage: data.coverage || '',
          exclusions: data.exclusions || '',
        });
      }
    } catch (error) {
      console.error('Error loading product details:', error);
      toast.error('Failed to load product details');
    } finally {
      setFetchingDetails(false);
    }
  }, [productHook, categoryHook, stockItem?.id, formik]);

  useEffect(() => {
    if (stockItem && isOpen) {
      loadStockDetails();
    }
  }, [stockItem, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Edit Stock Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {fetchingDetails ? (
          <div className="p-12 flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <form onSubmit={formik.handleSubmit} className="p-6">
            {/* Product Information Header */}
            {stockItem && (
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Product Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Product Code:</span>
                    <span className="ml-2 font-medium">{stockItem.productCode || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Category:</span>
                    <span className="ml-2 font-medium">{stockItem.category?.name || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {formik.touched.name && formik.errors.name && (
                  <p className="mt-1 text-sm text-red-600">{formik.errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="categoryId"
                  value={formik.values.categoryId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {formik.touched.categoryId && formik.errors.categoryId && (
                  <p className="mt-1 text-sm text-red-600">{formik.errors.categoryId}</p>
                )}
              </div>

              {/* Brand and Model */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <input
                    type="text"
                    name="brand"
                    value={formik.values.brand}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input
                    type="text"
                    name="model"
                    value={formik.values.model}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="unitPrice"
                    value={formik.values.unitPrice}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {formik.touched.unitPrice && formik.errors.unitPrice && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.unitPrice}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="costPrice"
                    value={formik.values.costPrice}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {formik.touched.costPrice && formik.errors.costPrice && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.costPrice}</p>
                  )}
                </div>
              </div>

              {/* Warranty Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Warranty Information</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Months</label>
                    <input
                      type="number"
                      name="warrantyMonths"
                      min="0"
                      value={formik.values.warrantyMonths}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      placeholder="0"
                    />
                    <p className="mt-1 text-xs text-gray-500">Set to 0 for no warranty</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Type</label>
                    <select
                      name="warrantyType"
                      value={formik.values.warrantyType}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="STANDARD">Standard</option>
                      <option value="EXTENDED">Extended</option>
                      <option value="LIMITED">Limited</option>
                      <option value="LIFETIME">Lifetime</option>
                      <option value="NO_WARRANTY">No Warranty</option>
                    </select>
                  </div>
                </div>

                {/* Warranty Terms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Terms</label>
                  <textarea
                    name="terms"
                    rows={3}
                    value={formik.values.terms}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter warranty terms and conditions..."
                  />
                </div>

                {/* Coverage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coverage</label>
                  <textarea
                    name="coverage"
                    rows={3}
                    value={formik.values.coverage}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="What's covered under warranty..."
                  />
                </div>

                {/* Exclusions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exclusions</label>
                  <textarea
                    name="exclusions"
                    rows={3}
                    value={formik.values.exclusions}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="What's not covered under warranty..."
                  />
                </div>
              </div>

              {/* Stock Management */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Stock Management</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Level</label>
                    <input
                      type="number"
                      name="minStockLevel"
                      min="0"
                      value={formik.values.minStockLevel}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Stock Level</label>
                    <input
                      type="number"
                      name="maxStockLevel"
                      min="0"
                      value={formik.values.maxStockLevel}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                    <input
                      type="number"
                      name="reorderLevel"
                      min="0"
                      value={formik.values.reorderLevel}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Quantity</label>
                    <input
                      type="number"
                      name="reorderQuantity"
                      min="0"
                      value={formik.values.reorderQuantity}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Product'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
