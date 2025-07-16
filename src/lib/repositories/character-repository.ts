/**
 * Character Repository
 * Handles character data operations
 */

import { sql } from '@/lib/database'
import { BaseRepository } from './base-repository'
import type { Character } from '@/types/database'

export class CharacterRepository extends BaseRepository<Character> {
  protected tableName = 'characters'

  /**
   * Find character by EVE character ID
   */
  async findByEveCharacterId(eveCharacterId: number): Promise<Character | null> {
    try {
      const result = await sql`
        SELECT * FROM characters 
        WHERE eve_character_id = ${eveCharacterId}
      `
      return (result[0] as Character) || null
    } catch (error) {
      console.error('Error finding character by EVE character ID:', error)
      throw error
    }
  }

  /**
   * Find characters by corporation ID
   */
  async findByCorporationId(corporationId: number): Promise<Character[]> {
    try {
      const result = await sql`
        SELECT * FROM characters 
        WHERE corporation_id = ${corporationId}
        ORDER BY name ASC
      `
      return result as unknown as Character[]
    } catch (error) {
      console.error('Error finding characters by corporation ID:', error)
      throw error
    }
  }

  /**
   * Find characters by alliance ID
   */
  async findByAllianceId(allianceId: number): Promise<Character[]> {
    try {
      const result = await sql`
        SELECT * FROM characters 
        WHERE alliance_id = ${allianceId}
        ORDER BY name ASC
      `
      return result as unknown as Character[]
    } catch (error) {
      console.error('Error finding characters by alliance ID:', error)
      throw error
    }
  }

  /**
   * Update character wallet balance
   */
  async updateWalletBalance(characterId: number, balance: number): Promise<Character | null> {
    try {
      const result = await sql`
        UPDATE characters 
        SET wallet_balance = ${balance}, updated_at = NOW()
        WHERE id = ${characterId}
        RETURNING *
      `
      return (result[0] as Character) || null
    } catch (error) {
      console.error('Error updating wallet balance:', error)
      throw error
    }
  }

  /**
   * Update character location
   */
  async updateLocation(
    characterId: number,
    locationId: number,
    locationName: string
  ): Promise<Character | null> {
    try {
      const result = await sql`
        UPDATE characters 
        SET location_id = ${locationId}, location_name = ${locationName}, updated_at = NOW()
        WHERE id = ${characterId}
        RETURNING *
      `
      return (result[0] as Character) || null
    } catch (error) {
      console.error('Error updating character location:', error)
      throw error
    }
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(characterId: number): Promise<Character | null> {
    try {
      const result = await sql`
        UPDATE characters 
        SET last_login = NOW(), updated_at = NOW()
        WHERE id = ${characterId}
        RETURNING *
      `
      return (result[0] as Character) || null
    } catch (error) {
      console.error('Error updating last login:', error)
      throw error
    }
  }

  /**
   * Find character by EVE ID (alias for findByEveCharacterId)
   */
  async findByEveId(eveCharacterId: number): Promise<Character | null> {
    return this.findByEveCharacterId(eveCharacterId)
  }

  /**
   * Delete all skills for a character
   */
  async deleteSkills(characterId: number): Promise<void> {
    try {
      await sql`
        DELETE FROM character_skills 
        WHERE character_id = ${characterId}
      `
    } catch (error) {
      console.error('Error deleting character skills:', error)
      throw error
    }
  }

  /**
   * Create a new skill for a character
   */
  async createSkill(skill: {
    character_id: number
    skill_type_id: number
    trained_skill_level: number
    skillpoints_in_skill: number
    active_skill_level: number
  }): Promise<any> {
    try {
      const result = await sql`
        INSERT INTO character_skills (
          character_id,
          skill_type_id,
          trained_skill_level,
          skillpoints_in_skill,
          active_skill_level,
          created_at,
          updated_at
        ) VALUES (
          ${skill.character_id},
          ${skill.skill_type_id},
          ${skill.trained_skill_level},
          ${skill.skillpoints_in_skill},
          ${skill.active_skill_level},
          NOW(),
          NOW()
        )
        RETURNING *
      `
      return result[0]
    } catch (error) {
      console.error('Error creating character skill:', error)
      throw error
    }
  }

  /**
   * Get character statistics
   */
  async getCharacterStats() {
    try {
      const result = await sql`
        SELECT 
          COUNT(*) as total_characters,
          COUNT(CASE WHEN last_login > NOW() - INTERVAL '7 days' THEN 1 END) as active_characters,
          AVG(wallet_balance) as average_wallet_balance,
          MAX(wallet_balance) as richest_character,
          COUNT(DISTINCT corporation_id) as unique_corporations,
          COUNT(DISTINCT alliance_id) as unique_alliances
        FROM characters
      `

      return {
        totalCharacters: parseInt(result[0]?.['total_characters'] || '0'),
        activeCharacters: parseInt(result[0]?.['active_characters'] || '0'),
        averageWalletBalance: parseFloat(result[0]?.['average_wallet_balance'] || '0'),
        richestCharacter: parseFloat(result[0]?.['richest_character'] || '0'),
        uniqueCorporations: parseInt(result[0]?.['unique_corporations'] || '0'),
        uniqueAlliances: parseInt(result[0]?.['unique_alliances'] || '0'),
      }
    } catch (error) {
      console.error('Error getting character statistics:', error)
      throw error
    }
  }
}

// Export singleton instance
export const characterRepository = new CharacterRepository()
