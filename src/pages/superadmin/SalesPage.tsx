import { useEffect, useState } from 'react';
import type { Sale } from '../../types/sales.types';
import { SaleStatus, PaymentMethod, PaymentStatus } from '../../types/sales.types';
import SalesTable from '../../components/superadmin/sales/SalesTable';
import SalesFilters, { type DateFilterType } from '../../components/superadmin/sales/SalesFilters';
import SalesDashboard from '../../components/superadmin/sales/dashboard/SalesDashboard';
import { DashboardSkeleton, TableSkeleton, CardSkeleton } from '../../components/common/SkeletonLoader';
import { EmptySearchState, EmptyTableState } from '../../components/common/EmptyState';
import { RefreshCw, BarChart3, List, TrendingUp, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import DataRawModal from '../../components/common/DataRawModal';
import BillModal from '../../components/branch/pos/BillModal';
import type { OrderData } from '../../components/branch/pos/PaymentModal';
import useSales from '../../hooks/useSales';

export default function SalesPage() {
  const { getDashboardData, getSaleById, downloadInvoice, printInvoice } = useSales();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions'>('dashboard');
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<{
    totalSales: number;
    totalRevenue: number;
    averageOrderValue: number;
    totalDiscount: number;
    totalTax: number;
    paymentMethodBreakdown: {
      cash: number;
      card: number;
      bankTransfer: number;
      mobilePayment: number;
      credit: number;
    };
    statusBreakdown: {
      completed: number;
      pending: number;
      cancelled: number;
      refunded: number;
    };
    topShops: Array<{
      shopId: number;
      shopName: string;
      totalSales: number;
      revenue: number;
    }>;
    topProducts: Array<{
      productId: number;
      productName: string;
      quantitySold: number;
      revenue: number;
    }>;
    topSellers: Array<{
      staffId: number;
      staffName: string;
      totalSales: number;
      revenue: number;
    }>;
    dailySales: Array<{
      date: string;
      sales: number;
      revenue: number;
    }>;
  }>({
    totalSales: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    totalDiscount: 0,
    totalTax: 0,
    paymentMethodBreakdown: {
      cash: 0,
      card: 0,
      bankTransfer: 0,
      mobilePayment: 0,
      credit: 0,
    },
    statusBreakdown: {
      completed: 0,
      pending: 0,
      cancelled: 0,
      refunded: 0,
    },
    topShops: [],
    topProducts: [],
    topSellers: [],
    dailySales: [],
  });
  const [summary, setSummary] = useState({
    todaySales: 0,
    todayRevenue: 0,
    yesterdaySales: 0,
    yesterdayRevenue: 0,
    weekSales: 0,
    weekRevenue: 0,
    monthSales: 0,
    monthRevenue: 0,
    growthRate: 0,
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isRawModalOpen, setIsRawModalOpen] = useState(false);
  const [rawData, setRawData] = useState<unknown | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [selectedOrderData, setSelectedOrderData] = useState<OrderData | null>(null);
  const [selectedResponseData, setSelectedResponseData] = useState<unknown>(null);
  // const [billModalOpen, setBillModalOpen] = useState(false);
  // const [selectedOrderData, setSelectedOrderData] = useState<OrderData | null>(null);
  // const [selectedResponseData, setSelectedResponseData] = useState<unknown>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<SaleStatus | ''>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | ''>('');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const getDateRangeFromFilter = (): { startDate?: string; endDate?: string; period?: string } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (dateFilter) {
      case 'today':
        return { 
          startDate: today.toLocaleDateString('en-CA'),
          endDate: today.toLocaleDateString('en-CA'),
          period: 'today'
        };
      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { 
          startDate: yesterday.toLocaleDateString('en-CA'),
          endDate: yesterday.toLocaleDateString('en-CA'),
          period: 'yesterday'
        };
      }
      case 'thisMonth': {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { 
          startDate: firstDay.toLocaleDateString('en-CA'),
          endDate: lastDay.toLocaleDateString('en-CA'),
          period: 'month'
        };
      }
      case 'thisYear': {
        const firstDay = new Date(now.getFullYear(), 0, 1);
        const lastDay = new Date(now.getFullYear(), 11, 31);
        return { 
          startDate: firstDay.toLocaleDateString('en-CA'),
          endDate: lastDay.toLocaleDateString('en-CA'),
          period: 'year'
        };
      }
      case 'custom':
        return { 
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          period: 'custom'
        };
      default:
        return { period };
    }
  };

  const loadAllData = async () => {
    try {
      setInitialLoading(true);
      const dateRange = getDateRangeFromFilter();
      const response = await getDashboardData(dateRange);
      
      if (response?.success && response?.data) {
        const data = response.data as SalesDashboardData;
        
        // Update summary
        setSummary({
          todaySales: data.summary?.totalSales || 0,
          todayRevenue: data.summary?.totalRevenue || 0,
          yesterdaySales: 0,
          yesterdayRevenue: 0,
          weekSales: data.summary?.totalSales || 0,
          weekRevenue: data.summary?.totalRevenue || 0,
          monthSales: data.summary?.totalSales || 0,
          monthRevenue: data.summary?.totalRevenue || 0,
          growthRate: data.growth?.revenueGrowth || 0,
        });

        // Update stats
        setStats(prevStats => ({
          ...prevStats,
          totalSales: data.summary?.totalSales || 0,
          totalRevenue: data.summary?.totalRevenue || 0,
          averageOrderValue: data.summary?.avgOrderValue || 0,
          totalDiscount: 0,
          totalTax: 0,
        }));

        // Update payment method breakdown
        if (data.paymentMethodBreakdown && data.paymentMethodBreakdown.length > 0) {
          const paymentBreakdown = {
            cash: 0,
            card: 0,
            bankTransfer: 0,
            mobilePayment: 0,
            credit: 0,
          };
          
          data.paymentMethodBreakdown.forEach((pm) => {
            const method = pm.method?.toLowerCase();
            if (method === 'cash') paymentBreakdown.cash = pm.count;
            else if (method === 'card') paymentBreakdown.card = pm.count;
            else if (method === 'bank_transfer') paymentBreakdown.bankTransfer = pm.count;
            else if (method === 'mobile_payment') paymentBreakdown.mobilePayment = pm.count;
            else if (method === 'credit') paymentBreakdown.credit = pm.count;
          });
          
          setStats(prevStats => ({
            ...prevStats,
            paymentMethodBreakdown: paymentBreakdown,
          }));
        }

        // Set recent sales as sales list
        if (data.recentSales && data.recentSales.length > 0) {
          const mappedSales: Sale[] = data.recentSales.map((sale) => ({
            id: sale.id,
            invoiceNumber: sale.invoiceNumber,
            locationId: '0',
            location: { id: '0', name: sale.locationName || 'Unknown', locationCode: '', locationType: 'BRANCH' },
            customerName: sale.customerName,
            customerPhone: '',
            items: [],
            subtotal: sale.totalAmount,
            discount: 0,
            tax: 0,
            totalAmount: sale.totalAmount,
            paymentMethod: PaymentMethod.CASH,
            paymentStatus: sale.paymentStatus as PaymentStatus,
            soldBy: '',
            soldByStaffId: 0,
            status: SaleStatus.COMPLETED,
            saleDate: sale.date,
            createdAt: sale.date,
            updatedAt: sale.date,
          }));
          setSales(mappedSales);
        }
      }
    } catch (error) {
      toast.error('Failed to load sales data');
      console.error('Error loading sales data:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  // Fetch initial data
  useEffect(() => {
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply filters whenever sales or filter states change
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sales, searchQuery, selectedStatus, selectedPaymentMethod, dateFilter, startDate, endDate]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefreshEnabled || activeTab !== 'dashboard') return;

    const interval = setInterval(() => {
      loadAllData();
      setLastRefreshTime(new Date());
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefreshEnabled, activeTab]);

  // Reload data when period or dateFilter changes
  useEffect(() => {
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, dateFilter, startDate, endDate]);

  const applyFilters = () => {
    let filtered = [...sales];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (sale) =>
          sale.invoiceNumber.toLowerCase().includes(query) ||
          sale.customerName.toLowerCase().includes(query) ||
          (sale.location?.name && sale.location.name.toLowerCase().includes(query)) ||
          (sale.location?.locationCode && sale.location.locationCode.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (selectedStatus) {
      filtered = filtered.filter((sale) => sale.status === selectedStatus);
    }

    // Payment method filter
    if (selectedPaymentMethod) {
      filtered = filtered.filter((sale) => sale.paymentMethod === selectedPaymentMethod);
    }

    // Date filter logic
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (dateFilter === 'today') {
        const todayStr = today.toLocaleDateString('en-CA');
        filtered = filtered.filter((sale) => sale.saleDate.startsWith(todayStr));
      } else if (dateFilter === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString('en-CA');
        filtered = filtered.filter((sale) => sale.saleDate.startsWith(yesterdayStr));
      } else if (dateFilter === 'thisMonth') {
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        filtered = filtered.filter((sale) => {
          const saleDate = new Date(sale.saleDate);
          return saleDate >= firstDayOfMonth && saleDate <= lastDayOfMonth;
        });
      } else if (dateFilter === 'thisYear') {
        const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
        const lastDayOfYear = new Date(now.getFullYear(), 11, 31);
        filtered = filtered.filter((sale) => {
          const saleDate = new Date(sale.saleDate);
          return saleDate >= firstDayOfYear && saleDate <= lastDayOfYear;
        });
      } else if (dateFilter === 'custom') {
        // Custom date range filter
        if (startDate) {
          filtered = filtered.filter((sale) => sale.saleDate >= startDate);
        }
        if (endDate) {
          filtered = filtered.filter((sale) => sale.saleDate <= endDate);
        }
      }
    }

    setFilteredSales(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAllData();
      setLastRefreshTime(new Date());
      toast.success('Data refreshed successfully');
    } catch {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(!autoRefreshEnabled);
    toast.success(`Auto-refresh ${!autoRefreshEnabled ? 'enabled' : 'disabled'}`);
  };

  const formatLastRefreshTime = () => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastRefreshTime.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return lastRefreshTime.toLocaleTimeString();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('');
    setSelectedPaymentMethod('');
    setDateFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const transformToOrderData = (data: any): OrderData => {
    return {
      customer: {
        id: data.customerId || 0,
        name: data.customerName || 'Walk-in Customer',
        phone: data.customerPhone || '',
        email: data.customerEmail || '',
      },
      devices: [], // Not applicable for POS sales
      items: (data.items || []).map((item: any) => ({
        id: item.productId,
        name: item.productName,
        price: parseFloat(item.unitPrice || item.price || 0),
        quantity: item.quantity,
      })),
      payment: {
        method: (data.paymentMethod || 'CASH').toLowerCase() as 'cash' | 'card',
        totalAmount: parseFloat(data.totalAmount || 0),
        cashReceived: (data.paymentMethod || 'CASH') === 'CASH' ? parseFloat(data.totalAmount || 0) : undefined,
      },
      paymentMethod: data.paymentMethod || 'CASH',
      discount: parseFloat(data.discount || 0),
      discountType: data.discountType,
      discountReason: data.discountReason,
      notes: data.notes,
      timestamp: data.createdAt || data.saleDate,
    };
  };

  const handleView = async (sale: Sale) => {
    try {
      const response = await getSaleById(sale.id);
      if (response?.success && response?.data) {
        const orderData = transformToOrderData(response.data);
        setSelectedOrderData(orderData);
        setSelectedResponseData(response.data);
        setBillModalOpen(true);
      } else {
        toast.error('Failed to load sale details');
      }
    } catch (error) {
      toast.error('Failed to load sale details');
      console.error('Error loading sale:', error);
    }
  };

  const handleDownload = async (sale: Sale) => {
    try {
      await downloadInvoice(sale.id.toString());
      toast.success('Invoice download started');
    } catch (error) {
      toast.error('Failed to download invoice');
      console.error('Download error:', error);
    }
  };

  const handlePrint = async (sale: Sale) => {
    try {
      await printInvoice(sale.id.toString());
      toast.success('Invoice sent to printer');
    } catch (error) {
      toast.error('Failed to print invoice');
      console.error('Print error:', error);
    }
  };

  const handleCancel = (sale: Sale) => {
    console.log('Cancel sale:', sale);
  };

  const handleRefund = (sale: Sale) => {
    console.log('Refund sale:', sale);
  };

  const formatCurrency = (amount: number) => {
    return `USD ${amount.toLocaleString('en-US')}`;
  };

  if (initialLoading) {
    return (
      <div className="space-y-6 mx-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="border-b border-gray-200">
          <div className="flex gap-8 py-4">
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>

        {/* Dashboard Skeleton */}
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-2 pb-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Management</h1>
          <p className="text-gray-600 mt-1">
            Track and analyze sales performance across all branches
          </p>
        </div>
        
        {/* Auto-refresh controls */}
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-500">
            Last updated: {formatLastRefreshTime()}
          </div>
          <button
            onClick={toggleAutoRefresh}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              autoRefreshEnabled
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Auto-refresh {autoRefreshEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs" role="tablist">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`${
              activeTab === 'dashboard'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`${
              activeTab === 'transactions'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <List className="w-4 h-4" />
            Transactions
          </button>
        </nav>
      </div>

   
      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="animate-fadeIn">
          <SalesDashboard />
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Period Selector for Transactions */}
          {/* <div className="flex gap-2">
            {(['today', 'week', 'month', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === p
                    ? 'bg-orange-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div> */}

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Sales Transactions</h2>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Quick Stats Summary */}
          {refreshing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">Today's Sales</h3>
                {summary.growthRate > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900">{summary.todaySales}</p>
              <p className="text-sm text-gray-600 mt-1">{formatCurrency(summary.todayRevenue)}</p>
              <p className={`text-xs mt-2 ${summary.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.growthRate >= 0 ? '+' : ''}{summary.growthRate.toFixed(1)}% from yesterday
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-4">This Week</h3>
              <p className="text-2xl font-bold text-gray-900">{summary.weekSales}</p>
              <p className="text-sm text-gray-600 mt-1">{formatCurrency(summary.weekRevenue)}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-4">This Month</h3>
              <p className="text-2xl font-bold text-gray-900">{summary.monthSales}</p>
              <p className="text-sm text-gray-600 mt-1">{formatCurrency(summary.monthRevenue)}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Avg Order Value</h3>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(Math.round(stats.averageOrderValue))}
              </p>
              <p className="text-sm text-gray-600 mt-1">Per transaction</p>
            </div>
          </div>
          )}

          {/* Filters */}
          <SalesFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            selectedPaymentMethod={selectedPaymentMethod}
            onPaymentMethodChange={setSelectedPaymentMethod}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            onReset={handleResetFilters}
          />

          {/* Sales Table */}
          {refreshing ? (
            <TableSkeleton rows={8} />
          ) : filteredSales.length === 0 && (searchQuery || selectedStatus || selectedPaymentMethod || dateFilter !== 'all') ? (
            <EmptySearchState onReset={handleResetFilters} />
          ) : filteredSales.length === 0 ? (
            <EmptyTableState message="No sales transactions found. Start recording sales to see them here." />
          ) : (
            <SalesTable
              sales={filteredSales}
              onView={handleView}
              onCancel={handleCancel}
              onRefund={handleRefund}
              onDownload={handleDownload}
              onPrint={handlePrint}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredSales.length}
              totalPages={Math.ceil(filteredSales.length / itemsPerPage)}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          )}

          {/* Results count */}
          {filteredSales.length > 0 && (
            <div className="text-sm text-gray-600 text-center">
              Showing {filteredSales.length} of {sales.length} sales
              <span className="ml-2 text-gray-500">
                | Total Revenue: {formatCurrency(filteredSales.filter(s => s.status === SaleStatus.COMPLETED).reduce((sum, sale) => sum + sale.totalAmount, 0))}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Raw Data Modal */}
      <DataRawModal
        isOpen={isRawModalOpen}
        onClose={() => {
          setIsRawModalOpen(false);
          setRawData(null);
        }}
        data={rawData}
        title="Sale Raw Data"
      />

      {/* Bill Modal */}
      <BillModal
        isOpen={billModalOpen}
        onClose={() => {
          setBillModalOpen(false);
          setSelectedOrderData(null);
          setSelectedResponseData(null);
        }}
        orderData={selectedOrderData}
        responseData={selectedResponseData}
      />
    </div>
  );
}
