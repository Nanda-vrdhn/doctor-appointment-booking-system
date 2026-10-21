import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as doctorService from '../../services/doctorService.js'
import * as appointmentService from '../../services/appointmentService.js'
import TimeSlotPicker from '../../components/appointments/TimeSlotPicker.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import { formatDate, formatTime } from '../../utils/dateTime.js'

export default function BookAppointment() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [doctors, setDoctors] = useState([])
  const [doctorId, setDoctorId] = useState(params.get('doctorId') || '')
  const [doctor, setDoctor] = useState(null)
  const [slots, setSlots] = useState([])
  const [selected, setSelected] = useState(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    doctorService
      .listDoctors()
      .then((d) => setDoctors(d.doctors))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!doctorId) {
      setDoctor(null)
      setSlots([])
      setSelected(null)
      return
    }
    setSelected(null)
    Promise.all([
      doctorService.getDoctor(doctorId),
      doctorService.getDoctorAvailability(doctorId),
    ])
      .then(([d, s]) => {
        setDoctor(d.doctor)
        setSlots(s.slots)
      })
      .catch((e) => setError(e.message))
  }, [doctorId])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!selected) {
      setError('Please choose a time slot.')
      return
    }
    setBusy(true)
    try {
      await appointmentService.bookAppointment(selected.availability_id, reason.trim())
      navigate('/patient/appointments')
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  if (loading) return <LoadingSpinner label="Loading booking page…" />

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800">Book an appointment</h1>

      {error && <div className="mt-4"><ErrorMessage message={error} /></div>}

      <form onSubmit={onSubmit} className="card mt-5 space-y-5">
        <div>
          <label htmlFor="doctor" className="label">
            Doctor
          </label>
          <select
            id="doctor"
            className="input"
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
          >
            <option value="">Select a doctor…</option>
            {doctors.map((d) => (
              <option key={d.doctor_id} value={d.doctor_id}>
                {d.full_name} — {d.specialization_name}
              </option>
            ))}
          </select>
        </div>

        {doctor && (
          <div className="rounded-lg bg-brand-50 p-3 text-sm text-brand-800">
            {doctor.full_name} · {doctor.specialization_name} · ₹{doctor.consultation_fee}
          </div>
        )}

        {doctorId && (
          <div>
            <p className="label">Select a slot</p>
            <TimeSlotPicker slots={slots} onSelect={setSelected} />
          </div>
        )}

        {selected && (
          <p className="text-sm text-slate-600">
            Selected: {formatDate(selected.available_date)} at {formatTime(selected.start_time)}
          </p>
        )}

        <div>
          <label htmlFor="reason" className="label">
            Reason for visit
          </label>
          <textarea
            id="reason"
            className="input"
            rows={3}
            maxLength={1000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Briefly describe your symptoms or reason for the visit"
          />
        </div>

        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'Booking…' : 'Confirm booking'}
        </button>
      </form>
    </div>
  )
}
