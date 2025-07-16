/**
 * Character Skill Repository
 * Handles character skill-related database operations
 */

import { sql } from '@/lib/database'
import { BaseRepository } from './base-repository'
import type { CharacterSkill, CharacterSkillRepository } from '@/types/database'

export class CharacterSkillRepositoryImpl extends BaseRepository<CharacterSkill> implements CharacterSkillRepository {
  protected tableName = 'character_skills'

  /**
   * Find skills by character ID
   */
  async findByCharacterId(characterId: number): Promise<CharacterSkill[]> {
    try {
      const result = await sql`
        SELECT * FROM character_skills 
        WHERE character_id = ${characterId}
        ORDER BY skill_type_id
      `
      return result as unknown as CharacterSkill[]
    } catch (error) {
      console.error('Error finding skills by character ID:', error)
      throw error
    }
  }

  /**
   * Find skills by skill type ID
   */
  async findBySkillTypeId(skillTypeId: number): Promise<CharacterSkill[]> {
    try {
      const result = await sql`
        SELECT * FROM character_skills 
        WHERE skill_type_id = ${skillTypeId}
        ORDER BY character_id
      `
      return result as unknown as CharacterSkill[]
    } catch (error) {
      console.error('Error finding skills by skill type ID:', error)
      throw error
    }
  }

  /**
   * Upsert a skill (insert or update)
   */
  async upsertSkill(skill: Omit<CharacterSkill, 'id' | 'created_at' | 'updated_at'>): Promise<CharacterSkill> {
    try {
      const result = await sql`
        INSERT INTO character_skills (
          character_id, skill_type_id, trained_skill_level, 
          skillpoints_in_skill, active_skill_level
        )
        VALUES (
          ${skill.character_id}, ${skill.skill_type_id}, ${skill.trained_skill_level},
          ${skill.skillpoints_in_skill}, ${skill.active_skill_level}
        )
        ON CONFLICT (character_id, skill_type_id)
        DO UPDATE SET
          trained_skill_level = EXCLUDED.trained_skill_level,
          skillpoints_in_skill = EXCLUDED.skillpoints_in_skill,
          active_skill_level = EXCLUDED.active_skill_level,
          updated_at = NOW()
        RETURNING *
      `
      
      return result[0] as CharacterSkill
    } catch (error) {
      console.error('Error upserting skill:', error)
      throw error
    }
  }

  /**
   * Bulk upsert skills
   */
  async bulkUpsertSkills(skills: Omit<CharacterSkill, 'id' | 'created_at' | 'updated_at'>[]): Promise<CharacterSkill[]> {
    if (skills.length === 0) {
      return []
    }

    try {
      return await this.withTransaction(async (sql) => {
        const results: CharacterSkill[] = []
        
        for (const skill of skills) {
          const result = await sql`
            INSERT INTO character_skills (
              character_id, skill_type_id, trained_skill_level, 
              skillpoints_in_skill, active_skill_level
            )
            VALUES (
              ${skill.character_id}, ${skill.skill_type_id}, ${skill.trained_skill_level},
              ${skill.skillpoints_in_skill}, ${skill.active_skill_level}
            )
            ON CONFLICT (character_id, skill_type_id)
            DO UPDATE SET
              trained_skill_level = EXCLUDED.trained_skill_level,
              skillpoints_in_skill = EXCLUDED.skillpoints_in_skill,
              active_skill_level = EXCLUDED.active_skill_level,
              updated_at = NOW()
            RETURNING *
          `
          
          results.push(result[0] as CharacterSkill)
        }
        
        return results
      })
    } catch (error) {
      console.error('Error bulk upserting skills:', error)
      throw error
    }
  }

  /**
   * Get skill level for a specific skill
   */
  async getSkillLevel(characterId: number, skillTypeId: number): Promise<number> {
    try {
      const result = await sql`
        SELECT trained_skill_level 
        FROM character_skills 
        WHERE character_id = ${characterId} AND skill_type_id = ${skillTypeId}
      `
      
      return result[0]?.['trained_skill_level'] || 0
    } catch (error) {
      console.error('Error getting skill level:', error)
      throw error
    }
  }

