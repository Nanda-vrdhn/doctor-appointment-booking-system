/** Small, dependency-free field helpers shared by all validators. */

export function str(value) {
  return value == null ? '' : String(value).trim()
}

export function required(value, field, { min = 1, max = 255 } = {}) {
  const v = str(value)
  if (v.length < min) {
    return min === 1 ? `${field} is required.` : `${field} must be at least ${min} characters.`
  }
  if (v.length > max) return `${field} must be ${max} characters or fewer.`
  return null
}

export function optional(value, field, { max = 255 } = {}) {
  const v = str(value)
  if (v.length === 0) return null
  if (v.length > max) return `${field} must be ${max} characters or fewer.`
  return null
}

export function email(value) {
  const v = str(value)
  if (!v) return 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address.'
  return null
}

/** Password policy: 8-72 chars, at least one letter and one number. */
export function password(value) {
  const v = str(value)
  if (v.length < 8) return 'Password must be at least 8 characters.'
  if (v.length > 72) return 'Password must be 72 characters or fewer.'
  if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) {
    return 'Password must include at least one letter and one number.'
  }
  return null
}

export function phone(value) {
  const v = str(value)
  if (!v) return null
  if (!/^\+?[0-9][0-9\s-]{6,19}$/.test(v)) return 'Enter a valid phone number.'
  return null
}

export function integer(value, field, { min = -Infinity, max = Infinity, optional = false } = {}) {
  if (value === undefined || value === null || value === '') {
    return optional ? null : `${field} is required.`
  }
  const n = Number(value)
  if (!Number.isInteger(n)) return `${field} must be a whole number.`
  if (n < min) return `${field} must be at least ${min}.`
  if (n > max) return `${field} must be at most ${max}.`
  return null
}

export function oneOf(value, field, allowed) {
  return allowed.includes(value) ? null : `${field} must be one of: ${allowed.join(', ')}.`
}

export function isoDate(value, field = 'Date') {
  const v = str(value)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${field} must be a valid date (YYYY-MM-DD).`
  const d = new Date(`${v}T00:00:00`)
  if (Number.isNaN(d.getTime())) return `${field} must be a valid date (YYYY-MM-DD).`
  return null
}

export function time(value, field = 'Time') {
  const v = str(value)
  if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(v)) {
    return `${field} must be a valid time (HH:MM).`
  }
  return null
}
