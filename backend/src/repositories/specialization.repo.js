/** Parameterized queries against `specializations`. */

export function listActive(db) {
  return db
    .prepare('SELECT * FROM specializations WHERE is_active = 1 ORDER BY name')
    .all()
}

export function listAll(db) {
  return db.prepare('SELECT * FROM specializations ORDER BY name').all()
}

export function findById(db, id) {
  return db.prepare('SELECT * FROM specializations WHERE specialization_id = ?').get(id)
}

export function insert(db, { name, description }) {
  const info = db
    .prepare('INSERT INTO specializations (name, description) VALUES (?, ?)')
    .run(name, description || null)
  return findById(db, Number(info.lastInsertRowid))
}

export function update(db, id, { name, description }) {
  db.prepare(
    `UPDATE specializations SET name = ?, description = ? WHERE specialization_id = ?`
  ).run(name, description || null, id)
  return findById(db, id)
}

export function setActive(db, id, isActive) {
  db.prepare('UPDATE specializations SET is_active = ? WHERE specialization_id = ?').run(
    isActive ? 1 : 0,
    id
  )
  return findById(db, id)
}
