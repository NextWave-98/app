import { useState, useEffect } from 'react';
import { useAddonRequest } from '../../hooks/useAddonRequest';
import type { AddonRequest } from '../../types/addonRequest.types';
import { toast } from 'sonner';
import {
  PackagePlus,
  Calendar,
  User,
  Package,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  MapPin,
  Search,
  Filter,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AddonRequestsPage = () => {
  const { user } = useAuth();
  const { getAllAddonRequests, updateAddonRequest, getAddonRequestStats } = useAddonRequest();
  const [requests, setRequests] = useState<AddonRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AddonRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    completedRequests: 0
  });

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await getAllAddonRequests();
      
      if (response?.data && Array.isArray(response.data)) {
        setRequests(response.data);
        setFilteredRequests(response.data);
      }
    } catch (error) {
      console.error('Error loading addon requests:', error);
      toast.error('Failed to load addon requests');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getAddonRequestStats();
      if (response?.data) {
        setStats(response.data as typeof stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    loadRequests();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let filtered = [...requests];

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(req => 
        req.Product?.name?.toLowerCase().includes(query) ||
        req.Product?.code?.toLowerCase().includes(query) ||
        req.Location?.name?.toLowerCase().includes(query) ||
        req.User?.fullName?.toLowerCase().includes(query)
      );
    }

    setFilteredRequests(filtered);
  }, [statusFilter, searchQuery, requests]);

  const handleUpdateStatus = async (requestId: string, newStatus: 'APPROVED' | 'REJECTED' | 'COMPLETED') => {
    try {
      setUpdating(requestId);
      await updateAddonRequest(requestId, { status: newStatus });
      toast.success(`Request ${newStatus.toLowerCase()} successfully`);
      await loadRequests();
      await loadStats();
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error('Failed to update request');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      COMPLETED: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const getSMSStatusBadge = (smsSent: boolean, smsDelivered: boolean | null) => {
    if (!smsSent) {
      return <span className="text-xs text-gray-500">Not Sent</span>;
    }
    if (smsDelivered === true) {
      return <span className="text-xs text-green-600 font-semibold">✓ Delivered</span>;
    }
    if (smsDelivered === false) {
      return <span className="text-xs text-red-600 font-semibold">✗ Failed</span>;
    }
    return <span className="text-xs text-yellow-600 font-semibold">⏳ Pending</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className=" space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Addon Requests Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage product addon quantity requests from all locations
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
            </div>
            <PackagePlus className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingRequests}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approvedRequests}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejectedRequests}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-blue-600">{stats.completedRequests}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by product, location, or user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <PackagePlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No addon requests found</p>
            <p className="text-sm text-gray-500 mt-2">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your filters'
                : 'Requests will appear here when branches submit addon requests'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SMS Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remarks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="w-5 h-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {request.Product?.name || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            Code: {request.Product?.code || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">
                          {request.Location?.name || 'Unknown'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-5 h-5 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">
                          {request.User?.fullName || 'Unknown'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getSMSStatusBadge(request.smsSent, request.smsDelivered)}
                    </td>
                    <td className="px-6 py-4">
                      {request.remark ? (
                        <div className="flex items-start max-w-xs">
                          <MessageSquare className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700 line-clamp-2">
                            {request.remark}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No remarks</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {request.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(request.id, 'APPROVED')}
                              disabled={updating === request.id}
                              className="px-3 py-1 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {updating === request.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(request.id, 'REJECTED')}
                              disabled={updating === request.id}
                              className="px-3 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {updating === request.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Reject'}
                            </button>
                          </>
                        )}
                        {request.status === 'APPROVED' && (
                          <button
                            onClick={() => handleUpdateStatus(request.id, 'COMPLETED')}
                            disabled={updating === request.id}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updating === request.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Complete'}
                          </button>
                        )}
                        {(request.status === 'REJECTED' || request.status === 'COMPLETED') && (
                          <span className="text-xs text-gray-500">No actions available</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddonRequestsPage;
