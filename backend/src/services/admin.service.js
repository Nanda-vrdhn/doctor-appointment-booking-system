import { getDb, transaction } from '../config/database.js'
import * as userRepo from '../repositories/user.repo.js'
import * as doctorRepo from '../repositories/doctor.repo.js'
import * as appointmentRepo from '../repositories/appointment.repo.js'
import * as availabilityRepo from '../repositories/availability.repo.js'
import * as specRepo from '../repositories/specialization.repo.js'
import { hashPassword } from '../utils/password.js'
import { publicUser } from '../utils/http.js'
import { ApiError } from '../utils/errors.js'

export function dashboard() {
  const db = getDb()
  const totalDoctors = db.prepare('SELECT COUNT(*) AS c FROM doctors').get().c
  const activeSpecializations = db
    .prepare('SELECT COUNT(*) AS c FROM specializations WHERE is_active = 1')
    .get().c
  return {
    users: userRepo.countByRole(db),
    doctors: { total: totalDoctors, active: doctorRepo.countActive(db) },
    appointments: appointmentRepo.counts(db),
    specializations: { active: activeSpecializations },
    slots: availabilityRepo.countByStatus(db),
  }
}

export function listUsers(filters = {}) {
  return userRepo.list(getDb(), filters)
}

export function setUserActive(adminUserId, targetUserId, isActive) {
  if (adminUserId === targetUserId) {
    throw ApiError.badRequest('You cannot change the status of your own account.')
  }
  const db = getDb()
  const user = userRepo.findById(db, targetUserId)
  if (!user) throw ApiError.notFound('User not found.')
  return publicUser(userRepo.setActive(db, targetUserId, isActive))
}

export function createDoctor(adminUserId, data) {
  const db = getDb()
  if (userRepo.findByEmail(db, data.email)) {
    throw ApiError.conflict('An account with this email already exists.', 'EMAIL_TAKEN')
  }
  if (!specRepo.findById(db, data.specializationId)) {
    throw ApiError.badRequest('Unknown specialization.')
  }
  return transaction((tx) => {
    const user = userRepo.insert(tx, {
      fullName: data.fullName,
      email: data.email,
      passwordHash: hashPassword(data.password),
      phone: data.phone,
      role: 'DOCTOR',
    })
    const doctor = doctorRepo.insert(tx, {
      userId: user.user_id,
      specializationId: data.specializationId,
      qualification: data.qualification,
      experienceYears: data.experienceYears,
      consultationFee: data.consultationFee,
      description: data.description,
    })
    return doctorRepo.findById(tx, doctor.doctor_id)
  })
}

export function updateDoctor(doctorId, fields) {
  const db = getDb()
  const doctor = doctorRepo.findById(db, doctorId)
  if (!doctor) throw ApiError.notFound('Doctor not found.')
  if (fields.specializationId != null && !specRepo.findById(db, fields.specializationId)) {
    throw ApiError.badRequest('Unknown specialization.')
  }
  return doctorRepo.update(db, doctorId, fields)
}

export function setDoctorActive(doctorId, isActive) {
  const db = getDb()
  if (!doctorRepo.findById(db, doctorId)) throw ApiError.notFound('Doctor not found.')
  return doctorRepo.setActive(db, doctorId, isActive)
}

export function listAppointments(filters = {}) {
  return appointmentRepo.listAll(getDb(), filters)
}

// --- specializations -------------------------------------------------------

export function listSpecializations() {
  return specRepo.listAll(getDb())
}

export function createSpecialization({ name, description }) {
  const db = getDb()
  const existing = db.prepare('SELECT specialization_id FROM specializations WHERE name = ?').get(name)
  if (existing) throw ApiError.conflict('A specialization with this name already exists.', 'NAME_TAKEN')
  return specRepo.insert(db, { name, description })
}

export function updateSpecialization(id, { name, description }) {
  const db = getDb()
  if (!specRepo.findById(db, id)) throw ApiError.notFound('Specialization not found.')
  const clash = db
    .prepare('SELECT specialization_id FROM specializations WHERE name = ? AND specialization_id != ?')
    .get(name, id)
  if (clash) throw ApiError.conflict('A specialization with this name already exists.', 'NAME_TAKEN')
  return specRepo.update(db, id, { name, description })
}

export function setSpecializationActive(id, isActive) {
  const db = getDb()
  if (!specRepo.findById(db, id)) throw ApiError.notFound('Specialization not found.')
  return specRepo.setActive(db, id, isActive)
}
