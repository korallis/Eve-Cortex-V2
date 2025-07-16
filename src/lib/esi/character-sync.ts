/**
 * Character Data Synchronization Service
 * Handles fetching and caching character data from ESI
 */

import { esiClient } from './client'
import { characterRepository } from '@/lib/repositories/character-repository'
import { redis } from '@/lib/redis'
import type {
  ESICharacter,
  ESICharacterSkills,
  ESISkillQueueItem,
  ESIAsset,
  ESILocation,
  ESIShip,
  ESIOnline,
  ESIWallet,
  ESIClones,
  ESIImplants,
} from '@/types/esi'
import type { Character, CharacterSkill } from '@/types/database'

export interface CharacterSyncResult {
  character: Character
  skills: CharacterSkill[]
  assets: ESIAsset[]
  location: ESILocation
  ship: ESIShip | null
  online: ESIOnline
  skillQueue: ESISkillQueueItem[]
  wallet: ESIWallet
  clones: ESIClones
  implants: number[]
  syncedAt: Date
}

export class CharacterSyncService {
  private syncLockPrefix = 'character:sync:lock:'
  private syncStatusPrefix = 'character:sync:status:'
  private syncResultPrefix = 'character:sync:result:'

  /**
   * Synchronize all character data from ESI
   */
  async syncCharacter(characterId: number, accessToken: string): Promise<CharacterSyncResult> {
    // Check if sync is already in progress
    const lockKey = `${this.syncLockPrefix}${characterId}`
    const locked = await redis.set(lockKey, '1', 'EX', 300, 'NX') // 5 minute lock

    if (!locked) {
      // Check if we have recent sync results
      const recentResult = await this.getRecentSyncResult(characterId)
      if (recentResult) {
        return recentResult
      }

      throw new Error('Character sync already in progress')
    }

    try {
      // Update sync status
      await this.updateSyncStatus(characterId, 'syncing', 'Starting character synchronization')

      // Fetch all character data in parallel
      const [
        characterData,
        skillsData,
        skillQueueData,
        assetsData,
        locationData,
        shipData,
        onlineData,
        walletData,
        clonesData,
        implantsData,
      ] = await Promise.all([
        this.fetchCharacterInfo(characterId, accessToken),
        this.fetchCharacterSkills(characterId, accessToken),
        this.fetchSkillQueue(characterId, accessToken),
        this.fetchAssets(characterId, accessToken),
        this.fetchLocation(characterId, accessToken),
        this.fetchShip(characterId, accessToken),
        this.fetchOnline(characterId, accessToken),
        this.fetchWallet(characterId, accessToken),
        this.fetchClones(characterId, accessToken),
        this.fetchImplants(characterId, accessToken),
      ])

      // Update character in database
      await this.updateSyncStatus(characterId, 'syncing', 'Updating character information')
      const character = await this.updateCharacterInDatabase(
        characterId,
        characterData,
        locationData,
        walletData,
        onlineData
      )

      // Update skills in database
      await this.updateSyncStatus(characterId, 'syncing', 'Updating character skills')
      const skills = await this.updateSkillsInDatabase(characterId, skillsData)

      // Prepare sync result
      const result: CharacterSyncResult = {
        character,
        skills,
        assets: assetsData,
        location: locationData,
        ship: shipData,
        online: onlineData,
        skillQueue: skillQueueData,
        wallet: walletData,
        clones: clonesData,
        implants: implantsData,
        syncedAt: new Date(),
      }

      // Cache sync result
      await this.cacheSyncResult(characterId, result)

      // Update sync status
      await this.updateSyncStatus(characterId, 'completed', 'Character synchronization completed')

      return result
    } catch (error) {
      // Update sync status with error
      await this.updateSyncStatus(
        characterId,
        'error',
        error instanceof Error ? error.message : 'Unknown error occurred'
      )
      throw error
    } finally {
      // Release lock
      await redis.del(lockKey)
    }
  }

  /**
   * Fetch character information from ESI
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
   * Fetch character skills from ESI
   */
  private async fetchCharacterSkills(
    characterId: number,
    accessToken: string
  ): Promise<ESICharacterSkills> {
    const response = await esiClient.request<ESICharacterSkills>(
      `/characters/${characterId}/skills/`,
      accessToken
    )
    return response.data
  }

  /**
   * Fetch skill queue from ESI
   */
  private async fetchSkillQueue(
    characterId: number,
    accessToken: string
  ): Promise<ESISkillQueueItem[]> {
    const response = await esiClient.request<ESISkillQueueItem[]>(
      `/characters/${characterId}/skillqueue/`,
      accessToken
    )
    return response.data
  }

  /**
   * Fetch character assets from ESI (paginated)
   */
  private async fetchAssets(characterId: number, accessToken: string): Promise<ESIAsset[]> {
    const assets: ESIAsset[] = []

    for await (const page of esiClient.paginate<ESIAsset>(
      `/characters/${characterId}/assets/`,
      accessToken
    )) {
      assets.push(...page)
    }

    return assets
  }

  /**
   * Fetch character location from ESI
   */
  private async fetchLocation(characterId: number, accessToken: string): Promise<ESILocation> {
    const response = await esiClient.request<ESILocation>(
      `/characters/${characterId}/location/`,
      accessToken
    )
    return response.data
  }

