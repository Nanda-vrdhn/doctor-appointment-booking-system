/** Parameterized queries against `appointments`. */

const BASE_SELECT = `
  SELECT a.appointment_id, a.patient_id, a.doctor_id, a.availability_id,
         a.appointment_date, a.appointment_time, a.reason, a.status,
         a.created_at, a.updated_at,
         p.full_name AS patient_name, p.email AS patient_email,
         d.full_name AS doctor_name, s.name AS specialization_name
  FROM appointments a
  JOIN users p           ON p.user_id = a.patient_id
  JOIN doctors doc       ON doc.doctor_id = a.doctor_id
  JOIN users d           ON d.user_id = doc.user_id
  JOIN specializations s ON s.specialization_id = doc.specialization_id
`

export function findById(db, id) {
  return db.prepare(`${BASE_SELECT} WHERE a.appointment_id = ?`).get(id)
}

export function listForPatient(db, patientId) {
  return db
    .prepare(`${BASE_SELECT} WHERE a.patient_id = ? ORDER BY a.appointment_date DESC, a.appointment_time DESC`)
    .all(patientId)
}

export function listForDoctor(db, doctorId, { status = null } = {}) {
  let sql = `${BASE_SELECT} WHERE a.doctor_id = ?`
  const params = [doctorId]
  if (status) {
    sql += ' AND a.status = ?'
    params.push(status)
  }
  sql += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC'
  return db.prepare(sql).all(...params)
}

export function listAll(db, { status = null, doctorId = null, patientId = null } = {}) {
  let sql = `${BASE_SELECT} WHERE 1 = 1`
  const params = []
  if (status) {
    sql += ' AND a.status = ?'
    params.push(status)
  }
  if (doctorId) {
    sql += ' AND a.doctor_id = ?'
    params.push(doctorId)
  }
  if (patientId) {
    sql += ' AND a.patient_id = ?'
    params.push(patientId)
  }
  sql += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC'
  return db.prepare(sql).all(...params)
}

export function insert(db, {
  patientId, doctorId, availabilityId, date, time, reason, status = 'PENDING',
}) {
  const info = db
    .prepare(
      `INSERT INTO appointments
         (patient_id, doctor_id, availability_id, appointment_date, appointment_time, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(patientId, doctorId, availabilityId, date, time, reason, status)
  return findById(db, Number(info.lastInsertRowid))
}

export function updateStatus(db, id, status) {
  db.prepare(
    `UPDATE appointments SET status = ?, updated_at = datetime('now') WHERE appointment_id = ?`
  ).run(status, id)
  return findById(db, id)
}

/** Prevent the same patient double-booking the same doctor slot. */
export function findActiveBooking(db, { patientId, doctorId, date, time }) {
  return db
    .prepare(
      `SELECT appointment_id FROM appointments
        WHERE patient_id = ? AND doctor_id = ? AND appointment_date = ?
          AND appointment_time = ? AND status IN ('PENDING', 'CONFIRMED')
        LIMIT 1`
    )
    .get(patientId, doctorId, date, time)
}

export function counts(db) {
  const total = db.prepare('SELECT COUNT(*) AS c FROM appointments').get().c
  const byStatusRows = db
    .prepare('SELECT status, COUNT(*) AS c FROM appointments GROUP BY status')
    .all()
  const byStatus = { PENDING: 0, CONFIRMED: 0, REJECTED: 0, COMPLETED: 0, CANCELLED: 0 }
  for (const r of byStatusRows) byStatus[r.status] = r.c
  return { total, byStatus }
}
