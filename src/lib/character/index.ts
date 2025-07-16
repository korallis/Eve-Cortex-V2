/**
 * Character Data Management System
 * Main exports for character management functionality
 */

// Core services
export { characterManager } from './manager'
export { characterSyncScheduler } from './scheduler'
export { characterValidator } from './validation'
export { characterProfileService } from './profile'

// Types
export type { CharacterManagerOptions } from './manager'

export type { SyncSchedule } from './scheduler'

export type { ValidationResult, ValidationError, ValidationWarning } from './validation'

export type { CharacterProfile, ProfileOptions } from './profile'

// Re-export character sync service for convenience
export { characterSyncService } from '@/lib/esi/character-sync'
export type { CharacterSyncResult } from '@/lib/esi/character-sync'

// Re-export character repository for convenience
export { characterRepository } from '@/lib/repositories/character-repository'
