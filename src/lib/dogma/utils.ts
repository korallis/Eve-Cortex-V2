/**
 * Dogma Utility Functions
 * Helper functions for common Dogma calculations and data formatting
 */

import type {
  FittingContext,
  ShipPerformance,
  DamageResistances,
  CharacterData,
  ModifierOperation,
  FittedModule,
} from '@/types/dogma'
import { STACKING_PENALTY } from './constants'

/**
 * Create a basic fitting context for testing or simple calculations
 */
export function createBasicFittingContext(
  shipTypeId: number,
  characterSkills: Array<{ skillId: number; level: number }> = []
): FittingContext {
  const characterData: CharacterData = {
    characterId: 0,
    skills: characterSkills.map(skill => ({
      skillId: skill.skillId,
      level: skill.level,
      skillpoints: skill.level * 250000, // Approximate skillpoints
    })),
    attributes: {
      intelligence: 20,
      memory: 20,
      perception: 20,
      willpower: 20,
      charisma: 20,
    },
  }

  return {
    ship: {
      typeId: shipTypeId,
      attributes: {},
      effects: [],
      slots: {
        high: 8,
        med: 4,
        low: 4,
        rig: 3,
      },
    },
    modules: [],
    character: characterData,
    implants: [],
    boosters: [],
  }
}

/**
 * Validate if a module can be fitted to a specific slot type
 */
export function validateModuleSlot(
  moduleGroupId: number,
  slotType: 'high' | 'med' | 'low' | 'rig' | 'subsystem'
): boolean {
  const slotMappings: Record<string, number[]> = {
    high: [
      53, // Energy weapons
      55, // Projectile weapons
      74, // Hybrid weapons
      507, // Missile launchers
      506, // Cruise missile launchers
      510, // Heavy missile launchers
      771, // Mining lasers
      65, // Sensor dampeners (some)
    ],
    med: [
      40, // Shield boosters
      76, // Capacitor boosters
      212, // Sensor boosters
      213, // Tracking computers
      46, // Propulsion modules
      65, // Some EWAR modules
      67, // Weapon disruptors
      379, // Target painters
    ],
    low: [
      62, // Armor repairers
      63, // Hull repairers
      328, // Armor hardeners
      60, // Damage controls
      71, // Energy neutralizers
      72, // Energy nosferatus
      52, // Warp scramblers
      65, // Stasis webs
    ],
    rig: [
      771, // Astronautic rigs
      772, // Armor rigs
      773, // Engineering rigs
      774, // Shield rigs
      775, // Hull rigs
      776, // Weapon rigs
      777, // Electronic superiority rigs
    ],
    subsystem: [
      955, // Defensive subsystems
      956, // Electronic subsystems
      957, // Engineering subsystems
      958, // Offensive subsystems
      959, // Propulsion subsystems
    ],
  }

  return slotMappings[slotType]?.includes(moduleGroupId) || false
}

/**
 * Calculate stacking penalty for multiple modules
 */
export function calculateStackingPenalty(
  modifiers: Array<{ value: number; operation: ModifierOperation }>,
  enableStackingPenalties: boolean = true
): Array<{ value: number; penalty: number; effectiveValue: number }> {
  if (!enableStackingPenalties) {
    return modifiers.map(mod => ({
      value: mod.value,
      penalty: 1.0,
      effectiveValue: mod.value,
    }))
  }

  // Only apply stacking penalties to percentage modifiers
  const percentageModifiers = modifiers.filter(mod => mod.operation === 'percent')
  const otherModifiers = modifiers.filter(mod => mod.operation !== 'percent')

  // Sort percentage modifiers by absolute value (highest first)
  const sortedPercentage = percentageModifiers
    .map(mod => ({ ...mod, absValue: Math.abs(mod.value) }))
    .sort((a, b) => b.absValue - a.absValue)

  const result = []

  // Apply stacking penalties to percentage modifiers
  for (let i = 0; i < sortedPercentage.length; i++) {
    const modifier = sortedPercentage[i]
    if (modifier) {
      const penalty =
        i < STACKING_PENALTY.MULTIPLIERS.length ? STACKING_PENALTY.MULTIPLIERS[i] || 0 : 0

      result.push({
        value: modifier.value,
        penalty,
        effectiveValue: modifier.value * penalty,
      })
    }
  }

  // Other modifiers don't have stacking penalties
  for (const modifier of otherModifiers) {
    result.push({
      value: modifier.value,
      penalty: 1.0,
      effectiveValue: modifier.value,
    })
  }

  return result
}

