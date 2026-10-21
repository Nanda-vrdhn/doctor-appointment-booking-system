import { Navigate, Route, Routes } from 'react-router-dom'

import PublicLayout from '../layouts/PublicLayout.jsx'
import PatientLayout from '../layouts/PatientLayout.jsx'
import DoctorLayout from '../layouts/DoctorLayout.jsx'
import AdminLayout from '../layouts/AdminLayout.jsx'
import { GuestRoute, ProtectedRoute } from './routeGuards.jsx'

import Home from '../pages/public/Home.jsx'
import Doctors from '../pages/public/Doctors.jsx'
import DoctorProfile from '../pages/public/DoctorProfile.jsx'
import About from '../pages/public/About.jsx'
import Contact from '../pages/public/Contact.jsx'
import Login from '../pages/auth/Login.jsx'
import Register from '../pages/auth/Register.jsx'
import NotFound from '../pages/public/NotFound.jsx'

import PatientDashboard from '../pages/patient/PatientDashboard.jsx'
import MyAppointments from '../pages/patient/MyAppointments.jsx'
import PatientProfile from '../pages/patient/PatientProfile.jsx'
import BookAppointment from '../pages/patient/BookAppointment.jsx'

import DoctorDashboard from '../pages/doctor/DoctorDashboard.jsx'
import DoctorAppointments from '../pages/doctor/DoctorAppointments.jsx'
import DoctorAvailability from '../pages/doctor/DoctorAvailability.jsx'
import DoctorProfilePage from '../pages/doctor/DoctorProfilePage.jsx'

import AdminDashboard from '../pages/admin/AdminDashboard.jsx'
import AdminDoctors from '../pages/admin/AdminDoctors.jsx'
import AdminUsers from '../pages/admin/AdminUsers.jsx'
import AdminAppointments from '../pages/admin/AdminAppointments.jsx'
import AdminSpecializations from '../pages/admin/AdminSpecializations.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="/" element={<Home />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/doctors/:doctorId" element={<DoctorProfile />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        {/* One login page per role; all three share POST /auth/login. */}
        <Route path="/login" element={<Navigate to="/login/patient" replace />} />
        <Route
          path="/login/patient"
          element={
            <GuestRoute>
              <Login role="PATIENT" />
            </GuestRoute>
          }
        />
        <Route
          path="/login/doctor"
          element={
            <GuestRoute>
              <Login role="DOCTOR" />
            </GuestRoute>
          }
        />
        <Route
          path="/login/admin"
          element={
            <GuestRoute>
              <Login role="ADMIN" />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />
        <Route
          path="/appointments/book"
          element={
            <ProtectedRoute role="PATIENT">
              <BookAppointment />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Patient */}
      <Route
        path="/patient"
        element={
          <ProtectedRoute role="PATIENT">
            <PatientLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<PatientDashboard />} />
        <Route path="appointments" element={<MyAppointments />} />
        <Route path="profile" element={<PatientProfile />} />
      </Route>

      {/* Doctor */}
      <Route
        path="/doctor"
        element={
          <ProtectedRoute role="DOCTOR">
            <DoctorLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DoctorDashboard />} />
        <Route path="appointments" element={<DoctorAppointments />} />
        <Route path="availability" element={<DoctorAvailability />} />
        <Route path="profile" element={<DoctorProfilePage />} />
      </Route>

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="doctors" element={<AdminDoctors />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="appointments" element={<AdminAppointments />} />
        <Route path="specializations" element={<AdminSpecializations />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
