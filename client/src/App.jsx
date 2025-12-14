import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/AdminDashboard'
import LawyerDashboard from './pages/LawyerDashboard'
import ParalegalDashboard from './pages/ParalegalDashboard'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/lawyer" element={
            <ProtectedRoute allowedRoles={['lawyer']}>
              <LawyerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/paralegal" element={
            <ProtectedRoute allowedRoles={['paralegal']}>
              <ParalegalDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