/**
 * Format performance metrics for display
 */
export function formatPerformanceMetrics(performance: ShipPerformance): {
  ehp: string
  dps: string
  speed: string
  capacitor: string
  targeting: string
  efficiency: {
    cpuUsage: string
    powergridUsage: string
    calibrationUsage?: string
  }
} {
  const formatNumber = (value: number, precision: number = 2): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(precision)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(precision)}K`
    } else {
      return value.toFixed(precision)
    }
  }

  const formatResistances = (resistances: DamageResistances): string => {
    const values = [
      `EM: ${(resistances.em * 100).toFixed(1)}%`,
      `Th: ${(resistances.thermal * 100).toFixed(1)}%`,
      `Ki: ${(resistances.kinetic * 100).toFixed(1)}%`,
      `Ex: ${(resistances.explosive * 100).toFixed(1)}%`,
    ]
    return values.join(' | ')
  }
  void formatResistances

  return {
    ehp: `${formatNumber(performance.ehp.total)} HP (S:${formatNumber(performance.ehp.shield)} A:${formatNumber(performance.ehp.armor)} H:${formatNumber(performance.ehp.hull)})`,
    dps: `${formatNumber(performance.dps.total)} DPS @ ${performance.dps.optimal.toFixed(1)}km`,
    speed: `${formatNumber(performance.speed.maxVelocity)} m/s (${performance.speed.agility.toFixed(1)}s align)`,
    capacitor: performance.capacitor.stable
      ? `${formatNumber(performance.capacitor.capacity)} GJ (Stable)`
      : `${formatNumber(performance.capacitor.capacity)} GJ (${performance.capacitor.stableTime?.toFixed(0)}s)`,
    targeting: `${performance.targeting.maxTargets} @ ${performance.targeting.maxRange.toFixed(1)}km (${performance.targeting.lockTime.toFixed(1)}s)`,
    efficiency: {
      cpuUsage: `${performance.fittingUsed.cpu.percentage.toFixed(1)}% (${formatNumber(performance.fittingUsed.cpu.used)}/${formatNumber(performance.fittingUsed.cpu.total)})`,
      powergridUsage: `${performance.fittingUsed.powergrid.percentage.toFixed(1)}% (${formatNumber(performance.fittingUsed.powergrid.used)}/${formatNumber(performance.fittingUsed.powergrid.total)})`,
      ...(performance.fittingUsed.calibration && {
        calibrationUsage: `${performance.fittingUsed.calibration.percentage.toFixed(1)}% (${performance.fittingUsed.calibration.used}/${performance.fittingUsed.calibration.total})`,
      }),
    },
  }
}

/**
 * Calculate effective HP against specific damage profile
 */
export function calculateEffectiveHPAgainstDamage(
  baseHP: number,
  resistances: DamageResistances,
  damageProfile: DamageResistances
): number {
  // Weight resistances by incoming damage profile
  const weightedResistance =
    resistances.em * damageProfile.em +
    resistances.thermal * damageProfile.thermal +
    resistances.kinetic * damageProfile.kinetic +
    resistances.explosive * damageProfile.explosive

  return baseHP / (1 - weightedResistance)
}

/**
 * Calculate DPS against specific resistance profile
 */
export function calculateDPSAgainstResistances(
  baseDPS: number,
  weaponDamageProfile: DamageResistances,
  targetResistances: DamageResistances
): number {
  // Calculate effective DPS considering target resistances
  const effectiveDPS =
    baseDPS * weaponDamageProfile.em * (1 - targetResistances.em) +
    baseDPS * weaponDamageProfile.thermal * (1 - targetResistances.thermal) +
    baseDPS * weaponDamageProfile.kinetic * (1 - targetResistances.kinetic) +
    baseDPS * weaponDamageProfile.explosive * (1 - targetResistances.explosive)

  return effectiveDPS
}

/**
 * Get common damage profiles for different enemy types
 */
export function getCommonDamageProfiles(): Record<string, DamageResistances> {
  return {
    uniform: { em: 0.25, thermal: 0.25, kinetic: 0.25, explosive: 0.25 },
    em_heavy: { em: 0.6, thermal: 0.2, kinetic: 0.1, explosive: 0.1 },
    thermal_heavy: { em: 0.1, thermal: 0.6, kinetic: 0.2, explosive: 0.1 },
    kinetic_heavy: { em: 0.1, thermal: 0.1, kinetic: 0.6, explosive: 0.2 },
    explosive_heavy: { em: 0.1, thermal: 0.1, kinetic: 0.2, explosive: 0.6 },
    amarr_npc: { em: 0.5, thermal: 0.4, kinetic: 0.05, explosive: 0.05 },
    caldari_npc: { em: 0.05, thermal: 0.45, kinetic: 0.45, explosive: 0.05 },
    gallente_npc: { em: 0.05, thermal: 0.45, kinetic: 0.05, explosive: 0.45 },
    minmatar_npc: { em: 0.05, thermal: 0.05, kinetic: 0.45, explosive: 0.45 },
    guristas: { em: 0.0, thermal: 0.7, kinetic: 0.3, explosive: 0.0 },
    serpentis: { em: 0.0, thermal: 0.5, kinetic: 0.0, explosive: 0.5 },
    blood_raiders: { em: 0.5, thermal: 0.5, kinetic: 0.0, explosive: 0.0 },
    sansha: { em: 0.6, thermal: 0.4, kinetic: 0.0, explosive: 0.0 },
    angel: { em: 0.0, thermal: 0.0, kinetic: 0.6, explosive: 0.4 },
  }
}

/**
 * Get common resistance profiles for different ship types
 */
export function getCommonResistanceProfiles(): Record<
  string,
  {
    shield: DamageResistances
    armor: DamageResistances
    hull: DamageResistances
  }
> {
  return {
    amarr_ship: {
      shield: { em: 0.0, thermal: 0.2, kinetic: 0.4, explosive: 0.5 },
      armor: { em: 0.6, thermal: 0.35, kinetic: 0.25, explosive: 0.1 },
      hull: { em: 0.0, thermal: 0.0, kinetic: 0.0, explosive: 0.0 },
    },
    caldari_ship: {
      shield: { em: 0.0, thermal: 0.2, kinetic: 0.4, explosive: 0.5 },
      armor: { em: 0.5, thermal: 0.35, kinetic: 0.25, explosive: 0.1 },
      hull: { em: 0.0, thermal: 0.0, kinetic: 0.0, explosive: 0.0 },
    },
    gallente_ship: {
      shield: { em: 0.0, thermal: 0.2, kinetic: 0.4, explosive: 0.5 },
      armor: { em: 0.5, thermal: 0.35, kinetic: 0.25, explosive: 0.1 },
      hull: { em: 0.0, thermal: 0.0, kinetic: 0.0, explosive: 0.0 },
    },
    minmatar_ship: {
      shield: { em: 0.0, thermal: 0.2, kinetic: 0.4, explosive: 0.5 },
      armor: { em: 0.5, thermal: 0.35, kinetic: 0.25, explosive: 0.1 },
      hull: { em: 0.0, thermal: 0.0, kinetic: 0.0, explosive: 0.0 },
    },
  }
}

/**
 * Calculate range effectiveness based on distance
 */
export function calculateRangeEffectiveness(
  distance: number,
  optimal: number,
  falloff: number
): number {
  if (distance <= optimal) {
    return 1.0 // Full effectiveness within optimal
  }

  if (falloff === 0) {
    return 0.0 // No falloff means no damage beyond optimal
  }

  // Calculate damage reduction in falloff
  const falloffDistance = distance - optimal
  const falloffRatio = falloffDistance / falloff

  // EVE uses: damage = 0.5^((distance - optimal) / falloff)^2
  const effectiveness = Math.pow(0.5, Math.pow(falloffRatio, 2))

  return Math.max(0, effectiveness)
}

/**
 * Convert fitting data to context
 */
export function convertFittingToContext(fitting: {
  shipTypeId: number
  modules: Array<{
    typeId: number
    slotType: string
    chargeTypeId?: number
    online?: boolean
    active?: boolean
  }>
  character: {
    skills: Array<{ skillId: number; level: number; skillpoints: number }>
    attributes: {
      intelligence: number
      memory: number
      perception: number
      willpower: number
      charisma: number
    }
  }
  implants?: number[]
}): FittingContext {
  return {
    ship: {
      typeId: fitting.shipTypeId,
      attributes: {},
      effects: [],
      slots: { high: 8, med: 4, low: 4, rig: 3 },
    },
    modules: fitting.modules.map((module, index) => {
      const fitted: FittedModule = {
        typeId: module.typeId,
        slotType: module.slotType as any,
        slotIndex: index,
        state: module.active ? 'active' : module.online !== false ? 'online' : 'offline',
        attributes: {},
        effects: [],
        online: module.online !== false,
        active: module.active || false,
      }

      if (module.chargeTypeId !== undefined) {
        fitted.chargeTypeId = module.chargeTypeId
      }

      return fitted
    }),
    character: {
      characterId: 0,
      skills: fitting.character.skills,
      attributes: fitting.character.attributes,
    },
    implants: fitting.implants || [],
    boosters: [],
  }
}

/**
 * Calculate skill training time
 */
export function calculateSkillTrainingTime(
  skillId: number,
  fromLevel: number,
  toLevel: number,
  characterAttributes: {
    intelligence: number
    memory: number
    perception: number
    willpower: number
    charisma: number
  },
  implantBonuses: Record<string, number> = {}
): number {
  void skillId
  // Skill point requirements per level
  const spRequirements = [0, 250, 1414, 8000, 45255, 256000]

  // Get skill's primary and secondary attributes (simplified)
  const primaryAttribute = characterAttributes.intelligence + (implantBonuses['intelligence'] || 0)
  const secondaryAttribute = characterAttributes.memory + (implantBonuses['memory'] || 0)

  // Calculate training rate (SP per minute)
  const trainingRate = primaryAttribute + secondaryAttribute / 2

  // Calculate required SP
  let requiredSP = 0
  for (let level = fromLevel + 1; level <= toLevel; level++) {
    requiredSP += spRequirements[level] || 0
  }

  // Convert to training time in seconds
  return (requiredSP / trainingRate) * 60
}

/**
 * Format time duration to human readable string
 */
export function formatTrainingTime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)

  return parts.join(' ') || '0m'
}

/**
 * Calculate ship signature radius with modules
 */
export function calculateSignatureRadius(
  baseSignature: number,
  modules: Array<{ typeId: number; signatureModifier?: number }>
): number {
  let modifier = 1.0

  for (const fittedModule of modules) {
    if (fittedModule.signatureModifier) {
      modifier *= fittedModule.signatureModifier
    }
  }

  return baseSignature * modifier
}

/**
 * Validate implant combination
 */
export function validateImplants(implantTypeIds: number[]): {
  isValid: boolean
  conflicts: Array<{ slot: number; implants: number[] }>
  warnings: string[]
} {
  const slotUsage = new Map<number, number[]>()
  const warnings: string[] = []

  // Group implants by slot
  for (const implantId of implantTypeIds) {
    const slot = getImplantSlot(implantId)
    if (slot) {
      if (!slotUsage.has(slot)) {
        slotUsage.set(slot, [])
      }
      slotUsage.get(slot)!.push(implantId)
    }
  }

  // Check for conflicts
  const conflicts = []
  for (const [slot, implants] of slotUsage) {
    if (implants.length > 1) {
      conflicts.push({ slot, implants })
    }
  }

  // Check for suboptimal combinations
  if (implantTypeIds.length < 5) {
    warnings.push('Consider using attribute implants in all 5 slots for maximum benefit')
  }

  return {
    isValid: conflicts.length === 0,
    conflicts,
    warnings,
  }
}

/**
 * Get implant slot number from type ID
 */
export function getImplantSlot(implantTypeId: number): number | null {
  // This would map implant type IDs to their slots
  // Simplified implementation
  const slotMappings: Record<number, number> = {
    // Basic attribute implants
    9899: 1, // Intelligence
    9941: 2, // Memory
    9942: 3, // Perception
    9943: 4, // Willpower
    9944: 5, // Charisma
  }

  return slotMappings[implantTypeId] || null
}
