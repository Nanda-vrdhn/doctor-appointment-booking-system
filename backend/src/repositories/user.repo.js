/** Parameterized queries against `users`. Table/column names are hard-coded. */

export function findByEmail(db, email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email)
}

export function findById(db, id) {
  return db.prepare('SELECT * FROM users WHERE user_id = ?').get(id)
}

export function insert(db, { fullName, email, passwordHash, phone, role }) {
  const info = db
    .prepare(
      `INSERT INTO users (full_name, email, password_hash, phone, role)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(fullName, email, passwordHash, phone || null, role)
  return findById(db, Number(info.lastInsertRowid))
}

export function updateProfile(db, id, { fullName, phone, passwordHash }) {
  db.prepare(
    `UPDATE users
        SET full_name = ?, phone = ?, password_hash = COALESCE(?, password_hash),
            updated_at = datetime('now')
      WHERE user_id = ?`
  ).run(fullName, phone || null, passwordHash || null, id)
  return findById(db, id)
}

export function list(db, { search = '', role = null, limit = 50, offset = 0 } = {}) {
  let sql = `SELECT user_id, full_name, email, phone, role, is_active, created_at
             FROM users WHERE 1 = 1`
  const params = []
  if (search) {
    sql += ' AND (full_name LIKE ? OR email LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }
  if (role) {
    sql += ' AND role = ?'
    params.push(role)
  }
  sql += ' ORDER BY created_at DESC, user_id DESC LIMIT ? OFFSET ?'
  params.push(limit, offset)
  return db.prepare(sql).all(...params)
}

export function setActive(db, id, isActive) {
  db.prepare(`UPDATE users SET is_active = ?, updated_at = datetime('now') WHERE user_id = ?`).run(
    isActive ? 1 : 0,
    id
  )
  return findById(db, id)
}

export function countByRole(db) {
  const rows = db.prepare('SELECT role, COUNT(*) AS c FROM users GROUP BY role').all()
  const out = { PATIENT: 0, DOCTOR: 0, ADMIN: 0 }
  for (const r of rows) out[r.role] = r.c
  return out
}
