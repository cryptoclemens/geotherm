'use client'

// Einziger Zugriffspunkt auf Auth — niemals supabase.auth.* direkt importieren.
// Intern nutzt dieser Hook @supabase/ssr; austauschbar gegen Keycloak ohne Component-Änderungen.

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
}

// TODO M2: Implementierung mit @supabase/ssr
export function useAuth(): AuthState {
  const [user] = useState<User | null>(null)
  const [loading] = useState(false)

  return {
    user,
    loading,
    signIn: async () => ({ error: new Error('Auth nicht konfiguriert') }),
    signUp: async () => ({ error: new Error('Auth nicht konfiguriert') }),
    signOut: async () => {},
    resetPassword: async () => ({ error: new Error('Auth nicht konfiguriert') }),
  }
}
