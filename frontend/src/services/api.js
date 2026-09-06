import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // send the HttpOnly refresh_token cookie automatically
})

// In-memory access token — never touches localStorage
let _accessToken = null

export function setAccessToken(token) {
  _accessToken = token
}

export function clearAccessToken() {
  _accessToken = null
}

// Attach access token to every request
api.interceptors.request.use((config) => {
  if (_accessToken) config.headers.Authorization = `Bearer ${_accessToken}`
  return config
})

// On 401: try to refresh via the HttpOnly cookie; if it fails, go to /login
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      try {
        // The browser sends the HttpOnly refresh_token cookie automatically
        const { data } = await axios.post(
          `${BASE_URL}/api/auth/refresh/`,
          {},
          { withCredentials: true },
        )
        setAccessToken(data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        // refresh token also expired — force re-login
        clearAccessToken()
        window.location.href = '/login?expired=1'
      }
    }

    return Promise.reject(error)
  },
)

export default api
