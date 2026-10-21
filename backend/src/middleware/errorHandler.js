import { ApiError } from '../utils/errors.js'

/** 404 for unmatched API routes. */
export function notFound(req, _res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found.`))
}

/**
 * Central error handler. Never leaks stack traces, SQL, or secrets — unexpected
 * errors return a generic 500 message and are logged server-side only.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const status = err instanceof ApiError ? err.status : err.status || 500

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}:`, err)
  }

  const body = {
    error: {
      code: err.code || (status >= 500 ? 'INTERNAL_ERROR' : 'ERROR'),
      message: status >= 500 ? 'Internal server error.' : err.message,
    },
  }
  if (err.details !== undefined) body.error.details = err.details

  res.status(status).json(body)
}
