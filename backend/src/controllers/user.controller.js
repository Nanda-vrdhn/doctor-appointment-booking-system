import { asyncHandler } from '../utils/asyncHandler.js'
import { ok } from '../utils/http.js'
import * as authService from '../services/auth.service.js'
import * as userService from '../services/user.service.js'

export const getProfile = asyncHandler(async (req, res) => {
  ok(res, { user: authService.getMe(req.user.id) })
})

export const updateProfile = asyncHandler(async (req, res) => {
  const user = userService.updateProfile(req.user.id, req.validated)
  ok(res, { user })
})
