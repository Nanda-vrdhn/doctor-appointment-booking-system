/**
 * SQLite connection + schema bootstrap.
 *
 * Uses Node's built-in `node:sqlite` (Node >= 22.5) so no native module or
 * database server is required. The connection is a single synchronous handle;
 * all writes go through `transaction()` which takes a BEGIN IMMEDIATE lock.
 */
import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from './env.js'

const here = path.dirname(fileURLToPath(import.meta.url))
export const SCHEMA_PATH = path.resolve(here, '../../../database/schema.sqlite.sql')
export const DB_PATH = env.DB_PATH

let _db = null

/** Open (once) and return the shared connection. */
export function openDatabase() {
  if (_db) return _db
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  _db = new DatabaseSync(DB_PATH)
  _db.exec('PRAGMA journal_mode = WAL;')
  _db.exec('PRAGMA foreign_keys = ON;')
  _db.exec('PRAGMA busy_timeout = 5000;')
  return _db
}

export function getDb() {
  return openDatabase()
}

/** Create tables/indexes if they do not exist. Safe to call repeatedly. */
export function initSchema() {
  const db = openDatabase()
  const sql = fs.readFileSync(SCHEMA_PATH, 'utf8')
  db.exec(sql)
}

/**
 * Run `fn(db)` inside a write transaction.
 * BEGIN IMMEDIATE takes the write lock up front, so two concurrent booking
 * attempts serialise and the UNIQUE slot-claim constraint decides the winner.
 */
export function transaction(fn) {
  const db = openDatabase()
  db.exec('BEGIN IMMEDIATE')
  try {
    const result = fn(db)
    db.exec('COMMIT')
    return result
  } catch (err) {
    try {
      db.exec('ROLLBACK')
    } catch {
      /* connection already unusable */
    }
    throw err
  }
}

export function closeDatabase() {
  if (_db) {
    _db.close()
    _db = null
  }
}

/** Row counts per table — used by the health endpoint and tests. */
export function tableCounts() {
  const db = getDb()
  const tables = ['users', 'specializations', 'doctors', 'availability', 'appointments']
  const out = {}
  for (const t of tables) {
    out[t] = db.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get().c
  }
  return out
}
