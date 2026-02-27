/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, CreditCard, Building2, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import useFetch from '../../hooks/useFetch';

interface Customer {
    id: string;
    customerId: string;
    name: string;
    phone: string;
    email?: string;
}

interface FinancialDetails {
    nationalId: string;
    nationalIdIssueDate?: string;
    nationalIdExpiryDate?: string;
    bankName: string;
    bankBranch?: string;
    accountNumber: string;
    accountHolderName?: string;
    companyName: string;
    companyAddress?: string;
    jobPosition?: string;
    monthlyIncome?: number;
    supervisorName?: string;
    supervisorContact?: string;
    notes?: string;
}

export default function AddCustomerFinancialDetailsPage() {
    const navigate = useNavigate();
    const { customerId } = useParams<{ customerId: string }>();
    const [loading, setLoading] = useState(false);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loadingCustomer, setLoadingCustomer] = useState(true);

    const [formData, setFormData] = useState<FinancialDetails>({
        nationalId: '',
        nationalIdIssueDate: '',
        nationalIdExpiryDate: '',
        bankName: '',
        bankBranch: '',
        accountNumber: '',
        accountHolderName: '',
        companyName: '',
        companyAddress: '',
        jobPosition: '',
        monthlyIncome: undefined,
        supervisorName: '',
        supervisorContact: '',
        notes: '',
    });

    const { fetchData: getCustomer } = useFetch(`/customers/${customerId}`);
    const { fetchData: addFinancialDetails } = useFetch('/installments/financial-details');

    useEffect(() => {
        loadCustomer();
    }, [customerId]);

    const loadCustomer = async () => {
        try {
            setLoadingCustomer(true);
            const response = await getCustomer({
                method: 'GET',
                silent: true,
            });

            if (response?.success && response?.data) {
                setCustomer(response.data);
            } else {
                toast.error('Customer not found');
                navigate('../customers');
            }
        } catch (error) {
            toast.error('Failed to load customer');
            console.error(error);
            navigate('../customers');
        } finally {
            setLoadingCustomer(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value === '' ? undefined : parseFloat(value) });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nationalId || !formData.bankName || !formData.accountNumber || !formData.companyName) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);
            const response = await addFinancialDetails({
                method: 'POST',
                data: {
                    customerId,
                    ...formData,
                    nationalIdIssueDate: formData.nationalIdIssueDate ? new Date(formData.nationalIdIssueDate).toISOString() : undefined,
                    nationalIdExpiryDate: formData.nationalIdExpiryDate ? new Date(formData.nationalIdExpiryDate).toISOString() : undefined,
                },
            });

            if (response?.success) {
                toast.success('Financial details added successfully');
                navigate(`../customers/${customerId}`);
            }
        } catch (error) {
            toast.error('Failed to add financial details');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loadingCustomer) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
                <p className="mt-4 text-gray-600">Loading customer...</p>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="text-gray-600">Customer not found</p>
                <button
                    onClick={() => navigate('../customers')}
                    className="mt-4 text-orange-600 hover:text-orange-700"
                >
                    Back to Customers
                </button>
            </div>
        );
    }

    return (
        <div className="mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('../customers')}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Add Financial Details</h1>
                    <p className="text-gray-600 mt-1">Add financial information for {customer.name}</p>
                </div>
            </div>

            {/* Customer Info */}
            <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Customer Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Customer ID</p>
                        <p className="font-medium text-gray-900">{customer.customerId}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium text-gray-900">{customer.phone}</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* National ID */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        National ID Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                National ID Number *
                            </label>
                            <input
                                type="text"
                                name="nationalId"
                                value={formData.nationalId}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                                placeholder="123456789V"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Issue Date
                            </label>
                            <input
                                type="date"
                                name="nationalIdIssueDate"
                                value={formData.nationalIdIssueDate}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expiry Date
                            </label>
                            <input
                                type="date"
                                name="nationalIdExpiryDate"
                                value={formData.nationalIdExpiryDate}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Bank Details */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-green-600" />
                        Bank Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bank Name *
                            </label>
                            <input
                                type="text"
                                name="bankName"
                                value={formData.bankName}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                                placeholder="Bank of Ceylon"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Branch
                            </label>
                            <input
                                type="text"
                                name="bankBranch"
                                value={formData.bankBranch}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                                placeholder="Colombo Main"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Account Number *
                            </label>
                            <input
                                type="text"
                                name="accountNumber"
                                value={formData.accountNumber}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                                placeholder="1234567890"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Account Holder Name
                            </label>
                            <input
                                type="text"
                                name="accountHolderName"
                                value={formData.accountHolderName}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>
                </div>

                {/* Employment Details */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-purple-600" />
                        Employment Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Company Name *
                            </label>
                            <input
                                type="text"
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                                placeholder="ABC Company Ltd"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Job Position
                            </label>
                            <input
                                type="text"
                                name="jobPosition"
                                value={formData.jobPosition}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                                placeholder="Software Engineer"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Monthly Income (Rs.)
                            </label>
                            <input
                                type="number"
                                name="monthlyIncome"
                                value={formData.monthlyIncome || ''}
                                onChange={handleNumberChange}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                                placeholder="50000"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Supervisor Name
                            </label>
                            <input
                                type="text"
                                name="supervisorName"
                                value={formData.supervisorName}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                                placeholder="Jane Smith"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Company Address
                            </label>
                            <input
                                type="text"
                                name="companyAddress"
                                value={formData.companyAddress}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                                placeholder="123 Main St, Colombo"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Supervisor Contact
                            </label>
                            <input
                                type="text"
                                name="supervisorContact"
                                value={formData.supervisorContact}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                                placeholder="+94 77 123 4567"
                            />
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Notes
                    </label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                        placeholder="Any additional financial information..."
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('../customers')}
                        className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 inline animate-spin mr-2" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5 inline mr-2" />
                                Save Financial Details
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}