import api from '../api/axiosClient';

export const apiKeyService = {
  getAll:      (params)   => api.get('/api-keys', { params }),
  getById:     (id)       => api.get(`/api-keys/${id}`),
  create:      (payload)  => api.post('/api-keys', payload),
  update:      (id, data) => api.put(`/api-keys/${id}`, data),
  disable:     (id)       => api.patch(`/api-keys/${id}/disable`),
  enable:      (id)       => api.patch(`/api-keys/${id}/enable`),
  regenerate:  (id, data) => api.patch(`/api-keys/${id}/regenerate`, data),
  revoke:      (id)       => api.delete(`/api-keys/${id}`),
};
