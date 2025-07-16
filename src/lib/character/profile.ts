/**
 * Character Profile Service
 * Comprehensive character profile management with caching and optimization
 */

import { characterRepository } from '@/lib/repositories/character-repository'
import { characterSyncService } from '@/lib/esi/character-sync'
import { characterValidator } from './validation'
import { characterSyncScheduler } from './scheduler'
import { redis } from '@/lib/redis'
import { esiClient } from '@/lib/esi/client'
import type { Character } from '@/types/database'
import type { ESIAsset } from '@/types/esi'

export interface CharacterProfile {
  character: Character
  skills: any[]
  totalSkillPoints: number
  skillsInTraining: number
  assets: {
    total: number
    locations: Record<string, number>
    shipCount: number
    moduleCount: number
  }
  corporation: {
    id: number
    name?: string
  }
  alliance?: {
    id: number
    name?: string
  }
  location: {
    id: number | null
    name: string | null
    type: 'station' | 'system' | 'structure' | 'unknown'
  }
  wallet: {
    balance: number
    lastUpdate: Date
  }
  sync: {
    lastSync: Date | null
    status: string
    isHealthy: boolean
  }
  validation: {
    score: number
    issues: number
    warnings: number
  }
  metadata: {
    createdAt: Date
    lastActive: Date | null
    profileCompleteness: number
  }
}

export interface ProfileOptions {
  includeSkills?: boolean
  includeAssets?: boolean
  includeCorporation?: boolean
  includeAlliance?: boolean
  useCache?: boolean
  refreshCache?: boolean
}

export class CharacterProfileService {
  private profileCachePrefix = 'character:profile:'
  private assetCachePrefix = 'character:assets:'
  private corporationCachePrefix = 'corporation:info:'
  private allianceCachePrefix = 'alliance:info:'

  /**
   * Get comprehensive character profile
   */
  async getProfile(
    characterId: number,
    accessToken?: string,
    options: ProfileOptions = {}
  ): Promise<CharacterProfile> {
    const opts = {
      includeSkills: true,
      includeAssets: true,
      includeCorporation: true,
      includeAlliance: true,
      useCache: true,
      refreshCache: false,
      ...options,
    }

    // Check cache if enabled and not refreshing
    if (opts.useCache && !opts.refreshCache) {
      const cached = await this.getCachedProfile(characterId)
      if (cached) {
        return cached
      }
    }

    // Get character from database
    const character = await characterRepository.findByEveCharacterId(characterId)
    if (!character) {
      throw new Error('Character not found')
    }

    // Build profile
    const profile: CharacterProfile = {
      character,
      skills: [],
      totalSkillPoints: 0,
      skillsInTraining: 0,
      assets: {
        total: 0,
        locations: {},
        shipCount: 0,
        moduleCount: 0,
      },
      corporation: {
        id: character.corporation_id!,
      },
      location: {
        id: character.location_id,
        name: character.location_name,
        type: 'unknown',
      },
      wallet: {
        balance: character.wallet_balance,
        lastUpdate: character.updated_at,
      },
      sync: {
        lastSync: null,
        status: 'unknown',
        isHealthy: false,
      },
      validation: {
        score: 0,
        issues: 0,
        warnings: 0,
      },
      metadata: {
        createdAt: character.created_at,
        lastActive: character.last_login,
        profileCompleteness: 0,
      },
    }

    // Get skills if requested
    if (opts.includeSkills) {
      await this.enrichWithSkills(profile, characterId)
    }

    // Get assets if requested and token provided
    if (opts.includeAssets && accessToken) {
      await this.enrichWithAssets(profile, characterId, accessToken)
    }

    // Get corporation info if requested
    if (opts.includeCorporation && character.corporation_id) {
      await this.enrichWithCorporation(profile, character.corporation_id)
    }

    // Get alliance info if requested
    if (opts.includeAlliance && character.alliance_id) {
      await this.enrichWithAlliance(profile, character.alliance_id)
    }

    // Get sync status
    await this.enrichWithSyncStatus(profile, characterId)

    // Get validation info
    await this.enrichWithValidation(profile, characterId)

    // Determine location type
    await this.enrichWithLocation(profile)

    // Calculate metadata
    this.calculateMetadata(profile)

    // Cache profile if enabled
    if (opts.useCache) {
      await this.cacheProfile(characterId, profile)
    }

    return profile
  }

  /**
   * Get basic profile (minimal data for performance)
   */
  async getBasicProfile(characterId: number): Promise<Partial<CharacterProfile>> {
    const character = await characterRepository.findByEveCharacterId(characterId)
    if (!character) {
      throw new Error('Character not found')
    }

    return {
      character,
      wallet: {
        balance: character.wallet_balance,
        lastUpdate: character.updated_at,
      },
      location: {
        id: character.location_id,
        name: character.location_name,
        type: 'unknown',
      },
      metadata: {
        createdAt: character.created_at,
        lastActive: character.last_login,
        profileCompleteness: 50, // Basic profile is 50% complete
      },
    }
  }

