/**
 * Single error type for the whole API. Services throw `ApiError`; the central
 * error handler turns it into the documented JSON error envelope:
 *   { "error": { "code": "...", "message": "...", "details"?: {...} } }
 */
export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    if (details !== undefined) this.details = details
  }

  static badRequest(message = 'Invalid request.', code = 'BAD_REQUEST') {
    return new ApiError(400, code, message)
  }
  static unauthorized(message = 'Authentication required.', code = 'UNAUTHENTICATED') {
    return new ApiError(401, code, message)
  }
  static forbidden(
    message = 'You do not have permission to perform this action.',
    code = 'FORBIDDEN'
  ) {
    return new ApiError(403, code, message)
  }
  static notFound(message = 'Resource not found.', code = 'NOT_FOUND') {
    return new ApiError(404, code, message)
  }
  static conflict(message = 'The request conflicts with the current state.', code = 'CONFLICT') {
    return new ApiError(409, code, message)
  }
  static validation(details, message = 'Validation failed.') {
    return new ApiError(422, 'VALIDATION_ERROR', message, details)
  }
}
