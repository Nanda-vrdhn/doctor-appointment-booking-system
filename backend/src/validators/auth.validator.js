import { email, password, phone, required } from './common.js'

/**
 * Public registration ALWAYS creates a PATIENT. `body.role` is deliberately
 * ignored so a patient cannot self-assign a privileged role.
 */
export function validateRegister(body) {
  const data = {
    fullName: String(body.fullName ?? '').trim(),
    email: String(body.email ?? '').trim().toLowerCase(),
    password: String(body.password ?? ''),
    phone: String(body.phone ?? '').trim(),
  }
  const errors = {
    fullName: required(body.fullName, 'Full name', { min: 2, max: 120 }),
    email: email(body.email),
    password: password(body.password),
    phone: phone(body.phone),
  }
  return { data, errors }
}

export function validateLogin(body) {
  const data = {
    email: String(body.email ?? '').trim().toLowerCase(),
    password: String(body.password ?? ''),
  }
  const errors = {
    email: email(body.email),
    password: required(body.password, 'Password', { min: 1, max: 72 }),
  }
  return { data, errors }
}