  /**
   * Update profile data
   */
  async updateProfile(
    characterId: number,
    accessToken: string,
    updates: Partial<Character>
  ): Promise<CharacterProfile> {
    const character = await characterRepository.findByEveCharacterId(characterId)
    if (!character) {
      throw new Error('Character not found')
    }

    // Update character in database
    await characterRepository.update(character.id, updates)

    // Clear caches
    await this.clearProfileCache(characterId)

    // Return updated profile
    return this.getProfile(characterId, accessToken, { refreshCache: true })
  }

  /**
   * Enrich profile with skills data
   */
  private async enrichWithSkills(profile: CharacterProfile, characterId: number): Promise<void> {
    const character = await characterRepository.findByEveCharacterId(characterId)
    if (!character) return

    // This would fetch skills from character_skills table
    // For now, we'll use placeholder data
    profile.skills = []
    profile.totalSkillPoints = 0
    profile.skillsInTraining = 0
  }

  /**
   * Enrich profile with assets data
   */
  private async enrichWithAssets(
    profile: CharacterProfile,
    characterId: number,
    accessToken: string
  ): Promise<void> {
    try {
      // Check cache first
      const cacheKey = `${this.assetCachePrefix}${characterId}`
      let assets: ESIAsset[] = []

      const cached = await redis.get(cacheKey)
      if (cached) {
        assets = JSON.parse(cached)
      } else {
        // Fetch from ESI
        for await (const page of esiClient.paginate<ESIAsset>(
          `/characters/${characterId}/assets/`,
          accessToken
        )) {
          assets.push(...page)
        }

        // Cache for 15 minutes
        await redis.set(cacheKey, JSON.stringify(assets), 'EX', 900)
      }

      // Analyze assets
      const locations: Record<string, number> = {}
      let shipCount = 0
      let moduleCount = 0

      for (const asset of assets) {
        const locationKey = `${asset.location_id}`
        locations[locationKey] = (locations[locationKey] || 0) + asset.quantity

        // Simple categorization based on common type IDs
        // This would be more sophisticated with actual SDE data
        if (asset.type_id >= 24692 && asset.type_id <= 49752) {
          shipCount += asset.quantity
        } else if (asset.type_id >= 1 && asset.type_id <= 100000) {
          moduleCount += asset.quantity
        }
      }

      profile.assets = {
        total: assets.length,
        locations,
        shipCount,
        moduleCount,
      }
    } catch (error) {
      // Failed to fetch assets, use empty data
      profile.assets = {
        total: 0,
        locations: {},
        shipCount: 0,
        moduleCount: 0,
      }
    }
  }

  /**
   * Enrich profile with corporation data
   */
  private async enrichWithCorporation(
    profile: CharacterProfile,
    corporationId: number
  ): Promise<void> {
    const cacheKey = `${this.corporationCachePrefix}${corporationId}`

    try {
      let corporationName: string | undefined

      // Check cache
      const cached = await redis.get(cacheKey)
      if (cached) {
        const data = JSON.parse(cached)
        corporationName = data.name
      } else {
        // Fetch from ESI
        const response = await esiClient.publicRequest(`/corporations/${corporationId}/`)
        const corporationData = response.data as any
        corporationName = corporationData.name as string

        // Cache for 24 hours
        await redis.set(cacheKey, JSON.stringify(corporationData), 'EX', 86400)
      }

      if (corporationName) {
        profile.corporation.name = corporationName
      }
    } catch (error) {
      // Failed to fetch corporation info, keep ID only
    }
  }

  /**
   * Enrich profile with alliance data
   */
  private async enrichWithAlliance(profile: CharacterProfile, allianceId: number): Promise<void> {
    const cacheKey = `${this.allianceCachePrefix}${allianceId}`

    try {
      let allianceName: string | undefined

      // Check cache
      const cached = await redis.get(cacheKey)
      if (cached) {
        const data = JSON.parse(cached)
        allianceName = data.name
      } else {
        // Fetch from ESI
        const response = await esiClient.publicRequest(`/alliances/${allianceId}/`)
        const allianceData = response.data as any
        allianceName = allianceData.name

        // Cache for 24 hours
        await redis.set(cacheKey, JSON.stringify(allianceData), 'EX', 86400)
      }

      if (allianceName) {
        profile.alliance = {
          id: allianceId,
          name: allianceName,
        }
      }
    } catch (error) {
      // Failed to fetch alliance info
    }
  }

