import { useState, useEffect } from 'react'
import { Briefcase, FileText, Calendar, Clock, ChevronRight } from 'lucide-react'
import axios from 'axios'
import Navbar from '../components/Navbar'

export default function LawyerDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/matters')
        setData(response.data)
      } catch (err) {
        console.error('Failed to fetch matters:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'in progress': return 'bg-blue-100 text-blue-700'
      case 'review': return 'bg-yellow-100 text-yellow-700'
      case 'pending': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy-900">Lawyer Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your active matters and documents</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Briefcase className="h-6 w-6 text-gold-500" />
                <h2 className="text-xl font-semibold text-navy-900">Active Matters</h2>
              </div>
            </div>
            
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data?.active_matters.map((matter) => (
                  <div key={matter.id} className="p-4 hover:bg-gray-50 transition cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-navy-800">{matter.title}</h3>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(matter.status)}`}>
                            {matter.status}
                          </span>
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{matter.deadline}</span>
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <FileText className="h-6 w-6 text-gold-500" />
                <h2 className="text-xl font-semibold text-navy-900">Recent Documents</h2>
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
                {data?.recent_documents.map((doc) => (
                  <div key={doc.id} className="p-4 hover:bg-gray-50 transition cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-navy-800">{doc.name}</h3>
                          <p className="text-sm text-gray-500">{doc.matter}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-400">
                        <Clock className="h-4 w-4" />
                        <span>{doc.uploaded}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-navy-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Upload Document', icon: FileText },
              { label: 'New Matter', icon: Briefcase },
              { label: 'Schedule Meeting', icon: Calendar },
              { label: 'Request Review', icon: Clock },
            ].map((action, index) => (
              <button
                key={index}
                className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gold-50 hover:border-gold-200 border border-gray-100 transition"
              >
                <action.icon className="h-6 w-6 text-gold-600 mb-2" />
                <span className="text-sm font-medium text-navy-800">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
