import api from './axios'

export const reservationsApi = {
  list: (params) => api.get('/reservations', { params }),
  get: (id) => api.get(`/reservations/${id}`),
  create: (data) => api.post('/reservations', data),
  pay: (id, data) => api.post(`/reservations/${id}/pay`, data),
  invoice: (id) => api.get(`/reservations/${id}/invoice`),
  update: (id, data) => api.patch(`/reservations/${id}`, data),
  delete: (id) => api.delete(`/reservations/${id}`),
  confirm: (id) => api.patch(`/reservations/${id}/confirm`),
  checkIn: (id) => api.patch(`/reservations/${id}/check-in`),
  checkOut: (id) => api.patch(`/reservations/${id}/check-out`),
  cancel: (id) => api.patch(`/reservations/${id}/cancel`),
}
