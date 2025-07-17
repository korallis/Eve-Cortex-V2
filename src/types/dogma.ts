/**
 * EVE Online Dogma System Type Definitions
 * Comprehensive types for ship attribute calculations and effects processing
 */

// Core Dogma Attribute Types
export interface DogmaAttribute {
  attributeId: number
  attributeName: string
  description: string
  defaultValue: number
  published: boolean
  displayName?: string
  unitId?: number
  stackable: boolean
  highIsGood: boolean
}

export interface DogmaEffect {
  effectId: number
  effectName: string
  description: string
  effectCategory: number
  preExpression?: number
  postExpression?: number
  published: boolean
  isOffensive: boolean
  isAssistance: boolean
  durationAttributeId?: number
  trackingSpeedAttributeId?: number
  dischargeAttributeId?: number
  rangeAttributeId?: number
  falloffAttributeId?: number
  disallowAutoRepeat: boolean
  isWarpSafe: boolean
}

// Type Dogma Information
export interface TypeDogma {
  typeId: number
  attributes: TypeDogmaAttribute[]
  effects: TypeDogmaEffect[]
}

export interface TypeDogmaAttribute {
  attributeId: number
  value: number
}

export interface TypeDogmaEffect {
  effectId: number
  isDefault: boolean
}

// Character Modifiers
export interface CharacterModifier {
  type: 'skill' | 'implant' | 'booster'
  sourceId: number
  attributeId: number
  modifier: number
  operation: ModifierOperation
  skillLevel?: number
}

export type ModifierOperation =
  | 'add' // Addition
  | 'multiply' // Multiplication
  | 'percent' // Percentage modification
  | 'set' // Set absolute value

// Ship Fitting Calculation Context
export interface FittingContext {
  ship: Ship
  modules: FittedModule[]
  character: CharacterData
  implants: number[]
  boosters?: ActiveBooster[]
}

export interface Ship {
  typeId: number
  attributes: Record<number, number>
  effects: number[]
  slots: ShipSlots
}

export interface ShipSlots {
  high: number
  med: number
  low: number
  rig: number
  subsystem?: number
  launcher?: number
  turret?: number
}

export interface FittedModule {
  typeId: number
  slotType: 'high' | 'med' | 'low' | 'rig' | 'subsystem'
  slotIndex: number
  state: ModuleState
  chargeTypeId?: number
  attributes: Record<number, number>
  effects: number[]
  online: boolean
  active: boolean
}

export type ModuleState = 'offline' | 'online' | 'active' | 'overload'

export interface CharacterData {
  characterId: number
  skills: CharacterSkill[]
  attributes: CharacterAttributes
}

export interface CharacterSkill {
  skillId: number
  level: number
  skillpoints: number
}

export interface CharacterAttributes {
  intelligence: number
  memory: number
  perception: number
  willpower: number
  charisma: number
}

export interface ActiveBooster {
  typeId: number
  attributeModifiers: Record<number, number>
  duration: number
  sideEffects?: BoosterSideEffect[]
}

export interface BoosterSideEffect {
  penalty: number
  probability: number
  attributeId: number
}

// Ship Performance Metrics
export interface ShipPerformance {
  // Core Stats
  ehp: EffectiveHitPoints
  dps: DamagePerSecond
  speed: SpeedMetrics
  capacitor: CapacitorMetrics
  targeting: TargetingMetrics

  // Specialized Metrics
  mining?: MiningMetrics
  repair?: RepairMetrics
  ewar?: ElectronicWarfareMetrics

  // Economic Metrics
  cost: number
  fittingUsed: FittingUsage
}

export interface EffectiveHitPoints {
  shield: number
  armor: number
  hull: number
  total: number

  // Resistances
  shieldResistances: DamageResistances
  armorResistances: DamageResistances
  hullResistances: DamageResistances

  // Repair rates
  shieldRecharge: number
  armorRepair?: number
  hullRepair?: number
}

export interface DamageResistances {
  em: number // Electromagnetic
  thermal: number // Thermal
  kinetic: number // Kinetic
  explosive: number // Explosive
}

export interface DamagePerSecond {
  total: number
  weapon: WeaponDPS[]
  drone?: number

  // Damage types
  em: number
  thermal: number
  kinetic: number
  explosive: number

  // Range information
  optimal: number
  falloff: number
  effective: number
}

export interface WeaponDPS {
  groupName: string
  dps: number
  alpha: number // Alpha strike damage
  rof: number // Rate of fire
  range: number
  tracking?: number
  damageTypes: DamageResistances
}

