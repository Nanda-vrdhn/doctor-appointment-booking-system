import { asyncHandler } from '../utils/asyncHandler.js'
import { created, ok } from '../utils/http.js'
import { parseId } from '../utils/params.js'
import * as appointmentService from '../services/appointment.service.js'

export const book = asyncHandler(async (req, res) => {
  const appointment = appointmentService.book(req.user.id, req.validated)
  created(res, { appointment })
})

export const mine = asyncHandler(async (req, res) => {
  ok(res, { appointments: appointmentService.listMine(req.user.id) })
})

export const cancel = asyncHandler(async (req, res) => {
  const appointmentId = parseId(req.params.id, 'appointment id')
  const appointment = appointmentService.cancel(appointmentId, req.user)
  ok(res, { appointment })
})

export const doctorList = asyncHandler(async (req, res) => {
  ok(res, {
    appointments: appointmentService.listForDoctor(req.user.id, {
      status: (req.query.status ?? '').toString().trim() || null,
    }),
  })
})

export const doctorGet = asyncHandler(async (req, res) => {
  const appointmentId = parseId(req.params.id, 'appointment id')
  ok(res, { appointment: appointmentService.getForDoctor(req.user.id, appointmentId) })
})

export const doctorStatus = asyncHandler(async (req, res) => {
  const appointmentId = parseId(req.params.id, 'appointment id')
  const appointment = appointmentService.updateStatus(
    req.user.id,
    appointmentId,
    req.validated.action
  )
  ok(res, { appointment })
})

export const adminList = asyncHandler(async (req, res) => {
  const filters = {
    status: (req.query.status ?? '').toString().trim() || null,
    doctorId: req.query.doctorId ? parseId(req.query.doctorId, 'doctorId') : null,
    patientId: req.query.patientId ? parseId(req.query.patientId, 'patientId') : null,
  }
  ok(res, { appointments: appointmentService.listAll(filters) })
})
