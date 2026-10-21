import { asyncHandler } from '../utils/asyncHandler.js'
import { ok } from '../utils/http.js'
import { parseId } from '../utils/params.js'
import * as doctorService from '../services/doctor.service.js'

export const list = asyncHandler(async (req, res) => {
  const doctors = doctorService.listDoctors({
    name: (req.query.name ?? '').toString().trim(),
    specializationId: req.query.specializationId
      ? parseId(req.query.specializationId, 'specializationId')
      : null,
    date: (req.query.date ?? '').toString().trim() || null,
    limit: 50,
  })
  ok(res, { doctors })
})

export const profile = asyncHandler(async (req, res) => {
  const doctorId = parseId(req.params.doctorId, 'doctorId')
  ok(res, { doctor: doctorService.getDoctorProfile(doctorId) })
})

export const availability = asyncHandler(async (req, res) => {
  const doctorId = parseId(req.params.doctorId, 'doctorId')
  ok(res, { slots: doctorService.getPublicAvailability(doctorId) })
})
