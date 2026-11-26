import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { authApi } from '../services/endpoints'
import { TOKEN_KEY, UNAUTHORIZED_EVENT } from '../services/api'

const AuthContext = createContext(null)

// Reads the "exp" claim (ms) from a JWT without verifying it. Verification is the backend's job.
function getTokenExpiry(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(payload))
    return typeof exp === 'number' ? exp * 1000 : null
  } catch {
    return null
  }
}

function readStoredToken() {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return null
  const expiry = getTokenExpiry(token)
  if (expiry && expiry <= Date.now()) {
    localStorage.removeItem(TOKEN_KEY)
    return null
  }
  return token
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(readStoredToken)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(readStoredToken()))
  const [sessionNotice, setSessionNotice] = useState('')
  const expiryTimer = useRef(null)

  const logout = useCallback((notice = '') => {
    localStorage.removeItem(TOKEN_KEY)
    clearTimeout(expiryTimer.current)
    setToken(null)
    setUser(null)
    setLoading(false)
    setSessionNotice(typeof notice === 'string' ? notice : '')
  }, [])

  // Load the profile whenever we have a token.
  useEffect(() => {
    if (!token) return undefined
    let cancelled = false
    authApi
      .me()
      .then((profile) => { if (!cancelled) setUser(profile) })
      .catch(() => { /* a 401 is handled by the unauthorized listener below */ })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [token])

  // Log out automatically when the backend says the token is no longer valid.
  useEffect(() => {
    const handleUnauthorized = () => logout('Your session expired. Please log in again.')
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [logout])

  // Log out right when the JWT expires (the backend issues 30 minute tokens, no refresh).
  useEffect(() => {
    clearTimeout(expiryTimer.current)
    if (!token) return undefined
    const expiry = getTokenExpiry(token)
    if (!expiry) return undefined
    const delay = Math.max(expiry - Date.now(), 0)
    expiryTimer.current = setTimeout(() => logout('Your session expired. Please log in again.'), delay)
    return () => clearTimeout(expiryTimer.current)
  }, [token, logout])

  const login = useCallback(async (email, password) => {
    const { access_token: accessToken } = await authApi.login({ email, password })
    localStorage.setItem(TOKEN_KEY, accessToken)
    setSessionNotice('')
    setLoading(true)
    setToken(accessToken)
  }, [])

  const register = useCallback(
    async ({ fullName, email, password }) => {
      await authApi.register({ full_name: fullName, email, password })
      await login(email, password) // the register endpoint returns the user only, so sign in right after
    },
    [login],
  )

  const value = useMemo(
    () => ({ token, user, loading, isAuthenticated: Boolean(token), sessionNotice, login, register, logout }),
    [token, user, loading, sessionNotice, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
