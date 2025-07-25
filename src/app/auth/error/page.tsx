/**
 * Authentication Error Page
 * Handles authentication errors and provides user-friendly messages
 */

import Link from 'next/link'
import { AuthErrorDisplay } from '@/components/auth/error-display'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; message?: string }>
}) {
  const params = (await searchParams) || {}

  return (
    <div className="min-h-screen bg-dark-primary">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md">
          <div className="text-center">
            <h1 className="mb-2 text-3xl font-bold text-white">Authentication Error</h1>
            <p className="mb-8 text-dark-secondary">There was a problem with your authentication</p>
          </div>

          <AuthErrorDisplay error={params.error} message={params.message} />

          <div className="mt-8 text-center">
            <Link
              href="/auth/signin"
              className="hover:bg-cortex-blue-dark inline-flex items-center justify-center rounded-md bg-cortex-blue px-6 py-3 font-medium text-white transition-colors"
            >
              Try Again
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
