/**
 * Sign Out Page
 * Handles user sign out and displays confirmation
 */

import { auth } from '@/lib/auth/config'
import { SignOutForm } from '@/components/auth/signout-form'

export default async function SignOutPage() {
  const session = await auth()

  return (
    <div className="min-h-screen bg-dark-primary">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md">
          <div className="text-center">
            <h1 className="mb-2 text-3xl font-bold text-white">Sign Out</h1>
            <p className="mb-8 text-dark-secondary">
              Are you sure you want to sign out of Eve-Cortex?
            </p>
          </div>

          <SignOutForm session={session} />
        </div>
      </div>
    </div>
  )
}
