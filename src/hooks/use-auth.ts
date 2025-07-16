/**
 * Authentication Hook
 * Provides authentication state and utilities
 */

'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export interface AuthUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  characterId?: string
  characterName?: string
  corporationId?: string
  allianceId?: string
  accessToken?: string
  refreshToken?: string
  scopes?: string[]
}

export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const user = session?.user as AuthUser | undefined

  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated'
  const isUnauthenticated = status === 'unauthenticated'

  const requireAuth = (redirectTo?: string) => {
    if (isUnauthenticated) {
      const callbackUrl = redirectTo || window.location.pathname
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`)
    }
  }

  const hasScope = (requiredScope: string): boolean => {
    if (!user?.scopes) return false
    return user.scopes.includes(requiredScope)
  }

  const hasAnyScope = (requiredScopes: string[]): boolean => {
    if (!user?.scopes) return false
    return requiredScopes.some(scope => user.scopes!.includes(scope))
  }

  const hasAllScopes = (requiredScopes: string[]): boolean => {
    if (!user?.scopes) return false
    return requiredScopes.every(scope => user.scopes!.includes(scope))
  }

  const getCharacterInfo = () => {
    if (!user) return null
    
    return {
      id: user.characterId,
      name: user.characterName || user.name,
      corporationId: user.corporationId,
      allianceId: user.allianceId,
    }
  }

  const canAccessFeature = (feature: string): boolean => {
    const featureScopes: Record<string, string[]> = {
      'character-info': ['esi-characters.read_character_info.v1'],
      'skills': ['esi-skills.read_skills.v1', 'esi-skills.read_skillqueue.v1'],
      'assets': ['esi-assets.read_assets.v1'],
      'wallet': ['esi-wallet.read_character_wallet.v1'],
      'market': ['esi-markets.read_character_orders.v1'],
      'corporation': ['esi-corporations.read_corporation_membership.v1'],
      'fittings': ['esi-fittings.read_fittings.v1'],
      'location': ['esi-location.read_location.v1', 'esi-location.read_ship_type.v1'],
      'clones': ['esi-clones.read_clones.v1', 'esi-clones.read_implants.v1'],
      'contacts': ['esi-characters.read_contacts.v1'],
      'calendar': ['esi-calendar.read_calendar_events.v1'],
      'mail': ['esi-mail.read_mail.v1'],
      'industry': ['esi-industry.read_character_jobs.v1'],
      'planetary': ['esi-planets.manage_planets.v1'],
    }

    const requiredScopes = featureScopes[feature]
    if (!requiredScopes) return false

    return hasAllScopes(requiredScopes)
  }

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    isUnauthenticated,
    requireAuth,
    hasScope,
    hasAnyScope,
    hasAllScopes,
    getCharacterInfo,
    canAccessFeature,
  }
}