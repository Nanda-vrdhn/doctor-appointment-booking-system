/** Parameterized queries against `availability` (one row = one bookable slot). */

export function listForDoctor(db, doctorId, { fromDate = null, toDate = null } = {}) {
  let sql = `SELECT * FROM availability WHERE doctor_id = ?`
  const params = [doctorId]
  if (fromDate) {
    sql += ' AND available_date >= ?'
    params.push(fromDate)
  }
  if (toDate) {
    sql += ' AND available_date <= ?'
    params.push(toDate)
  }
  sql += ' ORDER BY available_date, start_time'
  return db.prepare(sql).all(...params)
}

/**
 * Public view: only future, active, unclaimed slots. A slot is "past" once its
 * start time has passed, so today's earlier slots are excluded too.
 */
export function listPublic(db, doctorId, { fromDate = null } = {}) {
  let sql = `
    SELECT availability_id, doctor_id, available_date, start_time, end_time
    FROM availability
    WHERE doctor_id = ? AND is_active = 1 AND slot_status = 'AVAILABLE'
      AND booked_appointment_id IS NULL
      AND (available_date || ' ' || start_time) >
          strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')`
  const params = [doctorId]
  if (fromDate) {
    sql += ' AND available_date >= ?'
    params.push(fromDate)
  }
  sql += ' ORDER BY available_date, start_time'
  return db.prepare(sql).all(...params)
}

export function findById(db, id) {
  return db.prepare('SELECT * FROM availability WHERE availability_id = ?').get(id)
}

export function insert(db, { doctorId, date, startTime, endTime, status = 'AVAILABLE' }) {
  const info = db
    .prepare(
      `INSERT INTO availability
         (doctor_id, available_date, start_time, end_time, slot_status)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(doctorId, date, startTime, endTime, status)
  return findById(db, Number(info.lastInsertRowid))
}

export function update(db, id, { date, startTime, endTime }) {
  db.prepare(
    `UPDATE availability
        SET available_date = ?, start_time = ?, end_time = ?
      WHERE availability_id = ?`
  ).run(date, startTime, endTime, id)
  return findById(db, id)
}

/** Detect an overlapping active slot for the same doctor/date. */
export function findOverlap(db, { doctorId, date, startTime, endTime, excludeId = null }) {
  let sql = `
    SELECT availability_id, start_time, end_time
    FROM availability
    WHERE doctor_id = ? AND available_date = ? AND is_active = 1
      AND slot_status = 'AVAILABLE'
      AND start_time < ? AND end_time > ?`
  const params = [doctorId, date, endTime, startTime]
  if (excludeId) {
    sql += ' AND availability_id != ?'
    params.push(excludeId)
  }
  sql += ' LIMIT 1'
  return db.prepare(sql).get(...params)
}

/** Database-enforced claim: UNIQUE(booked_appointment_id). */
export function claim(db, availabilityId, appointmentId) {
  db.prepare(
    'UPDATE availability SET booked_appointment_id = ? WHERE availability_id = ?'
  ).run(appointmentId, availabilityId)
}

/** Release the claim when a booking is cancelled/rejected/completed. */
export function release(db, availabilityId) {
  db.prepare('UPDATE availability SET booked_appointment_id = NULL WHERE availability_id = ?').run(
    availabilityId
  )
}

export function setUnavailable(db, id) {
  db.prepare(
    `UPDATE availability SET slot_status = 'UNAVAILABLE', is_active = 0
      WHERE availability_id = ?`
  ).run(id)
}

export function countByStatus(db) {
  const rows = db
    .prepare('SELECT slot_status, COUNT(*) AS c FROM availability GROUP BY slot_status')
    .all()
  const out = { AVAILABLE: 0, UNAVAILABLE: 0 }
  for (const r of rows) out[r.slot_status] = r.c
  return out
}
