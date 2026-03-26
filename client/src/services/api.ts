import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import { 
  User, 
  Prompt, 
  AuthResponse, 
  PaginatedResponse, 
  SearchFilters, 
  CreatePromptData,
  AdminStats
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Secure storage for client-side security tokens (CSRF)
const secureStorage = {
  // We only store CSRF token in memory for security
  _csrfToken: null as string | null,
  
  setCSRFToken: (token: string) => {
    secureStorage._csrfToken = token;
  },
  
  getCSRFToken: (): string | null => {
    return secureStorage._csrfToken;
  },
  
  clearTokens: () => {
    secureStorage._csrfToken = null;
    // Server will clear httpOnly cookies on logout
  }
};

// Simple cache implementation
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const withCache = async (key: string, fetcher: () => Promise<any>) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Implement retry logic
axiosRetry(api, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) => {
    const axiosError = error as any;
    return !axiosError.response || axiosError.response.status >= 500 || axiosError.code === 'NETWORK_ERROR';
  }
});

// Add CSRF to requests
api.interceptors.request.use((config) => {
  // Add CSRF token for state-changing requests
  if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase() || '')) {
    const csrfToken = secureStorage.getCSRFToken();
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }
  
  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Enhanced response error handling with retry logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const axiosError = error as AxiosError;
    const originalRequest = axiosError.config as any;
    
    if (axiosError.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/refresh') || originalRequest.url?.includes('/login')) {
        secureStorage.clearTokens();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        
        if (refreshResponse.data.csrfToken) {
          secureStorage.setCSRFToken(refreshResponse.data.csrfToken);
        }
        
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        secureStorage.clearTokens();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    // ... rest of error handling
    else if (axiosError.response?.status === 403) {
      throw new Error('Access denied. You do not have permission to perform this action.');
    } else if (axiosError.response?.status === 429) {
      throw new Error('Too many requests. Please try again later.');
    } else if (axiosError.code === 'NETWORK_ERROR' || !axiosError.response) {
      throw new Error('Network error. Please check your internet connection.');
    } else if (axiosError.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please try again.');
    }
    
    return Promise.reject(error);
  }
);

// Function to fetch and set CSRF token
export const fetchCSRFToken = async () => {
  try {
    const response = await api.get('/csrf-token');
    secureStorage.setCSRFToken(response.data.csrfToken);
    return response.data.csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    return null;
  }
};

// Auth API
export const authAPI = {
  register: async (userData: { username: string; email: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', userData);
    if (response.data.csrfToken) {
      secureStorage.setCSRFToken(response.data.csrfToken);
    }
    return response.data;
  },

  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.csrfToken) {
      secureStorage.setCSRFToken(response.data.csrfToken);
    }
    return response.data;
  },

  getCurrentUser: async (): Promise<{ user: User }> => {
    return withCache('currentUser', () => 
      api.get('/auth/me').then(r => r.data)
    );
  },

  updateProfile: async (profileData: { username?: string; avatar?: string }): Promise<{ message: string; user: User }> => {
    const response = await api.put('/auth/profile', profileData);
    // Clear cache after profile update
    cache.delete('currentUser');
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      secureStorage.clearTokens();
      cache.clear();
    }
  },

  refreshToken: async (): Promise<{ csrfToken: string }> => {
    const response = await api.post('/auth/refresh');
    if (response.data.csrfToken) {
      secureStorage.setCSRFToken(response.data.csrfToken);
    }
    return response.data;
  }
};

