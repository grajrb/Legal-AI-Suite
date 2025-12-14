import { useState, useEffect } from 'react'
import { Users, FileText, AlertTriangle, Activity, TrendingUp, Clock, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const response = await fetch('/api/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!response.ok) throw new Error('Failed to fetch stats')
        const data = await response.json()
        setStats(data)
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const statCards = stats ? [
    { icon: Users, label: 'Total Users', value: stats.total_users, color: 'bg-blue-500' },
    { icon: FileText, label: 'Total Documents', value: stats.total_documents, color: 'bg-green-500' },
    { icon: Activity, label: 'Active Matters', value: stats.active_matters, color: 'bg-purple-500' },
    { icon: AlertTriangle, label: 'Risky Clauses', value: stats.risky_clauses_detected, color: 'bg-red-500' },
    { icon: TrendingUp, label: 'Reviewed Today', value: stats.documents_reviewed_today, color: 'bg-gold-500' },
    { icon: Clock, label: 'Pending Reviews', value: stats.pending_reviews, color: 'bg-orange-500' },
  ] : []

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy-900">Firm Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your law firm's legal workspace</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((card, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
                <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center mb-4`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
                <p className="text-gray-500 text-sm">{card.label}</p>
                <p className="text-3xl font-bold text-navy-900">{card.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {[
                { action: 'Document uploaded', user: 'Priya Sharma', time: '2 hours ago' },
                { action: 'Contract reviewed', user: 'Raj Patel', time: '3 hours ago' },
                { action: 'Risk alert triggered', user: 'System', time: '5 hours ago' },
                { action: 'New user added', user: 'Admin', time: '1 day ago' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-navy-800">{activity.action}</p>
                    <p className="text-sm text-gray-500">by {activity.user}</p>
                  </div>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-navy-900 mb-4">System Health</h2>
            <div className="space-y-4">
              {[
                { name: 'API Response Time', status: 'Healthy', color: 'bg-green-500' },
                { name: 'Database Status', status: 'Connected', color: 'bg-green-500' },
                { name: 'OCR Service', status: 'Active', color: 'bg-green-500' },
                { name: 'AI Processing', status: 'Mock Mode', color: 'bg-yellow-500' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <span className="text-gray-700">{item.name}</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                    <span className="text-sm text-gray-600">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
