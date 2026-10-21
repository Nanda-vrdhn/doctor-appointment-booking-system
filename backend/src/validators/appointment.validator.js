import { oneOf, required } from './common.js'

export function validateBook(body) {
  const availabilityId = Number(body.availabilityId)
  const data = {
    availabilityId,
    reason: String(body.reason ?? '').trim(),
  }
  const errors = {
    availabilityId:
      Number.isInteger(availabilityId) && availabilityId > 0
        ? null
        : 'A valid availability slot is required.',
    reason: required(body.reason, 'Reason', { min: 3, max: 1000 }),
  }
  return { data, errors }
}

/** Doctor actions on an appointment. */
export function validateStatus(body) {
  const action = String(body.action ?? '').trim().toLowerCase()
  const data = { action }
  const errors = { action: oneOf(action, 'Action', ['accept', 'reject', 'complete', 'cancel']) }
  return { data, errors }
}
