/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useProduct } from '../../../hooks/useProduct';
import { useProductCategory } from '../../../hooks/useProductCategory';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Category {
  id: string;
  name: string;
  categoryCode: string;
}

const validationSchema = Yup.object({
  name: Yup.string().required('Product name is required'),
  description: Yup.string(),
  categoryId: Yup.string().required('Category is required'),
  brand: Yup.string(),
  model: Yup.string(),
  sku: Yup.string(),
  barcode: Yup.string(),
  unitPrice: Yup.number()
    .required('Unit price is required')
    .min(0, 'Unit price must be positive'),
  costPrice: Yup.number()
    .required('Cost price is required')
    .min(0, 'Cost price must be positive'),
  minStockLevel: Yup.number()
    .min(0, 'Min stock level must be positive')
    .integer('Min stock level must be a whole number')
    .default(5),
  maxStockLevel: Yup.number()
    .min(0, 'Max stock level must be positive')
    .integer('Max stock level must be a whole number')
    .default(100),
  reorderLevel: Yup.number()
    .min(0, 'Reorder level must be positive')
    .integer('Reorder level must be a whole number')
    .default(10),
  reorderQuantity: Yup.number()
    .min(0, 'Reorder quantity must be positive')
    .integer('Reorder quantity must be a whole number')
    .default(20),
  warrantyMonths: Yup.number()
    .min(0, 'Warranty months must be positive')
    .integer('Warranty months must be a whole number')
    .default(0),
  warrantyType: Yup.string().default('STANDARD'),
});

export default function AddStockModal({ isOpen, onClose, onSuccess }: AddStockModalProps) {
  const productHook = useProduct();
  const categoryHook = useProductCategory();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const loadInitialData = useCallback(async () => {
    setLoadingData(true);
    try {
      // Load categories
      const categoryResponse = await categoryHook.getAllCategories({ limit: 100 });
      if (categoryResponse?.data) {
        setCategories(categoryResponse.data as Category[]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoadingData(false);
    }
  }, [categoryHook]);

  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      categoryId: '',
      brand: '',
      model: '',
      sku: '',
      barcode: '',
      unitPrice: '',
      costPrice: '',
      minStockLevel: '5',
      maxStockLevel: '100',
      reorderLevel: '10',
      reorderQuantity: '20',
      warrantyMonths: '0',
      warrantyType: 'STANDARD',
      terms: '',
      coverage: '',
      exclusions: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const submitData = {
          name: values.name,
          description: values.description || undefined,
          categoryId: values.categoryId,
          brand: values.brand || undefined,
          model: values.model || undefined,
          sku: values.sku || undefined,
          barcode: values.barcode || undefined,
          unitPrice: parseFloat(values.unitPrice),
          costPrice: parseFloat(values.costPrice),
          minStockLevel: parseInt(values.minStockLevel) || 5,
          maxStockLevel: parseInt(values.maxStockLevel) || 100,
          reorderLevel: parseInt(values.reorderLevel) || 10,
          reorderQuantity: parseInt(values.reorderQuantity) || 20,
          warrantyMonths: parseInt(values.warrantyMonths) || 0,
          warrantyType: values.warrantyType || 'STANDARD',
          terms: values.terms || undefined,
          coverage: values.coverage || undefined,
          exclusions: values.exclusions || undefined,
          isActive: true,
        };

        const response = await productHook.createProduct(submitData);

        if (response?.success) {
          toast.success('Product added successfully');
          onSuccess();
          onClose();
          formik.resetForm();
        }
      } catch (error) {
        console.error('Error adding product:', error);
        toast.error('Failed to add product');
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Add Product</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={formik.handleSubmit} className="p-6">
          {loadingData ? (
            <div className="py-12 text-center text-gray-600">Loading categories...</div>
          ) : (
            <>
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
                    placeholder="Enter product name"
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
                    placeholder="Enter product description"
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
                      placeholder="e.g., HP, Dell, Samsung"
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
                      placeholder="Model number"
                    />
                  </div>
                </div>

                {/* SKU and Barcode */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                    <input
                      type="text"
                      name="sku"
                      value={formik.values.sku}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Stock keeping unit"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                    <input
                      type="text"
                      name="barcode"
                      value={formik.values.barcode}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Product barcode"
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
                      placeholder="0.00"
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
                      placeholder="0.00"
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

                {/* Stock Levels */}
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
                  {loading ? 'Adding...' : 'Add Product'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
