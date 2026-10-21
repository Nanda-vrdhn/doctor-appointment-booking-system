import { isoDate, required, time } from './common.js'
import { normaliseTime } from '../utils/dateTime.js'

function slotData(body) {
  return {
    date: String(body.date ?? '').trim(),
    startTime: normaliseTime(String(body.startTime ?? '').trim()),
    endTime: normaliseTime(String(body.endTime ?? '').trim()),
  }
}

function slotErrors(body, data) {
  const errors = {
    date: isoDate(body.date),
    startTime: time(body.startTime),
    endTime: time(body.endTime),
  }
  if (!errors.date && !errors.startTime && !errors.endTime && !(data.endTime > data.startTime)) {
    errors.endTime = 'End time must be after start time.'
  }
  return errors
}

export function validateCreateSlot(body) {
  const data = slotData(body)
  return { data, errors: slotErrors(body, data) }
}

export function validateUpdateSlot(body) {
  const data = slotData(body)
  return { data, errors: slotErrors(body, data) }
}
