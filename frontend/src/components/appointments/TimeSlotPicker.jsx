import { useMemo, useState } from 'react'
import { formatDate, formatTime } from '../../utils/dateTime.js'

/** Group bookable slots by date and let the patient pick one. */
export default function TimeSlotPicker({ slots, onSelect }) {
  const [selected, setSelected] = useState(null)

  const byDate = useMemo(() => {
    const groups = {}
    for (const s of slots) {
      ;(groups[s.available_date] ||= []).push(s)
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [slots])

  if (slots.length === 0) {
    return <p className="text-sm text-slate-500">No available slots for this doctor right now.</p>
  }

  return (
    <div className="space-y-4">
      {byDate.map(([date, daySlots]) => (
        <div key={date}>
          <p className="mb-2 text-sm font-medium text-slate-700">{formatDate(date)}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {daySlots.map((s) => {
              const active = selected === s.availability_id
              return (
                <button
                  key={s.availability_id}
                  type="button"
                  onClick={() => {
                    setSelected(s.availability_id)
                    onSelect(s)
                  }}
                  aria-pressed={active}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                    active
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300'
                  }`}
                >
                  {formatTime(s.start_time)} – {formatTime(s.end_time)}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
