import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Auth from './pages/auth/Auth'
import PatientDashboard from './pages/patient/PatientDashboard'
import DoctorDashboard from './pages/doctor/DoctorDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'

// Simple Route Guard
function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRole && user.role !== allowedRole) {
    // Redirect to their correct dashboard if role doesn't match
    if (user.role === 'patient') return <Navigate to="/patient/dashboard" replace />
    if (user.role === 'doctor') return <Navigate to="/doctor/dashboard" replace />
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Auth />} />
        <Route 
          path="/patient/dashboard" 
          element={
            <ProtectedRoute allowedRole="patient">
              <PatientDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/doctor/dashboard" 
          element={
            <ProtectedRoute allowedRole="doctor">
              <DoctorDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App