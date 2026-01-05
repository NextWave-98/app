/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import { useInventory } from '../../hooks/useInventory';
import useJobSheet, { type JobSheet } from '../../hooks/useJobSheet';
import useCustomer from '../../hooks/useCustomer';
import useSales from '../../hooks/useSales';
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface DashboardStats {
  sales: { total: number; change: string };
  orders: { total: number; change: string };
  customers: { total: number; change: string };
  products: { total: number; change: string };
  todaySales: number;
  monthSales: number;
  avgOrderValue: number;
  totalTransactions: number;
}

interface LowStockItem {
  id: string;
  name: string;
  stock: number;
  category: string;
  productId: string;
}

const BranchDashboardPage = () => {
  const { branchCode } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Hooks
  const { getDashboardStats, getLowStockItems } = useInventory();
  const { getJobSheets, getJobSheetStats } = useJobSheet();
  const { getCustomerStats } = useCustomer();
  const { getBranchDashboard, getBranchEnhancedDashboard } = useSales();

  // State
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardStats>({
    sales: { total: 0, change: '+0%' },
    orders: { total: 0, change: '+0%' },
    customers: { total: 0, change: '+0' },
    products: { total: 0, change: '0' },
    todaySales: 0,
    monthSales: 0,
    avgOrderValue: 0,
    totalTransactions: 0,
  });
  const [recentOrders, setRecentOrders] = useState<JobSheet[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [enhancedDashboardData, setEnhancedDashboardData] = useState<{
    todaySales: {
      jobsheetSales: number;
      posSales: number;
      totalSales: number;
      jobsheetCount: number;
      posCount: number;
    };
    productsCount: number;
    recentJobsheets: Array<{
      id: string;
      jobNumber: string;
      customerName: string;
      amount: number;
      status: string;
      createdAt: string;
    }>;
    recentPosSales: Array<{
      id: string;
      invoiceNumber: string;
      customerName: string;
      totalAmount: number;
      paymentStatus: string;
      createdAt: string;
    }>;
  } | null>(null);

  useEffect(() => {
    if (user?.locationId || user?.branchId) {
      loadDashboardData();
    }
  }, [user?.locationId, user?.branchId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadDashboardStats(),
        loadRecentOrders(),
        loadLowStockAlerts(),
        loadEnhancedDashboardData(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const userLocationId = user?.locationId || user?.branchId;
      const [inventoryStatsRes, jobStatsRes, customerStatsRes, posTodayRes, posMonthRes] = await Promise.all([
        getDashboardStats(userLocationId || undefined),
        getJobSheetStats(),
        getCustomerStats(userLocationId || undefined),
        getBranchDashboard({ period: 'today' }),
        getBranchDashboard({ period: 'month' }),
      ]);

      const inventoryStats = (inventoryStatsRes?.data as any) || {};
      const jobStats = (jobStatsRes?.data as any) || {};
      const customerStats = (customerStatsRes?.data as any) || {};
      const posTodayStats = (posTodayRes?.data as any) || {};
      const posMonthStats = (posMonthRes?.data as any) || {};

      // Calculate sales data - combine job sheet payments and POS sales
      const jobSheetSales = jobStats.summary?.totalRevenue || 0;
      const posSales = posTodayStats.summary?.totalRevenue || 0; // Use today's POS sales for total
      const totalSales = jobSheetSales + posSales;

      const todayJobSheetSales = 0; // TODO: Add today calculation in backend
      const todayPosSales = posTodayStats.summary?.totalRevenue || 0;
      const todaySales = todayJobSheetSales + todayPosSales;

      const monthJobSheetSales = jobStats.summary?.monthlyRevenue || 0;
      const monthPosSales = posMonthStats.summary?.totalRevenue || 0;
      const monthSales = monthJobSheetSales + monthPosSales;
      const lastMonthSales = 0; // TODO: Add last month calculation
      const salesChange = lastMonthSales > 0 
        ? `${((totalSales - lastMonthSales) / lastMonthSales * 100).toFixed(0)}%`
        : '+0%';

      // Calculate orders data - combine job sheets and POS orders
      const jobSheetOrders = jobStats.summary?.totalJobSheets || 0;
      const posOrders = posTodayStats.summary?.totalSales || 0;
      const totalOrders = jobSheetOrders + posOrders;
      const lastMonthOrders = 0; // TODO: Add last month calculation
      const ordersChange = lastMonthOrders > 0
        ? `${((totalOrders - lastMonthOrders) / lastMonthOrders * 100).toFixed(0)}%`
        : '+0%';

      // Calculate customers data
      const totalCustomers = customerStats.total || 0;
      const activeCustomers = customerStats.active || 0;
      const customersChange = `+${activeCustomers}`;

      // Calculate products data
      const totalProducts = inventoryStats.totalItems || 0;
      const productsChange = `${totalProducts}`;

      setDashboardData({
        sales: { total: totalSales, change: salesChange },
        orders: { total: totalOrders, change: ordersChange },
        customers: { total: totalCustomers, change: customersChange },
        products: { total: totalProducts, change: productsChange },
        todaySales,
        monthSales,
        avgOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
        totalTransactions: totalOrders,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const loadRecentOrders = async () => {
    try {
      const response = await getJobSheets({
        locationId: user?.locationId || user?.branchId || undefined,
        limit: 5,
        page: 1,
      });

      if (response && (response.data as any)?.jobSheets) {
        setRecentOrders((response.data as any).jobSheets);
      }
    } catch (error) {
      console.error('Error loading recent orders:', error);
    }
  };

  const loadLowStockAlerts = async () => {
    try {
      const response = await getLowStockItems();
      
      if (response?.data) {
        const items = Array.isArray(response.data) ? response.data : (response.data as any).items || [];
        const branchItems = items
          .filter((item: any) => (item.locationId || item.branchId) === (user?.locationId || user?.branchId))
          .map((item: any) => ({
            id: item.id,
            name: item.product?.name || 'Unknown Product',
            stock: item.quantity || 0,
            category: item.product?.category?.name || 'Uncategorized',
            productId: item.productId,
          }))
          .slice(0, 4);
        
        setLowStockItems(branchItems);
      }
    } catch (error) {
      console.error('Error loading low stock items:', error);
    }
  };

  const loadEnhancedDashboardData = async () => {
    try {
      const response = await getBranchEnhancedDashboard();
      if (response?.data) {
        setEnhancedDashboardData(response.data as typeof enhancedDashboardData);
      }
    } catch (error) {
      console.error('Error loading enhanced dashboard data:', error);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
      case 'QUALITY_CHECK':
        return 'bg-orange-100 text-orange-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = [
    {
      name: 'Total Sales  Today',
      value:formatCurrency(enhancedDashboardData?.todaySales?.totalSales || 0),
      change: dashboardData.sales.change,
      trend: dashboardData.sales.change.startsWith('+') ? 'up' : 'down',
      icon: DollarSign,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      changeColor: dashboardData.sales.change.startsWith('+') ? 'text-green-600' : 'text-red-600',
    },
    {
      name: 'Orders',
      value: dashboardData.orders.total.toString(),
      change: dashboardData.orders.change,
      trend: dashboardData.orders.change.startsWith('+') ? 'up' : 'down',
      icon: ShoppingBag,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      changeColor: dashboardData.orders.change.startsWith('+') ? 'text-orange-600' : 'text-red-600',
    },
    {
      name: 'Customers',
      value: dashboardData.customers.total.toString(),
      change: dashboardData.customers.change,
      trend: 'up',
      icon: Users,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      changeColor: 'text-purple-600',
    },
    // {
    //   name: 'Products',
    //   value: dashboardData.products.total.toString(),
    //   change: dashboardData.products.change,
    //   trend: 'up',
    //   icon: Package,
    //   bgColor: 'bg-orange-50',
    //   iconColor: 'text-orange-600',
    //   changeColor: 'text-orange-600',
    // },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#1e3a8a] mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-gray-600 mt-1">
              Managing Branch <span className="font-semibold text-[#1e3a8a]">{user?.branch?.name || branchCode}</span>
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-[#1e3a8a] text-white px-6 py-3 rounded-lg">
              <p className="text-sm opacity-90">Today's  Sales</p>
              <p className="text-2xl font-bold">{formatCurrency(enhancedDashboardData.todaySales.totalSales)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;

          return (
            <div
              key={stat.name}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
                <div className={`flex items-center space-x-1 ${stat.changeColor}`}>
                  <TrendIcon className="w-4 h-4" />
                  <span className="text-sm font-semibold">{stat.change}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Recent Job Sheets</h2>
              <button 
                onClick={() => navigate(`/${branchCode}/system/sales`)}
                className="text-sm text-[#1e3a8a] hover:underline flex items-center space-x-1"
              >
                <span>View All</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-6">
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No recent job sheets found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left text-xs font-semibold text-gray-600 pb-3">JOB NUMBER</th>
                      <th className="text-left text-xs font-semibold text-gray-600 pb-3">CUSTOMER</th>
                      <th className="text-left text-xs font-semibold text-gray-600 pb-3">AMOUNT</th>
                      <th className="text-left text-xs font-semibold text-gray-600 pb-3">STATUS</th>
                      <th className="text-left text-xs font-semibold text-gray-600 pb-3">TIME</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 text-sm font-semibold text-gray-900">{order.jobNumber}</td>
                        <td className="py-4 text-sm text-gray-700">{order.customer?.name || 'N/A'}</td>
                        <td className="py-4 text-sm font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</td>
                        <td className="py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-4 text-sm text-gray-600">{formatTime(order.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts - Takes 1 column */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-bold text-gray-900">Low Stock Alerts</h2>
              {lowStockItems.length > 0 && (
                <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-1 rounded-full">
                  {lowStockItems.length}
                </span>
              )}
            </div>
          </div>
          <div className="p-6">
            {lowStockItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No low stock items</p>
                <p className="text-xs mt-1">All products are well stocked</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {lowStockItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-orange-50 border border-orange-100 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-600">{item.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-orange-600">{item.stock} units</p>
                        <button 
                          onClick={() => navigate(`/${branchCode}/system/products`)}
                          className="text-xs text-[#1e3a8a] hover:underline"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => navigate(`/${branchCode}/system/products`)}
                  className="w-full mt-4 py-2 text-sm text-[#1e3a8a] border border-[#1e3a8a] rounded-lg hover:bg-orange-50 transition-colors"
                >
                  View All Inventory
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Dashboard Sections */}
      {enhancedDashboardData && enhancedDashboardData.todaySales && enhancedDashboardData.recentJobsheets && enhancedDashboardData.recentPosSales && (
        <>
          {/* Today's Sales Breakdown */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Today's Sales Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-600 font-semibold">Jobsheet Sales</p>
                <p className="text-2xl font-bold text-orange-800">{formatCurrency(enhancedDashboardData.todaySales.jobsheetSales)}</p>
                <p className="text-xs text-orange-600">{enhancedDashboardData.todaySales.jobsheetCount} jobs</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 font-semibold">POS Sales</p>
                <p className="text-2xl font-bold text-green-800">{formatCurrency(enhancedDashboardData.todaySales.posSales)}</p>
                <p className="text-xs text-green-600">{enhancedDashboardData.todaySales.posCount} transactions</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-600 font-semibold">Total Today</p>
                <p className="text-2xl font-bold text-purple-800">{formatCurrency(enhancedDashboardData.todaySales.totalSales)}</p>
                <p className="text-xs text-purple-600">{enhancedDashboardData.todaySales.jobsheetCount + enhancedDashboardData.todaySales.posCount} total</p>
              </div>
            </div>
          </div>

       

          {/* Recent Jobsheets and POS Sales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Jobsheets */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">Recent Jobsheet Payments</h2>
                  <button 
                    onClick={() => navigate(`/${branchCode}/system/sales`)}
                    className="text-sm text-[#1e3a8a] hover:underline flex items-center space-x-1"
                  >
                    <span>View All</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                {enhancedDashboardData.recentJobsheets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No recent jobsheet payments</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {enhancedDashboardData.recentJobsheets.map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{job.jobNumber}</p>
                          <p className="text-xs text-gray-600">{job.customerName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{formatCurrency(job.amount)}</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                            {job.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent POS Sales */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">Recent POS Sales</h2>
                  <button 
                    onClick={() => navigate(`/${branchCode}/system/sales`)}
                    className="text-sm text-[#1e3a8a] hover:underline flex items-center space-x-1"
                  >
                    <span>View All</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                {enhancedDashboardData.recentPosSales.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No recent POS sales</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {enhancedDashboardData.recentPosSales.map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{sale.invoiceNumber}</p>
                          <p className="text-xs text-gray-600">{sale.customerName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{formatCurrency(sale.totalAmount)}</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            sale.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                            sale.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {sale.paymentStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Branch Performance */}
      <div className="bg-gradient-to-r from-[#1e3a8a] to-orange-700 rounded-lg shadow-sm border border-gray-200 p-6 text-white">
        <h2 className="text-xl font-bold mb-4">Branch Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-orange-200 text-sm mb-1">Today</p>
            <p className="text-2xl font-bold">{formatCurrency(enhancedDashboardData.todaySales.totalSales)}</p>
            <p className="text-sm text-green-300 mt-1">{dashboardData.sales.change} from last month</p>
          </div>
          <div>
            <p className="text-orange-200 text-sm mb-1">Average Order Value</p>
            <p className="text-2xl font-bold">{formatCurrency(dashboardData.avgOrderValue)}</p>
            <p className="text-sm text-green-300 mt-1">Per transaction</p>
          </div>
          <div>
            <p className="text-orange-200 text-sm mb-1">Total Transactions</p>
            <p className="text-2xl font-bold">{dashboardData.totalTransactions}</p>
            <p className="text-sm text-green-300 mt-1">{dashboardData.orders.change} from last month</p>
          </div>
          <div>
            <p className="text-orange-200 text-sm mb-1">Active Customers</p>
            <p className="text-2xl font-bold">{dashboardData.customers.total}</p>
            <p className="text-sm text-green-300 mt-1">{dashboardData.customers.change} active</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchDashboardPage;
