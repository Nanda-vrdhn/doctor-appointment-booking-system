import { env } from '../config/env.js'
import { verifyToken } from '../utils/jwt.js'
import { ApiError } from '../utils/errors.js'

/**
 * Require a valid session. Accepts the HTTP-only cookie set on login, or a
 * `Bearer` token (handy for API testing). Attaches `req.user = { id, role }`.
 */
export function authenticate(req, _res, next) {
  const token =
    req.cookies?.[env.COOKIE_NAME] ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null)

  if (!token) return next(ApiError.unauthorized())

  try {
    const payload = verifyToken(token)
    req.user = { id: Number(payload.sub), role: payload.role }
    if (!req.user.id) return next(ApiError.unauthorized('Invalid session.'))
    next()
  } catch {
    next(ApiError.unauthorized('Session expired. Please log in again.'))
  }
}
