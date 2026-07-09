// src/services/api.js
import axios from 'axios';

// ✅ FIXED: Simplified and robust API URL detection
const getApiUrl = () => {
  // 1. Check for environment variable first (Render/Netlify/Vercel)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // 2. Check if running in browser
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // Production: Vercel frontend → Render backend
    if (hostname.includes('vercel.app')) {
      return 'https://aleyo-2-1.onrender.com';
    }

    // Production: Render backend (serving frontend)
    if (hostname.includes('onrender.com')) {
      // If frontend is also on Render, use the same host
      return `https://${hostname}`;
    }

    // Local development: check port
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return process.env.REACT_APP_API_URL || 'http://localhost:10000';
    }
  }

  // Fallback for server-side rendering / build time
  return process.env.REACT_APP_API_URL || 'https://aleyo-2-1.onrender.com';
};

// Base API configuration
const API_BASE_URL = getApiUrl();

// Log the API URL for debugging (remove in production)
console.log('🔗 API Base URL:', API_BASE_URL);

// Create axios instance with enhanced configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
  withCredentials: false, // Important: Set to true if using cookies
});

// ✅ ADDED: Request retry logic for network errors
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// ✅ ADDED: Health check function to verify backend availability
const checkBackendHealth = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000,
      headers: { 'Accept': 'application/json' }
    });
    return response.status === 200;
  } catch (error) {
    console.error('❌ Backend health check failed:', error.message);
    return false;
  }
};

