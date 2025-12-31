// useFetch.tsx
import { useState, useCallback } from 'react';
import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import Cookies from 'js-cookie';
import alert from '../utils/alert';
import { useLocation } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
const DEFAULT_ERROR_MESSAGE = 'An unexpected error occurred.';

interface ApiResponse<T = unknown> {
  status?: boolean;
  success?: boolean;
  message?: string;
  details?: string;
  code?: number;
  data?: T;
  resetToken?: string;
  token?: string;
  user?: {
    id: number;
    email: string;
    role: string;
    clientProfile?: Record<string, unknown>;
  }; // Add user field
  errors?: { field: string; message: string; error?: string }[];
  error?: {
    code: number;
    type: string;
    details: string;
  };

}

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  accessToken?: string;
  data?: unknown;
  silent?: boolean;
  successMessage?: string;
  config?: AxiosRequestConfig;
  contentType?: string;
  file?: File;
  image?: File;
  endpoint?: string;
  showToastOnError?: boolean;
  headers?: Record<string, string>;
  responseType?: 'json' | 'blob' | 'text';
  noRedirect?: boolean;
}

interface UseFetchReturn<T = unknown> {
  data: ApiResponse<T> | null;
  loading: boolean;
  error: string | null;
  responseCode: number | null;
  fetchData: (overrideOptions?: FetchOptions) => Promise<ApiResponse<T> | null>;
  reset: () => void;
}

