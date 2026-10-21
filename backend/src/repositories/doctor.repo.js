/** Parameterized queries against `doctors`. */

const PROFILE_SELECT = `
  SELECT d.doctor_id, d.user_id, d.specialization_id, d.qualification,
         d.experience_years, d.consultation_fee, d.description,
         d.is_active AS doctor_active,
         u.full_name, u.email, u.phone, u.is_active AS user_active,
         s.name AS specialization_name
  FROM doctors d
  JOIN users u           ON u.user_id = d.user_id
  JOIN specializations s ON s.specialization_id = d.specialization_id
`

export function list(db, { name = '', specializationId = null, date = null, limit = 20, offset = 0 } = {}) {
  const params = []
  const joinDate = date ? ' AND a.available_date = ?' : ''
  if (date) params.push(date)

  let sql = `
    SELECT d.doctor_id, d.qualification, d.experience_years, d.consultation_fee,
           d.description, d.is_active AS doctor_active,
           u.user_id, u.full_name, u.email, u.is_active AS user_active,
           s.specialization_id, s.name AS specialization_name,
           COUNT(a.availability_id) AS total_slots,
           COALESCE(SUM(CASE WHEN a.is_active = 1 AND a.slot_status = 'AVAILABLE'
                              AND a.booked_appointment_id IS NULL
                              AND (a.available_date || ' ' || a.start_time) >
                                  strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')
                             THEN 1 ELSE 0 END), 0)
             AS bookable_slots
    FROM doctors d
    JOIN users u           ON u.user_id = d.user_id
    JOIN specializations s ON s.specialization_id = d.specialization_id
    LEFT JOIN availability a ON a.doctor_id = d.doctor_id${joinDate}
    WHERE d.is_active = 1 AND u.is_active = 1`

  if (name) {
    sql += ' AND u.full_name LIKE ?'
    params.push(`%${name}%`)
  }
  if (specializationId) {
    sql += ' AND d.specialization_id = ?'
    params.push(specializationId)
  }
  sql += ' GROUP BY d.doctor_id'
  if (date) sql += ' HAVING bookable_slots > 0'
  sql += ' ORDER BY u.full_name LIMIT ? OFFSET ?'
  params.push(limit, offset)

  return db.prepare(sql).all(...params)
}

export function findById(db, id) {
  return db.prepare(`${PROFILE_SELECT} WHERE d.doctor_id = ?`).get(id)
}

export function findByUserId(db, userId) {
  return db.prepare(`${PROFILE_SELECT} WHERE d.user_id = ?`).get(userId)
}

export function insert(db, {
  userId, specializationId, qualification, experienceYears, consultationFee, description,
}) {
  const info = db
    .prepare(
      `INSERT INTO doctors
         (user_id, specialization_id, qualification, experience_years, consultation_fee, description)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      userId,
      specializationId,
      qualification,
      experienceYears ?? 0,
      consultationFee ?? 0,
      description || null
    )
  return findById(db, Number(info.lastInsertRowid))
}

export function update(db, id, fields) {
  const sets = []
  const params = []
  const map = {
    specializationId: 'specialization_id',
    qualification: 'qualification',
    experienceYears: 'experience_years',
    consultationFee: 'consultation_fee',
    description: 'description',
  }
  for (const [key, column] of Object.entries(map)) {
    if (fields[key] !== undefined) {
      sets.push(`${column} = ?`)
      params.push(fields[key])
    }
  }
  if (sets.length === 0) return findById(db, id)
  params.push(id)
  db.prepare(
    `UPDATE doctors SET ${sets.join(', ')}, updated_at = datetime('now') WHERE doctor_id = ?`
  ).run(...params)
  return findById(db, id)
}

export function setActive(db, id, isActive) {
  db.prepare(
    `UPDATE doctors SET is_active = ?, updated_at = datetime('now') WHERE doctor_id = ?`
  ).run(isActive ? 1 : 0, id)
  return findById(db, id)
}

export function countActive(db) {
  return db.prepare('SELECT COUNT(*) AS c FROM doctors WHERE is_active = 1').get().c
}
