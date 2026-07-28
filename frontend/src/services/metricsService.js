import api from '../api/axiosClient';

export const metricsService = {
  getMetrics: () => api.get('/metrics'),
};
