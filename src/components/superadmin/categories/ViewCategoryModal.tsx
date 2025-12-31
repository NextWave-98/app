import { X, Tag, FolderTree, Hash, Calendar, CheckCircle, XCircle } from 'lucide-react';

interface ViewCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: CategoryItem | null;
}

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

export default function ViewCategoryModal({ isOpen, onClose, category }: ViewCategoryModalProps) {
  if (!isOpen || !category) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Category Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {category.isActive ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                <XCircle className="w-3 h-3 mr-1" />
                Inactive
              </span>
            )}
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <Tag className="w-4 h-4 mr-2" />
                Category Name
              </div>
              <p className="text-lg font-semibold text-gray-900">{category.name}</p>
            </div>

            {category.description && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Description</div>
                <p className="text-gray-900">{category.description}</p>
              </div>
            )}

            {category.parent && (
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <FolderTree className="w-4 h-4 mr-2" />
                  Parent Category
                </div>
                <p className="text-gray-900">{category.parent.name}</p>
              </div>
            )}

            <div>
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <Hash className="w-4 h-4 mr-2" />
                Display Order
              </div>
              <p className="text-gray-900">{category.displayOrder}</p>
            </div>

            {category.productCount !== undefined && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Products in Category</div>
                <p className="text-gray-900">{category.productCount} products</p>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Metadata</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <Calendar className="w-4 h-4 mr-2" />
                  Created At
                </div>
                <p className="text-sm text-gray-900">{formatDate(category.createdAt)}</p>
              </div>
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <Calendar className="w-4 h-4 mr-2" />
                  Updated At
                </div>
                <p className="text-sm text-gray-900">{formatDate(category.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* ID */}
          <div className="pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Category ID</div>
            <p className="text-xs text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded break-all">
              {category.id}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
