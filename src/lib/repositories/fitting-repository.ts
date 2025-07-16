/**
 * Fitting Repository
 * Handles ship fitting-related database operations
 */

import { sql } from '@/lib/database'
import { BaseRepository } from './base-repository'
import type { Fitting, FittingRepository, CareerPath } from '@/types/database'

export class FittingRepositoryImpl extends BaseRepository<Fitting> implements FittingRepository {
  protected tableName = 'fittings'

  /**
   * Find fittings by character ID
   */
  async findByCharacterId(characterId: number): Promise<Fitting[]> {
    try {
      const result = await sql`
        SELECT * FROM fittings 
        WHERE character_id = ${characterId}
        ORDER BY updated_at DESC
      `
      return result as Fitting[]
    } catch (error) {
      console.error('Error finding fittings by character ID:', error)
      throw error
    }
  }

  /**
   * Find fittings by ship type ID
   */
  async findByShipTypeId(shipTypeId: number): Promise<Fitting[]> {
    try {
      const result = await sql`
        SELECT * FROM fittings 
        WHERE ship_type_id = ${shipTypeId}
        ORDER BY updated_at DESC
      `
      return result as Fitting[]
    } catch (error) {
      console.error('Error finding fittings by ship type ID:', error)
      throw error
    }
  }

  /**
   * Find fittings by career path
   */
  async findByCareerPath(careerPath: CareerPath): Promise<Fitting[]> {
    try {
      const result = await sql`
        SELECT * FROM fittings 
        WHERE career_path = ${careerPath}
        ORDER BY updated_at DESC
      `
      return result as Fitting[]
    } catch (error) {
      console.error('Error finding fittings by career path:', error)
      throw error
    }
  }

  /**
   * Find public fittings
   */
  async findPublicFittings(): Promise<Fitting[]> {
    try {
      const result = await sql`
        SELECT * FROM fittings 
        WHERE is_public = TRUE
        ORDER BY updated_at DESC
      `
      return result as Fitting[]
    } catch (error) {
      console.error('Error finding public fittings:', error)
      throw error
    }
  }

  /**
   * Find fittings by tags
   */
  async findByTags(tags: string[]): Promise<Fitting[]> {
    try {
      const result = await sql`
        SELECT * FROM fittings 
        WHERE tags && ${tags}
        ORDER BY updated_at DESC
      `
      return result as Fitting[]
    } catch (error) {
      console.error('Error finding fittings by tags:', error)
      throw error
    }
  }

  /**
   * Find fittings by ship type and career path
   */
  async findByShipTypeAndCareer(shipTypeId: number, careerPath: CareerPath): Promise<Fitting[]> {
    try {
      const result = await sql`
        SELECT * FROM fittings 
        WHERE ship_type_id = ${shipTypeId} AND career_path = ${careerPath}
        ORDER BY updated_at DESC
      `
      return result as Fitting[]
    } catch (error) {
      console.error('Error finding fittings by ship type and career:', error)
      throw error
    }
  }

  /**
   * Search fittings by name
   */
  async searchByName(searchTerm: string): Promise<Fitting[]> {
    try {
      const result = await sql`
        SELECT * FROM fittings 
        WHERE name ILIKE ${'%' + searchTerm + '%'}
        ORDER BY updated_at DESC
      `
      return result as Fitting[]
    } catch (error) {
      console.error('Error searching fittings by name:', error)
      throw error
    }
  }

