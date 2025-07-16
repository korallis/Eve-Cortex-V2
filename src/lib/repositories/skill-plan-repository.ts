/**
 * Skill Plan Repository
 * Handles skill plan-related database operations
 */

import { sql } from '@/lib/database'
import { BaseRepository } from './base-repository'
import type { SkillPlan, SkillPlanRepository, CareerPath } from '@/types/database'

export class SkillPlanRepositoryImpl extends BaseRepository<SkillPlan> implements SkillPlanRepository {
  protected tableName = 'skill_plans'

  /**
   * Find skill plans by character ID
   */
  async findByCharacterId(characterId: number): Promise<SkillPlan[]> {
    try {
      const result = await sql`
        SELECT * FROM skill_plans 
        WHERE character_id = ${characterId}
        ORDER BY priority DESC, created_at DESC
      `
      return result as SkillPlan[]
    } catch (error) {
      console.error('Error finding skill plans by character ID:', error)
      throw error
    }
  }

  /**
   * Find active skill plans by character ID
   */
  async findActiveByCharacterId(characterId: number): Promise<SkillPlan[]> {
    try {
      const result = await sql`
        SELECT * FROM skill_plans 
        WHERE character_id = ${characterId} AND is_active = TRUE
        ORDER BY priority DESC, created_at DESC
      `
      return result as SkillPlan[]
    } catch (error) {
      console.error('Error finding active skill plans by character ID:', error)
      throw error
    }
  }

  /**
   * Find skill plans by career path
   */
  async findByCareerPath(careerPath: CareerPath): Promise<SkillPlan[]> {
    try {
      const result = await sql`
        SELECT * FROM skill_plans 
        WHERE career_path = ${careerPath}
        ORDER BY priority DESC, created_at DESC
      `
      return result as SkillPlan[]
    } catch (error) {
      console.error('Error finding skill plans by career path:', error)
      throw error
    }
  }

  /**
   * Update progress percentage
   */
  async updateProgress(id: number, percentage: number): Promise<SkillPlan> {
    try {
      const result = await sql`
        UPDATE skill_plans 
        SET progress_percentage = ${percentage}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      
      if (result.length === 0) {
        throw new Error(`Skill plan with ID ${id} not found`)
      }
      
      return result[0] as SkillPlan
    } catch (error) {
      console.error('Error updating progress:', error)
      throw error
    }
  }

  /**
   * Set active status
   */
  async setActive(id: number, isActive: boolean): Promise<SkillPlan> {
    try {
      const result = await sql`
        UPDATE skill_plans 
        SET is_active = ${isActive}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      
      if (result.length === 0) {
        throw new Error(`Skill plan with ID ${id} not found`)
      }
      
      return result[0] as SkillPlan
    } catch (error) {
      console.error('Error setting active status:', error)
      throw error
    }
  }

  /**
   * Deactivate all skill plans for a character
   */
  async deactivateAllForCharacter(characterId: number): Promise<void> {
    try {
      await sql`
        UPDATE skill_plans 
        SET is_active = FALSE, updated_at = NOW()
        WHERE character_id = ${characterId}
      `
    } catch (error) {
      console.error('Error deactivating all skill plans for character:', error)
      throw error
    }
  }

  /**
   * Find skill plans by estimated completion time range
   */
  async findByCompletionTimeRange(
    characterId: number,
    minTime: number,
    maxTime: number
  ): Promise<SkillPlan[]> {
    try {
      const result = await sql`
        SELECT * FROM skill_plans 
        WHERE character_id = ${characterId} 
          AND estimated_completion_time BETWEEN ${minTime} AND ${maxTime}
        ORDER BY estimated_completion_time ASC
      `
      return result as SkillPlan[]
    } catch (error) {
      console.error('Error finding skill plans by completion time range:', error)
      throw error
    }
  }

