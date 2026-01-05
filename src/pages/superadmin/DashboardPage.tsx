import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  Users,
  Package,
  ShoppingCart,
  Wrench,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  DollarSign,
  BarChart3,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowRight,
  UserCircle,
  Shield,
  Truck,
  FileText,
  Bell,
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useDashboard, type DashboardStats, type RecentActivity, type TopPerformer } from '../../hooks/useDashboard';
import useSMS from '../../hooks/useSMS';

interface SMSBalanceData {
  success: boolean;
  message: string;
  credits?: number;
  balance?: number;
  data?: {
    success?: boolean;
    message?: string;
    balance?: number;
    credits?: number;
    data?: {
      status?: string;
      source?: string;
    };
  };
}



export default function DashboardPage() {
  const { getDashboardStats } = useDashboard();
  const { checkSMSBalance } = useSMS();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [smsBalance, setSmsBalance] = useState<SMSBalanceData | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

   

  useEffect(() => {
    loadDashboardData();
    loadSMSBalance();
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await getDashboardStats();
      if (data) {
        setStats(data);
        setRecentActivities(data.recentActivities || []);
        setTopPerformers(data.topPerformers || []);
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadDashboardData();
      toast.success('Dashboard refreshed');
    } catch (error) {
      toast.error('Failed to refresh dashboard');
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `USD ${(amount / 1000000).toFixed(2)}M`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return ShoppingCart;
      case 'jobsheet':
        return Wrench;
      case 'stock':
        return Package;
      case 'staff':
        return Users;
      default:
        return Activity;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-600';
      case 'warning':
        return 'bg-yellow-100 text-yellow-600';
      case 'error':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-orange-100 text-orange-600';
    }
  };

  const loadSMSBalance = useCallback(async () => {
      try {
        setBalanceLoading(true);
        const result = await checkSMSBalance(true);
        setSmsBalance(result as SMSBalanceData);
      } catch (err) {
        console.error('Failed to load SMS balance:', err);
      } finally {
        setBalanceLoading(false);
      }
  }, [checkSMSBalance]);
  
  const handleTopUp = () => {
    window.open('https://quicksend.lk/Client/topup.php?email=lankatechsolutions.live@gmail.com', '_blank');
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-2 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening across your mobile shop network.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        
      </div>

      <div className="mb-6 bg-gradient-to-r from-orange-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">SMS Balance</h3>
            {balanceLoading ? (
              <p className="text-3xl font-bold">Loading...</p>
            ) : smsBalance ? (
              <div>
                <p className="text-4xl font-bold">
                  {(smsBalance.credits ?? smsBalance.balance ?? smsBalance.data?.credits ?? smsBalance.data?.balance ?? 0).toFixed(2)}
                  <span className="text-lg ml-2">USD</span>
                </p>
                <p className="text-sm text-orange-100 mt-1">QuickSend.lk Account</p>
              </div>
            ) : (
              <p className="text-xl">Unable to fetch balance</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleTopUp}
              className="bg-white cursor-pointer text-orange-600 hover:bg-orange-50 px-6 py-3 rounded-lg font-semibold shadow-md transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Top Up
            </button>
            <button
              onClick={loadSMSBalance}
              disabled={balanceLoading}
              className="bg-orange-400 cursor-pointer hover:bg-orange-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${balanceLoading ? 'animate-spin' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
        </div>

      {/* Critical Alerts */}
      {stats.criticalAlerts > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900">Critical Alerts</h3>
              <p className="text-sm text-red-700 mt-1">
                You have {stats.criticalAlerts} critical items requiring immediate attention:
                {stats.overdueJobSheets > 0 && ` ${stats.overdueJobSheets} overdue job sheets,`}
                {stats.outOfStockItems > 0 && ` ${stats.outOfStockItems} out of stock items,`}
                {stats.lowStockItems > 0 && ` ${stats.lowStockItems} low stock items`}
              </p>
            </div>
            <button className="text-sm font-medium text-red-600 hover:text-red-700">
              View All
            </button>
          </div>
        </div>
      )}

      {/* Key Metrics - Today's Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium opacity-90">Today's Sales</h3>
            {stats.salesGrowth > 0 ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )}
          </div>
          <p className="text-3xl font-bold">{stats.todaySales}</p>
          <p className="text-sm opacity-90 mt-1">{formatCurrency(stats.todayRevenue)}</p>
          <p className={`text-xs mt-2 ${stats.salesGrowth >= 0 ? 'opacity-90' : 'text-red-200'}`}>
            {stats.salesGrowth >= 0 ? '+' : ''}{stats.salesGrowth}% from yesterday
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium opacity-90">Monthly Revenue</h3>
            <DollarSign className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(stats.monthRevenue)}</p>
          <p className="text-sm opacity-90 mt-1">{stats.monthSales} transactions</p>
          <p className="text-xs mt-2 opacity-90">
            Profit Margin: {stats.profitMargin}%
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium opacity-90">Active Job Sheets</h3>
            <Wrench className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold">{stats.inProgressJobSheets}</p>
          <p className="text-sm opacity-90 mt-1">{stats.pendingJobSheets} pending</p>
          {stats.overdueJobSheets > 0 && (
            <p className="text-xs mt-2 text-red-200">
              {stats.overdueJobSheets} overdue
            </p>
          )}
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium opacity-90">Inventory Value</h3>
            <Package className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(stats.totalInventoryValue)}</p>
          <p className="text-sm opacity-90 mt-1">{stats.totalStockItems} items</p>
          {stats.lowStockItems > 0 && (
            <p className="text-xs mt-2 text-yellow-200">
              {stats.lowStockItems} items low stock
            </p>
          )}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Shops */}
        <Link to="/superadmin/shops/management" className="block">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Shops</p>
                <p className="text-2xl font-bold text-orange-600">{stats.totalShops}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.activeShops} active, {stats.inactiveShops} inactive
                </p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <Store className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </Link>

        {/* Staff */}
        <Link to="/superadmin/staff/management" className="block">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Staff</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalStaff}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.activeStaff} active, {stats.onLeaveStaff} on leave
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </Link>

        {/* Stock */}
        <Link to="/superadmin/stock/dashboard" className="block">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Stock Items</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalStockItems}</p>
                <p className="text-xs text-red-500 mt-1">
                  {stats.outOfStockItems} out of stock
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </Link>

        {/* Sales */}
        <Link to="/superadmin/sales/monitor" className="block">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Week's Sales</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.weekSales}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(stats.weekRevenue)}
                </p>
              </div>
              <div className="bg-indigo-50 p-3 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Bottom Section - 3 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job Sheet Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Job Sheets</h3>
            <Link to="/superadmin/job-sheets/monitor" className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-yellow-600 mr-2" />
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">{stats.pendingJobSheets}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Activity className="w-4 h-4 text-orange-600 mr-2" />
                <span className="text-sm text-gray-600">In Progress</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">{stats.inProgressJobSheets}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">{stats.completedJobSheets}</span>
            </div>
            {stats.overdueJobSheets > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <XCircle className="w-4 h-4 text-red-600 mr-2" />
                  <span className="text-sm text-red-600 font-medium">Overdue</span>
                </div>
                <span className="text-lg font-semibold text-red-600">{stats.overdueJobSheets}</span>
              </div>
            )}
          </div>
        </div>

        {/* Top Performing Shops */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Shops</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {topPerformers.map((performer, index) => (
              <div key={performer.id} className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mr-3 ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-100 text-gray-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{performer.name}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(performer.value)}</p>
                  </div>
                </div>
                <div className={`text-sm font-medium ${performer.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {performer.change >= 0 ? '+' : ''}{performer.change}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              return (
                <div key={activity.id} className="flex items-start">
                  <div className={`p-2 rounded-lg mr-3 ${getActivityColor(activity.status)}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500 truncate">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Link
            to="/superadmin/shops/management"
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Store className="w-8 h-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Shops</span>
          </Link>
          <Link
            to="/superadmin/staff/management"
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Staff</span>
          </Link>
          <Link
            to="/superadmin/stock/management"
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Package className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Stock</span>
          </Link>
          <Link
            to="/superadmin/inventory/monitor"
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="w-8 h-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Inventory</span>
          </Link>
          <Link
            to="/superadmin/sales/monitor"
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ShoppingCart className="w-8 h-8 text-indigo-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Sales</span>
          </Link>
          <Link
            to="/superadmin/job-sheets/monitor"
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Wrench className="w-8 h-8 text-red-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Job Sheets</span>
          </Link>
          <Link
            to="/superadmin/customers/management"
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <UserCircle className="w-8 h-8 text-cyan-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Customers</span>
          </Link>
          <Link
            to="/superadmin/warranty/management"
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Shield className="w-8 h-8 text-teal-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Warranty</span>
          </Link>
          <Link
            to="/superadmin/suppliers/management"
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Truck className="w-8 h-8 text-amber-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Suppliers</span>
          </Link>
          <Link
            to="/superadmin/reports"
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-8 h-8 text-violet-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Reports</span>
          </Link>
          <Link
            to="/superadmin/notifications/dashboard"
            className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Bell className="w-8 h-8 text-rose-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Notifications</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
