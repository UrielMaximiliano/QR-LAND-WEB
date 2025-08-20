// Contexto de autenticación con patrón Provider
// Aplica SRP: solo gestiona estado de autenticación

import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { AuthService } from '../services/interfaces'
import { LocalStorageAuthService } from '../services/AuthService'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
  authService?: AuthService // Inyección de dependencias
}

export function AuthProvider({ children, authService = new LocalStorageAuthService() }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Restaurar sesión al cargar
    const currentUser = authService.getCurrentUser()
    setUser(currentUser)
  }, [authService])

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true)
    try {
      const loggedUser = await authService.login(username, password)
      if (loggedUser) {
        setUser(loggedUser)
        return true
      }
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    login,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
