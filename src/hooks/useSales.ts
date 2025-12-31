import { useCallback } from 'react';
import useFetch from './useFetch';

// Types
export interface SalesDashboardData {
  summary: {
    totalSales: number;
    totalRevenue: number;
    totalPaid: number;
    totalOutstanding: number;
    avgOrderValue: number;
    profitMargin: number;
  };
  trends: TrendPoint[];
  topLocations: LocationPerformance[]; // Changed from topBranches
  topStaff: StaffPerformance[];
  topProducts: ProductPerformance[];
  paymentMethodBreakdown: PaymentMethodData[];
  recentSales: RecentSale[];
  growth: GrowthIndicators;
}

export interface TrendPoint {
  date: string;
  salesCount: number;
  revenue: number;
  avgOrderValue: number;
}

export interface LocationPerformance {
  locationId: string; // Changed from branchId
  locationName: string; // Changed from branchName
  salesCount: number;
  revenue: number;
  growth: number;
}

// Backward compatibility alias
export type BranchPerformance = LocationPerformance;

export interface StaffPerformance {
  staffId: string;
  staffName: string;
  salesCount: number;
  revenue: number;
  commission: number;
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
  profit: number;
}

export interface PaymentMethodData {
  method: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface RecentSale {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  totalAmount: number;
  paymentStatus: string;
  locationName: string; // Changed from branchName
}

export interface GrowthIndicators {
  salesGrowth: number;
  revenueGrowth: number;
  aovGrowth: number;
  profitGrowth: number;
}

export interface SalesFilters {
  startDate?: string;
  endDate?: string;
  locationId?: string; // Changed from branchId
  period?: 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom';
}

export interface RevenueAnalytics {
  total: number;
  paid: number;
  outstanding: number;
  byPaymentMethod: PaymentMethodData[];
  byBranch: BranchRevenue[];
  byPeriod: PeriodRevenue[];
}

export interface LocationRevenue {
  locationId: string; // Changed from branchId
  locationName: string; // Changed from branchName
  revenue: number;
  percentage: number;
}

// Backward compatibility alias
export type BranchRevenue = LocationRevenue;

export interface PeriodRevenue {
  period: string;
  revenue: number;
  salesCount: number;
}

const useSales = () => {
  const dashboardFetch = useFetch();
  const statsFetch = useFetch();
  const revenueFetch = useFetch();
  const trendsFetch = useFetch();
  const branchFetch = useFetch();
  const staffFetch = useFetch();
  const productFetch = useFetch();
  const topCustomersFetch = useFetch();
  const profitFetch = useFetch();
  const paymentMethodsFetch = useFetch();
  const posFetch = useFetch();

  // Get dashboard data (comprehensive aggregated data)
  const getDashboardData = useCallback(
    async (filters?: SalesFilters) => {
      const queryParams = new URLSearchParams();
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);
      if (filters?.locationId) queryParams.append('locationId', filters.locationId); // Changed from branchId
      if (filters?.period) queryParams.append('period', filters.period);

      return dashboardFetch.fetchData({
        endpoint: `/sales/dashboard?${queryParams.toString()}`,
        method: 'GET',
        silent: true,
      });
    },
    [dashboardFetch]
  );

