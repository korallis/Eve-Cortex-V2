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
  requireAnyScope = false
}: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, hasAllScopes, hasAnyScope } = useAuth()

  // Show loading spinner while session is loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  // If not authenticated, the useAuth hook will handle redirect
  if (!isAuthenticated) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Authentication Required
          </h1>
          <p className="text-dark-secondary">
            Redirecting to sign in...
          </p>
        </div>
      </div>
    )
  }

  // Check required scopes if specified
  if (requiredScopes.length > 0) {
    const hasRequiredScopes = requireAnyScope 
      ? hasAnyScope(requiredScopes)
      : hasAllScopes(requiredScopes)

    if (!hasRequiredScopes) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-white mb-4">
              Insufficient Permissions
            </h1>
            <p className="text-dark-secondary mb-6">
              This feature requires additional ESI permissions. Please sign in again to grant the required access.
            </p>
            <div className="rounded-lg bg-dark-secondary/50 p-4 border border-dark-border">
              <h4 className="font-medium text-white mb-2">Required Permissions:</h4>
              <ul className="text-sm text-dark-secondary space-y-1">
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