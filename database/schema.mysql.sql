-- ============================================================================
-- DOCTOR APPOINTMENT BOOKING SYSTEM — MySQL 8 schema (reference)
-- This is the schema specified by the architecture document. The application
-- currently runs on SQLite (database/schema.sqlite.sql) because no MySQL
-- server is available on the development machine; use this file when deploying
-- to a hosted MySQL 8 database. Run with:
--     mysql -u <user> -p < database/schema.mysql.sql
-- ============================================================================

CREATE DATABASE IF NOT EXISTS doctor_appointment_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE doctor_appointment_db;

CREATE TABLE IF NOT EXISTS users (
  user_id       BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(120) NOT NULL,
  email         VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(25),
  role          ENUM('PATIENT', 'DOCTOR', 'ADMIN') NOT NULL DEFAULT 'PATIENT',
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role_active (role, is_active)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS specializations (
  specialization_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(500),
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS doctors (
  doctor_id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id           BIGINT UNSIGNED NOT NULL UNIQUE,
  specialization_id BIGINT UNSIGNED NOT NULL,
  qualification     VARCHAR(200) NOT NULL,
  experience_years  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  consultation_fee  DECIMAL(10,2) NOT NULL DEFAULT 0,
  description       TEXT,
  is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_doctors_user
    FOREIGN KEY (user_id) REFERENCES users (user_id),
  CONSTRAINT fk_doctors_specialization
    FOREIGN KEY (specialization_id) REFERENCES specializations (specialization_id),
  CONSTRAINT chk_doctor_fee CHECK (consultation_fee >= 0),
  INDEX idx_doctors_specialization_active (specialization_id, is_active),
  INDEX idx_doctors_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS availability (
  availability_id       BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  doctor_id             BIGINT UNSIGNED NOT NULL,
  available_date        DATE        NOT NULL,
  start_time            TIME        NOT NULL,
  end_time              TIME        NOT NULL,
  slot_status           ENUM('AVAILABLE', 'UNAVAILABLE') NOT NULL DEFAULT 'AVAILABLE',
  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  booked_appointment_id BIGINT UNSIGNED NULL UNIQUE,
  created_at            TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_availability_doctor
    FOREIGN KEY (doctor_id) REFERENCES doctors (doctor_id),
  CONSTRAINT chk_availability_time CHECK (end_time > start_time),
  CONSTRAINT uq_doctor_slot UNIQUE
    (doctor_id, available_date, start_time, end_time),
  INDEX idx_availability_lookup
    (doctor_id, available_date, slot_status, start_time)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS appointments (
  appointment_id   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id       BIGINT UNSIGNED NOT NULL,
  doctor_id        BIGINT UNSIGNED NOT NULL,
  availability_id  BIGINT UNSIGNED NOT NULL,
  appointment_date DATE        NOT NULL,
  appointment_time TIME        NOT NULL,
  reason           VARCHAR(1000) NOT NULL,
  status           ENUM('PENDING', 'CONFIRMED', 'REJECTED',
                        'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  created_at       TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_appointments_patient
    FOREIGN KEY (patient_id) REFERENCES users (user_id),
  CONSTRAINT fk_appointments_doctor
    FOREIGN KEY (doctor_id) REFERENCES doctors (doctor_id),
  CONSTRAINT fk_appointments_availability
    FOREIGN KEY (availability_id) REFERENCES availability (availability_id),
  INDEX idx_appointments_patient_date
    (patient_id, appointment_date, appointment_time),
  INDEX idx_appointments_doctor_date_status
    (doctor_id, appointment_date, status),
  INDEX idx_appointments_status_created (status, created_at)
) ENGINE=InnoDB;
