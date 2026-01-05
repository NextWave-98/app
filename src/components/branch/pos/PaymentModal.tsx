/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  CheckCircle,
  Loader2,
  Receipt,
  User,
  Phone,
  Search,
} from 'lucide-react';
import type { CartItem } from '../../../pages/branch/POSPage';
import type { Customer } from '../../../hooks/useCustomer';
import useCustomer from '../../../hooks/useCustomer';
import useDevice, { type Device } from '../../../hooks/useDevice';
import toast from 'react-hot-toast';
import AddCustomerModal from '../../superadmin/customers/AddCustomerModal';
import { formatCurrency } from '../../../utils/currency';

export interface DeviceInfo {
  id?: string;
  deviceType: 'MOBILE' | 'TABLET' | 'LAPTOP' | 'DESKTOP' | 'SMARTWATCH' | 'OTHER';
  brand: string;
  model: string;
  serialNumber?: string;
  imei?: string;
}

export interface OrderData {
  customer: {
    id?: string;
    name: string;
    phone: string;
    email?: string;
  };
  devices: DeviceInfo[]; // Changed from single device to array
  items: CartItem[];
  payment: {
    method: 'cash' | 'card';
    totalAmount: number;
    cashReceived?: number;
    change?: number;
    cardNumber?: string;
  };
  paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_PAYMENT' | 'CHECK' | 'OTHER';
  reference?: string;
  notes?: string;
  discount?: number;
  discountType?: 'FIXED' | 'PERCENTAGE';
  discountReason?: string;
  timestamp: string;
}

interface ApiResponse {
  status: boolean;
  message: string;
  saleId: string;
  saleNumber: string;
  sale: unknown;
  order: OrderData;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: (orderData: OrderData) => Promise<{ data: ApiResponse }>;
  onPaymentSuccess: (orderData: OrderData, responseData: ApiResponse) => void;
  cartItems: CartItem[];
  total: number;
  suggestedDevice?: {
    deviceType: 'MOBILE' | 'TABLET' | 'LAPTOP' | 'DESKTOP' | 'SMARTWATCH' | 'OTHER';
    brand: string;
    model: string;
  } | null;
}

type PaymentMethod = 'cash' | 'card';

const paymentMethods = [
  {
    id: 'cash' as PaymentMethod,
    name: 'Cash',
    description: 'Pay with cash',
    icon: Banknote,
    color: 'bg-green-50',
    textColor: 'text-green-600',
    borderColor: 'border-green-200',
    hoverColor: 'hover:bg-green-100'
  },
  {
    id: 'card' as PaymentMethod,
    name: 'Credit/Debit Card',
    description: 'Pay with card',
    icon: CreditCard,
    color: 'bg-orange-50',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-200',
    hoverColor: 'hover:bg-orange-100'
  }
];

