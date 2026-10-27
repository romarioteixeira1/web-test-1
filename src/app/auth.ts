import { createContext, useContext } from 'react'
import type { User } from '../../shared/auth'

export type AuthContextValue = {
  user: User
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

/** The signed-in user. Only available inside <AuthGate>, which renders the app once someone has signed in. */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthGate>')
  return ctx
}
