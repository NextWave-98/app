import { useCallback } from 'react';
import useFetch from './useFetch';

export interface DashboardStats {
  // Shops
  totalShops: number;
  activeShops: number;
  inactiveShops: number;

  // Staff
  totalStaff: number;
  activeStaff: number;
  onLeaveStaff: number;

  // Stock & Inventory
  totalStockItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalInventoryValue: number;

  // Sales
  todaySales: number;
  todayRevenue: number;
  weekSales: number;
  weekRevenue: number;
  monthSales: number;
  monthRevenue: number;
  salesGrowth: number;

  // Job Sheets
  totalJobSheets: number;
  pendingJobSheets: number;
  inProgressJobSheets: number;
  completedJobSheets: number;
  overdueJobSheets: number;

  // Financial Overview
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;

  // Recent Activity
  recentSales: number;
  recentJobSheets: number;
  criticalAlerts: number;

  // Detailed data
  recentActivities: RecentActivity[];
  topPerformers: TopPerformer[];
}

export interface RecentActivity {
  id: string;
  type: 'sale' | 'jobsheet' | 'stock' | 'staff';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

export interface TopPerformer {
  id: string;
  name: string;
  value: number;
  change: number;
  type: 'shop' | 'staff' | 'product';
}

export const useDashboard = () => {
  const { fetchData, loading, error } = useFetch<DashboardStats>('/admin/superadmin-dashboard', {
    method: 'GET',
  });

  const getDashboardStats = useCallback(async (): Promise<DashboardStats | null> => {
    const response = await fetchData({ silent: true, showToastOnError: true });
    
    if (response?.success && response.data) {
      return response.data;
    }
    
    return null;
  }, [fetchData]);

  return {
    getDashboardStats,
    loading,
    error,
  };
};
