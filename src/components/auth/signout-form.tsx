/**
 * Sign Out Form Component
 * Handles user sign out confirmation and actions
 */

'use client'

import { signOut } from 'next-auth/react'
import { useState } from 'react'
import { LogOut, User } from 'lucide-react'
import Link from 'next/link'
import type { Session } from 'next-auth'

interface SignOutFormProps {
  session: Session | null
}

export function SignOutForm({ session }: SignOutFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    
    try {
      await signOut({
        callbackUrl: '/',
        redirect: true,
      })
    } catch (error) {
      console.error('Sign out error:', error)
      setIsLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="rounded-lg bg-dark-secondary p-6 border border-dark-border">
        <div className="text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-neural-purple/20 flex items-center justify-center">
            <User className="h-6 w-6 text-neural-purple" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white">
              Not signed in
            </h3>
            <p className="text-sm text-dark-secondary mt-1">
              You are not currently signed in to Eve-Cortex
            </p>
          </div>

          <Link
            href="/auth/signin"
            className="inline-flex items-center justify-center gap-3 rounded-md bg-cortex-blue px-6 py-3 text-white font-medium hover:bg-cortex-blue-dark transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-dark-secondary p-6 border border-dark-border">
        <div className="text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-neural-purple/20 flex items-center justify-center">
            <User className="h-6 w-6 text-neural-purple" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white">
              {session.user?.name || 'EVE Online Character'}
            </h3>
            <p className="text-sm text-dark-secondary mt-1">
              Signed in as {session.user?.email || 'EVE Online pilot'}
            </p>
          </div>

          <button
            onClick={handleSignOut}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 rounded-md bg-red-600 px-6 py-3 text-white font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                Signing out...
              </>
            ) : (
              <>
                <LogOut className="h-5 w-5" />
                Sign Out
              </>
            )}
          </button>
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/dashboard"
          className="text-sm text-cortex-blue hover:text-cortex-blue-dark transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="rounded-lg bg-dark-secondary/50 p-4 border border-dark-border">
        <h4 className="font-medium text-white mb-2">What happens when you sign out?</h4>
        <ul className="text-sm text-dark-secondary space-y-1">
          <li>• Your session will be terminated</li>
          <li>• Access tokens will be revoked</li>
          <li>• You'll be redirected to the homepage</li>
          <li>• Your data remains secure on our servers</li>
        </ul>
      </div>
    </div>
  )
}