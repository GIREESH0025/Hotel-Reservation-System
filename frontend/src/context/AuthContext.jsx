import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/auth.api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token') || localStorage.getItem('hrh_token'))
  const [loading, setLoading] = useState(true) // loading gate: true until session restored

  // Restore session from token on mount
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('token') || localStorage.getItem('hrh_token')
      if (!storedToken) {
        setLoading(false)
        return
      }
      try {
        const { data } = await authApi.me()
        setUser(data.data)
        setToken(storedToken)
        localStorage.setItem('token', storedToken)
        localStorage.setItem('hrh_token', storedToken)
      } catch {
        // Token invalid or expired — clear it
        localStorage.removeItem('token')
        localStorage.removeItem('hrh_token')
        setUser(null)
        setToken(null)
      } finally {
        setLoading(false)
      }
    }
    restoreSession()
  }, [])

  // Listen for 401 events from Axios interceptor
  useEffect(() => {
    const handleLogout = () => {
      setUser(null)
      setToken(null)
    }
    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ email, password })
    const { token: newToken, user: newUser } = data.data
    localStorage.setItem('token', newToken)
    localStorage.setItem('hrh_token', newToken)
    setToken(newToken)
    setUser(newUser)
    return newUser
  }, [])

  const register = useCallback(async (formData) => {
    const { data } = await authApi.register(formData)
    const { token: newToken, user: newUser } = data.data
    localStorage.setItem('token', newToken)
    localStorage.setItem('hrh_token', newToken)
    setToken(newToken)
    setUser(newUser)
    return newUser
  }, [])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    localStorage.removeItem('token')
    localStorage.removeItem('hrh_token')
    setUser(null)
    setToken(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

