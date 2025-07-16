/**
 * Character Data Management System
 * Handles character registration, synchronization, and data management
 */

import { characterRepository } from '@/lib/repositories/character-repository'
import { characterSyncService } from '@/lib/esi/character-sync'
import { redis } from '@/lib/redis'
import { esiClient } from '@/lib/esi/client'
import type { Character } from '@/types/database'
import type { ESICharacter } from '@/types/esi'

export interface CharacterManagerOptions {
  autoSync?: boolean
  syncInterval?: number // in minutes
  maxSyncRetries?: number
}

export class CharacterManager {
  private syncSchedulerPrefix = 'character:sync:scheduler:'
  private validationPrefix = 'character:validation:'
  private options: Required<CharacterManagerOptions>

  constructor(options: CharacterManagerOptions = {}) {
    this.options = {
      autoSync: true,
      syncInterval: 60, // 1 hour default
      maxSyncRetries: 3,
      ...options,
    }
  }

  /**
   * Register a new character or update existing
   */
  async registerCharacter(
    characterId: number,
    accessToken: string
  ): Promise<{ character: Character; isNew: boolean }> {
    // Fetch character info from ESI
    const esiCharacter = await this.fetchCharacterInfo(characterId, accessToken)

    // Validate character data
    await this.validateCharacterData(characterId, esiCharacter)

    // Check if character already exists
    const existingCharacter = await characterRepository.findByEveCharacterId(characterId)

    if (existingCharacter) {
      // Update existing character
      const updated = await characterRepository.update(existingCharacter.id, {
        name: esiCharacter.name,
        corporation_id: esiCharacter.corporation_id,
        alliance_id: esiCharacter.alliance_id || null,
        security_status: esiCharacter.security_status || 0,
        birthday: esiCharacter.birthday ? new Date(esiCharacter.birthday) : null,
      })

      // Trigger initial sync if auto-sync is enabled
      if (this.options.autoSync) {
        this.scheduleSync(characterId, accessToken, 0) // Immediate sync
      }

      return { character: updated!, isNew: false }
    } else {
      // Create new character
      const newCharacter = await characterRepository.create({
        eve_character_id: characterId,
        name: esiCharacter.name,
        corporation_id: esiCharacter.corporation_id,
        alliance_id: esiCharacter.alliance_id || null,
        wallet_balance: 0,
        location_id: null,
        location_name: null,
        security_status: esiCharacter.security_status || 0,
        birthday: esiCharacter.birthday ? new Date(esiCharacter.birthday) : null,
        last_login: null,
      })

      // Trigger initial sync if auto-sync is enabled
      if (this.options.autoSync) {
        this.scheduleSync(characterId, accessToken, 0) // Immediate sync
      }

      return { character: newCharacter, isNew: true }
    }
  }

  /**
   * Synchronize character data
   */
  async syncCharacterData(characterId: number, accessToken: string): Promise<void> {
    try {
      // Perform sync using the sync service
      await characterSyncService.syncCharacter(characterId, accessToken)

      // Schedule next sync if auto-sync is enabled
      if (this.options.autoSync) {
        this.scheduleSync(characterId, accessToken, this.options.syncInterval)
      }
    } catch (error) {
      // Handle sync errors
      await this.handleSyncError(characterId, error)
      throw error
    }
  }

  /**
   * Get character sync status
   */
  async getSyncStatus(characterId: number) {
    return characterSyncService.getSyncStatus(characterId)
  }

  /**
   * Schedule character sync
   */
  private async scheduleSync(
    characterId: number,
    accessToken: string,
    delayMinutes: number
  ): Promise<void> {
    const schedulerKey = `${this.syncSchedulerPrefix}${characterId}`
    const scheduleData = {
      characterId,
      accessToken,
      scheduledAt: new Date().toISOString(),
      nextSync: new Date(Date.now() + delayMinutes * 60 * 1000).toISOString(),
    }

    // Store schedule data with TTL
    await redis.set(
      schedulerKey,
      JSON.stringify(scheduleData),
      'EX',
      delayMinutes * 60 + 300 // Add 5 minutes buffer
    )

    // Note: In a production environment, this would trigger a background job
    // For now, we'll use setTimeout for demonstration
    if (delayMinutes === 0) {
      // Immediate sync
      setImmediate(() => {
        this.syncCharacterData(characterId, accessToken).catch(error => {
          console.error(`Failed to sync character ${characterId}:`, error)
        })
      })
    } else {
      // Scheduled sync
      setTimeout(
        () => {
          this.syncCharacterData(characterId, accessToken).catch(error => {
            console.error(`Failed to sync character ${characterId}:`, error)
          })
        },
        delayMinutes * 60 * 1000
      )
    }
  }

  /**
   * Cancel scheduled sync
   */
  async cancelScheduledSync(characterId: number): Promise<void> {
    const schedulerKey = `${this.syncSchedulerPrefix}${characterId}`
    await redis.del(schedulerKey)
  }

  /**
   * Get scheduled sync info
   */
  async getScheduledSync(characterId: number) {
    const schedulerKey = `${this.syncSchedulerPrefix}${characterId}`
    const data = await redis.get(schedulerKey)
    return data ? JSON.parse(data) : null
  }

  /**
   * Fetch character info from ESI
   */
  private async fetchCharacterInfo(
    characterId: number,
    accessToken: string
  ): Promise<ESICharacter> {
    const response = await esiClient.request<ESICharacter>(
      `/characters/${characterId}/`,
      accessToken
    )
    return response.data
  }

