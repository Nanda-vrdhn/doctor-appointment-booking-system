import { useEffect, useState } from 'react'
import * as authService from '../../services/authService.js'
import FormField from '../../components/common/FormField.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'

export default function PatientProfile() {
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ fullName: '', phone: '' })
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '' })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    authService
      .getProfile()
      .then((d) => {
        setProfile(d.user)
        setForm({ fullName: d.user.fullName, phone: d.user.phone || '' })
      })
      .catch((e) => setError(e.message))
  }, [])

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })
  const updatePw = (field) => (e) => setPassword({ ...password, [field]: e.target.value })

  const saveProfile = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      const d = await authService.updateProfile(form)
      setProfile(d.user)
      setNotice('Profile updated.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      await authService.updateProfile({
        fullName: form.fullName,
        phone: form.phone,
        currentPassword: password.currentPassword,
        newPassword: password.newPassword,
      })
      setPassword({ currentPassword: '', newPassword: '' })
      setNotice('Password changed.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-slate-800">Profile & settings</h1>
      <p className="mt-1 text-sm text-slate-500">
        Signed in as {profile?.email} ({profile?.role})
      </p>

      <form onSubmit={saveProfile} className="card mt-5 space-y-4">
        <h2 className="font-semibold text-slate-800">Profile details</h2>
        {error && <ErrorMessage message={error} />}
        {notice && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
        <FormField label="Full name" htmlFor="fullName">
          <input id="fullName" className="input" value={form.fullName} onChange={update('fullName')} />
        </FormField>
        <FormField label="Phone" htmlFor="phone">
          <input id="phone" className="input" value={form.phone} onChange={update('phone')} />
        </FormField>
        <FormField label="Email" htmlFor="email">
          <input id="email" className="input bg-slate-50" value={profile?.email || ''} disabled />
        </FormField>
        <button type="submit" className="btn-primary" disabled={busy}>
          Save changes
        </button>
      </form>

      <form onSubmit={changePassword} className="card mt-5 space-y-4">
        <h2 className="font-semibold text-slate-800">Change password</h2>
        <FormField label="Current password" htmlFor="currentPassword">
          <input
            id="currentPassword"
            type="password"
            className="input"
            autoComplete="current-password"
            value={password.currentPassword}
            onChange={updatePw('currentPassword')}
          />
        </FormField>
        <FormField label="New password" htmlFor="newPassword">
          <input
            id="newPassword"
            type="password"
            className="input"
            autoComplete="new-password"
            value={password.newPassword}
            onChange={updatePw('newPassword')}
          />
        </FormField>
        <button type="submit" className="btn-secondary" disabled={busy}>
          Update password
        </button>
      </form>
    </div>
  )
}
