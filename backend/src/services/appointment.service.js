import { getDb, transaction } from '../config/database.js'
import * as appointmentRepo from '../repositories/appointment.repo.js'
import * as availabilityRepo from '../repositories/availability.repo.js'
import * as doctorRepo from '../repositories/doctor.repo.js'
import * as userRepo from '../repositories/user.repo.js'
import { ApiError } from '../utils/errors.js'
import { isFutureSlot } from '../utils/dateTime.js'

function requireActivePatient(db, userId) {
  const user = userRepo.findById(db, userId)
  if (!user) throw ApiError.notFound('User not found.')
  if (user.role !== 'PATIENT') {
    throw ApiError.forbidden('Only patients can book appointments.')
  }
  if (!user.is_active) {
    throw ApiError.forbidden('This account has been deactivated.', 'ACCOUNT_INACTIVE')
  }
  return user
}

/**
 * Transaction-safe booking. The UNIQUE(booked_appointment_id) constraint is the
 * real guarantee: two simultaneous requests cannot both claim the same slot.
 */
export function book(patientUserId, { availabilityId, reason }) {
  const db = getDb()
  requireActivePatient(db, patientUserId)

  return transaction((tx) => {
    const slot = availabilityRepo.findById(tx, availabilityId)
    if (!slot) throw ApiError.notFound('Selected slot not found.')
    if (slot.is_active !== 1 || slot.slot_status !== 'AVAILABLE') {
      throw ApiError.conflict('This slot is not available.', 'SLOT_UNAVAILABLE')
    }
    if (slot.booked_appointment_id != null) {
      throw ApiError.conflict('This slot has already been booked.', 'SLOT_TAKEN')
    }
    if (!isFutureSlot(slot.available_date, slot.start_time)) {
      throw ApiError.conflict('Cannot book a slot in the past.', 'SLOT_IN_PAST')
    }

    const doctor = doctorRepo.findById(tx, slot.doctor_id)
    if (!doctor || !doctor.doctor_active || !doctor.user_active) {
      throw ApiError.conflict('This doctor is not accepting bookings.', 'DOCTOR_INACTIVE')
    }

    const duplicate = appointmentRepo.findActiveBooking(tx, {
      patientId: patientUserId,
      doctorId: slot.doctor_id,
      date: slot.available_date,
      time: slot.start_time,
    })
    if (duplicate) {
      throw ApiError.conflict(
        'You already have an active booking for this slot.',
        'DUPLICATE_BOOKING'
      )
    }

    const appointment = appointmentRepo.insert(tx, {
      patientId: patientUserId,
      doctorId: slot.doctor_id,
      availabilityId,
      date: slot.available_date,
      time: slot.start_time,
      reason,
      status: 'PENDING',
    })
    availabilityRepo.claim(tx, availabilityId, appointment.appointment_id)
    return appointment
  })
}

export function listMine(patientUserId) {
  return appointmentRepo.listForPatient(getDb(), patientUserId)
}

/** Patient cancels their own eligible booking; an admin may cancel any. */
export function cancel(appointmentId, requester) {
  return transaction((tx) => {
    const appointment = appointmentRepo.findById(tx, appointmentId)
    if (!appointment) throw ApiError.notFound('Appointment not found.')

    if (requester.role === 'PATIENT' && appointment.patient_id !== requester.id) {
      throw ApiError.forbidden('You can only cancel your own appointments.')
    }
    if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
      throw ApiError.conflict(
        `Only pending or confirmed appointments can be cancelled (current: ${appointment.status}).`,
        'INVALID_STATE'
      )
    }
    if (!isFutureSlot(appointment.appointment_date, appointment.appointment_time)) {
      throw ApiError.conflict('Cannot cancel a past appointment.', 'APPOINTMENT_IN_PAST')
    }

    const updated = appointmentRepo.updateStatus(tx, appointmentId, 'CANCELLED')
    availabilityRepo.release(tx, appointment.availability_id)
    return updated
  })
}

export function listForDoctor(doctorUserId, { status = null } = {}) {
  const doctor = doctorRepo.findByUserId(getDb(), doctorUserId)
  if (!doctor) throw ApiError.notFound('Doctor profile not found.')
  return appointmentRepo.listForDoctor(getDb(), doctor.doctor_id, { status })
}

export function getForDoctor(doctorUserId, appointmentId) {
  const db = getDb()
  const doctor = doctorRepo.findByUserId(db, doctorUserId)
  if (!doctor) throw ApiError.notFound('Doctor profile not found.')
  const appointment = appointmentRepo.findById(db, appointmentId)
  if (!appointment || appointment.doctor_id !== doctor.doctor_id) {
    throw ApiError.notFound('Appointment not found.')
  }
  return appointment
}

const TRANSITIONS = {
  accept: { from: ['PENDING'], to: 'CONFIRMED', release: false },
  reject: { from: ['PENDING'], to: 'REJECTED', release: true },
  complete: { from: ['CONFIRMED'], to: 'COMPLETED', release: true },
  cancel: { from: ['PENDING', 'CONFIRMED'], to: 'CANCELLED', release: true },
}

/** Only the assigned doctor may accept/reject/complete/cancel. */
export function updateStatus(doctorUserId, appointmentId, action) {
  const db = getDb()
  const doctor = doctorRepo.findByUserId(db, doctorUserId)
  if (!doctor) throw ApiError.notFound('Doctor profile not found.')

  return transaction((tx) => {
    const appointment = appointmentRepo.findById(tx, appointmentId)
    if (!appointment || appointment.doctor_id !== doctor.doctor_id) {
      throw ApiError.notFound('Appointment not found.')
    }
    const rule = TRANSITIONS[action]
    if (!rule) throw ApiError.badRequest('Unknown action.')
    if (!rule.from.includes(appointment.status)) {
      throw ApiError.conflict(
        `Cannot ${action} an appointment with status ${appointment.status}.`,
        'INVALID_TRANSITION'
      )
    }
    const updated = appointmentRepo.updateStatus(tx, appointmentId, rule.to)
    if (rule.release) availabilityRepo.release(tx, appointment.availability_id)
    return updated
  })
}

export function listAll(filters = {}) {
  return appointmentRepo.listAll(getDb(), filters)
}