  /**
   * Enrich profile with sync status
   */
  private async enrichWithSyncStatus(
    profile: CharacterProfile,
    characterId: number
  ): Promise<void> {
    const syncStatus = await characterSyncService.getSyncStatus(characterId)
    const schedule = await characterSyncScheduler.getSchedule(characterId)

    profile.sync = {
      lastSync: syncStatus?.timestamp ? new Date(syncStatus.timestamp) : null,
      status: syncStatus?.status || 'never_synced',
      isHealthy: syncStatus?.status === 'completed' && schedule?.enabled === true,
    }
  }

  /**
   * Enrich profile with validation data
   */
  private async enrichWithValidation(
    profile: CharacterProfile,
    characterId: number
  ): Promise<void> {
    try {
      const validation = await characterValidator.validateCharacter(characterId)
      profile.validation = {
        score: validation.score,
        issues: validation.errors.length,
        warnings: validation.warnings.length,
      }
    } catch (error) {
      profile.validation = {
        score: 0,
        issues: 1,
        warnings: 0,
      }
    }
  }

  /**
   * Enrich profile with location type
   */
  private async enrichWithLocation(profile: CharacterProfile): Promise<void> {
    if (!profile.location.id) {
      profile.location.type = 'unknown'
      return
    }

    // Determine location type based on ID ranges
    // This is simplified - would use SDE data in production
    const locationId = profile.location.id

    if (locationId >= 60000000 && locationId <= 64000000) {
      profile.location.type = 'station'
    } else if (locationId >= 30000000 && locationId <= 33000000) {
      profile.location.type = 'system'
    } else if (locationId >= 1000000000000) {
      profile.location.type = 'structure'
    } else {
      profile.location.type = 'unknown'
    }
  }

  /**
   * Calculate profile metadata
   */
  private calculateMetadata(profile: CharacterProfile): void {
    let completeness = 0

    // Basic data (30%)
    if (profile.character.name) completeness += 10
    if (profile.character.corporation_id) completeness += 10
    if (profile.character.wallet_balance !== undefined) completeness += 10

    // Skills data (20%)
    if (profile.skills.length > 0) completeness += 20

    // Assets data (20%)
    if (profile.assets.total > 0) completeness += 20

    // Location data (10%)
    if (profile.location.id && profile.location.name) completeness += 10

    // Sync health (10%)
    if (profile.sync.isHealthy) completeness += 10

    // Validation score (10%)
    if (profile.validation.score > 80) completeness += 10

    profile.metadata.profileCompleteness = completeness
  }

  /**
   * Cache profile data
   */
  private async cacheProfile(characterId: number, profile: CharacterProfile): Promise<void> {
    const cacheKey = `${this.profileCachePrefix}${characterId}`
    await redis.set(cacheKey, JSON.stringify(profile), 'EX', 1800) // 30 minutes
  }

  /**
   * Get cached profile
   */
  private async getCachedProfile(characterId: number): Promise<CharacterProfile | null> {
    const cacheKey = `${this.profileCachePrefix}${characterId}`
    const cached = await redis.get(cacheKey)

    if (!cached) {
      return null
    }

    const profile = JSON.parse(cached) as CharacterProfile

    // Convert date strings back to Date objects
    profile.character.created_at = new Date(profile.character.created_at)
    profile.character.updated_at = new Date(profile.character.updated_at)
    if (profile.character.birthday) {
      profile.character.birthday = new Date(profile.character.birthday)
    }
    if (profile.character.last_login) {
      profile.character.last_login = new Date(profile.character.last_login)
    }
    if (profile.sync.lastSync) {
      profile.sync.lastSync = new Date(profile.sync.lastSync)
    }
    profile.wallet.lastUpdate = new Date(profile.wallet.lastUpdate)
    profile.metadata.createdAt = new Date(profile.metadata.createdAt)
    if (profile.metadata.lastActive) {
      profile.metadata.lastActive = new Date(profile.metadata.lastActive)
    }

    return profile
  }

  /**
   * Clear profile cache
   */
  async clearProfileCache(characterId: number): Promise<void> {
    const cacheKey = `${this.profileCachePrefix}${characterId}`
    await redis.del(cacheKey)
  }

  /**
   * Get profile summary for multiple characters
   */
  async getProfileSummaries(
    characterIds: number[]
  ): Promise<Record<number, Partial<CharacterProfile>>> {
    const summaries: Record<number, Partial<CharacterProfile>> = {}

    for (const characterId of characterIds) {
      try {
        const basic = await this.getBasicProfile(characterId)
        summaries[characterId] = basic
      } catch (error) {
        summaries[characterId] = {
          metadata: {
            createdAt: new Date(),
            lastActive: null,
            profileCompleteness: 0,
          },
        }
      }
    }

    return summaries
  }
}

// Export singleton instance
export const characterProfileService = new CharacterProfileService()
