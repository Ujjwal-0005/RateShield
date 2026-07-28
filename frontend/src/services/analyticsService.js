import api from '../api/axiosClient';

export const analyticsService = {
  getOverview: (period = '24h') => api.get('/metrics', { params: { period } }),
  getEvents: (params = {}) => api.get('/metrics', { params: { events: true, ...params } }),
  exportReport: (format = 'csv', period = '24h') =>
    api.get(`/metrics/export?format=${format}&period=${period}`, { responseType: 'blob' }),
};
