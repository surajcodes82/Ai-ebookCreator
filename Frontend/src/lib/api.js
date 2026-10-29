import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL;
const productionApiUrl = 'https://ai-ebookcreator-4d0s.onrender.com';

export const API_BASE = (configuredApiUrl || (import.meta.env.PROD ? productionApiUrl : '')).replace(/\/$/, '');
export const TOKEN_KEY = 'aiec.token';

export const getToken = () => localStorage.getItem(TOKEN_KEY) || '';
export const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let unauthorizedHandler = null;
/** AuthContext registers a handler so a rejected token clears the session. */
export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const response = error.response;

    // Blob responses (file exports) carry their JSON error in the blob body.
    if (response && typeof Blob !== 'undefined' && response.data instanceof Blob) {
      try {
        response.data = JSON.parse(await response.data.text());
      } catch {
        response.data = null;
      }
    }

    const url = error.config?.url || '';
    const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register');
    if (response?.status === 401 && !isAuthAttempt && unauthorizedHandler) {
      unauthorizedHandler();
    }

    return Promise.reject(error);
  }
);

/** Extracts a human readable message from any axios failure. */
export const getErrorMessage = (error) => {
  if (!error?.response) {
    return 'Could not reach the server. Make sure the backend is running on port 5000.';
  }
  const data = error.response.data;
  if (data && typeof data === 'object' && data.message) return data.message;
  if (typeof data === 'string' && data.trim()) return data.trim();

  const status = error.response.status;
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 404) return 'The requested resource was not found.';
  if (status >= 500) return 'Something went wrong on our side. Please try again.';
  return 'The request could not be completed. Please try again.';
};

export default api;
