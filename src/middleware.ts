/**
 * Next.js Middleware
 * Handles authentication and route protection
 */

import { NextRequest } from 'next/server'
import { authMiddleware } from '@/lib/auth/middleware'

export async function middleware(request: NextRequest) {
  // Handle authentication
  return await authMiddleware(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api/auth (NextAuth.js API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)',
  ],
}