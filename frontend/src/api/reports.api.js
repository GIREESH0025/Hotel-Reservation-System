import api from './axios'

export const reportsApi = {
  summary: () => api.get('/reports/summary'),
  revenue: (params) => api.get('/reports/revenue', { params }),
  occupancy: () => api.get('/reports/occupancy'),
}

