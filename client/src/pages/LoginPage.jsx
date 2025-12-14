import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Scale, Mail, Lock, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post('/api/login', { email, password })
      login(response.data.user)
      navigate(response.data.redirect)
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <Scale className="h-10 w-10 text-gold-500" />
            <span className="text-2xl font-bold text-navy-900">Legal AI</span>
          </Link>
          <p className="text-gray-500 mt-2">Sign in to your workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@lawfirm.com"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter any password"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold-500 hover:bg-gold-600 text-navy-900 py-3 rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 font-medium mb-2">Demo Credentials:</p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li><code className="bg-gray-200 px-1 rounded">admin@test.com</code> → Admin Dashboard</li>
            <li><code className="bg-gray-200 px-1 rounded">lawyer@test.com</code> → Lawyer Dashboard</li>
            <li><code className="bg-gray-200 px-1 rounded">paralegal@test.com</code> → Paralegal Dashboard</li>
          </ul>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/" className="text-gold-600 hover:text-gold-700">
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  )
}
