/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/exhaustive-deps */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import Cookies from 'js-cookie';
import useFetch from '../hooks/useFetch';
import alert from '../utils/alert';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  loading: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: {
    id: string;
    name: string;
    description: string | null;
    permissions: Array<{
      id: string;
      name: string;
      description: string | null;
      module: string;
      action: string;
    }>;
  };
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  // Location fields (backward compatible with branch)
  locationId?: string | null;
  branchId?: string | null; // Deprecated: use locationId
  location?: {
    id: string;
    name: string;
    locationCode: string;
    locationType: string;
    isActive: boolean;
  };
  locationCode?: string | null;
  branch?: {
    id: string;
    name: string;
    code: string;
    isActive: boolean;
  };
}

interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const { fetchData: refreshTokenFetch } = useFetch<RefreshTokenResponse>('/auth/refresh-token');

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const refreshTokenValue = Cookies.get('refreshToken');
      
      if (!refreshTokenValue) {
        return false;
      }

      const response = await refreshTokenFetch({
        method: 'POST',
        data: { refreshToken: refreshTokenValue },
        silent: true,
        showToastOnError: false,
      });

      if (response?.data && response.success !== false) {
        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Update tokens in cookies
        Cookies.set('accessToken', accessToken, { expires: 1 });
        Cookies.set('refreshToken', newRefreshToken, { expires: 7 });

        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }, []);

  const { fetchData: loginFetch } = useFetch<LoginResponse>('/auth/login', { noRedirect: true });
  const { fetchData: logoutFetch } = useFetch('/auth/logout', { onUnauthorized: refreshToken });
  const { fetchData: profileFetch } = useFetch<User>('/auth/profile', { onUnauthorized: refreshToken });

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const accessToken = Cookies.get('accessToken');
        const refreshTokenValue = Cookies.get('refreshToken');
        const userData = localStorage.getItem('user');

        if (accessToken && userData) {
          // Parse stored user data first
          const parsedUser = JSON.parse(userData);
          
          // Verify token is still valid by fetching profile
          const response = await profileFetch({
            method: 'GET',
            silent: true,
            showToastOnError: false,
          });

          // Check if response is successful (status true or success true)
          if (response && (response.status === true || response.success === true) && response.data) {
            // Ensure branchCode is set from branch.code if not directly available
            const userData = response.data;
            if (!userData.locationCode && userData.location?.locationCode) {
              userData.locationCode = userData.location.locationCode;
            }
            setIsAuthenticated(true);
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          } else if (refreshTokenValue && (response?.code === 401 || response?.status === false || response?.success === false)) {
            // Only try to refresh token if we got a 401 or explicit failure
            const refreshed = await refreshToken();
            if (refreshed) {
              // After refresh, try to get profile again
              const profileResponse = await profileFetch({
                method: 'GET',
                silent: true,
                showToastOnError: false,
              });
              if (profileResponse && (profileResponse.status === true || profileResponse.success === true) && profileResponse.data) {
                // Ensure branchCode is set from branch.code if not directly available
                const userData = profileResponse.data;
                if (!userData.locationCode && userData.location?.locationCode) {
                  userData.locationCode = userData.location.locationCode;
                }
                setIsAuthenticated(true);
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
                setLoading(false);
                return;
              }
            }
            // If refresh failed, clear auth
            clearAuth();
          } else if (!response || response.code === 401 || response.code === 403) {
            // Only clear auth if we got a definitive auth failure
            clearAuth();
          } else {
            // For other cases, use cached user data temporarily
            setIsAuthenticated(true);
            setUser(parsedUser);
          }
        } else if (refreshTokenValue) {
          // Try to refresh if we have refresh token but no access token
          const refreshed = await refreshToken();
          if (refreshed) {
            const profileResponse = await profileFetch({
              method: 'GET',
              silent: true,
              showToastOnError: false,
            });
            if (profileResponse && (profileResponse.status === true || profileResponse.success === true) && profileResponse.data) {
              // Ensure branchCode is set from branch.code if not directly available
              const userData = profileResponse.data;
              if (!userData.locationCode && userData.location?.locationCode) {
                userData.locationCode = userData.location.locationCode;
              }
              setIsAuthenticated(true);
              setUser(userData);
              localStorage.setItem('user', JSON.stringify(userData));
            } else {
              clearAuth();
            }
          } else {
            clearAuth();
          }
        } else {
          clearAuth();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // On error, try to use cached data if tokens exist
        const accessToken = Cookies.get('accessToken');
        const userData = localStorage.getItem('user');
        if (accessToken && userData) {
          try {
            const parsedUser = JSON.parse(userData);
            setIsAuthenticated(true);
            setUser(parsedUser);
          } catch {
            clearAuth();
          }
        } else {
          clearAuth();
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const clearAuth = () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await loginFetch({
        method: 'POST',
        data: { email, password },
       
      });
    
      if (response?.data && response.success !== false) {
        const { user: userData, accessToken, refreshToken } = response.data;

        // Ensure locationCode is set from location.locationCode if not directly available
        if (!userData.locationCode && userData.location?.locationCode) {
          userData.locationCode = userData.location.locationCode;
        }

        // Store tokens in cookies
        Cookies.set('accessToken', accessToken);
        Cookies.set('refreshToken', refreshToken);

        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(userData));

        setIsAuthenticated(true);
        setUser(userData);
      } else if (response?.success === false) {
        // Handle all error cases when success is false
        throw new Error(response?.message || 'Login failed');
      } else {
        throw new Error(response?.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call logout API to invalidate refresh token on server
      await logoutFetch({
        method: 'POST',
        silent: true,
        showToastOnError: false,
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    } finally {
      clearAuth();
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, refreshToken, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
