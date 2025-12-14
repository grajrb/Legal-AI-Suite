import { useState, useEffect } from 'react'
import { Upload, AlertCircle, CheckCircle, Clock, FileWarning, RefreshCw, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function ParalegalDashboard() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [ocr_failures, setOcrFailures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'paralegal') {
      navigate('/login')
      return
    }

    fetchTasks()
  }, [user, navigate, token])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/paralegal-tasks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch tasks')
      
      const data = await response.json()
      setTasks(data.upload_queue || [])
      setOcrFailures(data.ocr_failures || [])
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
            <h1 className="text-3xl font-bold text-gray-900">Paralegal Dashboard</h1>
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
      
      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Upload className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Upload Queue</h2>
                </div>
                <span className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full">
                  {tasks.length} pending
                </span>
              </div>
            </div>
            
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>No documents in upload queue</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {tasks.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Upload className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{item.filename}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            {item.status === 'processing' && <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />}
                            {item.status === 'queued' && <Clock className="h-4 w-4 text-gray-400" />}
                            {item.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                            <span className="text-sm text-gray-500">{item.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileWarning className="h-6 w-6 text-red-600" />
                  <h2 className="text-xl font-semibold text-gray-900">OCR Failures</h2>
                </div>
                <span className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded-full">
                  {ocr_failures.length} issues
                </span>
              </div>
            </div>
            
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : ocr_failures.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>No OCR failures - all documents processed successfully!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {ocr_failures.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.filename}</h3>
                        <p className="text-sm text-red-600 mt-1">{item.error}</p>
                        <p className="text-xs text-gray-400 mt-1">{item.date}</p>
                      </div>
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        Retry
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload New Document</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition cursor-pointer">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Drag and drop files here, or click to browse</p>
            <p className="text-sm text-gray-400">Supports PDF, DOC, DOCX (Max 50MB)</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Documents Processed', value: '156', change: '+12 today' },
            { label: 'Avg. Processing Time', value: '2.3s', change: '-0.5s vs last week' },
            { label: 'Success Rate', value: '97.2%', change: '+1.2% this month' },
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              <p className="text-xs text-green-600 mt-2">{stat.change}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
