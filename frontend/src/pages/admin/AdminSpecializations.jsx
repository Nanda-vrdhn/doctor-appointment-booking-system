import { useCallback, useEffect, useState } from 'react'
import * as adminService from '../../services/adminService.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import FormField from '../../components/common/FormField.jsx'

const EMPTY = { name: '', description: '' }

export default function AdminSpecializations() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    adminService
      .listSpecializations()
      .then((d) => setItems(d.specializations))
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
        await adminService.updateSpecialization(editingId, form)
        setNotice('Specialization updated.')
      } else {
        await adminService.createSpecialization(form)
        setNotice('Specialization created.')
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

  const edit = (item) => {
    setEditingId(item.specialization_id)
    setForm({ name: item.name, description: item.description || '' })
  }

  const toggle = async (item) => {
    setError('')
    try {
      await adminService.setSpecializationActive(item.specialization_id, !item.is_active)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Specializations</h1>
      <p className="mt-1 text-sm text-slate-500">Add, edit or deactivate medical specializations.</p>

      <form onSubmit={submit} className="card mt-5 space-y-4">
        <h2 className="font-semibold text-slate-800">{editingId ? 'Edit specialization' : 'Add specialization'}</h2>
        {error && <ErrorMessage message={error} />}
        {notice && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
        <FormField label="Name" htmlFor="name">
          <input id="name" className="input" value={form.name} onChange={update('name')} />
        </FormField>
        <FormField label="Description" htmlFor="description">
          <input id="description" className="input" value={form.description} onChange={update('description')} />
        </FormField>
        <div className="flex gap-2">
          <button type="submit" className="btn-primary" disabled={busy}>
            {editingId ? 'Save changes' : 'Add'}
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
        ) : items.length === 0 ? (
          <EmptyState title="No specializations" description="Add one above." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((s) => (
              <div key={s.specialization_id} className="card flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-800">{s.name}</p>
                  <p className="text-sm text-slate-500">{s.description}</p>
                  <p className="mt-1 text-xs text-slate-400">{s.is_active ? 'Active' : 'Inactive'}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button type="button" onClick={() => edit(s)} className="btn-secondary px-2 py-1 text-xs">
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(s)}
                    className={s.is_active ? 'btn-danger px-2 py-1 text-xs' : 'btn-primary px-2 py-1 text-xs'}
                  >
                    {s.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
