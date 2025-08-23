// Implementación del servicio de autenticación
// Responsabilidad única: gestionar autenticación y sesión

import type { AuthService } from './interfaces'
import type { User } from '../types'

const STORAGE_KEY = 'tiket-admin-session'

// Usuarios hardcodeados (en producción vendría de una base de datos)
const USERS: Record<string, { password: string; role: User['role'] }> = {
  'admin': { password: 'admin123', role: 'admin' },
  'super': { password: 'super123', role: 'admin' }
}

export class LocalStorageAuthService implements AuthService {
  async login(username: string, password: string): Promise<User | null> {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const userData = USERS[username]
    if (userData && userData.password === password) {
      const user: User = { username, role: userData.role }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      return user
    }
    return null
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY)
  }

  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }
}
