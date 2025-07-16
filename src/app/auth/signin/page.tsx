/**
 * Sign In Page
 * EVE Online ESI OAuth authentication page
 */

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import { SignInForm } from '@/components/auth/signin-form'

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<{ callbackUrl?: string; error?: string }>
}) {
  const session = await auth()
  const params = (await searchParams) || {}

  // If user is already authenticated, redirect to dashboard or callback URL
  if (session) {
    redirect(params.callbackUrl || '/dashboard')
  }

  return (
    <div className="min-h-screen bg-dark-primary">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md">
          <div className="text-center">
            <h1 className="mb-2 text-3xl font-bold text-white">Welcome to Eve-Cortex</h1>
            <p className="mb-8 text-dark-secondary">
              Sign in with your EVE Online character to access AI-powered optimization
            </p>
          </div>

          <SignInForm callbackUrl={params.callbackUrl} error={params.error} />
        </div>
      </div>
    </div>
  )
}
