/** Client-side validation mirrors the server rules for faster feedback. */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(value) {
  if (!value) return 'Email is required.'
  if (!EMAIL_RE.test(value)) return 'Enter a valid email address.'
  return ''
}

export function validatePassword(value) {
  if (!value) return 'Password is required.'
  if (value.length < 8) return 'Password must be at least 8 characters.'
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return 'Password must include a letter and a number.'
  }
  return ''
}

export function validateRequired(value, label, { min = 1, max = 255 } = {}) {
  const v = (value ?? '').trim()
  if (v.length < min) return `${label} is required.`
  if (v.length > max) return `${label} must be ${max} characters or fewer.`
  return ''
}

export function validatePhone(value) {
  const v = (value ?? '').trim()
  if (!v) return ''
  return /^\+?[0-9][0-9\s-]{6,19}$/.test(v) ? '' : 'Enter a valid phone number.'
}
