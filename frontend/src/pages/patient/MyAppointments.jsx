import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as appointmentService from '../../services/appointmentService.js'
import AppointmentTable from '../../components/appointments/AppointmentTable.jsx'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [target, setTarget] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = () => {
    setLoading(true)
    setError('')
    appointmentService
      .myAppointments()
      .then((d) => setAppointments(d.appointments))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const confirmCancel = async () => {
    setBusy(true)
    try {
      await appointmentService.cancelAppointment(target.appointment_id)
      setTarget(null)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">My appointments</h1>
        <Link to="/doctors" className="btn-primary">
          Book new
        </Link>
      </div>

      <div className="mt-5">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={error} onRetry={load} />
        ) : appointments.length === 0 ? (
          <EmptyState
            title="No appointments yet"
            description="Book an appointment from the doctor directory to see it here."
          />
        ) : (
          <AppointmentTable
            appointments={appointments}
            variant="patient"
            onCancel={(a) => setTarget(a)}
          />
        )}
      </div>

      <ConfirmDialog
        open={!!target}
        title="Cancel appointment"
        message={`Cancel the appointment with ${target?.doctor_name} on ${target?.appointment_date}?`}
        confirmLabel="Yes, cancel it"
        busy={busy}
        onConfirm={confirmCancel}
        onCancel={() => setTarget(null)}
      />
    </div>
  )
}
