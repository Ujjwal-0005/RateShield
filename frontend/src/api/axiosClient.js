import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach access token ──────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rs_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: handle 401 globally ─────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      const refreshToken = localStorage.getItem('rs_refresh_token');
      if (!refreshToken) {
        _clearSession();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        const newToken = data.data.token;
        const newRefresh = data.data.refreshToken;
        localStorage.setItem('rs_access_token', newToken);
        localStorage.setItem('rs_refresh_token', newRefresh);

        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        _clearSession();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

function _clearSession() {
  localStorage.removeItem('rs_access_token');
  localStorage.removeItem('rs_refresh_token');
  localStorage.removeItem('rs_user');
  window.location.href = '/login';
}

export default api;