  /**
   * Get skill plan statistics
   */
  async getSkillPlanStats(characterId?: number): Promise<{
    totalPlans: number
    activePlans: number
    completedPlans: number
    averageProgress: number
    plansByCareerPath: Record<CareerPath, number>
    averageCompletionTime: number
  }> {
    try {
      let query = sql`
        SELECT 
          COUNT(*) as total_plans,
          COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_plans,
          COUNT(CASE WHEN progress_percentage = 100 THEN 1 END) as completed_plans,
          AVG(progress_percentage) as average_progress,
          COUNT(CASE WHEN career_path = 'missions' THEN 1 END) as missions,
          COUNT(CASE WHEN career_path = 'pvp' THEN 1 END) as pvp,
          COUNT(CASE WHEN career_path = 'mining' THEN 1 END) as mining,
          COUNT(CASE WHEN career_path = 'exploration' THEN 1 END) as exploration,
          COUNT(CASE WHEN career_path = 'trading' THEN 1 END) as trading,
          COUNT(CASE WHEN career_path = 'industrial' THEN 1 END) as industrial,
          COUNT(CASE WHEN career_path = 'general' THEN 1 END) as general,
          AVG(estimated_completion_time) as average_completion_time
        FROM skill_plans
      `
      
      if (characterId) {
        query = sql`${query} WHERE character_id = ${characterId}`
      }
      
      const result = await query
      
      if (result.length === 0) {
        return {
          totalPlans: 0,
          activePlans: 0,
          completedPlans: 0,
          averageProgress: 0,
          plansByCareerPath: {
            missions: 0,
            pvp: 0,
            mining: 0,
            exploration: 0,
            trading: 0,
            industrial: 0,
            general: 0
          },
          averageCompletionTime: 0
        }
      }
      
      const stats = result[0]
      return {
        totalPlans: parseInt(stats.total_plans) || 0,
        activePlans: parseInt(stats.active_plans) || 0,
        completedPlans: parseInt(stats.completed_plans) || 0,
        averageProgress: parseFloat(stats.average_progress) || 0,
        plansByCareerPath: {
          missions: parseInt(stats.missions) || 0,
          pvp: parseInt(stats.pvp) || 0,
          mining: parseInt(stats.mining) || 0,
          exploration: parseInt(stats.exploration) || 0,
          trading: parseInt(stats.trading) || 0,
          industrial: parseInt(stats.industrial) || 0,
          general: parseInt(stats.general) || 0
        },
        averageCompletionTime: parseFloat(stats.average_completion_time) || 0
      }
    } catch (error) {
      console.error('Error getting skill plan stats:', error)
      throw error
    }
  }

  /**
   * Update training queue
   */
  async updateTrainingQueue(id: number, trainingQueue: any[]): Promise<SkillPlan> {
    try {
      const result = await sql`
        UPDATE skill_plans 
        SET training_queue = ${trainingQueue}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      
      if (result.length === 0) {
        throw new Error(`Skill plan with ID ${id} not found`)
      }
      
      return result[0] as SkillPlan
    } catch (error) {
      console.error('Error updating training queue:', error)
      throw error
    }
  }

  /**
   * Update goals
   */
  async updateGoals(id: number, goals: any[]): Promise<SkillPlan> {
    try {
      const result = await sql`
        UPDATE skill_plans 
        SET goals = ${goals}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      
      if (result.length === 0) {
        throw new Error(`Skill plan with ID ${id} not found`)
      }
      
      return result[0] as SkillPlan
    } catch (error) {
      console.error('Error updating goals:', error)
      throw error
    }
  }

  /**
   * Clone a skill plan
   */
  async cloneSkillPlan(id: number, newName: string): Promise<SkillPlan> {
    try {
      const original = await this.findById(id)
      if (!original) {
        throw new Error(`Skill plan with ID ${id} not found`)
      }
      
      const clonedPlan = await this.create({
        character_id: original.character_id,
        name: newName,
        description: original.description,
        goals: original.goals,
        training_queue: original.training_queue,
        estimated_completion_time: original.estimated_completion_time,
        priority: original.priority,
        career_path: original.career_path,
        is_active: false,
        progress_percentage: 0
      })
      
      return clonedPlan
    } catch (error) {
      console.error('Error cloning skill plan:', error)
      throw error
    }
  }
}

// Export singleton instance
export const skillPlanRepository = new SkillPlanRepositoryImpl()