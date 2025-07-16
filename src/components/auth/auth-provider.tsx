/**
 * Authentication Provider Component
 * Wraps NextAuth.js SessionProvider with additional authentication context
 */

'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import type { Session } from 'next-auth'

interface AuthProviderProps {
  children: ReactNode
  session?: Session | null | undefined
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider 
      session={session || null}
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  )
}