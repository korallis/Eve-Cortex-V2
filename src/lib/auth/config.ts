/**
 * NextAuth.js Configuration with EVE Online ESI OAuth
 * Provides secure authentication with automatic token refresh
 */

import { NextAuthConfig } from 'next-auth'
import { JWT } from 'next-auth/jwt'

// EVE Online ESI OAuth Configuration
const EVE_CLIENT_ID = process.env['EVE_CLIENT_ID']!
const EVE_CLIENT_SECRET = process.env['EVE_CLIENT_SECRET']!
const EVE_OAUTH_URL = 'https://login.eveonline.com/v2/oauth'

// Required ESI scopes for Eve-Cortex functionality
const ESI_SCOPES = [
  'esi-characters.read_characters.v1',
  'esi-skills.read_skills.v1',
  'esi-skills.read_skillqueue.v1',
  'esi-assets.read_assets.v1',
  'esi-assets.read_corporation_assets.v1',
  'esi-wallet.read_character_wallet.v1',
  'esi-wallet.read_corporation_wallet.v1',
  'esi-location.read_location.v1',
  'esi-location.read_ship_type.v1',
  'esi-location.read_online.v1',
  'esi-clones.read_clones.v1',
  'esi-clones.read_implants.v1',
  'esi-markets.read_character_orders.v1',
  'esi-markets.read_corporation_orders.v1',
  'esi-corporations.read_corporation_membership.v1',
  'esi-alliances.read_contacts.v1',
  'esi-characters.read_contacts.v1',
  'esi-characters.read_notifications.v1',
  'esi-contracts.read_character_contracts.v1',
  'esi-contracts.read_corporation_contracts.v1',
  'esi-industry.read_character_jobs.v1',
  'esi-industry.read_corporation_jobs.v1',
  'esi-planets.manage_planets.v1',
  'esi-planets.read_customs_offices.v1',
  'esi-fittings.read_fittings.v1',
  'esi-fittings.write_fittings.v1',
  'esi-killmails.read_killmails.v1',
  'esi-killmails.read_corporation_killmails.v1',
  'esi-mail.read_mail.v1',
  'esi-mail.send_mail.v1',
  'esi-calendar.read_calendar_events.v1',
  'esi-characters.read_corporation_roles.v1',
  'esi-characters.read_titles.v1',
  'esi-bookmarks.read_character_bookmarks.v1',
  'esi-bookmarks.read_corporation_bookmarks.v1',
  'esi-fleets.read_fleet.v1',
  'esi-fleets.write_fleet.v1',
  'esi-ui.open_information_window.v1',
  'esi-ui.write_waypoint.v1',
].join(' ')

// Custom EVE Online OAuth Provider
export const eveOnlineProvider = {
  id: 'eveonline',
  name: 'EVE Online',
  type: 'oauth' as const,
  clientId: EVE_CLIENT_ID,
  clientSecret: EVE_CLIENT_SECRET,
  authorization: {
    url: `${EVE_OAUTH_URL}/authorize`,
    params: {
      scope: ESI_SCOPES,
      response_type: 'code',
      redirect_uri: `${process.env['NEXTAUTH_URL']}/api/auth/callback/eveonline`,
    },
  },
  token: {
    url: `${EVE_OAUTH_URL}/token`,
    async request({ client, params, checks, provider }: { client: any; params: any; checks: any; provider: any }) {
      const response = await client.oauthCallback(
        provider.callbackUrl,
        params,
        checks
      )
      
      const tokens = {
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + (response.expires_in || 1200),
        token_type: response.token_type || 'Bearer',
        scope: response.scope || ESI_SCOPES,
      }
      
      return { tokens }
    },
  },
  userinfo: {
    url: `${EVE_OAUTH_URL}/verify`,
    async request({ tokens, provider }: { tokens: any; provider: any }) {
      const response = await fetch(provider.userinfo!.url!, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch user info from EVE Online')
      }
      
      return await response.json()
    },
  },
  profile(profile: any) {
    return {
      id: profile.CharacterID.toString(),
      name: profile.CharacterName,
      email: `${profile.CharacterName}@eveonline.com`,
      image: `https://images.evetech.net/characters/${profile.CharacterID}/portrait?size=128`,
      characterId: profile.CharacterID,
      characterName: profile.CharacterName,
      corporationId: profile.CorporationID,
      allianceId: profile.AllianceID,
      scopes: profile.Scopes,
      tokenType: profile.TokenType,
      characterOwnerHash: profile.CharacterOwnerHash,
      intellectualProperty: profile.IntellectualProperty,
    }
  },
  style: {
    logo: '/brand/logos/eveonline.svg',
    logoDark: '/brand/logos/eveonline-dark.svg',
    bg: '#0066FF',
    text: '#FFFFFF',
    bgDark: '#004ECC',
    textDark: '#FFFFFF',
  },
}

