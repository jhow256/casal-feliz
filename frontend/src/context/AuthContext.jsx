import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api, { setAccessToken, clearAccessToken } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount, attempt a silent token refresh using the HttpOnly cookie.
  // If the cookie is still valid the backend returns a fresh access token
  // and we can restore the session without asking the user to log in again.
  useEffect(() => {
    api.post('/api/auth/refresh/', {})
      .then(({ data }) => {
        setAccessToken(data.access)
        return api.get('/api/auth/me/')
      })
      .then(({ data }) => setUser(data))
      .catch(() => {
        // No valid cookie — user needs to log in
        clearAccessToken()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (username, password) => {
    const { data } = await api.post('/api/auth/login/', { username, password })
    // Access token goes into memory; refresh token is already in the HttpOnly cookie
    setAccessToken(data.access)
    setUser(data.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout/', {})
    } finally {
      clearAccessToken()
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
