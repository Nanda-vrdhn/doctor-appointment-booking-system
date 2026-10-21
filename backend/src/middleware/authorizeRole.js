import { ApiError } from '../utils/errors.js'

/** Require the authenticated user to have one of the given roles. */
export function authorizeRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized())
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden())
    }
    next()
  }
}
