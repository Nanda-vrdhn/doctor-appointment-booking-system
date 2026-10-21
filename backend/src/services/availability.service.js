import { getDb } from '../config/database.js'
import * as doctorRepo from '../repositories/doctor.repo.js'
import * as availabilityRepo from '../repositories/availability.repo.js'
import { ApiError } from '../utils/errors.js'
import { todayStr } from '../utils/dateTime.js'

function requireDoctorProfile(db, userId) {
  const doctor = doctorRepo.findByUserId(db, userId)
  if (!doctor) throw ApiError.notFound('Doctor profile not found.')
  return doctor
}

export function listOwn(doctorUserId, { fromDate = null, toDate = null } = {}) {
  const db = getDb()
  const doctor = requireDoctorProfile(db, doctorUserId)
  return availabilityRepo.listForDoctor(db, doctor.doctor_id, { fromDate, toDate })
}

export function createSlot(doctorUserId, { date, startTime, endTime }) {
  const db = getDb()
  const doctor = requireDoctorProfile(db, doctorUserId)

  if (date < todayStr()) {
    throw ApiError.badRequest('Cannot create a slot in the past.', 'SLOT_IN_PAST')
  }
  const overlap = availabilityRepo.findOverlap(db, {
    doctorId: doctor.doctor_id,
    date,
    startTime,
    endTime,
  })
  if (overlap) {
    throw ApiError.conflict('This slot overlaps an existing slot.', 'SLOT_OVERLAP')
  }
  return availabilityRepo.insert(db, {
    doctorId: doctor.doctor_id,
    date,
    startTime,
    endTime,
  })
}

export function updateSlot(doctorUserId, slotId, { date, startTime, endTime }) {
  const db = getDb()
  const doctor = requireDoctorProfile(db, doctorUserId)
  const slot = availabilityRepo.findById(db, slotId)

  if (!slot || slot.doctor_id !== doctor.doctor_id) {
    throw ApiError.notFound('Slot not found.')
  }
  if (slot.booked_appointment_id != null) {
    throw ApiError.conflict(
      'A booked slot cannot be edited. Cancel the appointment first.',
      'SLOT_BOOKED'
    )
  }
  if (date < todayStr()) {
    throw ApiError.badRequest('Cannot move a slot into the past.', 'SLOT_IN_PAST')
  }
  const overlap = availabilityRepo.findOverlap(db, {
    doctorId: doctor.doctor_id,
    date,
    startTime,
    endTime,
    excludeId: slotId,
  })
  if (overlap) {
    throw ApiError.conflict('This slot overlaps an existing slot.', 'SLOT_OVERLAP')
  }
  return availabilityRepo.update(db, slotId, { date, startTime, endTime })
}

export function deactivateSlot(doctorUserId, slotId) {
  const db = getDb()
  const doctor = requireDoctorProfile(db, doctorUserId)
  const slot = availabilityRepo.findById(db, slotId)

  if (!slot || slot.doctor_id !== doctor.doctor_id) {
    throw ApiError.notFound('Slot not found.')
  }
  if (slot.booked_appointment_id != null) {
    throw ApiError.conflict(
      'A booked slot cannot be deactivated. Cancel the appointment first.',
      'SLOT_BOOKED'
    )
  }
  availabilityRepo.setUnavailable(db, slotId)
  return availabilityRepo.findById(db, slotId)
}