// Request interceptor - Add token to every request
api.interceptors.request.use(
  async (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('authToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request ID for debugging
    config.headers['X-Request-ID'] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // ✅ ADDED: Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    }

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ✅ IMPROVED: Response interceptor with better error handling
api.interceptors.response.use(
  (response) => {
    // Check if response contains new token (for refresh endpoint)
    if (response.config.url === '/api/auth/refresh' && response.data.token) {
      const newToken = response.data.token;
      localStorage.setItem('authToken', newToken);
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // ✅ ADDED: Network error detection with retry
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.warn('⚠️ Network error detected, checking backend health...');
      
      const isHealthy = await checkBackendHealth();
      if (!isHealthy) {
        const networkError = new Error(
          'Cannot connect to server. Please ensure: \n' +
          '1. Backend is running on Render\n' +
          '2. CORS is configured correctly\n' +
          `3. API URL is: ${API_BASE_URL}`
        );
        networkError.status = 0;
        networkError.isNetworkError = true;
        return Promise.reject(networkError);
      }

      // If backend is healthy but network error persists, retry
      if (!originalRequest._retry && originalRequest._retryCount < MAX_RETRIES) {
        originalRequest._retry = true;
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
        
        // Exponential backoff
        const delay = RETRY_DELAY * Math.pow(2, originalRequest._retryCount - 1);
        console.log(`🔄 Retrying request (${originalRequest._retryCount}/${MAX_RETRIES}) in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return api(originalRequest);
      }
    }

    // If error is not 401 or request already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't retry refresh endpoint
    if (originalRequest.url === '/api/auth/refresh') {
      // Refresh failed - clear tokens and logout
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      // Dispatch logout event
      window.dispatchEvent(new CustomEvent('auth:logout'));

      return Promise.reject(error);
    }

    // Handle 401 unauthorized - token refresh flow
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // If already refreshing, queue request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;

      try {
        // Get refresh token
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call refresh endpoint
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          { refresh_token: refreshToken },
          { 
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 10000
          }
        );

        const newToken = response.data.token || response.data.access_token;
        const newRefreshToken = response.data.refreshToken;

        // Store new tokens
        localStorage.setItem('authToken', newToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        // Process queued requests
        processQueue(null, newToken);

        // Update original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear tokens and logout
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        // Process queue with error
        processQueue(refreshError, null);

        // Dispatch logout event
        window.dispatchEvent(new CustomEvent('auth:logout'));

        // Redirect to login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Flag to prevent multiple refresh token requests
let isRefreshing = false;
let failedQueue = [];

// Process queue of failed requests
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ✅ IMPROVED: Error handler with better messages
const handleError = (error) => {
  // Log error for debugging
  console.error('❌ API Error:', {
    message: error.message,
    status: error.response?.status,
    data: error.response?.data,
    config: error.config,
    url: error.config?.url,
    baseURL: error.config?.baseURL,
    isNetworkError: error.isNetworkError || error.code === 'ERR_NETWORK',
  });

  // Network errors - provide clear guidance
  if (error.isNetworkError || error.code === 'ERR_NETWORK') {
    const networkError = new Error(
      '🌐 Network Error: Cannot reach the server.\n' +
      'Please verify:\n' +
      `• Backend is running at: ${API_BASE_URL}\n` +
      '• Check Render logs for errors\n' +
      '• Verify CORS is configured on the backend'
    );
    networkError.status = 0;
    networkError.isNetworkError = true;
    throw networkError;
  }

  // Timeout errors
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    const timeoutError = new Error('⏱️ Request timeout. Please try again.');
    timeoutError.status = 408;
    throw timeoutError;
  }

  // Extract error message from response
  if (error.response?.data) {
    const errorData = error.response.data;
    const message = errorData.detail || errorData.message || errorData.error || 'An error occurred';

    // Create custom error with additional info
    const customError = new Error(message);
    customError.status = error.response.status;
    customError.data = errorData;
    customError.originalError = error;

    throw customError;
  }

  throw error;
};

// ✅ ADDED: Project Service
const projectService = {
  // Get all projects
  getProjects: async () => {
    try {
      const response = await api.get('/api/projects');
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  // Get a single project
  getProject: async (projectId) => {
    try {
      const response = await api.get(`/api/projects/${projectId}`);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  // Create a new project
  createProject: async (projectData) => {
    try {
      const response = await api.post('/api/projects', projectData);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  // Update a project
  updateProject: async (projectId, updates) => {
    try {
      const response = await api.put(`/api/projects/${projectId}`, updates);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  // Delete a project
  deleteProject: async (projectId) => {
    try {
      const response = await api.delete(`/api/projects/${projectId}`);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  // Save HTML code for a project
  saveHtml: async (projectId, htmlCode) => {
    try {
      const response = await api.put(`/api/projects/${projectId}`, { html_code: htmlCode });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  // Publish a project
  publishProject: async (projectId) => {
    try {
      const response = await api.post(`/api/projects/${projectId}/publish`);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },
};

// ✅ ADDED: Credit Service
const creditService = {
  // Get credit balance
  getBalance: async () => {
    try {
      const response = await api.get('/api/credits/balance');
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  // Get transaction history
  getTransactions: async () => {
    try {
      const response = await api.get('/api/credits/transactions');
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  // Purchase credits
  purchaseCredits: async (amount, paymentMethod) => {
    try {
      const response = await api.post('/api/credits/purchase', {
        amount,
        payment_method: paymentMethod,
      });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },
};

// ✅ ADDED: Upload Service
const uploadService = {
  // Upload a single file
  uploadFile: async (file, folder = 'uploads') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      const response = await api.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  // Upload avatar
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/api/upload/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  // Upload website assets
  uploadAssets: async (files, projectId) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('project_id', projectId);

    try {
      const response = await api.post('/api/upload/website-assets', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  // Delete a file
  deleteFile: async (filePath) => {
    try {
      const response = await api.delete(`/api/upload/${filePath}`);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  // List user files
  listFiles: async (folder = 'uploads') => {
    try {
      const response = await api.get(`/api/upload/list?folder=${folder}`);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },
};

// Helper methods for API calls
const apiService = {
  // GET request
  get: async (url, config = {}) => {
    try {
      const response = await api.get(url, config);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  // POST request
  post: async (url, data = {}, config = {}) => {
    try {
      const response = await api.post(url, data, config);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  // PUT request
  put: async (url, data = {}, config = {}) => {
    try {
      const response = await api.put(url, data, config);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  // PATCH request
  patch: async (url, data = {}, config = {}) => {
    try {
      const response = await api.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  // DELETE request
  delete: async (url, config = {}) => {
    try {
      const response = await api.delete(url, config);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  // File upload
  upload: async (url, file, config = {}) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post(url, formData, {
        ...config,
        headers: {
          ...config.headers,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  // Multiple file upload
  uploadMultiple: async (url, files, config = {}) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await api.post(url, formData, {
        ...config,
        headers: {
          ...config.headers,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  // Update user
  updateUser: async (userId, updates) => {
    try {
      const response = await api.put(`/api/users/${userId}`, updates);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  // Auth methods
  login: async (credentials) => {
    try {
      const response = await api.post('/api/auth/login', credentials);
      if (response.data.access_token) {
        localStorage.setItem('authToken', response.data.access_token);
        if (response.data.refresh_token) {
          localStorage.setItem('refreshToken', response.data.refresh_token);
        }
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
      }
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  signup: async (userData) => {
    try {
      const response = await api.post('/api/auth/signup', userData);
      if (response.data.access_token) {
        localStorage.setItem('authToken', response.data.access_token);
        if (response.data.refresh_token) {
          localStorage.setItem('refreshToken', response.data.refresh_token);
        }
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
      }
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      // Ignore logout errors
      console.warn('⚠️ Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get('/api/auth/me');
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post('/api/auth/reset-password', {
        token,
        new_password: newPassword,
      });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  // ✅ ADDED: Health check method
  healthCheck: async () => {
    return await checkBackendHealth();
  }
};

// Token management utilities
apiService.setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

apiService.getAuthToken = () => {
  return localStorage.getItem('authToken');
};

apiService.removeAuthToken = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

// ✅ EXPORT all services
// Export everything as named exports
export { 
  api, 
  apiService, 
  projectService, 
  creditService, 
  uploadService,
  API_BASE_URL,
  checkBackendHealth
};

// Also keep default export for backward compatibility
export default { 
  api, 
  apiService, 
  projectService, 
  creditService, 
  uploadService,
  API_BASE_URL,
  checkBackendHealth
};
