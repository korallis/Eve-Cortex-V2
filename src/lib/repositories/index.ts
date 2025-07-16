/**
 * Repository Index
 * Centralized exports for all repository implementations
 */

export { BaseRepository } from './base-repository'
export { CharacterRepositoryImpl, characterRepository } from './character-repository'
export { CharacterSkillRepositoryImpl, characterSkillRepository } from './character-skill-repository'
export { FittingRepositoryImpl, fittingRepository } from './fitting-repository'
export { SkillPlanRepositoryImpl, skillPlanRepository } from './skill-plan-repository'

// Import repository instances
import { characterRepository } from './character-repository'
import { characterSkillRepository } from './character-skill-repository'
import { fittingRepository } from './fitting-repository'
import { skillPlanRepository } from './skill-plan-repository'

// Export all repository instances for easy access
export const repositories = {
  character: characterRepository,
  characterSkill: characterSkillRepository,
  fitting: fittingRepository,
  skillPlan: skillPlanRepository
}

// Export types
export type {
  Character,
  CharacterSkill,
  Fitting,
  SkillPlan,
  CareerPath,
  DatabaseRecord,
  QueryOptions,
  PaginatedResult,
  CharacterRepository,
  CharacterSkillRepository,
  FittingRepository,
  SkillPlanRepository
} from '@/types/database'