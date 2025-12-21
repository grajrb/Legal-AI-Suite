import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/AdminDashboard'
import LawyerDashboard from './pages/LawyerDashboard'
import ParalegalDashboard from './pages/ParalegalDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import ClientsPage from './pages/ClientsPage'
import MattersPage from './pages/MattersPage'
import FoldersPage from './pages/FoldersPage'
import TemplatesPage from './pages/TemplatesPage'
import AdminAssistant from './pages/AdminAssistant'

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
          <Route path="/clients" element={
            <ProtectedRoute allowedRoles={['admin','lawyer','paralegal']}>
              <ClientsPage />
            </ProtectedRoute>
          } />
          <Route path="/matters" element={
            <ProtectedRoute allowedRoles={['admin','lawyer']}>
              <MattersPage />
            </ProtectedRoute>
          } />
          <Route path="/folders" element={
            <ProtectedRoute allowedRoles={['admin','lawyer','paralegal']}>
              <FoldersPage />
            </ProtectedRoute>
          } />
          <Route path="/templates" element={
            <ProtectedRoute allowedRoles={['admin','lawyer']}>
              <TemplatesPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/assistant" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminAssistant />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
