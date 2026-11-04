import api from './axios'

export const roomsApi = {
  list: (params) => api.get('/rooms', { params }),
  get: (id) => api.get(`/rooms/${id}`),
  availability: (params) => api.get('/rooms/availability', { params }),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.patch(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`),
}

