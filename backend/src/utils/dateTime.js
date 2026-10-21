/** Clinic-local date/time helpers. Appointment dates use the clinic calendar. */

export function toDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayStr() {
  return toDateStr(new Date())
}

/** True when a slot's date+time is strictly in the future. */
export function isFutureSlot(date, time) {
  if (!date || !time) return false
  const dt = new Date(`${date}T${time}`)
  return !Number.isNaN(dt.getTime()) && dt.getTime() > Date.now()
}

export function isValidDateStr(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = new Date(`${value}T00:00:00`)
  return !Number.isNaN(d.getTime())
}

export function isValidTimeStr(value) {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value)
}

/** Normalise "HH:MM" to "HH:MM:SS". */
export function normaliseTime(value) {
  return value.length === 5 ? `${value}:00` : value
}
