import api from '../api/axiosClient';

export const policyService = {
  getAll:     (params)   => api.get('/policies', { params }),
  getById:    (id)       => api.get(`/policies/${id}`),
  create:     (payload)  => api.post('/policies', payload),
  update:     (id, data) => api.put(`/policies/${id}`, data),
  activate:   (id)       => api.patch(`/policies/${id}/activate`),
  deactivate: (id)       => api.patch(`/policies/${id}/deactivate`),
  remove:     (id)       => api.delete(`/policies/${id}`),
};
