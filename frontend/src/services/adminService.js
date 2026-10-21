import { api } from './apiClient.js'

export const dashboard = () => api.get('/admin/dashboard')

export const listUsers = (params = {}) => {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.role) qs.set('role', params.role)
  const query = qs.toString()
  return api.get(`/admin/users${query ? `?${query}` : ''}`)
}
export const setUserActive = (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive })

export const listAppointments = (params = {}) => {
  const qs = new URLSearchParams()
  if (params.status) qs.set('status', params.status)
  const query = qs.toString()
  return api.get(`/admin/appointments${query ? `?${query}` : ''}`)
}

export const listSpecializations = () => api.get('/admin/specializations')
export const createSpecialization = (payload) => api.post('/admin/specializations', payload)
export const updateSpecialization = (id, payload) => api.patch(`/admin/specializations/${id}`, payload)
export const setSpecializationActive = (id, isActive) =>
  api.patch(`/admin/specializations/${id}/status`, { isActive })

export const createDoctor = (payload) => api.post('/admin/doctors', payload)
export const updateDoctor = (id, payload) => api.patch(`/admin/doctors/${id}`, payload)
export const setDoctorActive = (id, isActive) => api.patch(`/admin/doctors/${id}/status`, { isActive })
