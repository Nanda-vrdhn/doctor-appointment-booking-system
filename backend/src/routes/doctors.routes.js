import { Router } from 'express'
import * as ctrl from '../controllers/doctor.controller.js'

// Public endpoints — no authentication required to browse the directory.
const router = Router()

router.get('/', ctrl.list)
router.get('/:doctorId', ctrl.profile)
router.get('/:doctorId/availability', ctrl.availability)

export default router
