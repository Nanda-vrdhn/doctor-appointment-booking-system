import { api } from './apiClient.js'

export const listDoctors = (params = {}) => {
  const qs = new URLSearchParams()
  if (params.name) qs.set('name', params.name)
  if (params.specializationId) qs.set('specializationId', params.specializationId)
  if (params.date) qs.set('date', params.date)
  const query = qs.toString()
  return api.get(`/doctors${query ? `?${query}` : ''}`)
}

export const getDoctor = (doctorId) => api.get(`/doctors/${doctorId}`)
export const getDoctorAvailability = (doctorId) => api.get(`/doctors/${doctorId}/availability`)
export const listSpecializations = () => api.get('/specializations')

export const getMyProfile = () => api.get('/doctor/profile')
export const updateDoctorProfile = (payload) => api.patch('/doctor/profile', payload)