// Token refresh function
export async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const response = await fetch(`${EVE_OAUTH_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${EVE_CLIENT_ID}:${EVE_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refresh_token as string,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to refresh token')
    }

    const tokens = await response.json()

    return {
      ...token,
      access_token: tokens.access_token,
      expires_at: Math.floor(Date.now() / 1000) + (tokens.expires_in || 1200),
      refresh_token: tokens.refresh_token || token.refresh_token,
    }
  } catch (error) {
    console.error('Error refreshing access token:', error)
    
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    }
  }
}

// NextAuth.js configuration
export const authConfig: NextAuthConfig = {
  providers: [eveOnlineProvider],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    signOut: '/auth/signout',
  },
  callbacks: {
    async jwt({ token, account, user }): Promise<JWT> {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          access_token: account.access_token,
          refresh_token: account.refresh_token,
          expires_at: account.expires_at,
          scope: account.scope,
          characterId: (user as any).characterId,
          characterName: (user as any).characterName,
          corporationId: (user as any).corporationId,
          allianceId: (user as any).allianceId,
          characterOwnerHash: (user as any).characterOwnerHash,
        } as JWT
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.expires_at as number) * 1000) {
        return token
      }

      // Access token has expired, try to refresh it
      return await refreshAccessToken(token)
    },
    async session({ session, token }) {
      if (token.error) {
        session.error = token.error as string
      }

      session.user = {
        ...session.user,
        id: token.sub!,
        characterId: token.characterId as number,
        characterName: token.characterName as string,
        corporationId: token.corporationId as number,
        allianceId: token.allianceId as number,
        characterOwnerHash: token.characterOwnerHash as string,
      }

      session.accessToken = token.access_token as string
      session.refreshToken = token.refresh_token as string
      session.scope = token.scope as string

      return session
    },
    async signIn({ account, profile }) {
      // Validate that we have the required EVE Online data
      if (!account || !profile) {
        return false
      }

      // Check if we have the required character data
      if (!(profile as any)['CharacterID'] || !(profile as any)['CharacterName']) {
        return false
      }

      // Validate scopes - ensure we have the minimum required scopes
      const requiredScopes = [
        'esi-characters.read_characters.v1',
        'esi-skills.read_skills.v1',
        'esi-location.read_location.v1',
      ]
      
      const grantedScopes = (profile as any)['Scopes'] || ''
      const hasRequiredScopes = requiredScopes.every(scope => 
        (grantedScopes as string).includes(scope)
      )

      if (!hasRequiredScopes) {
        return false
      }

      return true
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  events: {
    async signIn({ user, isNewUser }) {
      console.log('User signed in:', {
        userId: user.id,
        characterName: (user as any).characterName,
        isNewUser,
      })
    },
    async signOut(params) {
      if ('token' in params && params.token) {
        console.log('User signed out:', {
          userId: params.token.sub,
          characterName: params.token.characterName,
        })
      }
    },
    async session({ session }) {
      // Update last activity timestamp
      console.log('Session accessed:', {
        userId: session.user.id,
        characterName: (session.user as any).characterName,
      })
    },
  },
  debug: process.env.NODE_ENV === 'development',
}

// Type augmentation for NextAuth
declare module 'next-auth' {
  interface Session {
    accessToken?: string
    refreshToken?: string
    scope?: string
    error?: string
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      characterId: number
      characterName: string
      corporationId: number
      allianceId: number
      characterOwnerHash: string
    }
  }

  interface User {
    characterId: number
    characterName: string
    corporationId: number
    allianceId: number
    characterOwnerHash: string
    scopes: string
    tokenType: string
    intellectualProperty: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    access_token?: string
    refresh_token?: string
    expires_at?: number
    scope?: string
    characterId?: number
    characterName?: string
    corporationId?: number
    allianceId?: number
    characterOwnerHash?: string
    error?: string
  }
}

export default authConfig

import NextAuth from 'next-auth'
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)