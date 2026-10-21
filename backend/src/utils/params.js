import { ApiError } from './errors.js'

/** Parse a positive integer route/query parameter or raise a 400. */
export function parseId(value, field = 'id') {
  const n = Number(value)
  if (!Number.isInteger(n) || n <= 0) throw ApiError.badRequest(`Invalid ${field}.`)
  return n
}

export function parseIntParam(value, fallback = null) {
  if (value === undefined || value === null || value === '') return fallback
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : fallback
}
