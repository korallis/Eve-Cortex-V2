/**
 * Character Repository
 * Handles character-related database operations
 */

import { sql } from '@/lib/database'
import { BaseRepository } from './base-repository'
import type { Character, CharacterRepository } from '@/types/database'

export class CharacterRepositoryImpl extends BaseRepository<Character> implements CharacterRepository {
  protected tableName = 'characters'

  /**
   * Find character by EVE Online character ID
   */
  async findByEveId(eveId: number): Promise<Character | null> {
    try {
      const result = await sql`
        SELECT * FROM characters WHERE eve_character_id = ${eveId}
      `
      return result[0] as Character || null
    } catch (error) {
      console.error('Error finding character by EVE ID:', error)
      throw error
    }
  }

  /**
   * Find character by name
   */
  async findByName(name: string): Promise<Character | null> {
    try {
      const result = await sql`
        SELECT * FROM characters WHERE LOWER(name) = LOWER(${name})
      `
      return result[0] as Character || null
    } catch (error) {
      console.error('Error finding character by name:', error)
      throw error
    }
  }

  /**
   * Update wallet balance
   */
  async updateWalletBalance(id: number, balance: number): Promise<Character> {
    try {
      const result = await sql`
        UPDATE characters 
        SET wallet_balance = ${balance}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      
      if (result.length === 0) {
        throw new Error(`Character with ID ${id} not found`)
      }
      
      return result[0] as Character
    } catch (error) {
      console.error('Error updating wallet balance:', error)
      throw error
    }
  }

  /**
   * Update character location
   */
  async updateLocation(id: number, locationId: number, locationName: string): Promise<Character> {
    try {
      const result = await sql`
        UPDATE characters 
        SET location_id = ${locationId}, location_name = ${locationName}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      
      if (result.length === 0) {
        throw new Error(`Character with ID ${id} not found`)
      }
      
      return result[0] as Character
    } catch (error) {
      console.error('Error updating character location:', error)
      throw error
    }
  }

  /**
   * Find characters by corporation
   */
  async findByCorporation(corporationId: number): Promise<Character[]> {
    try {
      const result = await sql`
        SELECT * FROM characters 
        WHERE corporation_id = ${corporationId}
        ORDER BY name
      `
      return result as unknown as Character[]
    } catch (error) {
      console.error('Error finding characters by corporation:', error)
      throw error
    }
  }

  /**
   * Find characters by alliance
   */
  async findByAlliance(allianceId: number): Promise<Character[]> {
    try {
      const result = await sql`
        SELECT * FROM characters 
        WHERE alliance_id = ${allianceId}
        ORDER BY name
      `
      return result as unknown as Character[]
    } catch (error) {
      console.error('Error finding characters by alliance:', error)
      throw error
    }
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: number): Promise<Character> {
    try {
      const result = await sql`
        UPDATE characters 
        SET last_login = NOW(), updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      
      if (result.length === 0) {
        throw new Error(`Character with ID ${id} not found`)
      }
      
      return result[0] as Character
    } catch (error) {
      console.error('Error updating last login:', error)
      throw error
    }
  }

  /**
   * Get character statistics
   */
  async getCharacterStats(id: number): Promise<{
    totalSkills: number
    totalSkillpoints: number
    averageSkillLevel: number
    totalFittings: number
    totalSkillPlans: number
  }> {
    try {
      const result = await sql`
        SELECT 
          COUNT(cs.id) as total_skills,
          SUM(cs.skillpoints_in_skill) as total_skillpoints,
          AVG(cs.trained_skill_level) as average_skill_level,
          COUNT(DISTINCT f.id) as total_fittings,
          COUNT(DISTINCT sp.id) as total_skill_plans
        FROM characters c
        LEFT JOIN character_skills cs ON c.id = cs.character_id
        LEFT JOIN fittings f ON c.id = f.character_id
        LEFT JOIN skill_plans sp ON c.id = sp.character_id
        WHERE c.id = ${id}
        GROUP BY c.id
      `
      
      if (result.length === 0) {
        throw new Error(`Character with ID ${id} not found`)
      }
      
      const stats = result[0]
      return {
        totalSkills: parseInt(stats?.['total_skills']) || 0,
        totalSkillpoints: parseInt(stats?.['total_skillpoints']) || 0,
        averageSkillLevel: parseFloat(stats?.['average_skill_level']) || 0,
        totalFittings: parseInt(stats?.['total_fittings']) || 0,
        totalSkillPlans: parseInt(stats?.['total_skill_plans']) || 0
      }
    } catch (error) {
      console.error('Error getting character stats:', error)
      throw error
    }
  }
}

// Export singleton instance
export const characterRepository = new CharacterRepositoryImpl()