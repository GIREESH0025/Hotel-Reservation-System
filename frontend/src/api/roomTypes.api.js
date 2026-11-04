import api from './axios'

export const roomTypesApi = {
  list: (params) => api.get('/room-types', { params }),
  get: (id) => api.get(`/room-types/${id}`),
  create: (data) => api.post('/room-types', data),
  update: (id, data) => api.patch(`/room-types/${id}`, data),
  delete: (id) => api.delete(`/room-types/${id}`),
}

