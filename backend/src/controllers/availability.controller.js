import { asyncHandler } from '../utils/asyncHandler.js'
import { created, ok } from '../utils/http.js'
import { parseId } from '../utils/params.js'
import * as availabilityService from '../services/availability.service.js'

export const list = asyncHandler(async (req, res) => {
  ok(res, {
    slots: availabilityService.listOwn(req.user.id, {
      fromDate: (req.query.from ?? '').toString().trim() || null,
      toDate: (req.query.to ?? '').toString().trim() || null,
    }),
  })
})

export const create = asyncHandler(async (req, res) => {
  const slot = availabilityService.createSlot(req.user.id, req.validated)
  created(res, { slot })
})

export const update = asyncHandler(async (req, res) => {
  const slotId = parseId(req.params.id, 'slot id')
  const slot = availabilityService.updateSlot(req.user.id, slotId, req.validated)
  ok(res, { slot })
})

export const deactivate = asyncHandler(async (req, res) => {
  const slotId = parseId(req.params.id, 'slot id')
  const slot = availabilityService.deactivateSlot(req.user.id, slotId)
  ok(res, { slot })
})
