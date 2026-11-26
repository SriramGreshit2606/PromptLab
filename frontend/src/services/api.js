import axios from 'axios'

export const TOKEN_KEY = 'promptlab_token'
export const UNAUTHORIZED_EVENT = 'promptlab:unauthorized'

// Empty VITE_API_BASE_URL => relative "/api/v1", handled by the Vite dev proxy.
const origin = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

const api = axios.create({
  baseURL: `${origin}/api/v1`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || ''
    const isAuthForm = url.startsWith('/auth/login') || url.startsWith('/auth/register')

    // Expired or invalid token on a protected call: tell the app to log out.
    if (error.response?.status === 401 && !isAuthForm) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    return Promise.reject(error)
  },
)

export default api
