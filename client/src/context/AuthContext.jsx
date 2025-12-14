import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  
  const [token, setToken] = useState(() => {
    return localStorage.getItem('auth_token')
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const login = useCallback((userData, accessToken) => {
    setUser(userData)
    setToken(accessToken)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('auth_token', accessToken)
    setError(null)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('user')
    localStorage.removeItem('auth_token')
  }, [])

  const register = useCallback(async (email, password, fullName, role = 'user', organization = '') => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role,
          organization
        })
      })
      
      if (!response.ok) {
        throw new Error('Registration failed')
      }
      
      const data = await response.json()
      login(data.user, data.access_token)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [login])

  const value = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    register,
    isAuthenticated: !!user && !!token
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
