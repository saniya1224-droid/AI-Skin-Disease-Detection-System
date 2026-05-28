import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('dermai_token'))
  const [loading, setLoading] = useState(true)

  // ── Rehydrate user on mount ──────────────────
  useEffect(() => {
    const savedUser = localStorage.getItem('dermai_user')
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem('dermai_user')
      }
    }
    setLoading(false)
  }, [token])

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password })
    const { token: newToken, user: newUser } = data
    localStorage.setItem('dermai_token', newToken)
    localStorage.setItem('dermai_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
    return newUser
  }, [])

  const register = useCallback(async (name, email, password) => {
    const { data } = await authAPI.register({ name, email, password })
    const { token: newToken, user: newUser } = data
    localStorage.setItem('dermai_token', newToken)
    localStorage.setItem('dermai_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
    return newUser
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('dermai_token')
    localStorage.removeItem('dermai_user')
    setToken(null)
    setUser(null)
  }, [])

  const isAuthenticated = Boolean(token && user)
  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, isAdmin, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
