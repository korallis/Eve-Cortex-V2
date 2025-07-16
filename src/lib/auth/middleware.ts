/**
 * Authentication Middleware
 * Protects routes and handles authentication flow
 */

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/character',
  '/skills',
  '/fittings',
  '/market',
  '/profile',
  '/api/character',
  '/api/skills',
  '/api/fittings',
  '/api/market',
]

// Routes that should redirect to dashboard if user is authenticated
const AUTH_ROUTES = ['/auth/signin', '/auth/signup', '/login', '/signin']

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/brand',
  '/about',
  '/features',
  '/pricing',
  '/contact',
  '/api/auth',
  '/api/health',
  '/api/status',
]

export async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))

  // Check if the route is an auth route
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))

  // Check if the route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))

  // Skip middleware for public routes (unless it's a protected route)
  if (isPublicRoute && !isProtectedRoute) {
    return NextResponse.next()
  }

  // Get the token from the request
  const secret = process.env['NEXTAUTH_SECRET']
  if (!secret) {
    console.error('NEXTAUTH_SECRET environment variable is not set')
    return NextResponse.redirect(new URL('/auth/error?error=Configuration', request.url))
  }

  const token = await getToken({
    req: request,
    secret,
  })

  // If user is authenticated and trying to access auth routes, redirect to dashboard
  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If user is not authenticated and trying to access protected routes, redirect to sign in
  if (!token && isProtectedRoute) {
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', request.url)
    return NextResponse.redirect(signInUrl)
  }

  // Check for token errors (expired, invalid, etc.)
  if (token && token.error) {
    // Token refresh failed, redirect to sign in
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('error', 'SessionRequired')
    signInUrl.searchParams.set('callbackUrl', request.url)
    return NextResponse.redirect(signInUrl)
  }

  // Allow the request to proceed
  return NextResponse.next()
}

// Utility function to check if a user has required ESI scopes
export function hasRequiredScope(token: any, requiredScope: string): boolean {
  if (!token || !token.scope) {
    return false
  }

  const scopes = token.scope.split(' ')
  return scopes.includes(requiredScope)
}

// Utility function to check if a user has any of the required ESI scopes
export function hasAnyRequiredScope(token: any, requiredScopes: string[]): boolean {
  if (!token || !token.scope) {
    return false
  }

  const scopes = token.scope.split(' ')
  return requiredScopes.some(scope => scopes.includes(scope))
}

// Utility function to check if a user has all required ESI scopes
export function hasAllRequiredScopes(token: any, requiredScopes: string[]): boolean {
  if (!token || !token.scope) {
    return false
  }

  const scopes = token.scope.split(' ')
  return requiredScopes.every(scope => scopes.includes(scope))
}

// Common ESI scope groups for different functionality
export const ESI_SCOPE_GROUPS = {
  BASIC_CHARACTER: [
    'esi-characters.read_characters.v1',
    'esi-location.read_location.v1',
    'esi-location.read_online.v1',
  ],
  SKILLS: ['esi-skills.read_skills.v1', 'esi-skills.read_skillqueue.v1'],
  WALLET: ['esi-wallet.read_character_wallet.v1'],
  ASSETS: ['esi-assets.read_assets.v1'],
  MARKET: ['esi-markets.read_character_orders.v1'],
  FITTINGS: ['esi-fittings.read_fittings.v1', 'esi-fittings.write_fittings.v1'],
  CORPORATION: [
    'esi-corporations.read_corporation_membership.v1',
    'esi-wallet.read_corporation_wallet.v1',
    'esi-assets.read_corporation_assets.v1',
  ],
  INDUSTRY: ['esi-industry.read_character_jobs.v1', 'esi-industry.read_corporation_jobs.v1'],
  CONTRACTS: [
    'esi-contracts.read_character_contracts.v1',
    'esi-contracts.read_corporation_contracts.v1',
  ],
  PLANETS: ['esi-planets.manage_planets.v1', 'esi-planets.read_customs_offices.v1'],
  MAIL: ['esi-mail.read_mail.v1', 'esi-mail.send_mail.v1'],
  CALENDAR: ['esi-calendar.read_calendar_events.v1'],
  KILLMAILS: ['esi-killmails.read_killmails.v1', 'esi-killmails.read_corporation_killmails.v1'],
  BOOKMARKS: [
    'esi-bookmarks.read_character_bookmarks.v1',
    'esi-bookmarks.read_corporation_bookmarks.v1',
  ],
  FLEETS: ['esi-fleets.read_fleet.v1', 'esi-fleets.write_fleet.v1'],
  UI: ['esi-ui.open_information_window.v1', 'esi-ui.write_waypoint.v1'],
}

// Helper function to validate API routes based on required scopes
export function createScopeValidator(requiredScopes: string[]) {
  return async (request: NextRequest) => {
    const secret = process.env['NEXTAUTH_SECRET']
    if (!secret) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const token = await getToken({
      req: request,
      secret,
    })

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (token.error) {
      return NextResponse.json({ error: 'Token expired or invalid' }, { status: 401 })
    }

    if (!hasAllRequiredScopes(token, requiredScopes)) {
      return NextResponse.json(
        {
          error: 'Insufficient permissions',
          requiredScopes,
          grantedScopes: token.scope ? token.scope.split(' ') : [],
        },
        { status: 403 }
      )
    }

    return null // No error, proceed with request
  }
}