  /**
   * Get fitting statistics
   */
  async getFittingStats(): Promise<{
    totalFittings: number
    publicFittings: number
    fittingsByCareerPath: Record<CareerPath, number>
    averagePerformanceData: {
      dps: number
      ehp: number
      speed: number
      cost: number
    }
  }> {
    try {
      const result = await sql`
        SELECT 
          COUNT(*) as total_fittings,
          COUNT(CASE WHEN is_public = TRUE THEN 1 END) as public_fittings,
          COUNT(CASE WHEN career_path = 'missions' THEN 1 END) as missions,
          COUNT(CASE WHEN career_path = 'pvp' THEN 1 END) as pvp,
          COUNT(CASE WHEN career_path = 'mining' THEN 1 END) as mining,
          COUNT(CASE WHEN career_path = 'exploration' THEN 1 END) as exploration,
          COUNT(CASE WHEN career_path = 'trading' THEN 1 END) as trading,
          COUNT(CASE WHEN career_path = 'industrial' THEN 1 END) as industrial,
          COUNT(CASE WHEN career_path = 'general' THEN 1 END) as general,
          AVG((performance_data->>'dps')::numeric) as avg_dps,
          AVG((performance_data->>'ehp')::numeric) as avg_ehp,
          AVG((performance_data->>'speed')::numeric) as avg_speed,
          AVG((performance_data->>'cost_estimate')::numeric) as avg_cost
        FROM fittings
        WHERE performance_data IS NOT NULL
      `
      
      if (result.length === 0) {
        return {
          totalFittings: 0,
          publicFittings: 0,
          fittingsByCareerPath: {
            missions: 0,
            pvp: 0,
            mining: 0,
            exploration: 0,
            trading: 0,
            industrial: 0,
            general: 0
          },
          averagePerformanceData: {
            dps: 0,
            ehp: 0,
            speed: 0,
            cost: 0
          }
        }
      }
      
      const stats = result[0]
      return {
        totalFittings: parseInt(stats.total_fittings) || 0,
        publicFittings: parseInt(stats.public_fittings) || 0,
        fittingsByCareerPath: {
          missions: parseInt(stats.missions) || 0,
          pvp: parseInt(stats.pvp) || 0,
          mining: parseInt(stats.mining) || 0,
          exploration: parseInt(stats.exploration) || 0,
          trading: parseInt(stats.trading) || 0,
          industrial: parseInt(stats.industrial) || 0,
          general: parseInt(stats.general) || 0
        },
        averagePerformanceData: {
          dps: parseFloat(stats.avg_dps) || 0,
          ehp: parseFloat(stats.avg_ehp) || 0,
          speed: parseFloat(stats.avg_speed) || 0,
          cost: parseFloat(stats.avg_cost) || 0
        }
      }
    } catch (error) {
      console.error('Error getting fitting stats:', error)
      throw error
    }
  }

  /**
   * Update performance data for a fitting
   */
  async updatePerformanceData(id: number, performanceData: any): Promise<Fitting> {
    try {
      const result = await sql`
        UPDATE fittings 
        SET performance_data = ${performanceData}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      
      if (result.length === 0) {
        throw new Error(`Fitting with ID ${id} not found`)
      }
      
      return result[0] as Fitting
    } catch (error) {
      console.error('Error updating performance data:', error)
      throw error
    }
  }

  /**
   * Toggle public status of a fitting
   */
  async togglePublic(id: number): Promise<Fitting> {
    try {
      const result = await sql`
        UPDATE fittings 
        SET is_public = NOT is_public, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      
      if (result.length === 0) {
        throw new Error(`Fitting with ID ${id} not found`)
      }
      
      return result[0] as Fitting
    } catch (error) {
      console.error('Error toggling public status:', error)
      throw error
    }
  }

  /**
   * Add tags to a fitting
   */
  async addTags(id: number, tags: string[]): Promise<Fitting> {
    try {
      const result = await sql`
        UPDATE fittings 
        SET tags = array_cat(tags, ${tags}), updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      
      if (result.length === 0) {
        throw new Error(`Fitting with ID ${id} not found`)
      }
      
      return result[0] as Fitting
    } catch (error) {
      console.error('Error adding tags:', error)
      throw error
    }
  }

  /**
   * Remove tags from a fitting
   */
  async removeTags(id: number, tags: string[]): Promise<Fitting> {
    try {
      const result = await sql`
        UPDATE fittings 
        SET tags = array_remove_all(tags, ${tags}), updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      
      if (result.length === 0) {
        throw new Error(`Fitting with ID ${id} not found`)
      }
      
      return result[0] as Fitting
    } catch (error) {
      console.error('Error removing tags:', error)
      throw error
    }
  }
}

// Export singleton instance
export const fittingRepository = new FittingRepositoryImpl()