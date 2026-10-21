import { api } from './apiClient.js'

export const bookAppointment = (availabilityId, reason) =>
  api.post('/appointments', { availabilityId, reason })

export const myAppointments = () => api.get('/appointments/mine')
export const cancelAppointment = (id) => api.patch(`/appointments/${id}/cancel`)

export const doctorAppointments = (status = '') =>
  api.get(`/appointments/doctor/appointments${status ? `?status=${status}` : ''}`)
export const doctorAppointment = (id) => api.get(`/appointments/doctor/appointments/${id}`)
export const updateAppointmentStatus = (id, action) =>
  api.patch(`/appointments/doctor/appointments/${id}/status`, { action })
