import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

/**
 * Sign a short-lived access token for an authenticated user. Accepts either a
 * raw DB row (`user_id`) or a public profile (`userId`).
 */
export function signToken(user) {
  const id = user.userId ?? user.user_id
  if (id === undefined || id === null) {
    throw new Error('signToken requires a user id')
  }
  return jwt.sign({ sub: String(id), role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  })
}

/** Verify a token and return its payload, or throw. */
export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET)
}

/** Cookie settings. `secure` is enabled outside local development. */
export function cookieOptions() {
  return {
    httpOnly: true, // not readable from JavaScript (XSS mitigation)
    sameSite: 'lax', // blocks cross-site state-changing requests (CSRF mitigation)
    secure: env.isProduction,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  }
}
