import { Router } from 'express'
import * as ctrl from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { validateLogin, validateRegister } from '../validators/auth.validator.js'

const router = Router()

router.post('/register', validateRequest(validateRegister), ctrl.register)
router.post('/login', validateRequest(validateLogin), ctrl.login)
router.post('/logout', authenticate, ctrl.logout)
router.get('/me', authenticate, ctrl.me)

export default router
