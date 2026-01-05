/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Search, User, ChevronDown, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import useNotification, { type Notification as NotificationItem } from '../../hooks/useNotification';

interface TopNavbarProps {
  title: string;
  isSidebarCollapsed?: boolean;
}

export default function TopNavbar({ title, isSidebarCollapsed = false }: TopNavbarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout, user } = useAuth();
  const { getMyNotifications } = useNotification();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Load recent notifications
  useEffect(() => {
    const loadNotifications = async () => {
      if (isNotificationOpen) {
        setLoadingNotifications(true);
        try {
          // Get all unread notifications (both PENDING and SENT)
          const response = await getMyNotifications({ limit: 10 });
          // Handle paginated response structure
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const notificationData = (response as any)?.data ? (response as any).data : (Array.isArray(response) ? response : []);
          // Filter to show only unread (PENDING or SENT status)
          const unreadNotifications = notificationData.filter((n: NotificationItem) => 
            n.status === 'PENDING' || n.status === 'SENT'
          );
          setNotifications(unreadNotifications);
        } catch (err) {
          console.error('Failed to load notifications:', err);
          setNotifications([]);
        } finally {
          setLoadingNotifications(false);
        }
      }
    };
    loadNotifications();
  }, [isNotificationOpen]);

  const unreadNotifications = notifications.filter(n => n.status === 'PENDING' || n.status === 'SENT').length;

  return (
    <div className={`bg-white transition-all duration-300 ${
      isSidebarCollapsed ? 'ml-16' : 'ml-64'
    } fixed top-0 left-0 right-0 z-40 shadow-sm`}>
      <div className="px-6 py-2">
        <div className="flex items-center justify-between">
          {/* Left Section - Title and Mobile Menu */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600" />
              )}
            </button>

            <div>
              <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                <span>{new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
                <span>•</span>
                <span>{new Date().toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
            </div>
          </div>

          {/* Right Section - Search, Notifications, Profile */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative hidden md:block">
              {isSearchOpen ? (
                <div className="flex items-center">
                  <input
                    type="text"
                    placeholder="Search shops, staff, inventory..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none text-sm"
                    autoFocus
                  />
                  <button
                    onClick={() => {setIsSearchOpen(false); setSearchQuery('');}}
                    className="ml-2 p-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <Search className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>

            {/* Mobile Search */}
            <button className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Search className="w-5 h-5 text-gray-600" />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative cursor-pointer"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                    {unreadNotifications > 0 && (
                      <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                        {unreadNotifications} new
                      </span>
                    )}
                  </div>

                  {/* Notification List */}
                  <div className="max-h-96 overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="px-4 py-8 text-center text-gray-500">
                        Loading notifications...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map((notification) => {
                        const notificationType = notification.type.includes('SALE') ? 'success' :
                                               notification.type.includes('RETURN') ? 'warning' :
                                               notification.type.includes('JOB') ? 'info' : 'info';
                        const timeAgo = new Date(notification.createdAt).toLocaleDateString() === new Date().toLocaleDateString()
                          ? new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : new Date(notification.createdAt).toLocaleDateString();
                        
                        // Determine the route based on notification type
                        let route = '/superadmin/notifications/dashboard'; // default
                        if (notification.saleId) {
                          route = `/superadmin/sales`;
                        } else if (notification.productReturnId) {
                          route = `/superadmin/returns`;
                        } else if (notification.jobSheetId) {
                          route = `/superadmin/jobsheets`;
                        }
                        
                        return (
                          <Link
                            key={notification.id}
                            to={route}
                            onClick={() => setIsNotificationOpen(false)}
                            className="px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 cursor-pointer block"
                          >
                            <div className="flex items-start space-x-3">
                              {/* Icon based on type */}
                              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                notificationType === 'warning'
                                  ? 'bg-yellow-100'
                                  : notificationType === 'info'
                                  ? 'bg-orange-100'
                                  : 'bg-green-100'
                              }`}>
                                <Bell className={`w-5 h-5 ${
                                  notificationType === 'warning'
                                    ? 'text-yellow-600'
                                    : notificationType === 'info'
                                    ? 'text-orange-600'
                                    : 'text-green-600'
                                }`} />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {notification.type.replace(/_/g, ' ')}
                                </p>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {timeAgo}
                                </p>
                              </div>

                              {/* Unread indicator */}
                              {(notification.status === 'PENDING' || notification.status === 'SENT') && (
                                <div className="flex-shrink-0">
                                  <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                                </div>
                              )}
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                    <Link 
                      to="/superadmin/notifications/dashboard"
                      onClick={() => setIsNotificationOpen(false)}
                      className="block w-full text-center text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 p-2 bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 bg-orange-950 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-black">{user?.name ?? 'Super Admin'}</p>
                  <p className="text-xs text-gray-500">{user?.email ?? 'admin@example.com'}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${
                  isProfileOpen ? 'rotate-180' : ''
                }`} />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-black">{user?.name ?? 'Super Admin'}</p>
                        {/* <p className="text-sm text-gray-500">{user?.email ?? 'admin@example.com'}</p> */}
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                     <Link
                      to={`/superadmin/profile`}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm text-gray-700 flex items-center space-x-3"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      <span>Profile Settings</span>
                    </Link>
                  
                    <Link
                      to={`/superadmin/notifications/settings`}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm text-gray-700 flex items-center space-x-3"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Bell className="w-4 h-4" />
                      <span>Notification Settings</span>
                    </Link>
                  </div>

                  <div className="border-t border-gray-100 pt-2">
                    <button
                      onClick={async () => {
                        setIsProfileOpen(false);
                        try {
                          await logout();
                        } catch (err) {
                          console.error('Logout failed:', err);
                        }
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm text-red-600 flex items-center space-x-3"
                    >
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchOpen && (
          <div className="md:hidden mt-4">
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Search shops, staff, inventory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                autoFocus
              />
              <button
                onClick={() => {setIsSearchOpen(false); setSearchQuery('');}}
                className="ml-2 p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu Overlay (if needed for mobile sidebar toggle) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30" onClick={() => setIsMobileMenuOpen(false)} />
      )}
    </div>
  );
}