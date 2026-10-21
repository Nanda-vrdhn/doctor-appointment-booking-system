import { getDb, transaction } from '../config/database.js'
import * as userRepo from '../repositories/user.repo.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import { publicUser } from '../utils/http.js'
import { ApiError } from '../utils/errors.js'

/**
 * Public registration always creates a PATIENT — the role is never taken from
 * the request body, so a visitor cannot self-assign DOCTOR or ADMIN.
 */
export function register({ fullName, email, password, phone }) {
  const db = getDb()
  if (userRepo.findByEmail(db, email)) {
    throw ApiError.conflict('An account with this email already exists.', 'EMAIL_TAKEN')
  }
  const user = transaction((tx) =>
    userRepo.insert(tx, {
      fullName,
      email,
      passwordHash: hashPassword(password),
      phone,
      role: 'PATIENT',
    })
  )
  return publicUser(user)
}

export function login({ email, password }) {
  const db = getDb()
  const user = userRepo.findByEmail(db, email)
  // Generic failure — do not reveal whether the email is registered.
  if (!user || !verifyPassword(password, user.password_hash)) {
    throw ApiError.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS')
  }
  if (!user.is_active) {
    throw ApiError.forbidden('This account has been deactivated.', 'ACCOUNT_INACTIVE')
  }
  return publicUser(user)
}

export function getMe(userId) {
  const user = userRepo.findById(getDb(), userId)
  if (!user) throw ApiError.notFound('User not found.')
  return publicUser(user)
}
