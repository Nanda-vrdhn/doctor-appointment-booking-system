import { Outlet } from 'react-router-dom'
import DashboardShell from '../components/common/DashboardShell.jsx'

const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', end: true },
  { to: '/admin/doctors', label: 'Doctors' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/appointments', label: 'Appointments' },
  { to: '/admin/specializations', label: 'Specializations' },
]

export default function AdminLayout() {
  return (
    <DashboardShell role="Admin" navItems={NAV}>
      <Outlet />
    </DashboardShell>
  )
}
