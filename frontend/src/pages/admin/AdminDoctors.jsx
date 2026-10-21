import { useCallback, useEffect, useState } from 'react'
import * as adminService from '../../services/adminService.js'
import * as doctorService from '../../services/doctorService.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import FormField from '../../components/common/FormField.jsx'

const EMPTY = {
  fullName: '',
  email: '',
  password: '',
  phone: '',
  specializationId: '',
  qualification: '',
  experienceYears: '',
  consultationFee: '',
  description: '',
}

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([])
  const [specializations, setSpecializations] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([doctorService.listDoctors(), doctorService.listSpecializations()])
      .then(([d, s]) => {
        setDoctors(d.doctors)
        setSpecializations(s.specializations)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      if (editingId) {
        await adminService.updateDoctor(editingId, {
          specializationId: form.specializationId ? Number(form.specializationId) : undefined,
          qualification: form.qualification || undefined,
          experienceYears: form.experienceYears === '' ? undefined : Number(form.experienceYears),
          consultationFee: form.consultationFee === '' ? undefined : Number(form.consultationFee),
          description: form.description || undefined,
        })
        setNotice('Doctor updated.')
      } else {
        await adminService.createDoctor({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          phone: form.phone,
          specializationId: Number(form.specializationId),
          qualification: form.qualification,
          experienceYears: Number(form.experienceYears || 0),
          consultationFee: Number(form.consultationFee || 0),
          description: form.description,
        })
        setNotice('Doctor account created.')
      }
      setForm(EMPTY)
      setEditingId(null)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const edit = (d) => {
    setEditingId(d.doctor_id)
    setForm({
      ...EMPTY,
      fullName: d.full_name,
      specializationId: String(d.specialization_id),
      qualification: d.qualification,
      experienceYears: String(d.experience_years),
      consultationFee: String(d.consultation_fee),
      description: d.description || '',
    })
  }

  const toggle = async (d) => {
    setError('')
    try {
      await adminService.setDoctorActive(d.doctor_id, !d.doctor_active)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Doctors</h1>
      <p className="mt-1 text-sm text-slate-500">Add, edit or deactivate doctor accounts.</p>

      <form onSubmit={submit} className="card mt-5 space-y-4">
        <h2 className="font-semibold text-slate-800">
          {editingId ? 'Edit doctor' : 'Add a doctor'}
        </h2>
        {error && <ErrorMessage message={error} />}
        {notice && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}

        <div className="grid gap-3 md:grid-cols-2">
          <FormField label="Full name" htmlFor="fullName">
            <input id="fullName" className="input" value={form.fullName} onChange={update('fullName')} />
          </FormField>
          <FormField label="Email" htmlFor="email">
            <input id="email" type="email" className="input" value={form.email} onChange={update('email')} disabled={!!editingId} />
          </FormField>
          {!editingId && (
            <FormField label="Temporary password" htmlFor="password">
              <input id="password" type="password" className="input" value={form.password} onChange={update('password')} />
            </FormField>
          )}
          <FormField label="Phone" htmlFor="phone">
            <input id="phone" className="input" value={form.phone} onChange={update('phone')} />
          </FormField>
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
            <input id="qualification" className="input" value={form.qualification} onChange={update('qualification')} />
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
        </div>
        <FormField label="Description" htmlFor="description">
          <textarea id="description" className="input" rows={2} value={form.description} onChange={update('description')} />
        </FormField>

        <div className="flex gap-2">
          <button type="submit" className="btn-primary" disabled={busy}>
            {editingId ? 'Save changes' : 'Create doctor'}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setEditingId(null)
                setForm(EMPTY)
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-5">
        {loading ? (
          <LoadingSpinner />
        ) : doctors.length === 0 ? (
          <EmptyState title="No doctors" description="Add one above." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Specialization</th>
                  <th className="px-4 py-3">Qualification</th>
                  <th className="px-4 py-3">Fee</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctors.map((d) => (
                  <tr key={d.doctor_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{d.full_name}</td>
                    <td className="px-4 py-3 text-slate-500">{d.specialization_name}</td>
                    <td className="px-4 py-3 text-slate-500">{d.qualification}</td>
                    <td className="px-4 py-3">₹{d.consultation_fee}</td>
                    <td className="px-4 py-3">
                      {d.doctor_active ? (
                        <span className="text-emerald-600">Active</span>
                      ) : (
                        <span className="text-slate-400">Inactive</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button type="button" onClick={() => edit(d)} className="btn-secondary px-2 py-1 text-xs">
                        Edit
                      </button>{' '}
                      <button
                        type="button"
                        onClick={() => toggle(d)}
                        className={d.doctor_active ? 'btn-danger px-2 py-1 text-xs' : 'btn-primary px-2 py-1 text-xs'}
                      >
                        {d.doctor_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
