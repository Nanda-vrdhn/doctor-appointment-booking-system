import { useCallback, useEffect, useState } from 'react'
import * as adminService from '../../services/adminService.js'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    adminService
      .listUsers({ search, role })
      .then((d) => setUsers(d.users))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [search, role])

  useEffect(load, [load])

  const toggle = async (user) => {
    setError('')
    try {
      await adminService.setUserActive(user.user_id, !user.is_active)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Users</h1>
      <p className="mt-1 text-sm text-slate-500">View and activate or deactivate registered users.</p>

      <div className="card mt-5 flex flex-col gap-3 md:flex-row">
        <input
          className="input flex-1"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search users"
        />
        <select className="input md:w-44" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filter by role">
          <option value="">All roles</option>
          <option value="PATIENT">Patients</option>
          <option value="DOCTOR">Doctors</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      {error && <div className="mt-4"><ErrorMessage message={error} /></div>}

      <div className="mt-4">
        {loading ? (
          <LoadingSpinner />
        ) : users.length === 0 ? (
          <EmptyState title="No users found" description="Try a different search." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.user_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{u.full_name}</td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="badge bg-brand-100 text-brand-800">{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      {u.is_active ? (
                        <span className="text-emerald-600">Active</span>
                      ) : (
                        <span className="text-slate-400">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => toggle(u)}
                        className={u.is_active ? 'btn-danger px-2 py-1 text-xs' : 'btn-primary px-2 py-1 text-xs'}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
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
