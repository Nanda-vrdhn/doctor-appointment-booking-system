/**
 * Thin fetch wrapper. Requests go through the Vite dev proxy at /api so the
 * httpOnly session cookie is sent automatically (credentials: 'include').
 */

const BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  let payload = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }

  if (!res.ok) {
    const error = new Error(payload?.error?.message || `Request failed (${res.status})`)
    error.status = res.status
    error.code = payload?.error?.code
    error.details = payload?.error?.details
    throw error
  }

  return payload?.data
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
  del: (path) => request('DELETE', path),
}

export { BASE }
