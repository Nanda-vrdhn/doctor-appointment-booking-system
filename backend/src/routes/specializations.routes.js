import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ok } from '../utils/http.js'
import * as specRepo from '../repositories/specialization.repo.js'
import { getDb } from '../config/database.js'

// Public list of active specializations (used by the doctor search filters).
const router = Router()

router.get(
  '/',
  asyncHandler(async (req, res) => {
    ok(res, { specializations: specRepo.listActive(getDb()) })
  })
)

export default router