  /**
   * Get total skillpoints for a character
   */
  async getTotalSkillpoints(characterId: number): Promise<number> {
    try {
      const result = await sql`
        SELECT SUM(skillpoints_in_skill) as total_skillpoints
        FROM character_skills 
        WHERE character_id = ${characterId}
      `
      
      return parseInt(result[0]?.['total_skillpoints']) || 0
    } catch (error) {
      console.error('Error getting total skillpoints:', error)
      throw error
    }
  }

  /**
   * Get skills by minimum level
   */
  async findByMinimumLevel(characterId: number, minimumLevel: number): Promise<CharacterSkill[]> {
    try {
      const result = await sql`
        SELECT * FROM character_skills 
        WHERE character_id = ${characterId} AND trained_skill_level >= ${minimumLevel}
        ORDER BY skill_type_id
      `
      return result as unknown as CharacterSkill[]
    } catch (error) {
      console.error('Error finding skills by minimum level:', error)
      throw error
    }
  }

  /**
   * Get skill statistics for a character
   */
  async getSkillStats(characterId: number): Promise<{
    totalSkills: number
    totalSkillpoints: number
    averageSkillLevel: number
    skillsAtMaxLevel: number
    distributionByLevel: Record<number, number>
  }> {
    try {
      const result = await sql`
        SELECT 
          COUNT(*) as total_skills,
          SUM(skillpoints_in_skill) as total_skillpoints,
          AVG(trained_skill_level) as average_skill_level,
          COUNT(CASE WHEN trained_skill_level = 5 THEN 1 END) as skills_at_max_level,
          COUNT(CASE WHEN trained_skill_level = 0 THEN 1 END) as level_0,
          COUNT(CASE WHEN trained_skill_level = 1 THEN 1 END) as level_1,
          COUNT(CASE WHEN trained_skill_level = 2 THEN 1 END) as level_2,
          COUNT(CASE WHEN trained_skill_level = 3 THEN 1 END) as level_3,
          COUNT(CASE WHEN trained_skill_level = 4 THEN 1 END) as level_4,
          COUNT(CASE WHEN trained_skill_level = 5 THEN 1 END) as level_5
        FROM character_skills 
        WHERE character_id = ${characterId}
      `
      
      if (result.length === 0) {
        return {
          totalSkills: 0,
          totalSkillpoints: 0,
          averageSkillLevel: 0,
          skillsAtMaxLevel: 0,
          distributionByLevel: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        }
      }
      
      const stats = result[0]
      return {
        totalSkills: parseInt(stats?.['total_skills']) || 0,
        totalSkillpoints: parseInt(stats?.['total_skillpoints']) || 0,
        averageSkillLevel: parseFloat(stats?.['average_skill_level']) || 0,
        skillsAtMaxLevel: parseInt(stats?.['skills_at_max_level']) || 0,
        distributionByLevel: {
          0: parseInt(stats?.['level_0']) || 0,
          1: parseInt(stats?.['level_1']) || 0,
          2: parseInt(stats?.['level_2']) || 0,
          3: parseInt(stats?.['level_3']) || 0,
          4: parseInt(stats?.['level_4']) || 0,
          5: parseInt(stats?.['level_5']) || 0
        }
      }
    } catch (error) {
      console.error('Error getting skill stats:', error)
      throw error
    }
  }

  /**
   * Delete all skills for a character
   */
  async deleteByCharacterId(characterId: number): Promise<boolean> {
    try {
      const result = await sql`
        DELETE FROM character_skills WHERE character_id = ${characterId}
      `
      
      return result.count > 0
    } catch (error) {
      console.error('Error deleting skills by character ID:', error)
      throw error
    }
  }
}

// Export singleton instance
export const characterSkillRepository = new CharacterSkillRepositoryImpl()