const useFetch = <T = unknown>(
  initialEndpoint = '',
  options: FetchOptions = {}
): UseFetchReturn<T> => {
  const [data, setData] = useState<ApiResponse<T> | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [responseCode, setResponseCode] = useState<number | null>(null);
  const location = useLocation();
  
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    setResponseCode(null);
  }, []);

  const handleError = useCallback((message: string = DEFAULT_ERROR_MESSAGE, code?: number, responseData?: ApiResponse<T>): void => {
    // Check for deactivated account
    if ((responseData as unknown as { code?: string })?.code === 'ACCOUNT_DEACTIVATED' ||
      message?.toLowerCase().includes('account has been deactivated')) {
      Cookies.remove('accessToken');
      alert.error('Your account has been deactivated. Please contact an administrator.');
      if (location.pathname !== '/ditech/login') {
      window.location.href = '/ditech/login';
      }
      return;
    }

    // Check for invalid token messages
    if (code === 401 ||
      message?.toLowerCase().includes('invalid token') ||
      message?.toLowerCase().includes('please log in again')) {
      Cookies.remove('accessToken');
      if (location.pathname !== '/ditech/login') {
       
          window.location.href = '/ditech/login';
       
      }
      return;
    }

    if (code === 401) {
      Cookies.remove('accessToken');
      if (location.pathname !== '/ditech/login') {
      window.location.reload();
      }
    } else {
      setError(message);
      alert.warn(message || "operation failed");
    }
  }, [location.pathname]);

  const fetchData = useCallback(async (overrideOptions: FetchOptions = {}): Promise<ApiResponse<T> | null> => {
    const {
      method = 'GET',
      accessToken: providedToken,
      data: requestData,
      silent = false,
      successMessage,
      config,
      contentType = 'application/json',
      file,
      image,
      endpoint = initialEndpoint,
      showToastOnError = true,
      headers: optionHeaders,
      responseType = 'json',
      noRedirect = false,
    } = { ...options, ...overrideOptions };

    // Auto-get accessToken from cookies if not provided
    const accessToken = providedToken || Cookies.get('accessToken') || undefined;

    setLoading(true);
    setError(null);

    try {
      let response: AxiosResponse<ApiResponse<T>>;

      let finalData: unknown = requestData;
      // const finalHeaders: Record<string, string> = {
      //   'Content-Type': contentType,
      //   ...headers
      // };

       const finalHeaders: Record<string, string> = {
        'Content-Type': contentType,
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...(config?.headers as Record<string, string>),
        ...optionHeaders,
         };

      if (contentType === 'multipart/form-data' || file || image) {
        const formData = new FormData();

        // If requestData is already FormData, use it directly
        if (requestData instanceof FormData) {
          finalData = requestData;
        } else {
          // Handle file/image uploads
          if (file) formData.append('file', file);
          if (image) formData.append('image', image);

          // Handle other form data
          if (requestData && typeof requestData === 'object') {
            Object.entries(requestData).forEach(([key, value]) => {
              // Handle File objects specially
              if (value instanceof File) {
                formData.append(key, value);
              }
              // Handle arrays
              else if (Array.isArray(value)) {
                value.forEach((item: string | Blob) => formData.append(key, item));
              }
              // Handle nested objects
              else if (typeof value === 'object' && value !== null) {
                formData.append(key, JSON.stringify(value));
              }
              // Handle other values
              else if (value !== undefined && value !== null) {
                formData.append(key, String(value));
              }
            });
          }
          finalData = formData;
        }
        // Remove Content-Type header for FormData to let browser set it with boundary
        delete finalHeaders['Content-Type'];
      } else if (contentType === 'application/json' && requestData) {
        // Only stringify if the data isn't already a string
        finalData = typeof requestData === 'string' ? requestData : JSON.stringify(requestData);
      }

      const requestConfig: AxiosRequestConfig = {
        headers: finalHeaders,
        responseType: responseType === 'json' ? undefined : responseType,
        ...config,
      };

      const url = `${BASE_URL}${endpoint}`;

      switch (method.toUpperCase()) {
        case 'GET':
          response = await axios.get<ApiResponse<T>>(url, {
            params: requestData,
            ...requestConfig,
          });
          break;
        case 'POST':
          response = await axios.post<ApiResponse<T>>(url, finalData, requestConfig);
          break;
        case 'PUT':
          response = await axios.put<ApiResponse<T>>(url, finalData, requestConfig);
          break;
        case 'DELETE':
          response = await axios.delete<ApiResponse<T>>(url, {
            data: finalData,
            ...requestConfig,
          });
          break;
        case 'PATCH':
          response = await axios.patch<ApiResponse<T>>(url, finalData, requestConfig);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      setResponseCode(response.status);
      const responseData = response.data;

      if (responseData.code) setResponseCode(responseData.code);

      if (responseData.status === true || response.status === 200 || response.status === 201 || responseData.success === true) {
        setData(responseData);

        // Only show success alert if silent is explicitly false
        if (!silent) {
          alert.success(successMessage || responseData.message || 'Operation successful!');
        }

        // Return response data for chaining
        return responseData;
      } else {
        // Check for invalid token messages in response
        if ((responseData.success === false || responseData.status === false || responseData.success===false) &&
          responseData.message &&
          (responseData.message.toLowerCase().includes('invalid token') ||
            responseData.message.toLowerCase().includes('please log in again'))) {
          if (!noRedirect) {
            Cookies.remove('accessToken');
            if (location.pathname !== '/ditech/login') {
            window.location.href = '/ditech/login';}
          }
          return responseData;
        }

        if (responseData.code === 401) {
          if (!noRedirect) {
            window.location.href = '/ditech/login';
          }
          return responseData;
        } else if (responseData.code === 403) {
          if (!noRedirect) {
            Cookies.remove('accessToken');
            window.location.href = '/ditech/login';
          }
          return responseData;
        } else {
          setData(responseData);
          if (!silent && showToastOnError) {
            handleError(responseData.message, responseData.code, responseData);
          }
          return responseData;
        }
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: ApiResponse<T> & { error?: { details?: string } } }; message?: string };

      const errorResponseData = axiosError.response?.data;

      const statusCode = axiosError.response?.status || 500;
      setResponseCode(statusCode);

      const backendDetails = errorResponseData?.details;
      const nestedDetails = errorResponseData?.error?.details;
      const firstValidationError = errorResponseData?.errors?.[0]?.error || errorResponseData?.errors?.[0]?.message;

      // 2. Fall back to the top-level message if details don't exist.
      const topLevelMessage = errorResponseData?.message;

      // 3. Use a final generic fallback from the axios error object or a default.
      const finalErrorMessage = backendDetails || nestedDetails || firstValidationError || topLevelMessage || axiosError.message || DEFAULT_ERROR_MESSAGE;

      // Handle token-related errors
      if (statusCode === 401 || finalErrorMessage.toLowerCase().includes('invalid token')) {
        if (!noRedirect) {
          Cookies.remove('accessToken');
          if (location.pathname !== '/ditech/login') {
            window.location.href = '/ditech/login';
          }
        }
      }

      // Update the hook's internal error state with the best message we found.
      setError(finalErrorMessage);

      // If the hook is NOT silent, show the alert with the best message.
      if (!silent && showToastOnError) {
        handleError(finalErrorMessage, statusCode, errorResponseData);
      }

      // --- THIS IS THE FIX ---
      // If the actual response from the server exists, return it.
      // Otherwise, construct a new, complete error object that matches the ApiResponse interface.
      return errorResponseData || {
        success: false,
        message: finalErrorMessage,
        details: finalErrorMessage,
        error: {
          code: statusCode, // Add the status code
          type: "CLIENT_ERROR", // Add a generic type
          details: finalErrorMessage // The message is here
        }
      };

    } finally {
      setLoading(false);
    }
  }, [initialEndpoint, options, handleError, location.pathname]);

  return { data, loading, error, responseCode, fetchData, reset };
};

export default useFetch;