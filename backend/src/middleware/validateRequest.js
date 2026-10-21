import { ApiError } from '../utils/errors.js'

/**
 * Run a validator over the request body. A validator returns
 * `{ data, errors }`. On failure it raises a 422 with a field->message map.
 */
export function validateRequest(validator) {
  return (req, _res, next) => {
    let result
    try {
      result = validator(req.body ?? {})
    } catch (err) {
      return next(ApiError.badRequest('Malformed request body.'))
    }
    const { data, errors } = result || {}
    // Validators return a key->message map where passing fields are `null`.
    const failed = Object.entries(errors || {}).filter(([, message]) => Boolean(message))
    if (failed.length > 0) {
      return next(ApiError.validation(Object.fromEntries(failed)))
    }
    req.validated = data
    next()
  }
}
