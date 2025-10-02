import axios from 'axios';

const rawBase = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
const baseURL = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  // Attach token from localStorage/persisted store if present
  try {
    const raw = globalThis?.localStorage?.getItem('persist:root');
    if (raw) {
      const root = JSON.parse(raw);
      const authStr = root?.auth as string | undefined;
      if (authStr) {
        const auth = JSON.parse(authStr);
        const token = auth?.token as string | null;
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }
  } catch (_e) {
    // ignore
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // basic normalization
    return Promise.reject(err);
  }
);

export default api;
