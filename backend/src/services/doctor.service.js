import { getDb } from '../config/database.js'
import * as doctorRepo from '../repositories/doctor.repo.js'
import * as availabilityRepo from '../repositories/availability.repo.js'
import * as specRepo from '../repositories/specialization.repo.js'
import { ApiError } from '../utils/errors.js'
import { todayStr } from '../utils/dateTime.js'

export function listDoctors(filters = {}) {
  return doctorRepo.list(getDb(), filters)
}

export function getDoctorProfile(doctorId) {
  const doctor = doctorRepo.findById(getDb(), doctorId)
  if (!doctor) throw ApiError.notFound('Doctor not found.')
  return doctor
}

export function getDoctorByUserId(userId) {
  return doctorRepo.findByUserId(getDb(), userId)
}

/** Public slot list defaults to today onward — past slots are never shown. */
export function getPublicAvailability(doctorId, fromDate = todayStr()) {
  return availabilityRepo.listPublic(getDb(), doctorId, { fromDate })
}

/** Doctor updates their own professional profile. */
export function updateDoctorProfile(userId, fields) {
  const db = getDb()
  const doctor = doctorRepo.findByUserId(db, userId)
  if (!doctor) throw ApiError.notFound('Doctor profile not found.')

  if (fields.specializationId != null && !specRepo.findById(db, fields.specializationId)) {
    throw ApiError.badRequest('Unknown specialization.')
  }
  return doctorRepo.update(db, doctor.doctor_id, fields)
}
