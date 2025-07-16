/**
 * Protected Route Component
 * Wraps components that require authentication
 */

'use client'

import { useAuth } from '@/hooks/use-auth'
import { ReactNode } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface ProtectedRouteProps {
  children: ReactNode
  fallback?: ReactNode
  requiredScopes?: string[]
  requireAnyScope?: boolean
}

export function ProtectedRoute({
  children,
  fallback,
  requiredScopes = [],
  requireAnyScope = false,
}: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, hasAllScopes, hasAnyScope } = useAuth()

  // Show loading spinner while session is loading
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  // If not authenticated, the useAuth hook will handle redirect
  if (!isAuthenticated) {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold text-white">Authentication Required</h1>
            <p className="text-dark-secondary">Redirecting to sign in...</p>
          </div>
        </div>
      )
    )
  }

  // Check required scopes if specified
  if (requiredScopes.length > 0) {
    const hasRequiredScopes = requireAnyScope
      ? hasAnyScope(requiredScopes)
      : hasAllScopes(requiredScopes)

    if (!hasRequiredScopes) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="max-w-md text-center">
            <h1 className="mb-4 text-2xl font-bold text-white">Insufficient Permissions</h1>
            <p className="mb-6 text-dark-secondary">
              This feature requires additional ESI permissions. Please sign in again to grant the
              required access.
            </p>
            <div className="border-dark-border rounded-lg border bg-dark-secondary/50 p-4">
              <h4 className="mb-2 font-medium text-white">Required Permissions:</h4>
              <ul className="space-y-1 text-sm text-dark-secondary">
                {requiredScopes.map(scope => (
                  <li key={scope}>• {scope}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}
