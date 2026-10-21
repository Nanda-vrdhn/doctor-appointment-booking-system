import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const itemClass = ({ isActive }) =>
  `block rounded-lg px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
  }`

/** Shared shell for the three role dashboards. */
export default function DashboardShell({ role, navItems, children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const onLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white p-4 md:flex">
        <div className="mb-6 flex items-center gap-2">
          <img src="/healthcare-logo.svg" alt="" className="h-8 w-8" />
          <span className="text-lg font-semibold text-brand-800">CareConnect</span>
        </div>
        <nav className="flex flex-col gap-1" aria-label="Dashboard">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={itemClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-slate-100 pt-4 text-sm">
          <p className="font-medium text-slate-800">{user?.fullName}</p>
          <p className="capitalize text-slate-500">{role}</p>
          <button type="button" onClick={onLogout} className="btn-secondary mt-3 w-full">
            Log out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <span className="font-semibold text-brand-800">{role} dashboard</span>
          <button type="button" onClick={onLogout} className="btn-secondary">
            Log out
          </button>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
