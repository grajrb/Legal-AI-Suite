import { useState, useEffect } from 'react'
import { Upload, AlertCircle, CheckCircle, Clock, FileWarning, RefreshCw } from 'lucide-react'
import axios from 'axios'
import Navbar from '../components/Navbar'

export default function ParalegalDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/paralegal-tasks')
        setData(response.data)
      } catch (err) {
        console.error('Failed to fetch tasks:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'low': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'processing': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'pending ocr': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'queued': return <Clock className="h-4 w-4 text-gray-400" />
      default: return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy-900">Paralegal Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage document uploads and processing tasks</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Upload className="h-6 w-6 text-gold-500" />
                  <h2 className="text-xl font-semibold text-navy-900">Upload Queue</h2>
                </div>
                <span className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full">
                  {data?.upload_queue?.length || 0} pending
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
            ) : (
              <div className="divide-y divide-gray-100">
                {data?.upload_queue.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Upload className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-navy-800">{item.filename}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            {getStatusIcon(item.status)}
                            <span className="text-sm text-gray-500">{item.status}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileWarning className="h-6 w-6 text-red-500" />
                  <h2 className="text-xl font-semibold text-navy-900">OCR Failures</h2>
                </div>
                <span className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded-full">
                  {data?.ocr_failures?.length || 0} issues
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
            ) : (
              <div className="divide-y divide-gray-100">
                {data?.ocr_failures.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-navy-800">{item.filename}</h3>
                        <p className="text-sm text-red-600 mt-1">{item.error}</p>
                        <p className="text-xs text-gray-400 mt-1">{item.date}</p>
                      </div>
                      <button className="text-sm text-gold-600 hover:text-gold-700 font-medium">
                        Retry
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-navy-900 mb-4">Upload New Document</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gold-400 transition cursor-pointer">
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
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-navy-900 mt-1">{stat.value}</p>
              <p className="text-xs text-green-600 mt-2">{stat.change}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
