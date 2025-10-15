import axios from 'axios';

// Normalize base URL and ensure it targets the backend /api mountpoint
const rawBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
const baseURL = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (token) {
      if (config.headers) {
        (config.headers as Record<string, unknown>)['Authorization'] = `Bearer ${token}`;
      } else {
        config.headers = { Authorization: `Bearer ${token}` } as import('axios').AxiosRequestHeaders;
      }
    }
  } catch {}
  return config;
});

export default api;
