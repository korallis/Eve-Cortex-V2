/**
 * Authentication Utilities
 * Helper functions for authentication and ESI integration
 */

import { auth } from '@/lib/auth/config'
import type { Session } from 'next-auth'

export interface ESIToken {
  access_token: string
  refresh_token: string
  expires_at: number
  token_type: string
  scopes: string[]
}

export interface CharacterInfo {
  character_id: number
  character_name: string
  corporation_id: number
  alliance_id?: number
  expires_on: string
  scopes: string[]
}

/**
 * Get the current server session
 */
export async function getAuthSession(): Promise<Session | null> {
  return await auth()
}

/**
 * Get the current user's ESI token
 */
export async function getESIToken(): Promise<ESIToken | null> {
  const session = await getAuthSession()
  if (!session?.user) return null

  const user = session.user as any
  if (!user.access_token || !user.refresh_token) return null

  return {
    access_token: user.access_token,
    refresh_token: user.refresh_token,
    expires_at: user.expires_at,
    token_type: user.token_type || 'Bearer',
    scopes: user.scopes || [],
  }
}

/**
 * Check if the current user has the required ESI scope
 */
export async function hasESIScope(requiredScope: string): Promise<boolean> {
  const token = await getESIToken()
  if (!token) return false

  return token.scopes.includes(requiredScope)
}

/**
 * Check if the current user has any of the required ESI scopes
 */
export async function hasAnyESIScope(requiredScopes: string[]): Promise<boolean> {
  const token = await getESIToken()
  if (!token) return false

  return requiredScopes.some(scope => token.scopes.includes(scope))
}

/**
 * Check if the current user has all required ESI scopes
 */
export async function hasAllESIScopes(requiredScopes: string[]): Promise<boolean> {
  const token = await getESIToken()
  if (!token) return false

  return requiredScopes.every(scope => token.scopes.includes(scope))
}

/**
 * Get character information from the current session
 */
export async function getCharacterInfo(): Promise<CharacterInfo | null> {
  const session = await getAuthSession()
  if (!session?.user) return null

  const user = session.user as any
  if (!user.character_id) return null

  return {
    character_id: user.character_id,
    character_name: user.character_name || user.name,
    corporation_id: user.corporation_id,
    alliance_id: user.alliance_id,
    expires_on: user.expires_on,
    scopes: user.scopes || [],
  }
}

/**
 * Refresh an ESI token
 */
export async function refreshESIToken(refreshToken: string): Promise<ESIToken | null> {
  const EVE_CLIENT_ID = process.env['EVE_CLIENT_ID']!
  const EVE_CLIENT_SECRET = process.env['EVE_CLIENT_SECRET']!
  const EVE_OAUTH_URL = 'https://login.eveonline.com/v2/oauth'

  try {
    const response = await fetch(`${EVE_OAUTH_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${EVE_CLIENT_ID}:${EVE_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      console.error('Token refresh failed:', response.status, response.statusText)
      return null
    }

    const tokenData = await response.json()

    return {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || refreshToken,
      expires_at: Date.now() + tokenData.expires_in * 1000,
      token_type: tokenData.token_type,
      scopes: tokenData.scope?.split(' ') || [],
    }
  } catch (error) {
    console.error('Error refreshing ESI token:', error)
    return null
  }
}

/**
 * Make an authenticated ESI API request
 */
export async function makeESIRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T | null> {
  const token = await getESIToken()
  if (!token) {
    console.error('No ESI token available')
    return null
  }

  const ESI_BASE_URL = 'https://esi.evetech.net'
  const url = endpoint.startsWith('http') ? endpoint : `${ESI_BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Eve-Cortex/1.0.0',
        ...options.headers,
      },
    })

    if (!response.ok) {
      console.error('ESI request failed:', response.status, response.statusText)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error making ESI request:', error)
    return null
  }
}

/**
 * Get the ESI base URL for the current version
 */
export function getESIBaseUrl(version: string = 'latest'): string {
  return `https://esi.evetech.net/${version}`
}

/**
 * Format ESI scopes for display
 */
export function formatScopeForDisplay(scope: string): string {
  // Remove the 'esi-' prefix and version suffix
  const cleanScope = scope.replace(/^esi-/, '').replace(/\.v\d+$/, '')

  // Split by dots and capitalize each part
  return cleanScope
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

/**
 * Group ESI scopes by category
 */
export function groupScopesByCategory(scopes: string[]): Record<string, string[]> {
  const categories: Record<string, string[]> = {}

  scopes.forEach(scope => {
    const category = scope.split('-')[1]?.split('.')[0] || 'other'
    if (!categories[category]) {
      categories[category] = []
    }
    categories[category].push(scope)
  })

  return categories
}

/**
 * Check if a token is expired or will expire soon
 */
export function isTokenExpired(expiresAt: number, bufferMinutes: number = 5): boolean {
  const bufferMs = bufferMinutes * 60 * 1000
  return Date.now() + bufferMs >= expiresAt
}

/**
 * Validate ESI scope format
 */
export function isValidESIScope(scope: string): boolean {
  const scopeRegex = /^esi-[a-z]+\.[a-z_]+\.v\d+$/
  return scopeRegex.test(scope)
}

/**
 * Extract character ID from ESI token
 */
export function extractCharacterIdFromToken(token: string): number | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2 || !parts[1]) return null

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    const subParts = payload.sub?.split(':')
    return subParts && subParts[2] ? parseInt(subParts[2]) : null
  } catch (error) {
    console.error('Error extracting character ID from token:', error)
    return null
  }
}
