import { useState } from 'react';
import { X, Send, Users } from 'lucide-react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import useSMS from '../../../hooks/useSMS';
import type { Customer } from '../../../types/customer.types';

interface BulkSMSSameModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCustomers: Customer[];
  onSuccess?: () => void;
}

const validationSchema = Yup.object({
  message: Yup.string()
    .min(1, 'Message is required')
    .max(1000, 'Message too long')
    .required('Message is required'),
});

const BulkSMSSameModal: React.FC<BulkSMSSameModalProps> = ({
  isOpen,
  onClose,
  selectedCustomers,
  onSuccess,
}) => {
  const { sendBulkSameSMS } = useSMS();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: {
      message: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      if (selectedCustomers.length === 0) {
        toast.error('Please select at least one customer');
        return;
      }

      setIsSubmitting(true);
      try {
        const phoneNumbers = selectedCustomers
          .map(customer => customer.phone)
          .filter(phone => phone && phone.trim() !== '');

        if (phoneNumbers.length === 0) {
          toast.error('No valid phone numbers found');
          return;
        }

        const result = await sendBulkSameSMS({
          to: phoneNumbers,
          msg: values.message,
        });

        if (result?.success) {
          const smsResult = result.data as { deliveryWarning?: boolean };
          if (smsResult?.deliveryWarning) {
            toast.success('SMS request sent, but delivery may be delayed. Please check your SMS account balance and sender ID approval.', {
              duration: 6000,
            });
          } else {
            toast.success('Bulk SMS sent successfully');
          }
          onClose();
          onSuccess?.();
        } else {
          toast.error(result?.message || 'Failed to send SMS');
        }
      } catch (error) {
        console.error('Bulk SMS error:', error);
        toast.error('Failed to send bulk SMS');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm bg-opacity-50 transition-opacity flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <Send className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Send Bulk SMS (Same Message)</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={formik.handleSubmit} className="p-6 space-y-6">
          {/* Selected Customers Summary */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">
                {selectedCustomers.length} customer{selectedCustomers.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="text-sm text-blue-700">
              Valid phone numbers: {selectedCustomers.filter(c => c.phone && c.phone.trim() !== '').length}
            </div>
          </div>

          {/* Message Input */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Enter your message..."
              value={formik.values.message}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.message && formik.errors.message && (
              <p className="mt-1 text-sm text-red-600">{formik.errors.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              {formik.values.message.length}/1000 characters
            </p>
          </div>

          {/* Cost Check Option */}
          {/* Cost estimation not supported by current SMS provider */}
          
          {/* Cost Estimate Display */}
          {/* Cost estimation not supported by current SMS provider */}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedCustomers.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Send SMS'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkSMSSameModal;