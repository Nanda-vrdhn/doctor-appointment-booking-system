import { api } from './apiClient.js'

export const register = (payload) => api.post('/auth/register', payload)
export const login = (email, password) => api.post('/auth/login', { email, password })
export const logout = () => api.post('/auth/logout')
export const me = () => api.get('/auth/me')

export const getProfile = () => api.get('/users/me')
export const updateProfile = (payload) => api.patch('/users/me', payload)
