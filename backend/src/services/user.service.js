import { getDb } from '../config/database.js'
import * as userRepo from '../repositories/user.repo.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import { publicUser } from '../utils/http.js'
import { ApiError } from '../utils/errors.js'

export function updateProfile(userId, { fullName, phone, currentPassword, newPassword }) {
  const db = getDb()
  const user = userRepo.findById(db, userId)
  if (!user) throw ApiError.notFound('User not found.')

  let passwordHash = null
  if (newPassword) {
    if (!verifyPassword(currentPassword, user.password_hash)) {
      throw ApiError.unauthorized('Current password is incorrect.', 'INVALID_PASSWORD')
    }
    passwordHash = hashPassword(newPassword)
  }

  return publicUser(userRepo.updateProfile(db, userId, { fullName, phone, passwordHash }))
}
