import { useEffect, useState } from 'react';
import { Bell, BellOff, Check, CheckCheck, Trash2, Settings, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import type { Notification, NotificationStats } from '../../types/notification.types';
import { NotificationType } from '../../types/notification.types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';


export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      

      const notificationsData = mockNotifications;
      const statsData = getNotificationStats
      setNotifications(notificationsData);
      setStats(statsData);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      markAsRead(id);
      loadData();
      toast.success('Marked as read');
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      markAllAsRead();
      loadData();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      deleteNotification(id);
      loadData();
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.ALERT:
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case NotificationType.WARNING:
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case NotificationType.SUCCESS:
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Info className="w-5 h-5 text-orange-600" />;
    }
  };

  const getNotificationBg = (type: NotificationType, isRead: boolean) => {
    if (isRead) return 'bg-gray-50';

    switch (type) {
      case NotificationType.ALERT:
        return 'bg-red-50 border-l-4 border-red-500';
      case NotificationType.WARNING:
        return 'bg-yellow-50 border-l-4 border-yellow-500';
      case NotificationType.SUCCESS:
        return 'bg-green-50 border-l-4 border-green-500';
      default:
        return 'bg-orange-50 border-l-4 border-orange-500';
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">Stay updated with alerts and important updates</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All Read
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 cursor-pointer">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Notifications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalNotifications}</p>
              </div>
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-orange-600">{stats.unreadNotifications}</p>
              </div>
              <BellOff className="w-8 h-8 text-orange-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-red-600">{stats.highPriorityUnread}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stock Alerts</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.notificationsByCategory.stock}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm ">
        <div className="p-4">
          <div className="flex gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'all' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'unread' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Unread ({stats?.unreadNotifications || 0})
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No notifications to display</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 ${getNotificationBg(notification.type, notification.isRead)}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900">{notification.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{new Date(notification.createdAt).toLocaleString()}</span>
                          {notification.shopName && <span>• {notification.shopName}</span>}
                          <span className={`px-2 py-0.5 rounded-full ${
                            notification.priority === 'high' ? 'bg-red-100 text-red-700' :
                            notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {notification.priority}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-1 text-gray-400 hover:text-orange-600"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
