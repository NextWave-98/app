import { useCallback } from 'react';
import useFetch from './useFetch';

export interface BranchSalesFilters {
  startDate?: string;
  endDate?: string;
  period?: 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom';
  status?: string;
  page?: number;
  limit?: number;
}

const useBranchSales = () => {
  const { fetchData: baseFetchData } = useFetch();

  /**
   * Get branch manager's dashboard data (automatically filtered by their branch)
   */
  const getBranchDashboard = useCallback(
    async (filters?: BranchSalesFilters) => {
      const queryParams = new URLSearchParams();
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);
      if (filters?.period) queryParams.append('period', filters.period);

      const queryString = queryParams.toString();
      const endpoint = queryString 
        ? `/sales/branch/dashboard?${queryString}`
        : '/sales/branch/dashboard';

      return await baseFetchData({
        endpoint,
        method: 'GET',
        silent: true,
      });
    },
    [baseFetchData]
  );

  /**
   * Get branch manager's sales details (automatically filtered by their branch)
   */
  const getBranchSalesDetails = useCallback(
    async (filters?: BranchSalesFilters) => {
      const queryParams = new URLSearchParams();
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());

      const queryString = queryParams.toString();
      const endpoint = queryString 
        ? `/sales/branch/details?${queryString}`
        : '/sales/branch/details';

      return await baseFetchData({
        endpoint,
        method: 'GET',
        silent: true,
      });
    },
    [baseFetchData]
  );

  return {
    // Data fetching
    getBranchDashboard,
    getBranchSalesDetails,
  };
};

export default useBranchSales;
