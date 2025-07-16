/**
 * Authentication Error Display Component
 * Displays user-friendly error messages for authentication failures
 */

'use client'

import { AlertTriangle, RefreshCw, Shield, Clock, Server } from 'lucide-react'
import Link from 'next/link'

interface AuthErrorDisplayProps {
  error?: string | undefined
  message?: string | undefined
}

const ERROR_CONFIGS = {
  Configuration: {
    icon: Server,
    title: 'Server Configuration Error',
    description: 'There is a problem with the server configuration. Please try again later.',
    action: 'Contact Support',
    actionUrl: '/support',
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  AccessDenied: {
    icon: Shield,
    title: 'Access Denied',
    description: 'You do not have permission to access this resource. Please ensure you have the required EVE Online permissions.',
    action: 'Try Again',
    actionUrl: '/auth/signin',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
  },
  Verification: {
    icon: Clock,
    title: 'Verification Failed',
    description: 'The verification link is invalid or has expired. Please request a new sign-in link.',
    action: 'Sign In Again',
    actionUrl: '/auth/signin',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
  OAuthSignin: {
    icon: AlertTriangle,
    title: 'OAuth Sign In Error',
    description: 'There was an error constructing the authorization URL. This may be a temporary issue.',
    action: 'Try Again',
    actionUrl: '/auth/signin',
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  OAuthCallback: {
    icon: RefreshCw,
    title: 'OAuth Callback Error',
    description: 'There was an error processing the response from EVE Online. Please try signing in again.',
    action: 'Try Again',
    actionUrl: '/auth/signin',
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  OAuthCreateAccount: {
    icon: AlertTriangle,
    title: 'Account Creation Failed',
    description: 'Could not create your account with the provided OAuth credentials. Please try again.',
    action: 'Try Again',
    actionUrl: '/auth/signin',
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  OAuthAccountNotLinked: {
    icon: Shield,
    title: 'Account Already Linked',
    description: 'This EVE Online account is already linked to another user. Please use a different account.',
    action: 'Use Different Account',
    actionUrl: '/auth/signin',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
  },
  SessionRequired: {
    icon: Clock,
    title: 'Session Required',
    description: 'You need to be signed in to access this page. Please sign in with your EVE Online character.',
    action: 'Sign In',
    actionUrl: '/auth/signin',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  Default: {
    icon: AlertTriangle,
    title: 'Authentication Error',
    description: 'An unexpected error occurred during authentication. Please try again.',
    action: 'Try Again',
    actionUrl: '/auth/signin',
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
  },
}

export function AuthErrorDisplay({ error, message }: AuthErrorDisplayProps) {
  const config = ERROR_CONFIGS[error as keyof typeof ERROR_CONFIGS] || ERROR_CONFIGS.Default
  const Icon = config.icon

  return (
    <div className="space-y-6">
      <div className={`rounded-lg p-6 border ${config.bgColor} ${config.borderColor}`}>
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 ${config.color}`}>
            <Icon className="h-6 w-6" />
          </div>
          
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${config.color}`}>
              {config.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {message || config.description}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={config.actionUrl}
          className="flex-1 inline-flex items-center justify-center rounded-md bg-cortex-blue px-6 py-3 text-white font-medium hover:bg-cortex-blue-dark transition-colors"
        >
          {config.action}
        </Link>
        
        <Link
          href="/"
          className="flex-1 inline-flex items-center justify-center rounded-md bg-dark-secondary px-6 py-3 text-white font-medium hover:bg-dark-secondary/80 border border-dark-border transition-colors"
        >
          Go Home
        </Link>
      </div>

      <div className="rounded-lg bg-dark-secondary/50 p-4 border border-dark-border">
        <h4 className="font-medium text-white mb-2">Troubleshooting Tips</h4>
        <ul className="text-sm text-dark-secondary space-y-1">
          <li>• Ensure your EVE Online account is active</li>
          <li>• Check that you're using the correct EVE Online character</li>
          <li>• Try clearing your browser cache and cookies</li>
          <li>• Disable browser extensions that might interfere</li>
          <li>• Contact support if the problem persists</li>
        </ul>
      </div>

      {error && (
        <div className="rounded-lg bg-dark-secondary/30 p-3 border border-dark-border">
          <p className="text-xs text-dark-secondary font-mono">
            Error Code: {error}
          </p>
        </div>
      )}
    </div>
  )
}