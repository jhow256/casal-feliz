import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount, restore user from token
  useEffect(() => {
    const access = localStorage.getItem('access')
    if (!access) { setLoading(false); return }

    api.get('/api/auth/me/')
      .then(({ data }) => setUser(data))
      .catch(() => {
        localStorage.removeItem('access')
        localStorage.removeItem('refresh')
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (username, password) => {
    const { data } = await api.post('/api/auth/login/', { username, password })
    localStorage.setItem('access', data.access)
    localStorage.setItem('refresh', data.refresh)
    setUser(data.user)
  }, [])

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem('refresh')
    try {
      if (refresh) await api.post('/api/auth/logout/', { refresh })
    } finally {
      localStorage.removeItem('access')
      localStorage.removeItem('refresh')
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
