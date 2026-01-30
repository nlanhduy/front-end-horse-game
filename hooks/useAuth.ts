import { useEffect, useState } from 'react';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check if user is authenticated from localStorage (client-side only)
    if (typeof window === 'undefined') return false
    return localStorage.getItem('adminAuth') === 'true'
  })
  const [isLoading, setIsLoading] = useState(false)

  const login = (name: string, password: string): boolean => {
    const adminName = process.env.NEXT_PUBLIC_ADMIN_NAME
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD

    if (name === adminName && password === adminPassword) {
      localStorage.setItem('adminAuth', 'true')
      setIsAuthenticated(true)
      return true
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem('adminAuth')
    setIsAuthenticated(false)
  }

  return { isAuthenticated, isLoading, login, logout }
}
