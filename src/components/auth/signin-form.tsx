/**
 * Sign In Form Component
 * Handles EVE Online ESI OAuth sign in flow
 */

'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { AlertCircle } from 'lucide-react'

interface SignInFormProps {
  callbackUrl?: string | undefined
  error?: string | undefined
}

const ERROR_MESSAGES = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'Access denied. Please make sure you have the required permissions.',
  Verification: 'The verification link is invalid or has expired.',
  Default: 'An error occurred during sign in. Please try again.',
  OAuthSignin: 'Error in constructing an authorization URL.',
  OAuthCallback: 'Error in handling the response from OAuth provider.',
  OAuthCreateAccount: 'Could not create OAuth account.',
  EmailCreateAccount: 'Could not create email account.',
  Callback: 'Error in the OAuth callback handler route.',
  OAuthAccountNotLinked: 'Account is already linked to another user.',
  EmailSignin: 'Check your email for the sign in link.',
  CredentialsSignin: 'Sign in failed. Check your credentials.',
  SessionRequired: 'Please sign in to access this page.',
}

export function SignInForm({ callbackUrl, error }: SignInFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    setIsLoading(true)

    try {
      await signIn('eveonline', {
        callbackUrl: callbackUrl || '/dashboard',
        redirect: true,
      })
    } catch (error) {
      console.error('Sign in error:', error)
      setIsLoading(false)
    }
  }

  const errorMessage = error
    ? ERROR_MESSAGES[error as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.Default
    : null

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="flex items-center gap-3 rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        </div>
      )}

      <div className="border-dark-border rounded-lg border bg-dark-secondary p-6">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cortex-blue/20">
            <svg className="h-6 w-6 text-cortex-blue" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">Sign in with EVE Online</h3>
            <p className="mt-1 text-sm text-dark-secondary">
              Connect your EVE Online character to access personalized optimization
            </p>
          </div>

          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="hover:bg-cortex-blue-dark flex w-full items-center justify-center gap-3 rounded-md bg-cortex-blue px-6 py-3 font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Connecting...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                Sign in with EVE Online
              </>
            )}
          </button>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-dark-secondary">
          By signing in, you agree to share your character data with Eve-Cortex to provide
          personalized optimization recommendations.
        </p>
      </div>

      <div className="border-dark-border rounded-lg border bg-dark-secondary/50 p-4">
        <h4 className="mb-2 font-medium text-white">Required Permissions</h4>
        <ul className="space-y-1 text-sm text-dark-secondary">
          <li>• Character information and skills</li>
          <li>• Asset and wallet data</li>
          <li>• Market orders and history</li>
          <li>• Corporation membership</li>
          <li>• Fitting and ship information</li>
        </ul>
      </div>
    </div>
  )
}
