-- ============================================================================
-- DOCTOR APPOINTMENT BOOKING SYSTEM — SQLite schema
-- Single source of truth, executed by backend/src/config/database.js at startup.
--
-- The architecture document specifies MySQL 8. Because this machine has no
-- MySQL server (and none can be installed without admin rights), the project
-- runs on a local SQLite file for zero-install local development. The exact
-- MySQL 8 equivalent is kept alongside as database/schema.mysql.sql so the
-- schema can be ported to a hosted MySQL/PostgreSQL server later.
--
-- All appointment dates/times use the clinic's local calendar (YYYY-MM-DD and
-- HH:MM:SS strings). Audit timestamps use UTC via datetime('now').
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  user_id       INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name     TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  phone         TEXT,
  role          TEXT    NOT NULL DEFAULT 'PATIENT'
                          CHECK (role IN ('PATIENT', 'DOCTOR', 'ADMIN')),
  is_active     INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users (role, is_active);

-- ---------------------------------------------------------------------------
-- specializations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS specializations (
  specialization_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL UNIQUE,
  description TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- doctors
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS doctors (
  doctor_id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           INTEGER NOT NULL UNIQUE,
  specialization_id INTEGER NOT NULL,
  qualification     TEXT    NOT NULL,
  experience_years  INTEGER NOT NULL DEFAULT 0 CHECK (experience_years >= 0),
  consultation_fee  REAL    NOT NULL DEFAULT 0 CHECK (consultation_fee >= 0),
  description       TEXT,
  is_active         INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id)           REFERENCES users (user_id) ON DELETE CASCADE,
  FOREIGN KEY (specialization_id) REFERENCES specializations (specialization_id)
);
CREATE INDEX IF NOT EXISTS idx_doctors_spec_active ON doctors (specialization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_doctors_active ON doctors (is_active);

-- ---------------------------------------------------------------------------
-- availability — each row is ONE discrete, bookable slot.
-- booked_appointment_id is a UNIQUE, nullable pointer: the database-enforced
-- "claim" that stops two patients taking the same slot.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS availability (
  availability_id       INTEGER PRIMARY KEY AUTOINCREMENT,
  doctor_id             INTEGER NOT NULL,
  available_date        TEXT    NOT NULL,            -- YYYY-MM-DD
  start_time            TEXT    NOT NULL,            -- HH:MM:SS
  end_time              TEXT    NOT NULL,
  slot_status           TEXT    NOT NULL DEFAULT 'AVAILABLE'
                                  CHECK (slot_status IN ('AVAILABLE', 'UNAVAILABLE')),
  is_active             INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  booked_appointment_id INTEGER UNIQUE,
  created_at            TEXT    NOT NULL DEFAULT (datetime('now')),
  CHECK (end_time > start_time),
  UNIQUE (doctor_id, available_date, start_time, end_time),
  FOREIGN KEY (doctor_id)             REFERENCES doctors (doctor_id) ON DELETE CASCADE,
  FOREIGN KEY (booked_appointment_id) REFERENCES appointments (appointment_id)
);
CREATE INDEX IF NOT EXISTS idx_availability_lookup
  ON availability (doctor_id, available_date, slot_status, start_time);

-- ---------------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS appointments (
  appointment_id   INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id       INTEGER NOT NULL,
  doctor_id        INTEGER NOT NULL,
  availability_id  INTEGER NOT NULL,
  appointment_date TEXT    NOT NULL,               -- YYYY-MM-DD
  appointment_time TEXT    NOT NULL,               -- HH:MM:SS
  reason           TEXT    NOT NULL,
  status           TEXT    NOT NULL DEFAULT 'PENDING'
                             CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED',
                                              'COMPLETED', 'CANCELLED')),
  created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (patient_id)      REFERENCES users (user_id),
  FOREIGN KEY (doctor_id)       REFERENCES doctors (doctor_id),
  FOREIGN KEY (availability_id) REFERENCES availability (availability_id)
);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_date
  ON appointments (patient_id, appointment_date, appointment_time);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date_status
  ON appointments (doctor_id, appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_status_created
  ON appointments (status, created_at);