// Prompts API
export const promptsAPI = {
  getPrompts: async (filters: SearchFilters = {}): Promise<PaginatedResponse<Prompt>> => {
    const cacheKey = `prompts-${JSON.stringify(filters)}`;
    return withCache(cacheKey, async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      const response = await api.get(`/prompts?${params}`);
      return response.data;
    });
  },

  getPrompt: async (id: string): Promise<{ prompt: Prompt }> => {
    const cacheKey = `prompt-${id}`;
    return withCache(cacheKey, () => 
      api.get(`/prompts/${id}`).then(r => r.data)
    );
  },

  createPrompt: async (promptData: CreatePromptData, imageFiles?: File[]): Promise<{ prompt: Prompt }> => {
    if (imageFiles && imageFiles.length > 0) {
      const form = new FormData();
      (Object.entries(promptData) as [string, any][]).forEach(([k, v]) => {
        if (Array.isArray(v)) v.forEach(item => form.append(k, item));
        else if (v !== undefined && v !== null) form.append(k, String(v));
      });
      imageFiles.forEach(f => form.append('images', f));
      const response = await api.post('/prompts', form);
      cache.clear();
      return response.data;
    }
    const response = await api.post('/prompts', promptData);
    cache.clear();
    return response.data;
  },

  ratePrompt: async (id: string, rating: number): Promise<{ averageRating: number; totalRatings: number }> => {
    const response = await api.post(`/prompts/${id}/rate`, { rating });
    // Clear cache for this prompt
    cache.delete(`prompt-${id}`);
    cache.delete('prompts-{}');
    return response.data;
  },

  reportPrompt: async (id: string, reason: string, details?: string): Promise<{ message: string }> => {
    const response = await api.post(`/prompts/${id}/report`, { reason, details });
    return response.data;
  },

  toggleFavorite: async (id: string): Promise<{ favorited: boolean; favoritesCount: number }> => {
    const response = await api.post(`/prompts/${id}/favorite`);
    // Clear cache
    cache.delete(`prompt-${id}`);
    cache.delete('prompts-{}');
    cache.delete('favorites');
    return response.data;
  },

  getFavorites: async (): Promise<{ prompts: Prompt[] }> => {
    return withCache('favorites', () => 
      api.get('/prompts/user/favorites').then(r => r.data)
    );
  },

  getMyPrompts: async (): Promise<{ prompts: Prompt[] }> => {
    return withCache('myPrompts', () =>
      api.get('/prompts/user/my-prompts').then(r => r.data)
    );
  },

  updatePrompt: async (id: string, data: Partial<CreatePromptData>, imageFiles?: File[], existingImages?: string[]): Promise<{ prompt: Prompt }> => {
    if (imageFiles && imageFiles.length > 0) {
      const form = new FormData();
      (Object.entries(data) as [string, any][]).forEach(([k, v]) => {
        if (Array.isArray(v)) v.forEach(item => form.append(k, item));
        else if (v !== undefined && v !== null) form.append(k, String(v));
      });
      imageFiles.forEach(f => form.append('images', f));
      if (existingImages) existingImages.forEach(url => form.append('existingImages', url));
      const response = await api.put(`/prompts/${id}`, form);
      cache.delete(`prompt-${id}`); cache.delete('myPrompts'); cache.delete('prompts-{}');
      return response.data;
    }
    const payload = existingImages !== undefined ? { ...data, existingImages } : data;
    const response = await api.put(`/prompts/${id}`, payload);
    cache.delete(`prompt-${id}`); cache.delete('myPrompts'); cache.delete('prompts-{}');
    return response.data;
  },

  deletePrompt: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/prompts/${id}`);
    cache.delete(`prompt-${id}`);
    cache.delete('myPrompts');
    cache.delete('prompts-{}');
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getUserProfile: async (username: string): Promise<{ user: User }> => {
    const cacheKey = `userProfile-${username}`;
    return withCache(cacheKey, () => 
      api.get(`/users/${username}`).then(r => r.data)
    );
  },

  updateProfile: async (profileData: { username?: string; avatar?: string; bio?: string }): Promise<{ message: string; user: User }> => {
    const response = await api.put('/users/profile', profileData);
    // Clear cache
    cache.delete('currentUser');
    return response.data;
  },

  changePassword: async (passwordData: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
    const response = await api.put('/users/password', passwordData);
    return response.data;
  },

  deleteAccount: async (password: string): Promise<{ message: string }> => {
    const response = await api.delete('/users/account', { data: { password } });
    // Clear all cache
    cache.clear();
    return response.data;
  },

  getUserStats: async (): Promise<{ stats: any }> => {
    return withCache('userStats', () =>
      api.get('/users/stats/me').then(r => r.data)
    );
  },

  updatePreferences: async (prefs: { showNSFW: boolean }): Promise<{ preferences: any }> => {
    const response = await api.patch('/users/preferences', prefs);
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  getDashboard: async (): Promise<AdminStats> => {
    return withCache('adminDashboard', () => 
      api.get('/admin/dashboard').then(r => r.data)
    );
  },

  getPendingPrompts: async (page = 1, limit = 20): Promise<PaginatedResponse<Prompt>> => {
    const response = await api.get(`/admin/prompts/pending?page=${page}&limit=${limit}`);
    return response.data;
  },

  approvePrompt: async (id: string): Promise<{ message: string; prompt: Prompt }> => {
    const response = await api.post(`/admin/prompts/${id}/approve`);
    // Clear cache
    cache.delete('adminDashboard');
    cache.delete(`prompt-${id}`);
    cache.delete('prompts-{}');
    return response.data;
  },

  rejectPrompt: async (id: string, reason: string): Promise<{ message: string; prompt: Prompt }> => {
    const response = await api.post(`/admin/prompts/${id}/reject`, { reason });
    // Clear cache
    cache.delete('adminDashboard');
    cache.delete(`prompt-${id}`);
    cache.delete('prompts-{}');
    return response.data;
  },

  getUsers: async (page = 1, limit = 20, search?: string, status?: string): Promise<PaginatedResponse<User>> => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    
    const response = await api.get(`/admin/users?${params}`);
    return response.data;
  },

  toggleUserStatus: async (id: string): Promise<{ message: string; user: User }> => {
    const response = await api.post(`/admin/users/${id}/toggle-status`);
    cache.delete('adminDashboard');
    return response.data;
  },

  deletePrompt: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/admin/prompts/${id}`);
    // Clear cache
    cache.delete('adminDashboard');
    cache.delete(`prompt-${id}`);
    cache.delete('prompts-{}');
    return response.data;
  },

  getReports: async (status = 'pending', page = 1): Promise<{ reports: any[]; total: number; pendingCount: number; pagination: any }> => {
    const params = new URLSearchParams({ status, page: page.toString() });
    return api.get(`/admin/reports?${params}`).then(r => r.data);
  },

  resolveReport: async (id: string, action: string, resolutionNote?: string): Promise<{ message: string }> => {
    const response = await api.post(`/admin/reports/${id}/resolve`, { action, resolutionNote });
    return response.data;
  },

  dismissReport: async (id: string, resolutionNote?: string): Promise<{ message: string }> => {
    const response = await api.post(`/admin/reports/${id}/dismiss`, { resolutionNote });
    return response.data;
  },

  getModerators: async (): Promise<{ moderators: User[] }> => {
    return api.get('/admin/moderators').then(r => r.data);
  },

  getModerationLog: async (): Promise<{ actions: any[] }> => {
    return api.get('/admin/moderation-log').then(r => r.data);
  },

  addModerator: async (email: string): Promise<{ message: string; user: User }> => {
    const response = await api.post('/admin/moderators', { email });
    return response.data;
  },

  removeModerator: async (userId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/admin/moderators/${userId}`);
    return response.data;
  },

  // Forums management (admin)
  getAdminForums: async (): Promise<{ forums: any[] }> => {
    return api.get('/admin/forums').then(r => r.data);
  },

  createForum: async (data: { name: string; description: string; url: string; image?: string; favicon?: string; language?: string }): Promise<{ message: string; forum: any }> => {
    const response = await api.post('/admin/forums', data);
    return response.data;
  },

  updateForum: async (id: string, data: { name?: string; description?: string; url?: string; isActive?: boolean; image?: string; favicon?: string; language?: string }): Promise<{ message: string; forum: any }> => {
    const response = await api.put(`/admin/forums/${id}`, data);
    return response.data;
  },

  deleteForum: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/admin/forums/${id}`);
    return response.data;
  },

  // AI Tools management (admin)
  getAdminTools: async (): Promise<{ tools: any[] }> => {
    return api.get('/admin/tools').then(r => r.data);
  },

  createTool: async (data: { name: string; url: string; description: string; category: string; featured?: boolean }): Promise<{ message: string; tool: any }> => {
    const response = await api.post('/admin/tools', data);
    return response.data;
  },

  updateTool: async (id: string, data: { name?: string; url?: string; description?: string; category?: string; isActive?: boolean; featured?: boolean }): Promise<{ message: string; tool: any }> => {
    const response = await api.put(`/admin/tools/${id}`, data);
    return response.data;
  },

  deleteTool: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/admin/tools/${id}`);
    return response.data;
  },
};

// Public AI Tools API
export const aiToolsAPI = {
  getTools: async (category?: string): Promise<{ tools: any[] }> => {
    const params = category && category !== 'all' ? `?category=${category}` : '';
    return api.get(`/tools${params}`).then(r => r.data);
  },
};


// Public Forums API
export const forumsAPI = {
  getForums: async (): Promise<{ forums: any[] }> => {
    return api.get('/forums').then(r => r.data);
  },
};

// Blog API
export const blogAPI = {
  getPosts: async (params: { category?: string; page?: number; search?: string } = {}): Promise<{ posts: any[]; pagination: any }> => {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'all') query.append('category', params.category);
    if (params.page) query.append('page', params.page.toString());
    if (params.search) query.append('search', params.search);
    const response = await api.get(`/blog?${query}`);
    return response.data;
  },

  getPost: async (id: string): Promise<any> => {
    const response = await api.get(`/blog/${id}`);
    return response.data;
  },

  createPost: async (data: {
    title: string;
    excerpt: string;
    content: string;
    category: string;
    coverImage?: string;
    images?: string[];
    mentions?: Array<{ kind: string; refId: string; name: string; url?: string; category?: string; description?: string }>;
    tags?: string[];
  }): Promise<any> => {
    const response = await api.post('/blog', data);
    return response.data;
  },

  updatePost: async (id: string, data: Partial<any>): Promise<any> => {
    const response = await api.put(`/blog/${id}`, data);
    return response.data;
  },

  deletePost: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/blog/${id}`);
    return response.data;
  },

  likePost: async (id: string): Promise<{ likes: number; liked: boolean }> => {
    const response = await api.post(`/blog/${id}/like`);
    return response.data;
  },

  getComments: async (id: string): Promise<{ comments: any[] }> => {
    const response = await api.get(`/blog/${id}/comments`);
    return response.data;
  },

  addComment: async (id: string, content: string): Promise<any> => {
    const response = await api.post(`/blog/${id}/comments`, { content });
    return response.data;
  },

  deleteComment: async (postId: string, commentId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/blog/${postId}/comments/${commentId}`);
    return response.data;
  },
};

// Notifications API
export const notificationsAPI = {
  getAll: async (page = 1): Promise<{ notifications: any[]; total: number; unreadCount: number }> => {
    return api.get(`/notifications?page=${page}`).then(r => r.data);
  },
  getUnreadCount: async (): Promise<{ count: number }> => {
    return api.get('/notifications/unread-count').then(r => r.data);
  },
  markRead: async (id: string): Promise<void> => {
    await api.put(`/notifications/${id}/read`);
  },
  markAllRead: async (): Promise<void> => {
    await api.put('/notifications/read-all');
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  }
};

// Public stats API
export const statsAPI = {
  getStats: async (): Promise<{ prompts: number; creators: number; saved: number }> => {
    const response = await api.get('/stats');
    return response.data;
  }
};

export default api;
export { secureStorage };
