import axios from 'axios';
import { getStoredToken } from './common/access';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:4005'
  : (process.env.REACT_APP_API_URL || '');

const api = axios.create({
  baseURL: API_BASE,
});

// Attach token to every request automatically
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Prevent browser caching for all GET requests to avoid stale 401s
    if (config.method && config.method.toLowerCase() === 'get') {
      config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      config.headers['Pragma'] = 'no-cache';
      config.headers['Expires'] = '0';
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token expiry globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const token = getStoredToken();
      // Only auto-redirect if we had a token (means it expired)
      if (token) {
        localStorage.removeItem('sa_token');
        localStorage.removeItem('sa_authUser');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE };
