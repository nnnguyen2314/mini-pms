import axios from 'axios';

// Determine base URL for API
// Priority:
// 1) NEXT_PUBLIC_API_BASE_URL (or NEXT_PUBLIC_API_URL) if provided
// 2) If running in browser and no env provided, use relative "/api" so Nginx can proxy
// 3) Fallback to http://localhost:5000/api for SSR/tests/dev
const envBase = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || '').trim();
let computedBase: string;
if (envBase) {
  const trimmed = envBase.replace(/\/+$/, '');
  computedBase = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
} else if (typeof window !== 'undefined') {
  computedBase = '/api';
} else {
  computedBase = 'http://localhost:5000/api';
}

export const api = axios.create({
  baseURL: computedBase,
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
          if (config.headers) {
            (config.headers as Record<string, unknown>)['Authorization'] = `Bearer ${token}`;
          } else {
            config.headers = { Authorization: `Bearer ${token}` } as import('axios').AxiosRequestHeaders;
          }
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
