import bcrypt from 'bcryptjs'

const ROUNDS = 10

/** Hash a plaintext password. Plaintext is never stored or logged. */
export function hashPassword(plain) {
  return bcrypt.hashSync(String(plain), ROUNDS)
}

/** Constant-time comparison of a plaintext password against a stored hash. */
export function verifyPassword(plain, hash) {
  if (!plain || !hash) return false
  return bcrypt.compareSync(String(plain), hash)
}
