import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import * as doctorService from '../../services/doctorService.js'
import { useAuth } from '../../context/AuthContext.jsx'
import TimeSlotPicker from '../../components/appointments/TimeSlotPicker.jsx'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'

export default function DoctorProfile() {
  const { doctorId } = useParams()
  const { user } = useAuth()
  const [doctor, setDoctor] = useState(null)
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      doctorService.getDoctor(doctorId),
      doctorService.getDoctorAvailability(doctorId),
    ])
      .then(([d, s]) => {
        setDoctor(d.doctor)
        setSlots(s.slots)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [doctorId])

  if (loading) return <LoadingSpinner label="Loading doctor…" />
  if (error) return <div className="mx-auto max-w-4xl px-4 py-8"><ErrorMessage message={error} /></div>
  if (!doctor) return null

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="card">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-xl font-semibold text-brand-700">
            {doctor.full_name
              .split(' ')
              .filter(Boolean)
              .map((w) => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{doctor.full_name}</h1>
            <p className="text-brand-600">{doctor.specialization_name}</p>
            <p className="text-sm text-slate-500">
              {doctor.qualification} · {doctor.experience_years} years experience
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-700">
              ₹{doctor.consultation_fee} <span className="text-sm font-normal text-slate-500">consultation fee</span>
            </p>
          </div>
        </div>
        {doctor.description && (
          <p className="mt-4 text-sm text-slate-600">{doctor.description}</p>
        )}
      </div>

      <div className="card mt-6">
        <h2 className="text-lg font-semibold text-slate-800">Available slots</h2>
        <div className="mt-4">
          <TimeSlotPicker slots={slots} onSelect={() => {}} />
        </div>
        {user ? (
          <Link to={`/appointments/book?doctorId=${doctor.doctor_id}`} className="btn-primary mt-5">
            Book an appointment
          </Link>
        ) : (
          <Link to="/login/patient" className="btn-primary mt-5">
            Log in to book
          </Link>
        )}
      </div>
    </div>
  )
}