export interface SpeedMetrics {
  maxVelocity: number
  acceleration: number
  agility: number // Align time in seconds
  warpSpeed: number
  warpStrength?: number
}

export interface CapacitorMetrics {
  capacity: number
  rechargeRate: number
  stable: boolean
  stableTime?: number // Time to depletion if not stable
  peakRecharge: number
  usage: CapacitorUsage[]
}

export interface CapacitorUsage {
  moduleTypeId: number
  moduleName: string
  usage: number
  cycle: number
}

export interface TargetingMetrics {
  maxTargets: number
  maxRange: number
  scanResolution: number
  signatureRadius: number
  lockTime: number
}

export interface MiningMetrics {
  yield: number // m3 per cycle
  cycleTime: number // seconds
  m3PerSecond: number
  range: number
  cargoCapacity: number
  oreHoldCapacity?: number
}

export interface RepairMetrics {
  armorRepairRate: number // HP per second
  shieldBoostRate: number // HP per second
  hullRepairRate?: number // HP per second
  capacitorUsage: number // GJ per second
}

export interface ElectronicWarfareMetrics {
  jammingStrength?: number
  warpScramblerStrength?: number
  webifierStrength?: number
  nosferatuAmount?: number
  neutralizerAmount?: number
  pointStrength?: number
  dampenerStrength?: number
}

export interface FittingUsage {
  cpu: {
    used: number
    total: number
    percentage: number
  }
  powergrid: {
    used: number
    total: number
    percentage: number
  }
  calibration?: {
    used: number
    total: number
    percentage: number
  }
}

// Dogma Calculation Results
export interface DogmaCalculationResult {
  success: boolean
  performance: ShipPerformance
  warnings: DogmaWarning[]
  errors: DogmaError[]
  calculationTime: number

  // Debug information
  appliedModifiers?: CharacterModifier[]
  attributeCalculations?: AttributeCalculation[]
}

export interface DogmaWarning {
  type: 'fitting' | 'skill' | 'attribute' | 'module'
  message: string
  severity: 'low' | 'medium' | 'high'
  moduleTypeId?: number
  attributeId?: number
}

export interface DogmaError {
  type: 'calculation' | 'validation' | 'data'
  message: string
  moduleTypeId?: number
  attributeId?: number
  skillId?: number
}

export interface AttributeCalculation {
  attributeId: number
  baseValue: number
  modifiedValue: number
  modifiers: AttributeModifier[]
}

export interface AttributeModifier {
  sourceType: 'ship' | 'module' | 'skill' | 'implant' | 'booster'
  sourceId: number
  operation: ModifierOperation
  value: number
  stackingPenalty?: number
}

// Dogma Configuration
export interface DogmaConfig {
  enableStackingPenalties: boolean
  enableSkillBonuses: boolean
  enableImplantBonuses: boolean
  enableBoosterBonuses: boolean
  precision: number
  cacheResults: boolean
  debugMode: boolean
}

// Static Data Export (SDE) Integration
export interface SDEData {
  types: Map<number, ESIType>
  attributes: Map<number, DogmaAttribute>
  effects: Map<number, DogmaEffect>
  groups: Map<number, ESIGroup>
  categories: Map<number, ESICategory>
  lastUpdated: Date
}

// Import ESI types that are referenced
import type { ESIType, ESIGroup, ESICategory } from '@/types/esi'

// Skill bonus calculation types
export interface SkillBonus {
  skillId: number
  bonusType: 'linear' | 'exponential' | 'threshold'
  perLevel: number
  attributeId: number
  maxLevel?: number
}

// Module validation types
export interface ModuleValidation {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  requiredSkills: RequiredSkill[]
  cpuUsage: number
  powergridUsage: number
}

export interface ValidationError {
  type: 'cpu' | 'powergrid' | 'slot' | 'skill' | 'fitting_restriction'
  message: string
  moduleTypeId: number
  requiredValue?: number
  currentValue?: number
}

export interface ValidationWarning {
  type: 'suboptimal' | 'skill_level' | 'fitting_conflict'
  message: string
  moduleTypeId: number
  severity: 'low' | 'medium' | 'high'
}

export interface RequiredSkill {
  skillId: number
  requiredLevel: number
  currentLevel: number
  trained: boolean
}

// Optimization targets for fitting calculations
export interface OptimizationTarget {
  type: 'dps' | 'tank' | 'speed' | 'range' | 'cost' | 'balanced'
  priority: number
  constraints?: OptimizationConstraint[]
}

export interface OptimizationConstraint {
  type: 'max_cost' | 'min_dps' | 'min_ehp' | 'max_sig' | 'required_module'
  value: number | string
  strict: boolean
}
