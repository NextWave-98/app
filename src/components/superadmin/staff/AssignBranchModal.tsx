import { useState, useEffect } from 'react';
import { X, Building2, AlertCircle } from 'lucide-react';
import useFetch from '../../../hooks/useFetch';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface Branch {
  id: string;
  name: string;
  locationCode: string;
  branchCode?: string | null;
  address?: string;
  isActive: boolean;
}

interface BranchesResponse {
  locations: Branch[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface AssignBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (staffId: string, branchId: string | null) => Promise<void>;
  staffId: string;
  staffName: string;
  currentBranch?: {
    id: string;
    name: string;
    locationCode: string;
    branchCode?: string | null;
  } | null;
}

const validationSchema = Yup.object({
  branchId: Yup.string().nullable(),
});

export default function AssignBranchModal({
  isOpen,
  onClose,
  onSubmit,
  staffId,
  staffName,
  currentBranch,
}: AssignBranchModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);

  const branchesFetch = useFetch<BranchesResponse>('/locations');

  const formik = useFormik({
    initialValues: {
      branchId: currentBranch?.id || '',
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        await onSubmit(staffId, values.branchId || null);
        handleClose();
      } catch (error) {
        console.error('Error assigning branch:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (isOpen) {
      loadBranches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const loadBranches = async () => {
    setLoading(true);
    try {
      const response = await branchesFetch.fetchData({
        method: 'GET',
        silent: true,
        endpoint: '/locations?limit=100',
      });

      if (response?.data?.locations) {
        // Filter only active branches
        const activeBranches = response.data.locations.filter(
          (branch: Branch) => branch.isActive
        );
        setBranches(activeBranches);
      }
    } catch (error) {
      console.error('Failed to load branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      formik.resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Building2 className="w-6 h-6 text-orange-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Assign Branch</h2>
              <p className="text-sm text-gray-600 mt-0.5">{staffName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <p className="mt-2 text-gray-600">Loading branches...</p>
          </div>
        ) : (
          <form onSubmit={formik.handleSubmit} className="p-6 space-y-6">
            {/* Current Branch Info */}
            {currentBranch && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-orange-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-orange-900">
                      Currently Assigned
                    </h4>
                    <p className="text-sm text-orange-700 mt-1">
                      {currentBranch.name} ({currentBranch.branchCode || currentBranch.locationCode})
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Branch Selection */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Branch
                </label>
                <select
                  name="branchId"
                  value={formik.values.branchId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={branches.length === 0}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    formik.errors.branchId && formik.touched.branchId
                      ? 'border-red-500'
                      : 'border-gray-300'
                  } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                >
                  <option value="">Unassign from branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.branchCode || branch.locationCode})
                      {branch.address && ` - ${branch.address}`}
                    </option>
                  ))}
                </select>
                {formik.errors.branchId && formik.touched.branchId && (
                  <p className="mt-1 text-sm text-red-500">{formik.errors.branchId}</p>
                )}
                {branches.length === 0 && (
                  <p className="mt-1 text-sm text-amber-600">
                    No active branches available
                  </p>
                )}
              </div>

              {/* Info Message */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  {formik.values.branchId ? (
                    <>
                      <strong>Action:</strong> Staff member will be{' '}
                      {currentBranch ? 'reassigned' : 'assigned'} to the selected
                      branch.
                    </>
                  ) : (
                    <>
                      <strong>Action:</strong> Staff member will be unassigned from any
                      branch.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || branches.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                {isSubmitting
                  ? 'Assigning...'
                  : formik.values.branchId
                  ? 'Assign Branch'
                  : 'Unassign'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
