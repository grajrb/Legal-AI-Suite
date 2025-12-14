import { Link, useNavigate } from 'react-router-dom'
import { Scale, LogOut, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-navy-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Scale className="h-8 w-8 text-gold-400" />
            <span className="text-xl font-bold">Legal AI</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2 text-sm">
                  <User className="h-4 w-4" />
                  <span>{user.name}</span>
                  <span className="text-gold-400 capitalize">({user.role})</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 bg-navy-700 hover:bg-navy-600 px-3 py-2 rounded-md text-sm transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-gold-500 hover:bg-gold-600 text-navy-900 px-4 py-2 rounded-md font-medium transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
