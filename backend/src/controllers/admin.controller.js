import { asyncHandler } from '../utils/asyncHandler.js'
import { created, ok } from '../utils/http.js'
import { parseId } from '../utils/params.js'
import * as adminService from '../services/admin.service.js'

export const dashboard = asyncHandler(async (req, res) => {
  ok(res, adminService.dashboard())
})

export const listUsers = asyncHandler(async (req, res) => {
  ok(res, {
    users: adminService.listUsers({
      search: (req.query.search ?? '').toString().trim(),
      role: (req.query.role ?? '').toString().trim() || null,
      limit: 100,
    }),
  })
})

export const setUserActive = asyncHandler(async (req, res) => {
  const userId = parseId(req.params.id, 'user id')
  const user = adminService.setUserActive(req.user.id, userId, req.validated.isActive)
  ok(res, { user })
})

export const createDoctor = asyncHandler(async (req, res) => {
  const doctor = adminService.createDoctor(req.user.id, req.validated)
  created(res, { doctor })
})

export const updateDoctor = asyncHandler(async (req, res) => {
  const doctorId = parseId(req.params.id, 'doctor id')
  const doctor = adminService.updateDoctor(doctorId, req.validated)
  ok(res, { doctor })
})

export const setDoctorActive = asyncHandler(async (req, res) => {
  const doctorId = parseId(req.params.id, 'doctor id')
  const doctor = adminService.setDoctorActive(doctorId, req.validated.isActive)
  ok(res, { doctor })
})

export const listSpecializations = asyncHandler(async (req, res) => {
  ok(res, { specializations: adminService.listSpecializations() })
})

export const createSpecialization = asyncHandler(async (req, res) => {
  const specialization = adminService.createSpecialization(req.validated)
  created(res, { specialization })
})

export const updateSpecialization = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'specialization id')
  const specialization = adminService.updateSpecialization(id, req.validated)
  ok(res, { specialization })
})

export const setSpecializationActive = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'specialization id')
  const specialization = adminService.setSpecializationActive(id, req.validated.isActive)
  ok(res, { specialization })
})
