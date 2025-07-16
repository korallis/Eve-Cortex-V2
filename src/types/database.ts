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
  progress_percentage: number
}

export interface SkillGoal {
  skill_type_id: number
  target_level: number
  description?: string
  priority: number
}

export interface TrainingQueueItem {
  skill_type_id: number
  target_level: number
  training_time: number
  prerequisites: number[]
  order: number
}

// Enums and constants
export type CareerPath = 
  | 'missions'
  | 'pvp'
  | 'mining'
  | 'exploration'
  | 'trading'
  | 'industrial'
  | 'general'

// Repository interfaces
export interface BaseRepository<T extends DatabaseRecord> {
  findById(id: number): Promise<T | null>
  findAll(): Promise<T[]>
  create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T>
  update(id: number, data: Partial<T>): Promise<T>
  delete(id: number): Promise<boolean>
}

export interface CharacterRepository extends BaseRepository<Character> {
  findByEveId(eveId: number): Promise<Character | null>
  findByName(name: string): Promise<Character | null>
  updateWalletBalance(id: number, balance: number): Promise<Character>
  updateLocation(id: number, locationId: number, locationName: string): Promise<Character>
}

export interface CharacterSkillRepository extends BaseRepository<CharacterSkill> {
  findByCharacterId(characterId: number): Promise<CharacterSkill[]>
  findBySkillTypeId(skillTypeId: number): Promise<CharacterSkill[]>
  upsertSkill(skill: Omit<CharacterSkill, 'id' | 'created_at' | 'updated_at'>): Promise<CharacterSkill>
  bulkUpsertSkills(skills: Omit<CharacterSkill, 'id' | 'created_at' | 'updated_at'>[]): Promise<CharacterSkill[]>
}

export interface FittingRepository extends BaseRepository<Fitting> {
  findByCharacterId(characterId: number): Promise<Fitting[]>
  findByShipTypeId(shipTypeId: number): Promise<Fitting[]>
  findByCareerPath(careerPath: CareerPath): Promise<Fitting[]>
  findPublicFittings(): Promise<Fitting[]>
  findByTags(tags: string[]): Promise<Fitting[]>
}

export interface SkillPlanRepository extends BaseRepository<SkillPlan> {
  findByCharacterId(characterId: number): Promise<SkillPlan[]>
  findActiveByCharacterId(characterId: number): Promise<SkillPlan[]>
  findByCareerPath(careerPath: CareerPath): Promise<SkillPlan[]>
  updateProgress(id: number, percentage: number): Promise<SkillPlan>
  setActive(id: number, isActive: boolean): Promise<SkillPlan>
}

// Database connection types
export interface DatabaseConfig {
  host: string
  port: number
  database: string
  username: string
  password: string
  ssl: boolean
  maxConnections: number
  idleTimeout: number
  connectionTimeout: number
}

export interface DatabaseHealth {
  isHealthy: boolean
  database: string
  user: string
  version: string
  currentTime: Date
  connectionCount?: number
  error?: string
}

// Query types
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
  filename: string
  success: boolean
  error?: string
  executionTime: number
}