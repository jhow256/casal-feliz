import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401: try to refresh; if refresh fails, redirect to /login
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh')

      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/api/auth/refresh/`, { refresh })
          localStorage.setItem('access', data.access)
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          // refresh also expired
        }
      }

      localStorage.removeItem('access')
      localStorage.removeItem('refresh')
      window.location.href = '/login?expired=1'
    }

    return Promise.reject(error)
  },
)

export default api
