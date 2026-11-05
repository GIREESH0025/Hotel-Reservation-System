import api from './axios'

export const paymentsApi = {
  list: (params) => api.get('/payments', { params }),
  get: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  payReservation: (id, data) => api.post(`/reservations/${id}/pay`, data),
  refund: (id, data) => api.post(`/payments/${id}/refund`, data),
}
