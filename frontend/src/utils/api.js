import axios from 'axios';

// FIX 6: When CRA's proxy is set in package.json ("proxy": "http://localhost:5000"),
// relative URLs like "/api/..." are auto-proxied during `npm start`.
// The REACT_APP_API_URL env var (absolute URL) is only needed for production builds.
// Using a relative base path makes local dev work regardless of the port CRA runs on.
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT from localStorage ─────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sl_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// ── Response interceptor: handle 401 globally ────────────────────────────────
// FIX 7: Only redirect to /login on 401 if the request was NOT itself the
// login or signup call — otherwise a wrong-password attempt would cause an
// infinite redirect loop.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthRoute =
      err.config?.url?.includes('/auth/login') ||
      err.config?.url?.includes('/auth/signup');

    if (err.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('sl_token');
      localStorage.removeItem('sl_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
