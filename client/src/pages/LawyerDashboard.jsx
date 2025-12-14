import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Calendar, FileText, AlertCircle, Loader2, LogOut, Plus } from 'lucide-react'

export default function LawyerDashboard() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [matters, setMatters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'lawyer') {
      navigate('/login')
      return
    }

    fetchMatters()
  }, [user, navigate, token])

  const fetchMatters = async () => {
    try {
      const response = await fetch('/api/matters', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch matters')
      
      const data = await response.json()
      setMatters(data.matters || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lawyer Dashboard</h1>
            <p className="text-gray-600 mt-1">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Active Matters</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {matters.filter(m => m.status === 'active').length}
                </p>
              </div>
              <FileText className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Pending Documents</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {matters.filter(m => m.pending_docs > 0).length}
                </p>
              </div>
              <Calendar className="w-12 h-12 text-orange-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Upcoming Deadlines</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {matters.filter(m => m.deadline_urgent).length}
                </p>
              </div>
              <AlertCircle className="w-12 h-12 text-red-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Matters List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Your Matters</h2>
            <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
              <Plus className="w-5 h-5" />
              <span>New Matter</span>
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 m-4 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {loading ? (
            <div className="p-8 flex items-center justify-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-gray-600">Loading matters...</span>
            </div>
          ) : matters.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No matters yet. Create your first matter to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Matter Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Client</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Deadline</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Documents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {matters.map(matter => (
                    <tr key={matter.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{matter.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{matter.client_name}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          matter.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : matter.status === 'closed'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {matter.status.charAt(0).toUpperCase() + matter.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{matter.deadline || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{matter.document_count || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
