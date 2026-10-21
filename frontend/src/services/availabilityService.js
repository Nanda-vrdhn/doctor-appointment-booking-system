import { api } from './apiClient.js'

export const listOwnAvailability = (params = {}) => {
  const qs = new URLSearchParams()
  if (params.from) qs.set('from', params.from)
  if (params.to) qs.set('to', params.to)
  const query = qs.toString()
  return api.get(`/doctor/availability${query ? `?${query}` : ''}`)
}

export const createSlot = (payload) => api.post('/doctor/availability', payload)
export const updateSlot = (id, payload) => api.patch(`/doctor/availability/${id}`, payload)
export const deactivateSlot = (id) => api.patch(`/doctor/availability/${id}/deactivate`)