  /**
   * Fetch character ship from ESI
   */
  private async fetchShip(characterId: number, accessToken: string): Promise<ESIShip | null> {
    try {
      const response = await esiClient.request<ESIShip>(
        `/characters/${characterId}/ship/`,
        accessToken
      )
      return response.data
    } catch (error) {
      // Character might not be in a ship (in station)
      return null
    }
  }

  /**
   * Fetch character online status from ESI
   */
  private async fetchOnline(characterId: number, accessToken: string): Promise<ESIOnline> {
    const response = await esiClient.request<ESIOnline>(
      `/characters/${characterId}/online/`,
      accessToken
    )
    return response.data
  }

  /**
   * Fetch character wallet from ESI
   */
  private async fetchWallet(characterId: number, accessToken: string): Promise<ESIWallet> {
    const response = await esiClient.request<ESIWallet>(
      `/characters/${characterId}/wallet/`,
      accessToken
    )
    return response.data
  }

  /**
   * Fetch character clones from ESI
   */
  private async fetchClones(characterId: number, accessToken: string): Promise<ESIClones> {
    const response = await esiClient.request<ESIClones>(
      `/characters/${characterId}/clones/`,
      accessToken
    )
    return response.data
  }

  /**
   * Fetch character implants from ESI
   */
  private async fetchImplants(characterId: number, accessToken: string): Promise<number[]> {
    const response = await esiClient.request<ESIImplants>(
      `/characters/${characterId}/implants/`,
      accessToken
    )
    return response.data.implants
  }

  /**
   * Update character in database
   */
  private async updateCharacterInDatabase(
    characterId: number,
    characterData: ESICharacter,
    locationData: ESILocation,
    walletData: ESIWallet,
    onlineData: ESIOnline
  ): Promise<Character> {
    // Get location name if we have a station ID
    let locationName: string | null = null
    if (locationData.station_id) {
      try {
        const stationResponse = await esiClient.publicRequest(
          `/universe/stations/${locationData.station_id}/`
        )
        locationName = (stationResponse.data as any).name
      } catch {
        // Ignore errors for location name
      }
    }

    const characterUpdate = {
      eve_character_id: characterId,
      name: characterData.name,
      corporation_id: characterData.corporation_id,
      alliance_id: characterData.alliance_id || null,
      wallet_balance: walletData.balance,
      location_id: locationData.solar_system_id,
      location_name: locationName,
      security_status: characterData.security_status || 0,
      birthday: new Date(characterData.birthday),
      last_login: onlineData.last_login ? new Date(onlineData.last_login) : null,
    }

    // Check if character exists
    const existingCharacter = await characterRepository.findByEveId(characterId)

    if (existingCharacter) {
      // Update existing character
      const updated = await characterRepository.update(existingCharacter.id, characterUpdate)
      return updated!
    } else {
      // Create new character
      return await characterRepository.create(characterUpdate)
    }
  }

  /**
   * Update skills in database
   */
  private async updateSkillsInDatabase(
    characterId: number,
    skillsData: ESICharacterSkills
  ): Promise<CharacterSkill[]> {
    // Get character from database
    const character = await characterRepository.findByEveId(characterId)
    if (!character) {
      throw new Error('Character not found in database')
    }

    // Delete existing skills
    await characterRepository.deleteSkills(character.id)

    // Insert new skills
    const skills: CharacterSkill[] = []
    for (const skill of skillsData.skills) {
      const created = await characterRepository.createSkill({
        character_id: character.id,
        skill_type_id: skill.skill_id,
        trained_skill_level: skill.trained_skill_level,
        skillpoints_in_skill: skill.skillpoints_in_skill,
        active_skill_level: skill.active_skill_level,
      })
      skills.push(created)
    }

    return skills
  }

  /**
   * Update sync status
   */
  private async updateSyncStatus(
    characterId: number,
    status: 'syncing' | 'completed' | 'error',
    message: string
  ): Promise<void> {
    const statusKey = `${this.syncStatusPrefix}${characterId}`
    const statusData = {
      status,
      message,
      timestamp: new Date().toISOString(),
    }

    await redis.set(statusKey, JSON.stringify(statusData), 'EX', 3600) // 1 hour
  }

  /**
   * Get sync status
   */
  async getSyncStatus(characterId: number): Promise<{
    status: string
    message: string
    timestamp: string
  } | null> {
    const statusKey = `${this.syncStatusPrefix}${characterId}`
    const statusData = await redis.get(statusKey)

    if (!statusData) {
      return null
    }

    return JSON.parse(statusData)
  }

  /**
   * Cache sync result
   */
  private async cacheSyncResult(characterId: number, result: CharacterSyncResult): Promise<void> {
    const resultKey = `${this.syncResultPrefix}${characterId}`
    await redis.set(resultKey, JSON.stringify(result), 'EX', 900) // 15 minutes
  }

  /**
   * Get recent sync result
   */
  private async getRecentSyncResult(characterId: number): Promise<CharacterSyncResult | null> {
    const resultKey = `${this.syncResultPrefix}${characterId}`
    const resultData = await redis.get(resultKey)

    if (!resultData) {
      return null
    }

    return JSON.parse(resultData)
  }

  /**
   * Clear sync cache for a character
   */
  async clearSyncCache(characterId: number): Promise<void> {
    const keys = [
      `${this.syncLockPrefix}${characterId}`,
      `${this.syncStatusPrefix}${characterId}`,
      `${this.syncResultPrefix}${characterId}`,
    ]

    await redis.del(...keys)
  }
}

// Export singleton instance
export const characterSyncService = new CharacterSyncService()
