/**
 * Character Data Validation Utilities
 * Provides comprehensive validation for character data integrity
 */

import { characterRepository } from '@/lib/repositories/character-repository'
import { redis } from '@/lib/redis'
import type { Character } from '@/types/database'
import type { ESICharacter, ESICharacterSkills } from '@/types/esi'

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  score: number // 0-100 data quality score
}

export interface ValidationError {
  field: string
  message: string
  severity: 'critical' | 'major' | 'minor'
  code: string
}

export interface ValidationWarning {
  field: string
  message: string
  recommendation: string
}

export class CharacterValidator {
  private validationCachePrefix = 'character:validation:cache:'

  /**
   * Validate character data comprehensively
   */
  async validateCharacter(characterId: number): Promise<ValidationResult> {
    // Check cache first
    const cached = await this.getCachedValidation(characterId)
    if (cached) {
      return cached
    }

    const character = await characterRepository.findByEveCharacterId(characterId)
    if (!character) {
      return {
        valid: false,
        errors: [
          {
            field: 'character',
            message: 'Character not found in database',
            severity: 'critical',
            code: 'CHARACTER_NOT_FOUND',
          },
        ],
        warnings: [],
        score: 0,
      }
    }

    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      score: 100,
    }

    // Validate character basic data
    await this.validateBasicData(character, result)

    // Validate skills data
    await this.validateSkillsData(character, result)

    // Validate data freshness
    await this.validateDataFreshness(character, result)

    // Validate data consistency
    await this.validateDataConsistency(character, result)

    // Calculate final validity and score
    result.valid = result.errors.length === 0
    result.score = this.calculateQualityScore(result)

    // Cache result
    await this.cacheValidation(characterId, result)