// Utility function to format phone number for API
const formatPhoneForApi = (phone: string): string => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with +94
  if (digits.startsWith('0')) {
    return '+94' + digits.substring(1);
  }
  
  // If already has country code
  if (digits.startsWith('94')) {
    return '+' + digits;
  }
  
  // If it's just the number without 0, add +94
  if (digits.length === 9) {
    return '+94' + digits;
  }
  
  // Return as is if already formatted
  return phone;
};

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentComplete,
  onPaymentSuccess,
  cartItems,
  total,
  suggestedDevice
}) => {
  // Hooks
  const { searchCustomers, createCustomer } = useCustomer();
  const { getCustomerDevices } = useDevice();

  // Step management
  const [currentStep, setCurrentStep] = useState<'customer_details' | 'device_count' | 'device_details' | 'payment_method'>('customer_details');
  const [deviceCount, setDeviceCount] = useState<number>(1);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState<number>(0);
  const [collectedDevices, setCollectedDevices] = useState<DeviceInfo[]>([]);

  // Customer details
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerErrors, setCustomerErrors] = useState<{ name?: string; phone?: string }>({});
  
  // Customer search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Add Customer Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Current device being edited
  const [deviceType, setDeviceType] = useState<'MOBILE' | 'TABLET' | 'LAPTOP' | 'DESKTOP' | 'SMARTWATCH' | 'OTHER'>('MOBILE');
  const [deviceBrand, setDeviceBrand] = useState<string>('');
  const [deviceModel, setDeviceModel] = useState<string>('');
  const [deviceSerial, setDeviceSerial] = useState<string>('');
  const [deviceIMEI, setDeviceIMEI] = useState<string>('');
  const [deviceErrors, setDeviceErrors] = useState<{ brand?: string; model?: string }>({});
  
  // Device selection from existing customer devices
  const [customerDevices, setCustomerDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [showDeviceOptions, setShowDeviceOptions] = useState(false);

  // Payment details
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cashReceived, setCashReceived] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');

  // Discount details
  const [discountAmount, setDiscountAmount] = useState<string>('');
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENTAGE'>('FIXED');
  const [discountReason, setDiscountReason] = useState<string>('');


  // Search customers when query changes (with debounce)
  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (searchQuery.length >= 3 && !selectedCustomer) {
        setIsSearching(true);
        setShowDropdown(true); // Show dropdown when searching
        try {
          // Format phone number for API call
          const formattedPhone = formatPhoneForApi(searchQuery);
          console.log('Searching with:', formattedPhone); // Debug log
          
          const response = await searchCustomers(formattedPhone, 10);
          console.log('Search response:', response); // Debug log

          // Support multiple backend response shapes:
          // - { data: { customers: [...] } }
          // - { data: [...] }
          // - { customers: [...] }
          let customers: Customer[] = [];

          try {
            const resp = response as unknown as Record<string, unknown> | null;
            const respData = resp?.['data'] as unknown;

            if (Array.isArray(respData)) {
              customers = respData as Customer[];
            } else if (respData && typeof respData === 'object' && Array.isArray((respData as Record<string, unknown>)['customers'])) {
              customers = (respData as Record<string, unknown>)['customers'] as unknown as Customer[];
            } else if (resp && Array.isArray((resp as Record<string, unknown>)['customers'])) {
              customers = (resp as Record<string, unknown>)['customers'] as unknown as Customer[];
            } else if (respData && typeof respData === 'object' && Array.isArray(((respData as Record<string, unknown>)['data']))) {
              // handle double-wrapped data: { data: { data: [...] } }
              customers = ((respData as Record<string, unknown>)['data']) as unknown as Customer[];
            }
          } catch (err) {
            console.error('Failed to parse customer search response', err);
            customers = [];
          }

          setSearchResults(customers || []);
          // Keep dropdown open even if no results to show "not found" message
        } catch (error) {
          console.error('Failed to search customers:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [searchQuery, selectedCustomer]);

  // Reset form when modal opens and auto-fill device if suggested
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('customer_details');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerErrors({});
      setSearchQuery('');
      setSearchResults([]);
      setSelectedCustomer(null);
      setShowDropdown(false);
      
      // Auto-fill device details from suggested device (from product)
      if (suggestedDevice) {
        setDeviceType(suggestedDevice.deviceType);
        setDeviceBrand(suggestedDevice.brand);
        setDeviceModel(suggestedDevice.model);
      } else {
        setDeviceType('MOBILE');
        setDeviceBrand('');
        setDeviceModel('');
      }
      
      setDeviceSerial('');
      setDeviceIMEI('');
      setDeviceErrors({});
      setSelectedPaymentMethod(null);
      setCashReceived('');
      setCardNumber('');
    }
  }, [isOpen, suggestedDevice]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
      // Reset all state
      setTimeout(() => {
        setCurrentStep('customer_details');
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
        setCustomerErrors({});
        setSearchQuery('');
        setSearchResults([]);
        setSelectedCustomer(null);
        setShowDropdown(false);
        setDeviceType('MOBILE');
        setDeviceBrand('');
        setDeviceModel('');
        setDeviceSerial('');
        setDeviceIMEI('');
        setDeviceErrors({});
        setSelectedPaymentMethod(null);
        setCashReceived('');
        setCardNumber('');
      }, 300);
    }
  };

  // Handle customer selection from dropdown
  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setCustomerEmail(customer.email || '');
    setSearchQuery(customer.phone);
    setShowDropdown(false);
    setSearchResults([]);
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCustomerPhone(value);

    // If user clears or modifies, clear selection
    if (selectedCustomer && value !== selectedCustomer.phone) {
      setSelectedCustomer(null);
      setCustomerName('');
      setCustomerEmail('');
    }
  };

  // Handle new customer creation from AddCustomerModal
  const handleAddCustomerSubmit = async (customerData: {
    name: string;
    email?: string | null;
    phone: string;
    alternatePhone?: string | null;
    address?: string | null;
    city?: string | null;
    nicNumber?: string | null;
    branchId?: string | null;
    customerType: 'WALK_IN' | 'REGULAR' | 'VIP';
    notes?: string | null;
    isActive: boolean;
  }) => {
    try {
      const response = await createCustomer(customerData, false);

      // Parse the response to get the created customer
      const createdCustomer = response?.data as Customer;

      if (createdCustomer && createdCustomer.id) {
        // Auto-select the newly created customer
        setSelectedCustomer(createdCustomer);
        setCustomerName(createdCustomer.name);
        setCustomerPhone(createdCustomer.phone);
        setCustomerEmail(createdCustomer.email || '');
        setSearchQuery(createdCustomer.phone);

        toast.success('Customer created and selected successfully!');
      } else {
        toast.error('Customer may have been created but could not be selected. Please search for the customer manually.');
      }
    } catch (error) {
      console.error('Failed to create customer:', error);
      toast.error('Failed to create customer. Please try again.');
    } finally {
      // Always close the modal
      setIsAddModalOpen(false);
    }
  };

  // Validate customer details
  const validateCustomerDetails = () => {
    const errors: { name?: string; phone?: string } = {};

    if (!customerName.trim()) {
      errors.name = 'Customer name is required';
    }

    // if (!customerPhone.trim()) {
    //   errors.phone = 'Phone number is required';
    // } else if (!/^\d{10}$/.test(customerPhone.replace(/\D/g, ''))) {
    //   errors.phone = 'Please enter a valid 10-digit phone number';
    // }

    setCustomerErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate device details
  const validateDeviceDetails = () => {
    const errors: { brand?: string; model?: string } = {};

    if (!deviceBrand.trim()) {
      errors.brand = 'Device brand is required';
    }

    if (!deviceModel.trim()) {
      errors.model = 'Device model is required';
    }

    setDeviceErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Fetch customer devices when customer is selected/created
  const fetchCustomerDevices = async (customerId: string) => {
    try {
      setLoadingDevices(true);
      const response = await getCustomerDevices(customerId);
      const devices = (response?.data as Device[]) || [];
      setCustomerDevices(devices);
      
      // Check if any existing devices match the suggested device
      if (suggestedDevice && devices.length > 0) {
        const matchingDevices = devices.filter(
          d => d.brand.toLowerCase() === suggestedDevice.brand.toLowerCase() &&
               d.model.toLowerCase() === suggestedDevice.model.toLowerCase()
        );
        
        if (matchingDevices.length > 0) {
          setShowDeviceOptions(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch customer devices:', error);
      setCustomerDevices([]);
    } finally {
      setLoadingDevices(false);
    }
  };

  // Proceed to device count selection (skip to payment for POS)
  const handleProceedToDeviceCount = () => {
    if (validateCustomerDetails()) {
      // Skip device details for direct POS sales
      setCurrentStep('payment_method');
    }
  };

  // Proceed to device details after selecting count
  const handleProceedToDevice = async () => {
    if (deviceCount < 1 || deviceCount > 10) {
      toast.error('Please enter a valid device count (1-10)');
      return;
    }
    
    // If customer is selected, fetch their devices
    if (selectedCustomer?.id) {
      await fetchCustomerDevices(selectedCustomer.id);
    }
    
    setCurrentDeviceIndex(0);
    setCollectedDevices([]);
    setCurrentStep('device_details');
  };

  // Save current device and move to next or payment
  const handleSaveDevice = () => {
    if (!validateDeviceDetails()) return;

    const deviceInfo: DeviceInfo = {
      ...(selectedDevice && { id: selectedDevice.id }),
      deviceType,
      brand: deviceBrand,
      model: deviceModel,
      serialNumber: deviceSerial || undefined,
      imei: deviceIMEI || undefined,
    };

    const updatedDevices = [...collectedDevices];
    updatedDevices[currentDeviceIndex] = deviceInfo;
    setCollectedDevices(updatedDevices);

    // Check if we need more devices
    if (currentDeviceIndex + 1 < deviceCount) {
      // Reset form for next device
      setCurrentDeviceIndex(currentDeviceIndex + 1);
      setSelectedDevice(null);
      setDeviceType('MOBILE');
      setDeviceBrand('');
      setDeviceModel('');
      setDeviceSerial('');
      setDeviceIMEI('');
      setShowDeviceOptions(false);
      toast.success(`Device ${currentDeviceIndex + 1} saved! Enter device ${currentDeviceIndex + 2} details.`);
    } else {
      // All devices collected, go to payment
      setCurrentStep('payment_method');
      toast.success(`All ${deviceCount} device(s) saved!`);
    }
  };

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    // Validate payment method specific inputs
    if (selectedPaymentMethod === 'cash') {
      console.log('Validating cash received:', cashReceived, 'against discounted total:', calculateDiscountedTotal());
      const received = parseFloat(cashReceived);
      if (!cashReceived || isNaN(received) || received < calculateDiscountedTotal()) {
        toast.error('Cash amount must be at least the total amount');
        return;
      }
    }

    if (selectedPaymentMethod === 'card') {
      if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
        toast.error('Please enter a valid card number');
        return;
      }
    }

    setIsProcessing(true);

    // Construct complete order data
    const orderData: OrderData = {
      customer: {
        id: selectedCustomer?.id,
        name: customerName,
        phone: customerPhone || searchQuery,
        email: customerEmail || undefined,
      },
      devices: collectedDevices.length > 0 ? collectedDevices : [],
      items: cartItems.map(item => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        stock: item.stock,
        category: item.category,
        image: item.image
      })),
      payment: {
        method: selectedPaymentMethod,
        totalAmount: calculateDiscountedTotal(),
        ...(selectedPaymentMethod === 'cash' && {
          cashReceived: parseFloat(cashReceived),
          change: calculateChange()
        }),
        ...(selectedPaymentMethod === 'card' && {
          cardNumber: cardNumber.replace(/\s/g, '').slice(-4) // Only store last 4 digits for security
        })
      },
      paymentMethod: selectedPaymentMethod === 'cash' ? 'CASH' : 'CARD',
      reference: selectedPaymentMethod === 'card' ? `CARD-${Date.now()}` : `CASH-${Date.now()}`,
      notes: `POS Sale - ${customerName}`,
      discount: calculateDiscountAmount(),
      discountType: discountType,
      discountReason: discountReason || undefined,
      timestamp: new Date().toISOString()
    };


    // Call API through onPaymentComplete and wait for response
    try {
      const response = await onPaymentComplete(orderData);

      setIsProcessing(false);

      // Check if payment was successful
      if (response?.data?.status) {
     

        // Close modal and reset state
        handleClose();

        // Call onPaymentSuccess to open BillModal
        onPaymentSuccess(orderData, response.data);
      } else {
        // Payment failed
        // toast.error(response?.data?.message || 'Payment failed. Please try again.');
      }
    } catch (error) {
      setIsProcessing(false);
      // toast.error('Payment processing failed. Please try again.');
      console.error('Payment error:', error);
    }
  };

  const calculateChange = () => {
    const received = parseFloat(cashReceived);
    const discountedTotal = calculateDiscountedTotal();
    if (!isNaN(received) && received >= discountedTotal) {
      return received - discountedTotal;
    }
    return 0;
  };

  const calculateDiscountedTotal = () => {
    const discountValue = parseFloat(discountAmount) || 0;
    if (discountType === 'PERCENTAGE') {
      return total - (total * discountValue / 100);
    } else {
      return Math.max(0, total - discountValue);
    }
  };

  const calculateDiscountAmount = () => {
    const discountValue = parseFloat(discountAmount) || 0;
    if (discountType === 'PERCENTAGE') {
      return total * discountValue / 100;
    } else {
      return discountValue;
    }
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19); // 16 digits + 3 spaces
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gradient-to-br from-orange-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-md transition-opacity"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
              <div className="bg-orange-50 p-2 rounded-lg">
                {currentStep === 'customer_details' ? (
                  <User className="w-6 h-6 text-orange-600" />
                ) : currentStep === 'device_details' ? (
                  <Phone className="w-6 h-6 text-orange-600" />
                ) : (
                  <CreditCard className="w-6 h-6 text-orange-600" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {currentStep === 'customer_details'
                  ? 'Customer Details'
                  : currentStep === 'device_details'
                  ? 'Device Details'
                  : 'Payment Method'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* STEP 1: Customer Details */}
            {currentStep === 'customer_details' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Summary */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Receipt className="w-5 h-5 text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
                  </div>

                  <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-gray-500">
                            {formatCurrency(item.price)} × {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-300 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-orange-600">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Details Form */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Enter Customer Information</h3>

                  <div className="space-y-4">
                    {/* Phone Search with Autocomplete */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Search className="w-4 h-4" />
                          Phone Number <span className="text-red-500">*</span>
                        </div>
                      </label>
                      <input
                        type="tel"
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                        placeholder="Search by phone (min 3 digits) or enter new"
                        disabled={!!selectedCustomer}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          customerErrors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-11">
                          <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                        </div>
                      )}
                      {customerErrors.phone && (
                        <p className="mt-1 text-sm text-red-500">{customerErrors.phone}</p>
                      )}

                      {/* Search Results Dropdown */}
                      {showDropdown && !selectedCustomer && searchQuery.length >= 3 && (
                        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                          {searchResults.length > 0 ? (
                            <>
                              <div className="p-2 bg-gray-50 border-b border-gray-200">
                                <p className="text-xs font-medium text-gray-600">
                                  {searchResults.length} customer{searchResults.length !== 1 ? 's' : ''} found
                                </p>
                              </div>
                              {searchResults.map((customer) => (
                                <button
                                  key={customer.id}
                                  type="button"
                                  onClick={() => handleCustomerSelect(customer)}
                                  className="w-full text-left px-4 py-3 hover:bg-orange-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900">{customer.name}</p>
                                      <p className="text-sm text-gray-600">{customer.phone}</p>
                                      {customer.email && (
                                        <p className="text-xs text-gray-500 mt-0.5">{customer.email}</p>
                                      )}
                                    </div>
                                    <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700 font-medium ml-2">
                                      {customer.customerType}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </>
                          ) : !isSearching ? (
                            <div className="p-4 text-center">
                              <p className="text-sm text-gray-600 mb-3">No customers found</p>
                              <button
                                type="button"
                                onClick={() => setIsAddModalOpen(true)}
                                className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
                              >
                                + Create New Customer
                              </button>
                            </div>
                          ) : null}
                        </div>
                      )}

                      {/* Selected Customer Display */}
                      {selectedCustomer && (
                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <p className="text-sm text-green-700 font-medium">Existing Customer Found</p>
                              </div>
                              <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
                              <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                              {selectedCustomer.email && (
                                <p className="text-xs text-gray-500 mt-0.5">{selectedCustomer.email}</p>
                              )}
                              <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-700 font-medium">
                                {selectedCustomer.customerType}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCustomer(null);
                                setSearchQuery('');
                                setCustomerName('');
                                setCustomerPhone('');
                                setCustomerEmail('');
                                setShowDropdown(false);
                              }}
                              className="text-green-600 hover:text-green-800 text-sm font-medium underline"
                            >
                              Change
                            </button>
                          </div>
                        </div>
                      )}

                      {/* No results message */}
                      {searchQuery.length >= 3 && !isSearching && searchResults.length === 0 && !selectedCustomer && (
                        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800 font-medium mb-2">
                            ⚠️ No existing customer found
                          </p>
                          <p className="text-xs text-yellow-700 mb-3">
                            Enter customer details manually below or create a complete profile.
                          </p>
                          <button
                            type="button"
                            onClick={() => setIsAddModalOpen(true)}
                            className="w-full px-3 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
                          >
                            + Create New Customer Profile
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Customer Name - Auto-filled or manual entry */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Customer Name <span className="text-red-500">*</span>
                        </div>
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => {
                          setCustomerName(e.target.value);
                          setCustomerErrors({ ...customerErrors, name: undefined });
                        }}
                        placeholder="Enter customer name"
                        disabled={!!selectedCustomer}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          customerErrors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {customerErrors.name && (
                        <p className="mt-1 text-sm text-red-500">{customerErrors.name}</p>
                      )}
                    </div>

                    {/* Email - Optional field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="customer@example.com"
                        disabled={!!selectedCustomer}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Info Note */}
                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                      <p className="text-sm text-orange-700">
                        💡 Start typing phone number to search existing customers, or enter new customer details.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Device Count Selection */}
            {currentStep === 'device_count' && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">How many devices?</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Enter the number of different devices for this sale (e.g., 2 iPhones with different serial numbers).
                  </p>

                  {/* Device Count Input */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Devices <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={deviceCount}
                      onChange={(e) => setDeviceCount(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="1"
                    />
                    <p className="mt-2 text-xs text-gray-500">Maximum 10 devices per sale</p>
                  </div>

                  {/* Info Box */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-orange-900 mb-1">Why do we need this?</h4>
                        <p className="text-sm text-orange-700">
                          Each device gets its own job sheet for tracking repairs and services.
                          You'll enter details for each device separately in the next step.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Info Summary */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">Customer:</p>
                    <p className="text-base font-semibold text-gray-900">{customerName}</p>
                    <p className="text-sm text-gray-600">{customerPhone || searchQuery}</p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Device Details */}
            {currentStep === 'device_details' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Summary */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Receipt className="w-5 h-5 text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
                  </div>

                  {/* Customer Info */}
                  <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <p className="text-sm font-medium text-gray-900">{customerName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <p className="text-sm text-gray-600">{customerPhone || searchQuery}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-gray-500">
                            ${item.price} × {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900">
                          ${(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-300 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-orange-600">${total}</span>
                    </div>
                  </div>
                </div>

                {/* Device Details Form */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {deviceCount > 1 ? `Device ${currentDeviceIndex + 1} of ${deviceCount}` : 'Enter Device Information'}
                    </h3>
                    {deviceCount > 1 && (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: deviceCount }).map((_, idx) => (
                          <div
                            key={idx}
                            className={`w-2 h-2 rounded-full ${
                              idx < currentDeviceIndex
                                ? 'bg-green-500'
                                : idx === currentDeviceIndex
                                ? 'bg-orange-500'
                                : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Show loading state while fetching devices */}
                  {loadingDevices && (
                    <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
                        <p className="text-sm text-orange-700">Checking for existing devices...</p>
                      </div>
                    </div>
                  )}

                  {/* Show existing matching devices if found */}
                  {showDeviceOptions && customerDevices.length > 0 && !loadingDevices && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start gap-2 mb-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-800 mb-1">
                            Found {customerDevices.length} existing device{customerDevices.length > 1 ? 's' : ''} for this customer
                          </p>
                          <p className="text-xs text-green-700">
                            Select an existing device or continue to create a new one
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {customerDevices.map((device) => (
                          <button
                            key={device.id}
                            type="button"
                            onClick={() => {
                              setSelectedDevice(device);
                              setDeviceType(device.deviceType);
                              setDeviceBrand(device.brand);
                              setDeviceModel(device.model);
                              setDeviceSerial(device.serialNumber || '');
                              setDeviceIMEI(device.imei || '');
                              setShowDeviceOptions(false);
                            }}
                            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                              selectedDevice?.id === device.id
                                ? 'border-green-500 bg-white'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {device.brand} {device.model}
                                </p>
                                <p className="text-sm text-gray-600">{device.deviceType}</p>
                                {device.serialNumber && (
                                  <p className="text-xs text-gray-500 mt-1">S/N: {device.serialNumber}</p>
                                )}
                              </div>
                              {selectedDevice?.id === device.id && (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              )}
                            </div>
                          </button>
                        ))}
                        
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDevice(null);
                            setShowDeviceOptions(false);
                            // Reset to suggested device if available
                            if (suggestedDevice) {
                              setDeviceType(suggestedDevice.deviceType);
                              setDeviceBrand(suggestedDevice.brand);
                              setDeviceModel(suggestedDevice.model);
                            }
                          }}
                          className="w-full text-center p-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
                        >
                          + Create New Device Instead
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Device Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Device Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={deviceType}
                        onChange={(e) => setDeviceType(e.target.value as 'MOBILE' | 'TABLET' | 'LAPTOP' | 'DESKTOP' | 'SMARTWATCH' | 'OTHER')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="MOBILE">Mobile Phone</option>
                        <option value="TABLET">Tablet</option>
                        <option value="LAPTOP">Laptop</option>
                        <option value="DESKTOP">Desktop</option>
                        <option value="SMARTWATCH">Smartwatch</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    {/* Device Brand */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Brand <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={deviceBrand}
                        onChange={(e) => {
                          setDeviceBrand(e.target.value);
                          setDeviceErrors({ ...deviceErrors, brand: undefined });
                        }}
                        placeholder="e.g., Samsung, Apple, HP"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                          deviceErrors.brand ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {deviceErrors.brand && (
                        <p className="mt-1 text-sm text-red-500">{deviceErrors.brand}</p>
                      )}
                    </div>

                    {/* Device Model */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Model <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={deviceModel}
                        onChange={(e) => {
                          setDeviceModel(e.target.value);
                          setDeviceErrors({ ...deviceErrors, model: undefined });
                        }}
                        placeholder="e.g., Galaxy S21, iPhone 13, ThinkPad"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                          deviceErrors.model ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {deviceErrors.model && (
                        <p className="mt-1 text-sm text-red-500">{deviceErrors.model}</p>
                      )}
                    </div>

                    {/* Serial Number (Optional) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Serial Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={deviceSerial}
                        onChange={(e) => setDeviceSerial(e.target.value)}
                        placeholder="Device serial number"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    {/* IMEI (Optional, for mobile devices) */}
                    {deviceType === 'MOBILE' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          IMEI Number (Optional)
                        </label>
                        <input
                          type="text"
                          value={deviceIMEI}
                          onChange={(e) => setDeviceIMEI(e.target.value)}
                          placeholder="15-digit IMEI number"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    )}

                    {/* Info Note */}
                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                      <p className="text-sm text-orange-700">
                        📱 Device information helps track warranty and service history.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Payment Method */}
            {currentStep === 'payment_method' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Summary with Customer Info */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Receipt className="w-5 h-5 text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
                  </div>

                  {/* Customer Info */}
                  <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <p className="text-sm font-medium text-gray-900">{customerName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <p className="text-sm text-gray-600">{customerPhone}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-gray-500">
                            ${item.price} × {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900">
                          ${(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-300 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-semibold text-gray-900">Subtotal</span>
                      <span className="text-lg text-gray-900">{formatCurrency(total)}</span>
                    </div>
                    {parseFloat(discountAmount) > 0 && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">
                          Discount ({discountType === 'PERCENTAGE' ? `${discountAmount}%` : `${formatCurrency(parseFloat(discountAmount))}`})
                        </span>
                        <span className="text-sm text-red-600">
                          -{formatCurrency(discountType === 'PERCENTAGE' 
                            ? (total * parseFloat(discountAmount) / 100) 
                            : parseFloat(discountAmount))}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-orange-600">{formatCurrency(calculateDiscountedTotal())}</span>
                    </div>
                  </div>
                </div>

                {/* Discount Section */}
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200 mb-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Apply Discount (Optional)</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount Type
                      </label>
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value as 'FIXED' | 'PERCENTAGE')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        disabled={isProcessing}
                      >
                        <option value="FIXED">Fixed Amount (USD)</option>
                        <option value="PERCENTAGE">Percentage (%)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount Amount {discountType === 'PERCENTAGE' ? '(%)' : '($)'}
                      </label>
                      <input
                        type="number"
                        step={discountType === 'PERCENTAGE' ? '0.01' : '0.01'}
                        min="0"
                        max={discountType === 'PERCENTAGE' ? '100' : total}
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(e.target.value)}
                        placeholder={discountType === 'PERCENTAGE' ? '10.00' : '50.00'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        disabled={isProcessing}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason (Optional)
                    </label>
                    <input
                      type="text"
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      placeholder="e.g., Loyalty customer, Bulk purchase"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Payment Method</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      const isSelected = selectedPaymentMethod === method.id;

                      return (
                        <button
                          key={method.id}
                          onClick={() => setSelectedPaymentMethod(method.id)}
                          disabled={isProcessing}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            isSelected
                              ? `${method.color} ${method.borderColor} ring-2 ring-offset-2 ring-orange-500`
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`${method.color} p-2 rounded-lg`}>
                              <Icon className={`w-6 h-6 ${method.textColor}`} />
                            </div>
                            <div className="text-left flex-1">
                              <p className="text-sm font-semibold text-gray-900">{method.name}</p>
                              <p className="text-xs text-gray-500">{method.description}</p>
                            </div>
                            {isSelected && (
                              <CheckCircle className="w-5 h-5 text-orange-600" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Payment Method Specific Inputs */}
                  {selectedPaymentMethod === 'cash' && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200 mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cash Received <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min={calculateDiscountedTotal()}
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg font-semibold"
                        disabled={isProcessing}
                      />
                      {cashReceived && parseFloat(cashReceived) >= calculateDiscountedTotal() && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-green-300">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Change</span>
                            <span className="text-xl font-bold text-green-600">
                              {formatCurrency(calculateChange())}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedPaymentMethod === 'card' && (
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200 mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        placeholder="1234 5678 9012 3456"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg font-mono"
                        disabled={isProcessing}
                        maxLength={19}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {currentStep === 'customer_details' && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Cancel
              </button>
              <button
                onClick={handleProceedToDeviceCount}
                className="inline-flex items-center gap-2 px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Continue
              </button>
            </div>
          )}

          {currentStep === 'device_count' && (
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setCurrentStep('customer_details')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Back
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProceedToDevice}
                  className="inline-flex items-center gap-2 px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Continue to Devices
                </button>
              </div>
            </div>
          )}

          {currentStep === 'device_details' && (
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => deviceCount > 1 ? setCurrentStep('device_count') : setCurrentStep('customer_details')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Back
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDevice}
                  className="inline-flex items-center gap-2 px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  {currentDeviceIndex + 1 < deviceCount ? `Save & Next Device (${currentDeviceIndex + 2}/${deviceCount})` : 'Continue to Payment'}
                </button>
              </div>
            </div>
          )}

          {currentStep === 'payment_method' && (
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setCurrentStep('customer_details')}
                disabled={isProcessing}
                className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  disabled={isProcessing}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Complete Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddCustomerSubmit}
        initialPhone={searchQuery}
      />
    </div>
  );
};

export default PaymentModal;