  // Get branch dashboard data (for branch managers)
  const getBranchDashboard = useCallback(
    async (filters?: SalesFilters) => {
      const queryParams = new URLSearchParams();
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);
      if (filters?.period) queryParams.append('period', filters.period);

      return dashboardFetch.fetchData({
        endpoint: `/sales/branch/dashboard?${queryParams.toString()}`,
        method: 'GET',
        silent: true,
      });
    },
    [dashboardFetch]
  );

  // Get enhanced branch dashboard with jobsheet/POS breakdown
  const getBranchEnhancedDashboard = useCallback(
    async () => {
      return dashboardFetch.fetchData({
        endpoint: '/sales/branch/enhanced-dashboard',
        method: 'GET',
        silent: true,
      });
    },
    [dashboardFetch]
  );

  // Get sales statistics
  const getSalesStats = useCallback(
    async (filters?: SalesFilters) => {
      const queryParams = new URLSearchParams();
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);
      if (filters?.locationId) queryParams.append('locationId', filters.locationId);

      return statsFetch.fetchData({
        endpoint: `/sales/overview?${queryParams.toString()}`,
        method: 'GET',
        silent: true,
      });
    },
    [statsFetch]
  );

  // Get revenue analytics
  const getRevenueAnalytics = useCallback(
    async (period: string = 'month') => {
      return revenueFetch.fetchData({
        endpoint: `/sales/revenue-breakdown?period=${period}`,
        method: 'GET',
        silent: true,
      });
    },
    [revenueFetch]
  );

  // Get sales trends
  const getSalesTrends = useCallback(
    async (startDate: string, endDate: string, groupBy: 'day' | 'week' | 'month' = 'day') => {
      return trendsFetch.fetchData({
        endpoint: `/sales/trends?startDate=${startDate}&endDate=${endDate}&groupBy=${groupBy}`,
        method: 'GET',
        silent: true,
      });
    },
    [trendsFetch]
  );

  // Get sales by branch
  const getSalesByBranch = useCallback(
    async (filters?: SalesFilters) => {
      const queryParams = new URLSearchParams();
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);

      return branchFetch.fetchData({
        endpoint: `/sales/branch-performance?${queryParams.toString()}`,
        method: 'GET',
        silent: true,
      });
    },
    [branchFetch]
  );

  // Get sales by staff
  const getSalesByStaff = useCallback(
    async (filters?: SalesFilters) => {
      const queryParams = new URLSearchParams();
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);
      if (filters?.locationId) queryParams.append('locationId', filters.locationId);

      return staffFetch.fetchData({
        endpoint: `/sales/staff-performance?${queryParams.toString()}`,
        method: 'GET',
        silent: true,
      });
    },
    [staffFetch]
  );

  // Get sales by product
  const getSalesByProduct = useCallback(
    async (filters?: SalesFilters & { limit?: number }) => {
      const queryParams = new URLSearchParams();
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());

      return productFetch.fetchData({
        endpoint: `/sales/top-products?${queryParams.toString()}`,
        method: 'GET',
        silent: true,
      });
    },
    [productFetch]
  );

  // Get top customers
  const getTopCustomers = useCallback(
    async (limit: number = 10, filters?: SalesFilters) => {
      const queryParams = new URLSearchParams();
      queryParams.append('limit', limit.toString());
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);

      return topCustomersFetch.fetchData({
        endpoint: `/sales/top-customers?${queryParams.toString()}`,
        method: 'GET',
        silent: true,
      });
    },
    [topCustomersFetch]
  );

  // Get profit analysis
  const getProfitAnalysis = useCallback(
    async (filters?: SalesFilters) => {
      const queryParams = new URLSearchParams();
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);
      if (filters?.locationId) queryParams.append('locationId', filters.locationId);

      return profitFetch.fetchData({
        endpoint: `/sales/profit-analysis?${queryParams.toString()}`,
        method: 'GET',
        silent: true,
      });
    },
    [profitFetch]
  );

  // Get payment method breakdown
  const getPaymentMethodBreakdown = useCallback(
    async (filters?: SalesFilters) => {
      const queryParams = new URLSearchParams();
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);
      if (filters?.locationId) queryParams.append('locationId', filters.locationId);

      return paymentMethodsFetch.fetchData({
        endpoint: `/sales/payment-methods?${queryParams.toString()}`,
        method: 'GET',
        silent: true,
      });
    },
    [paymentMethodsFetch]
  );

  // Get customer insights
  const getCustomerInsights = useCallback(
    async (filters?: SalesFilters) => {
      const queryParams = new URLSearchParams();
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);
      if (filters?.locationId) queryParams.append('locationId', filters.locationId);

      return topCustomersFetch.fetchData({
        endpoint: `/sales/customer-insights?${queryParams.toString()}`,
        method: 'GET',
        silent: true,
      });
    },
    [topCustomersFetch]
  );

  // Get sales details with pagination
  const getSalesDetails = useCallback(
    async (filters?: SalesFilters & { page?: number; limit?: number; staffId?: string; status?: string }) => {
      const queryParams = new URLSearchParams();
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);
      if (filters?.locationId) queryParams.append('locationId', filters.locationId);
      if (filters?.staffId) queryParams.append('staffId', filters.staffId);
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());

      return dashboardFetch.fetchData({
        endpoint: `/sales/details?${queryParams.toString()}`,
        method: 'GET',
        silent: true,
      });
    },
    [dashboardFetch]
  );

  // ============================================
  // POS OPERATIONS
  // ============================================

  // Create a new sale (POS)
  const createSale = useCallback(
    async (saleData: {
      locationId: string; // Changed from branchId
      soldById: string;
      customerId?: string;
      items: Array<{
        productId: string;
        quantity: number;
        unitPrice: number;
        costPrice?: number;
        discount?: number;
        discountType?: 'PERCENTAGE' | 'FIXED';
        tax?: number;
        warrantyMonths?: number;
      }>;
      payments?: Array<{
        method: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE' | 'MOBILE_MONEY';
        amount: number;
        reference?: string;
      }>;
      type: 'DIRECT_SALE' | 'INVOICE_SALE' | 'QUOTE';
      discount?: number;
      discountType?: 'PERCENTAGE' | 'FIXED';
      notes?: string;
    }) => {
      return posFetch.fetchData({
        endpoint: '/sales/pos',
        method: 'POST',
        data: saleData,
      });
    },
    [posFetch]
  );

  const downloadInvoice = useCallback(
    async (saleId: string, options: { includeTerms?: boolean; includeConditions?: boolean } = {}) => {
      try {
        // const queryParams = new URLSearchParams({
        //   format: 'pdf',
        //   includeTerms: (options.includeTerms ?? true).toString(),
        //   includeConditions: (options.includeConditions ?? true).toString(),
        // });

        const result = await posFetch.fetchData({
          method: 'GET',
          endpoint: `/sales/pos/${saleId}/invoice/download`,
          responseType: 'blob',
          silent: true,
        });

        if (!result || !(result instanceof Blob)) {
          throw new Error('Failed to download invoice');
        }

        const blob = result as Blob;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice_${saleId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading invoice:', error);
        throw error;
      }
    },
    [posFetch]
  );


  const printInvoice = useCallback(
    async (saleId: string, options: { copies?: number; includeTerms?: boolean; includeConditions?: boolean } = {}) => {
      try {
        // const queryParams = new URLSearchParams({
        //   copies: (options.copies ?? 1).toString(),
        //   includeTerms: (options.includeTerms ?? true).toString(),
        //   includeConditions: (options.includeConditions ?? true).toString(),
        // });

        const result = await posFetch.fetchData({
          method: 'GET',
          endpoint: `/sales/pos/${saleId}/invoice/print`,
          responseType: 'blob',
          silent: true,
        });

        if (!result || !(result instanceof Blob)) {
          throw new Error('Failed to generate invoice for printing');
        }

        const blob = result as Blob;
        const url = window.URL.createObjectURL(blob);
        const printWindow = window.open(url, '_blank');

        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        } else {
          // Fallback: download the file if popup is blocked
          const link = document.createElement('a');
          link.href = url;
          link.download = `invoice_${saleId}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        // Clean up the URL object after a delay
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 1000);
      } catch (error) {
        console.error('Error printing invoice:', error);
        throw error;
      }
    },
    [posFetch]
  );

  // Get all sales (with filters)
  const getSales = useCallback(
    async (filters?: {
      branchId?: string;
      locationId?: string;
      customerId?: string;
      status?: 'PENDING' | 'COMPLETED' | 'PARTIAL_REFUND' | 'REFUNDED' | 'CANCELLED';
      type?: 'DIRECT_SALE' | 'INVOICE_SALE' | 'QUOTE';
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (filters?.locationId) queryParams.append('locationId', filters.locationId);
      if (filters?.customerId) queryParams.append('customerId', filters.customerId);
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.type) queryParams.append('type', filters.type);
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());

      return posFetch.fetchData({
        endpoint: `/sales/pos?${queryParams.toString()}`,
        method: 'GET',
        silent: true,
      });
    },
    [posFetch]
  );

  // Get sale by ID (works for both POS sales and JobSheets)
  const getSaleById = useCallback(
    async (id: string) => {
      return posFetch.fetchData({
        endpoint: `/sales/${id}`,
        method: 'GET',
        silent: true,
      });
    },
    [posFetch]
  );

  // Add payment to sale
  const addPaymentToSale = useCallback(
    async (saleId: string, paymentData: {
      method: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE' | 'MOBILE_MONEY';
      amount: number;
      reference?: string;
    }) => {
      return posFetch.fetchData({
        endpoint: `/sales/pos/${saleId}/payments`,
        method: 'POST',
        data: paymentData,
      });
    },
    [posFetch]
  );

  // Create refund
  const createRefund = useCallback(
    async (saleId: string, refundData: {
      amount: number;
      reason: string;
      refundMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE' | 'MOBILE_MONEY';
      items?: Array<{
        productId: string;
        quantity: number;
      }>;
    }) => {
      return posFetch.fetchData({
        endpoint: `/sales/pos/${saleId}/refunds`,
        method: 'POST',
        data: refundData,
      });
    },
    [posFetch]
  );

  // Cancel sale
  const cancelSale = useCallback(
    async (saleId: string, reason: string) => {
      return posFetch.fetchData({
        endpoint: `/sales/pos/${saleId}/cancel`,
        method: 'POST',
        data: { reason },
      });
    },
    [posFetch]
  );

  return {
    // Dashboard & Analytics
    getDashboardData,
    getBranchDashboard,
    getBranchEnhancedDashboard,
    getSalesStats,
    getRevenueAnalytics,
    getSalesTrends,
    getSalesByBranch,
    getSalesByStaff,
    getSalesByProduct,
    getTopCustomers,
    getProfitAnalysis,
    getPaymentMethodBreakdown,
    getCustomerInsights,
    getSalesDetails,

    // POS Operations
    createSale,
    downloadInvoice,
    printInvoice,
    getSales,
    getSaleById,
    addPaymentToSale,
    createRefund,
    cancelSale,

    // Loading states
    loading: {
      dashboard: dashboardFetch.loading,
      stats: statsFetch.loading,
      revenue: revenueFetch.loading,
      trends: trendsFetch.loading,
      branch: branchFetch.loading,
      staff: staffFetch.loading,
      product: productFetch.loading,
      customers: topCustomersFetch.loading,
      profit: profitFetch.loading,
      paymentMethods: paymentMethodsFetch.loading,
      pos: posFetch.loading,
    },

    // Error states
    error: {
      dashboard: dashboardFetch.error,
      stats: statsFetch.error,
      revenue: revenueFetch.error,
      trends: trendsFetch.error,
      branch: branchFetch.error,
      staff: staffFetch.error,
      product: productFetch.error,
      customers: topCustomersFetch.error,
      profit: profitFetch.error,
      paymentMethods: paymentMethodsFetch.error,
      pos: posFetch.error,
    },
  };
};

export default useSales;

