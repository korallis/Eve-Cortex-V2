'use client'

import { AuthProvider } from '@/components/auth/auth-provider'
import { ThemeProvider } from '@/components/theme-provider'
import type { ReactNode } from 'react'
import type { Session } from 'next-auth'

interface ProvidersProps {
  children: ReactNode
  session?: Session | null | undefined
}

export function Providers({ children, session }: ProvidersProps) {
  return (
    <AuthProvider session={session}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </AuthProvider>
  )
}