  /**
   * Validate character data
   */
  private async validateCharacterData(characterId: number, character: ESICharacter): Promise<void> {
    const validationKey = `${this.validationPrefix}${characterId}`
    const validationResult = {
      valid: true,
      errors: [] as string[],
      warnings: [] as string[],
      validatedAt: new Date().toISOString(),
    }

    // Validate required fields
    if (!character.name) {
      validationResult.valid = false
      validationResult.errors.push('Character name is required')
    }

    if (!character.corporation_id) {
      validationResult.valid = false
      validationResult.errors.push('Corporation ID is required')
    }

    // Validate data integrity
    if (
      character.security_status &&
      (character.security_status < -10 || character.security_status > 10)
    ) {
      validationResult.warnings.push('Security status outside normal range')
    }

    // Store validation result
    await redis.set(validationKey, JSON.stringify(validationResult), 'EX', 3600) // 1 hour

    if (!validationResult.valid) {
      throw new Error(`Character validation failed: ${validationResult.errors.join(', ')}`)
    }
  }

  /**
   * Handle sync errors with retry logic
   */
  private async handleSyncError(characterId: number, error: unknown): Promise<void> {
    const errorKey = `character:sync:error:${characterId}`
    const errorCountKey = `character:sync:error:count:${characterId}`

    // Get current error count
    const errorCount = await redis.incr(errorCountKey)
    await redis.expire(errorCountKey, 86400) // 24 hours

    // Store error details
    const errorData = {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      attemptNumber: errorCount,
    }

    await redis.set(errorKey, JSON.stringify(errorData), 'EX', 86400) // 24 hours

    // Log error for monitoring
    console.error(`Character sync error for ${characterId}:`, errorData)
  }

  /**
   * Get character statistics
   */
  async getCharacterStatistics() {
    return characterRepository.getCharacterStats()
  }

  /**
   * Update character skills tracking
   */
  async updateCharacterSkills(characterId: number, accessToken: string): Promise<void> {
    const character = await characterRepository.findByEveCharacterId(characterId)
    if (!character) {
      throw new Error('Character not found')
    }

    // Fetch latest skills from ESI
    const response = await esiClient.request(`/characters/${characterId}/skills/`, accessToken)
    const skillsData = response.data as any

    // Delete existing skills
    await characterRepository.deleteSkills(character.id)

    // Insert updated skills
    for (const skill of skillsData.skills) {
      await characterRepository.createSkill({
        character_id: character.id,
        skill_type_id: skill.skill_id,
        trained_skill_level: skill.trained_skill_level,
        skillpoints_in_skill: skill.skillpoints_in_skill,
        active_skill_level: skill.active_skill_level,
      })
    }
  }

  /**
   * Update character assets
   */
  async updateCharacterAssets(characterId: number, accessToken: string): Promise<void> {
    // This would integrate with the asset tracking service
    // For now, we'll just fetch and cache the data
    const assets = []
    for await (const page of esiClient.paginate(
      `/characters/${characterId}/assets/`,
      accessToken
    )) {
      assets.push(...page)
    }

    // Cache assets data
    const assetKey = `character:assets:${characterId}`
    await redis.set(assetKey, JSON.stringify(assets), 'EX', 900) // 15 minutes
  }

  /**
   * Update character location
   */
  async updateCharacterLocation(characterId: number, accessToken: string): Promise<void> {
    const character = await characterRepository.findByEveCharacterId(characterId)
    if (!character) {
      throw new Error('Character not found')
    }

    // Fetch location from ESI
    const response = await esiClient.request(`/characters/${characterId}/location/`, accessToken)
    const location = response.data as any

    // Get location name
    let locationName: string | null = null
    if (location.station_id) {
      try {
        const stationResponse = await esiClient.publicRequest(
          `/universe/stations/${location.station_id}/`
        )
        locationName = (stationResponse.data as any).name
      } catch {
        // Ignore errors for location name
      }
    }

    // Update location in database
    await characterRepository.updateLocation(
      character.id,
      location.solar_system_id,
      locationName || `System ${location.solar_system_id}`
    )
  }

  /**
   * Update wallet balance
   */
  async updateWalletBalance(characterId: number, accessToken: string): Promise<void> {
    const character = await characterRepository.findByEveCharacterId(characterId)
    if (!character) {
      throw new Error('Character not found')
    }

    // Fetch wallet from ESI
    const response = await esiClient.request(`/characters/${characterId}/wallet/`, accessToken)
    const wallet = response.data as any

    // Update wallet in database
    await characterRepository.updateWalletBalance(character.id, wallet.balance)
  }

  /**
   * Perform data integrity check
   */
  async performIntegrityCheck(characterId: number): Promise<{
    valid: boolean
    issues: string[]
  }> {
    const character = await characterRepository.findByEveCharacterId(characterId)
    if (!character) {
      return { valid: false, issues: ['Character not found in database'] }
    }

    const issues: string[] = []

    // Check for missing required fields
    if (!character.name) {
      issues.push('Character name is missing')
    }

    if (!character.corporation_id) {
      issues.push('Corporation ID is missing')
    }

    // Check for data consistency
    if (character.security_status < -10 || character.security_status > 10) {
      issues.push('Security status is out of valid range')
    }

    if (character.wallet_balance < 0) {
      issues.push('Wallet balance is negative')
    }

    // Check last sync time
    const syncStatus = await this.getSyncStatus(character.eve_character_id)
    if (!syncStatus) {
      issues.push('Character has never been synchronized')
    } else {
      const lastSync = new Date(syncStatus.timestamp)
      const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60)
      if (hoursSinceSync > 24) {
        issues.push(`Character data is ${Math.floor(hoursSinceSync)} hours old`)
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    }
  }
}

// Export singleton instance
export const characterManager = new CharacterManager()