    return result
  }

  /**
   * Validate ESI character data before saving
   */
  async validateESICharacterData(
    _characterId: number,
    esiCharacter: ESICharacter
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      score: 100,
    }

    // Validate required fields
    if (!esiCharacter.name || esiCharacter.name.trim().length === 0) {
      result.errors.push({
        field: 'name',
        message: 'Character name is required and cannot be empty',
        severity: 'critical',
        code: 'MISSING_NAME',
      })
    }

    if (!esiCharacter.corporation_id) {
      result.errors.push({
        field: 'corporation_id',
        message: 'Corporation ID is required',
        severity: 'critical',
        code: 'MISSING_CORPORATION',
      })
    }

    // Validate character name format
    if (esiCharacter.name && esiCharacter.name.length > 255) {
      result.errors.push({
        field: 'name',
        message: 'Character name exceeds maximum length',
        severity: 'major',
        code: 'NAME_TOO_LONG',
      })
    }

    // Validate security status
    if (esiCharacter.security_status !== undefined) {
      if (esiCharacter.security_status < -10 || esiCharacter.security_status > 10) {
        result.warnings.push({
          field: 'security_status',
          message: 'Security status outside normal range (-10 to 10)',
          recommendation: 'Verify character data accuracy',
        })
      }
    }

    // Validate birthday
    if (esiCharacter.birthday) {
      const birthday = new Date(esiCharacter.birthday)
      const minDate = new Date('2003-05-06') // EVE Online release date
      const maxDate = new Date()

      if (birthday < minDate || birthday > maxDate) {
        result.errors.push({
          field: 'birthday',
          message: 'Character birthday is outside valid range',
          severity: 'major',
          code: 'INVALID_BIRTHDAY',
        })
      }
    }

    // Validate corporation and alliance relationship
    if (esiCharacter.alliance_id && !esiCharacter.corporation_id) {
      result.errors.push({
        field: 'alliance_id',
        message: 'Character cannot have alliance without corporation',
        severity: 'major',
        code: 'ORPHANED_ALLIANCE',
      })
    }

    result.valid = result.errors.length === 0
    result.score = this.calculateQualityScore(result)

    return result
  }

  /**
   * Validate ESI skills data
   */
  async validateESISkillsData(
    _characterId: number,
    skillsData: ESICharacterSkills
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      score: 100,
    }

    // Validate total skill points
    if (skillsData.total_sp < 0) {
      result.errors.push({
        field: 'total_sp',
        message: 'Total skill points cannot be negative',
        severity: 'critical',
        code: 'NEGATIVE_SP',
      })
    }

    // Validate individual skills
    for (const skill of skillsData.skills) {
      // Validate skill level
      if (skill.trained_skill_level < 0 || skill.trained_skill_level > 5) {
        result.errors.push({
          field: 'skill_level',
          message: `Invalid skill level ${skill.trained_skill_level} for skill ${skill.skill_id}`,
          severity: 'major',
          code: 'INVALID_SKILL_LEVEL',
        })
      }

      if (skill.active_skill_level < 0 || skill.active_skill_level > 5) {
        result.errors.push({
          field: 'active_skill_level',
          message: `Invalid active skill level ${skill.active_skill_level} for skill ${skill.skill_id}`,
          severity: 'major',
          code: 'INVALID_ACTIVE_LEVEL',
        })
      }

      // Validate skill points
      if (skill.skillpoints_in_skill < 0) {
        result.errors.push({
          field: 'skillpoints_in_skill',
          message: `Negative skill points for skill ${skill.skill_id}`,
          severity: 'major',
          code: 'NEGATIVE_SKILL_SP',
        })
      }

      // Validate active level <= trained level
      if (skill.active_skill_level > skill.trained_skill_level) {
        result.errors.push({
          field: 'skill_levels',
          message: `Active level exceeds trained level for skill ${skill.skill_id}`,
          severity: 'major',
          code: 'INVALID_LEVEL_RELATIONSHIP',
        })
      }
    }

    // Check for duplicate skills
    const skillIds = skillsData.skills.map(s => s.skill_id)
    const duplicates = skillIds.filter((id, index) => skillIds.indexOf(id) !== index)
    if (duplicates.length > 0) {
      result.errors.push({
        field: 'skills',
        message: `Duplicate skills found: ${duplicates.join(', ')}`,
        severity: 'major',
        code: 'DUPLICATE_SKILLS',
      })
    }

    result.valid = result.errors.length === 0
    result.score = this.calculateQualityScore(result)

    return result
  }

  /**
   * Validate character basic data
   */
  private async validateBasicData(character: Character, result: ValidationResult): Promise<void> {
    // Check required fields
    if (!character.name || character.name.trim().length === 0) {
      result.errors.push({
        field: 'name',
        message: 'Character name is missing or empty',
        severity: 'critical',
        code: 'MISSING_NAME',
      })
    }

    if (!character.corporation_id) {
      result.errors.push({
        field: 'corporation_id',
        message: 'Corporation ID is missing',
        severity: 'critical',
        code: 'MISSING_CORPORATION',
      })
    }

    // Validate data ranges
    if (character.security_status < -10 || character.security_status > 10) {
      result.warnings.push({
        field: 'security_status',
        message: 'Security status outside normal range',
        recommendation: 'Verify character data accuracy',
      })
    }

    if (character.wallet_balance < 0) {
      result.warnings.push({
        field: 'wallet_balance',
        message: 'Negative wallet balance',
        recommendation: 'Check wallet data synchronization',
      })
    }

    // Validate birthday
    if (character.birthday) {
      const minDate = new Date('2003-05-06')
      const maxDate = new Date()
      if (character.birthday < minDate || character.birthday > maxDate) {
        result.errors.push({
          field: 'birthday',
          message: 'Character birthday is outside valid range',
          severity: 'major',
          code: 'INVALID_BIRTHDAY',
        })
      }
    }
  }

  /**
   * Validate skills data
   */
  private async validateSkillsData(_character: Character, result: ValidationResult): Promise<void> {
    // This would check skills in the character_skills table
    // For now, we'll add a placeholder check
    result.warnings.push({
      field: 'skills',
      message: 'Skills validation not yet implemented',
      recommendation: 'Implement skills validation in future update',
    })
  }

  /**
   * Validate data freshness
   */
  private async validateDataFreshness(
    character: Character,
    result: ValidationResult
  ): Promise<void> {
    const now = new Date()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

    // Check character data age
    if (character.updated_at && now.getTime() - character.updated_at.getTime() > maxAge) {
      result.warnings.push({
        field: 'updated_at',
        message: 'Character data is older than 24 hours',
        recommendation: 'Schedule regular synchronization',
      })
    }

    // Check last login freshness
    if (character.last_login && now.getTime() - character.last_login.getTime() > 7 * maxAge) {
      result.warnings.push({
        field: 'last_login',
        message: 'Character has not logged in for over a week',
        recommendation: 'Character may be inactive',
      })
    }
  }

  /**
   * Validate data consistency
   */
  private async validateDataConsistency(
    character: Character,
    result: ValidationResult
  ): Promise<void> {
    // Validate alliance-corporation relationship
    if (character.alliance_id && !character.corporation_id) {
      result.errors.push({
        field: 'alliance_id',
        message: 'Character has alliance but no corporation',
        severity: 'major',
        code: 'ORPHANED_ALLIANCE',
      })
    }

    // Validate creation/update timestamps
    if (character.updated_at < character.created_at) {
      result.errors.push({
        field: 'timestamps',
        message: 'Updated timestamp is before created timestamp',
        severity: 'major',
        code: 'INVALID_TIMESTAMPS',
      })
    }
  }

  /**
   * Calculate data quality score (0-100)
   */
  private calculateQualityScore(result: ValidationResult): number {
    let score = 100

    // Deduct for errors
    for (const error of result.errors) {
      switch (error.severity) {
        case 'critical':
          score -= 30
          break
        case 'major':
          score -= 15
          break
        case 'minor':
          score -= 5
          break
      }
    }

    // Deduct for warnings
    score -= result.warnings.length * 2

    return Math.max(0, score)
  }

  /**
   * Cache validation result
   */
  private async cacheValidation(characterId: number, result: ValidationResult): Promise<void> {
    const cacheKey = `${this.validationCachePrefix}${characterId}`
    await redis.set(cacheKey, JSON.stringify(result), 'EX', 3600) // 1 hour
  }

  /**
   * Get cached validation result
   */
  private async getCachedValidation(characterId: number): Promise<ValidationResult | null> {
    const cacheKey = `${this.validationCachePrefix}${characterId}`
    const cached = await redis.get(cacheKey)
    return cached ? JSON.parse(cached) : null
  }

  /**
   * Clear validation cache
   */
  async clearValidationCache(characterId: number): Promise<void> {
    const cacheKey = `${this.validationCachePrefix}${characterId}`
    await redis.del(cacheKey)
  }

  /**
   * Batch validate multiple characters
   */
  async batchValidate(characterIds: number[]): Promise<Record<number, ValidationResult>> {
    const results: Record<number, ValidationResult> = {}

    for (const characterId of characterIds) {
      try {
        results[characterId] = await this.validateCharacter(characterId)
      } catch (error) {
        results[characterId] = {
          valid: false,
          errors: [
            {
              field: 'character',
              message: error instanceof Error ? error.message : 'Validation failed',
              severity: 'critical',
              code: 'VALIDATION_ERROR',
            },
          ],
          warnings: [],
          score: 0,
        }
      }
    }

    return results
  }
}

// Export singleton instance
export const characterValidator = new CharacterValidator()
