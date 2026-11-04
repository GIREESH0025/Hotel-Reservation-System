import api from './axios'

export const guestsApi = {
  list: (params) => api.get('/guests', { params }),
  get: (id) => api.get(`/guests/${id}`),
  create: (data) => api.post('/guests', data),
  update: (id, data) => api.patch(`/guests/${id}`, data),
  delete: (id) => api.delete(`/guests/${id}`),
}

