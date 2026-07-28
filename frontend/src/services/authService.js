import api from '../api/axiosClient';

export const authService = {
  /**
   * Register a new admin user.
   */
  register: (payload) => api.post('/auth/register', payload),

  /**
   * Authenticate and obtain access + refresh tokens.
   */
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  /**
   * Refresh the access token using a stored refresh token.
   */
  refresh: (refreshToken) =>
    api.post('/auth/refresh', { refreshToken }),

  /**
   * Revoke the current session (logout).
   */
  logout: () => api.post('/auth/logout'),

  /**
   * Fetch the authenticated admin profile.
   */
  getMe: () => api.get('/auth/me'),

  /**
   * Update name / email.
   */
  updateProfile: (payload) => api.put('/auth/profile', payload),

  /**
   * Change password.
   */
  changePassword: (payload) => api.patch('/auth/change-password', payload),
};
