/**
 * Database Type Definitions
 * Core database types and interfaces for Eve-Cortex
 */

// Base database record type
export interface DatabaseRecord {
  id: number
  created_at: Date
  updated_at: Date
}

// Character types
export interface Character extends DatabaseRecord {
  eve_character_id: number
  name: string
  corporation_id: number | null
  alliance_id: number | null
  wallet_balance: number
  location_id: number | null
  location_name: string | null
  security_status: number
  birthday: Date | null
  last_login: Date | null
}

export interface CharacterSkill extends DatabaseRecord {
  character_id: number
  skill_type_id: number
  trained_skill_level: number
  skillpoints_in_skill: number
  active_skill_level: number
}

// Fitting types
export interface Fitting extends DatabaseRecord {
  character_id: number
  ship_type_id: number
  name: string
  description: string | null
  fitting_data: FittingData
  career_path: CareerPath
  tags: string[]
  is_public: boolean
  performance_data: PerformanceData | null
}

export interface FittingData {
  ship_type_id: number
  modules: FittingModule[]
  rigs?: FittingModule[]
  subsystems?: FittingModule[]
  charges?: FittingModule[]
}

export interface FittingModule {
  type_id: number
  slot_type: 'high' | 'med' | 'low' | 'rig' | 'subsystem'
  quantity: number
  charge_type_id?: number
}

export interface PerformanceData {
  dps: number
  ehp: number
  speed: number
  range: number
  capacitor_stable: boolean
  capacitor_time?: number
  cost_estimate: number
  [key: string]: unknown
}

// Skill plan types
export interface SkillPlan extends DatabaseRecord {
  character_id: number
  name: string
  description: string | null
  goals: SkillGoal[]
  training_queue: TrainingQueueItem[]
  estimated_completion_time: number | null
  priority: number
  career_path: CareerPath
  is_active: boolean
  progress: number
}

export interface SkillGoal {
  skill_type_id: number
  target_level: number
  reason: string
  priority: number
}

export interface TrainingQueueItem {
  skill_type_id: number
  target_level: number
  training_time: number
  prerequisites: number[]
  position: number
}

// Career path types
export type CareerPath = 
  | 'missions'
  | 'pvp'
  | 'mining'
  | 'exploration'
  | 'trading'
  | 'industrial'
  | 'general'

// Database health types
export interface DatabaseHealth {
  isHealthy: boolean
  database: string
  user: string
  version: string
  currentTime: Date
  connectionCount?: number
  error?: string
}

// Database statistics
export interface DatabaseStats {
  characterCount: number
  skillCount: number
  fittingCount: number
  skillPlanCount: number
  migrationCount: number
  databaseSize: number
}

// Performance metrics
export interface PerformanceMetrics {
  queryLatency: number
  connectionLatency: number
  timestamp: Date
}

// Migration types
export interface MigrationInfo {
  filename: string
  executed_at: Date
}

// Query options
export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
  where?: Record<string, unknown>
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Migration types
export interface Migration {
  id: number
  filename: string
  executed_at: Date
}

export interface MigrationResult {
  success: boolean
  message: string
  migrations?: string[]
}

// Database diagnostics
export interface DatabaseDiagnostics {
  health: DatabaseHealth
  structure: Record<string, unknown[]>
  indexes: unknown[]
  stats: DatabaseStats
  performance: PerformanceMetrics
  longQueries: unknown[]
  migrations: MigrationInfo[]
  timestamp: Date
}