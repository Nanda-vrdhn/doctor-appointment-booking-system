import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as doctorService from '../../services/doctorService.js'
import DoctorSearchFilters from '../../components/doctors/DoctorSearchFilters.jsx'
import DoctorCard from '../../components/doctors/DoctorCard.jsx'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'

const EMPTY_FILTERS = { name: '', specializationId: '', date: '' }

export default function Doctors() {
  const [params] = useSearchParams()
  const [filters, setFilters] = useState({
    name: params.get('name') || '',
    ...EMPTY_FILTERS,
  })
  const [applied, setApplied] = useState(filters)
  const [specializations, setSpecializations] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    doctorService
      .listSpecializations()
      .then((d) => setSpecializations(d.specializations))
      .catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const d = await doctorService.listDoctors(applied)
      setDoctors(d.doctors)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [applied])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800">Doctor directory</h1>
      <p className="mt-1 text-sm text-slate-500">
        Search by name, specialization or an available date.
      </p>

      <div className="mt-5">
        <DoctorSearchFilters
          filters={filters}
          specializations={specializations}
          onChange={setFilters}
          onSubmit={() => setApplied({ ...filters })}
        />
      </div>

      <div className="mt-6">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={error} onRetry={load} />
        ) : doctors.length === 0 ? (
          <EmptyState
            title="No doctors found"
            description="Try a different name, specialization or date."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {doctors.map((d) => (
              <DoctorCard key={d.doctor_id} doctor={d} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
