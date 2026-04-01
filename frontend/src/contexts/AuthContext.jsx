import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => {
    try { return JSON.parse(localStorage.getItem('mm_user')) } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  // Verify token & fetch fresh user on mount
  useEffect(() => {
    const token = localStorage.getItem('mm_access')
    if (!token) { setLoading(false); return }
    authApi.me()
      .then(({ data }) => setUser(data))
      .catch(() => {
        localStorage.removeItem('mm_access')
        localStorage.removeItem('mm_refresh')
        localStorage.removeItem('mm_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ email, password })
    localStorage.setItem('mm_access',  data.access)
    localStorage.setItem('mm_refresh', data.refresh)
    localStorage.setItem('mm_user',    JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem('mm_refresh')
    try { await authApi.logout({ refresh }) } catch { /* ignore */ }
    localStorage.removeItem('mm_access')
    localStorage.removeItem('mm_refresh')
    localStorage.removeItem('mm_user')
    setUser(null)
  }, [])

  const updateUser = useCallback(updated => {
    const merged = { ...user, ...updated }
    setUser(merged)
    localStorage.setItem('mm_user', JSON.stringify(merged))
  }, [user])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}