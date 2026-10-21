import { password, phone, required } from './common.js'

export function validateUpdateProfile(body) {
  const wantsPasswordChange = Boolean(body.newPassword)
  const data = {
    fullName: String(body.fullName ?? '').trim(),
    phone: String(body.phone ?? '').trim(),
    currentPassword: wantsPasswordChange ? String(body.currentPassword ?? '') : null,
    newPassword: wantsPasswordChange ? String(body.newPassword) : null,
  }
  const errors = {
    fullName: required(body.fullName, 'Full name', { min: 2, max: 120 }),
    phone: phone(body.phone),
  }
  if (wantsPasswordChange) {
    errors.newPassword = password(body.newPassword)
    errors.currentPassword = required(body.currentPassword, 'Current password', {
      min: 1,
      max: 72,
    })
  }
  return { data, errors }
}
