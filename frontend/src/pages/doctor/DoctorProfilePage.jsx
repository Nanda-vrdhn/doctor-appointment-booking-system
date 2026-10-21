import { useEffect, useState } from 'react'
import * as doctorService from '../../services/doctorService.js'
import { useAuth } from '../../context/AuthContext.jsx'
import FormField from '../../components/common/FormField.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'

export default function DoctorProfilePage() {
  const { user } = useAuth()
  const [specializations, setSpecializations] = useState([])
  const [form, setForm] = useState({
    specializationId: '',
    qualification: '',
    experienceYears: '',
    consultationFee: '',
    description: '',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    Promise.all([doctorService.getMyProfile(), doctorService.listSpecializations()])
      .then(([profile, specs]) => {
        const d = profile.doctor
        setForm({
          specializationId: d.specialization_id || '',
          qualification: d.qualification || '',
          experienceYears: d.experience_years ?? '',
          consultationFee: d.consultation_fee ?? '',
          description: d.description || '',
        })
        setSpecializations(specs.specializations)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const save = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      await doctorService.updateDoctorProfile({
        specializationId: form.specializationId ? Number(form.specializationId) : undefined,
        qualification: form.qualification,
        experienceYears: form.experienceYears === '' ? undefined : Number(form.experienceYears),
        consultationFee: form.consultationFee === '' ? undefined : Number(form.consultationFee),
        description: form.description,
      })
      setNotice('Profile updated.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-slate-800">My profile</h1>
      <p className="mt-1 text-sm text-slate-500">Signed in as {user?.email}</p>

      <form onSubmit={save} className="card mt-5 space-y-4">
        {error && <ErrorMessage message={error} />}
        {notice && (
          <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>
        )}
        <FormField label="Specialization" htmlFor="specializationId">
          <select
            id="specializationId"
            className="input"
            value={form.specializationId}
            onChange={update('specializationId')}
          >
            <option value="">Select…</option>
            {specializations.map((s) => (
              <option key={s.specialization_id} value={s.specialization_id}>
                {s.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Qualification" htmlFor="qualification">
          <input
            id="qualification"
            className="input"
            value={form.qualification}
            onChange={update('qualification')}
          />
        </FormField>
        <FormField label="Experience (years)" htmlFor="experienceYears">
          <input
            id="experienceYears"
            type="number"
            min="0"
            className="input"
            value={form.experienceYears}
            onChange={update('experienceYears')}
          />
        </FormField>
        <FormField label="Consultation fee (₹)" htmlFor="consultationFee">
          <input
            id="consultationFee"
            type="number"
            min="0"
            className="input"
            value={form.consultationFee}
            onChange={update('consultationFee')}
          />
        </FormField>
        <FormField label="Description" htmlFor="description">
          <textarea
            id="description"
            className="input"
            rows={3}
            value={form.description}
            onChange={update('description')}
          />
        </FormField>
        <button type="submit" className="btn-primary" disabled={busy}>
          Save profile
        </button>
      </form>
    </div>
  )
}
