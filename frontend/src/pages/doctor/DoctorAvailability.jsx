import { useEffect, useState } from 'react'
import * as availabilityService from '../../services/availabilityService.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import FormField from '../../components/common/FormField.jsx'
import { formatDate, formatTime, todayStr } from '../../utils/dateTime.js'

export default function DoctorAvailability() {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({ date: todayStr(), startTime: '09:00', endTime: '09:30' })
  const [busy, setBusy] = useState(false)

  const load = () => {
    setLoading(true)
    setError('')
    availabilityService
      .listOwnAvailability()
      .then((d) => setSlots(d.slots))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const addSlot = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      await availabilityService.createSlot(form)
      setNotice('Slot added.')
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const deactivate = async (id) => {
    setError('')
    try {
      await availabilityService.deactivateSlot(id)
      setNotice('Slot deactivated.')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const grouped = slots.reduce((acc, s) => {
    ;(acc[s.available_date] ||= []).push(s)
    return acc
  }, {})
  const dates = Object.keys(grouped).sort()

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Manage availability</h1>
      <p className="mt-1 text-sm text-slate-500">Add or deactivate bookable time slots.</p>

      <form onSubmit={addSlot} className="card mt-5">
        <h2 className="font-semibold text-slate-800">Add a slot</h2>
        {error && <div className="mt-3"><ErrorMessage message={error} /></div>}
        {notice && <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <FormField label="Date" htmlFor="date">
            <input id="date" type="date" className="input" value={form.date} onChange={update('date')} />
          </FormField>
          <FormField label="Start time" htmlFor="startTime">
            <input id="startTime" type="time" className="input" value={form.startTime} onChange={update('startTime')} />
          </FormField>
          <FormField label="End time" htmlFor="endTime">
            <input id="endTime" type="time" className="input" value={form.endTime} onChange={update('endTime')} />
          </FormField>
        </div>
        <button type="submit" className="btn-primary mt-4" disabled={busy}>
          Add slot
        </button>
      </form>

      <div className="mt-6">
        {loading ? (
          <LoadingSpinner />
        ) : dates.length === 0 ? (
          <EmptyState title="No slots yet" description="Add your first slot above." />
        ) : (
          dates.map((date) => (
            <div key={date} className="card mt-4">
              <p className="font-medium text-slate-800">{formatDate(date)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {grouped[date].map((s) => (
                  <div
                    key={s.availability_id}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                  >
                    <span>
                      {formatTime(s.start_time)} – {formatTime(s.end_time)}
                    </span>
                    <span className={s.slot_status === 'AVAILABLE' ? 'text-emerald-600' : 'text-slate-400'}>
                      {s.slot_status}
                    </span>
                    {s.slot_status === 'AVAILABLE' && (
                      <button
                        type="button"
                        onClick={() => deactivate(s.availability_id)}
                        className="text-xs font-medium text-rose-600 hover:underline"
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
