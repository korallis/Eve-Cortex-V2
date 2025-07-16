/**
 * Dogma Attribute Calculator
 * Handles ship and module attribute calculations with character modifiers
 */

import type {
  FittingContext,
  CharacterModifier,
  ModifierOperation,
  AttributeCalculation,
  AttributeModifier,
  DogmaConfig,
  SkillBonus,
} from '@/types/dogma'
import { DOGMA_ATTRIBUTES, STACKING_PENALTY } from './constants'
import { sdeIntegration } from './sde-integration'

export class AttributeCalculator {
  private config: DogmaConfig

  constructor(config: DogmaConfig) {
    this.config = config
  }

  /**
   * Calculate final attribute value with all modifiers applied
   */
  async calculateAttribute(
    attributeId: number,
    baseValue: number,
    context: FittingContext,
    sourceModifiers?: CharacterModifier[]
  ): Promise<AttributeCalculation> {
    const calculation: AttributeCalculation = {
      attributeId,
      baseValue,
      modifiedValue: baseValue,
      modifiers: [],
    }

    // Collect all modifiers for this attribute
    const modifiers = await this.collectModifiers(attributeId, context, sourceModifiers)

    // Apply modifiers in the correct order
    calculation.modifiedValue = this.applyModifiers(baseValue, modifiers)
    calculation.modifiers = modifiers

    return calculation
  }

  /**
   * Collect all modifiers that affect a specific attribute
   */
  private async collectModifiers(
    attributeId: number,
    context: FittingContext,
    sourceModifiers?: CharacterModifier[]
  ): Promise<AttributeModifier[]> {
    const modifiers: AttributeModifier[] = []

    // Ship base modifiers
    const shipModifiers = await this.getShipModifiers(attributeId, context.ship)
    modifiers.push(...shipModifiers)

    // Module modifiers
    for (const fittedModule of context.modules) {
      if (fittedModule.online || fittedModule.active) {
        const moduleModifiers = await this.getModuleModifiers(attributeId, fittedModule, context)
        modifiers.push(...moduleModifiers)
      }
    }

    // Character skill modifiers
    if (this.config.enableSkillBonuses) {
      const skillModifiers = await this.getSkillModifiers(
        attributeId,
        context.character,
        context.ship
      )
      modifiers.push(...skillModifiers)
    }

    // Implant modifiers
    if (this.config.enableImplantBonuses) {
      const implantModifiers = await this.getImplantModifiers(attributeId, context.implants)
      modifiers.push(...implantModifiers)
    }

    // Booster modifiers
    if (this.config.enableBoosterBonuses && context.boosters) {
      const boosterModifiers = await this.getBoosterModifiers(attributeId, context.boosters)
      modifiers.push(...boosterModifiers)
    }

    // External modifiers (from sourceModifiers parameter)
    if (sourceModifiers) {
      const externalModifiers = sourceModifiers
        .filter(mod => mod.attributeId === attributeId)
        .map(mod => this.convertToAttributeModifier(mod))
      modifiers.push(...externalModifiers)
    }

    return modifiers
  }

  /**
   * Get ship-based modifiers for an attribute
   */
  private async getShipModifiers(attributeId: number, ship: any): Promise<AttributeModifier[]> {
    void attributeId
    void ship
    const modifiers: AttributeModifier[] = []

    // Ship may have built-in bonuses that affect certain attributes
    // This would require parsing ship effects and bonuses

    return modifiers
  }

  /**
   * Get module-based modifiers for an attribute
   */
  private async getModuleModifiers(
    attributeId: number,
    fittedModule: any,
    context: FittingContext
  ): Promise<AttributeModifier[]> {
    void context
    const modifiers: AttributeModifier[] = []

    // Get module type data
    const moduleType = await sdeIntegration.getModuleType(fittedModule.typeId)
    if (!moduleType?.dogma_attributes) return modifiers

    // Check if this module affects the target attribute
    for (const attr of moduleType.dogma_attributes) {
      // This is a simplified example - real implementation would parse effects
      if (this.isModifierAttribute(attr.attribute_id, attributeId)) {
        modifiers.push({
          sourceType: 'module',
          sourceId: fittedModule.typeId,
          operation: this.getModifierOperation(attr.attribute_id),
          value: attr.value,
        })
      }
    }

    return modifiers
  }

  /**
   * Get skill-based modifiers for an attribute
   */
  private async getSkillModifiers(
    attributeId: number,
    character: any,
    ship: any
  ): Promise<AttributeModifier[]> {
    // Avoid unused parameter warnings
    void attributeId
    const modifiers: AttributeModifier[] = []

    // Get ship type to determine skill bonuses
    const shipType = await sdeIntegration.getShipType(ship.typeId)
    if (!shipType) return modifiers

    // Apply ship-specific skill bonuses
    const shipBonuses = await this.getShipSkillBonuses(shipType)

    for (const bonus of shipBonuses) {
      if (bonus.attributeId === attributeId) {
        const skill = character.skills.find((s: any) => s.skillId === bonus.skillId)
        if (skill) {
          const bonusValue = this.calculateSkillBonus(bonus, skill.level)
          modifiers.push({
            sourceType: 'skill',
            sourceId: bonus.skillId,
            operation: bonus.bonusType === 'linear' ? 'percent' : 'multiply',
            value: bonusValue,
          })
        }
      }
    }

    return modifiers
  }

  /**
   * Get implant-based modifiers for an attribute
   */
  private async getImplantModifiers(
    attributeId: number,
    implants: number[]
  ): Promise<AttributeModifier[]> {
    const modifiers: AttributeModifier[] = []

    for (const implantTypeId of implants) {
      const implantType = await sdeIntegration.getModuleType(implantTypeId)
      if (!implantType?.dogma_attributes) continue

      for (const attr of implantType.dogma_attributes) {
        if (this.isModifierAttribute(attr.attribute_id, attributeId)) {
          modifiers.push({
            sourceType: 'implant',
            sourceId: implantTypeId,
            operation: this.getModifierOperation(attr.attribute_id),
            value: attr.value,
          })
        }
      }
    }

    return modifiers
  }

  /**
   * Get booster-based modifiers for an attribute
   */
  private async getBoosterModifiers(
    attributeId: number,
    boosters: any[]
  ): Promise<AttributeModifier[]> {
    const modifiers: AttributeModifier[] = []

    for (const booster of boosters) {
      if (booster.attributeModifiers && booster.attributeModifiers[attributeId]) {
        modifiers.push({
          sourceType: 'booster',
          sourceId: booster.typeId,
          operation: 'percent',
          value: booster.attributeModifiers[attributeId],
        })
      }
    }

    return modifiers
  }

  /**
   * Apply all modifiers to a base value
   */
  private applyModifiers(baseValue: number, modifiers: AttributeModifier[]): number {
    // Sort modifiers by operation type for correct order of operations
    const addModifiers = modifiers.filter(m => m.operation === 'add')
    const multiplyModifiers = modifiers.filter(m => m.operation === 'multiply')
    const percentModifiers = modifiers.filter(m => m.operation === 'percent')
    const setModifiers = modifiers.filter(m => m.operation === 'set')

    let result = baseValue

    // Apply set modifiers first (they override base value)
    for (const modifier of setModifiers) {
      result = modifier.value
    }

    // Apply additive modifiers
    for (const modifier of addModifiers) {
      result += modifier.value
    }

    // Apply percentage modifiers with stacking penalties
    if (percentModifiers.length > 0 && this.config.enableStackingPenalties) {
      result = this.applyStackingPenalties(result, percentModifiers)
    } else {
      // Apply percentage modifiers without stacking penalties
      for (const modifier of percentModifiers) {
        result *= 1 + modifier.value / 100
      }
    }

    // Apply multiplicative modifiers
    for (const modifier of multiplyModifiers) {
      result *= modifier.value
    }

    return Number(result.toFixed(this.config.precision))
  }

  /**
   * Apply stacking penalties to percentage modifiers
   */
  private applyStackingPenalties(baseValue: number, modifiers: AttributeModifier[]): number {
    // Sort modifiers by effectiveness (highest first)
    const sortedModifiers = [...modifiers].sort((a, b) => Math.abs(b.value) - Math.abs(a.value))

    let result = baseValue

    for (let i = 0; i < sortedModifiers.length && i < STACKING_PENALTY.MAX_MODULES; i++) {
      const modifier = sortedModifiers[i]
      if (modifier) {
        const penalty = STACKING_PENALTY.MULTIPLIERS[i] || 0
        const effectiveBonus = modifier.value * penalty

        // Store stacking penalty for debugging
        modifier.stackingPenalty = penalty

        result *= 1 + effectiveBonus / 100
      }
    }

    return result
  }

  /**
   * Get ship-specific skill bonuses
   */
  private async getShipSkillBonuses(shipType: any): Promise<SkillBonus[]> {
    const bonuses: SkillBonus[] = []

    // This would typically parse ship traits and role bonuses
    // For now, we'll use some common examples

    // Example: Amarr Frigate skill bonus (5% damage per level)
    if (shipType.group_id === 25) {
      // Frigate group
      bonuses.push({
        skillId: 3327, // Spaceship Command skill
        bonusType: 'linear',
        perLevel: 5, // 5% per level
        attributeId: DOGMA_ATTRIBUTES.DAMAGE_MULTIPLIER,
        maxLevel: 5,
      })
    }

    return bonuses
  }

  /**
   * Calculate skill bonus value
   */
  private calculateSkillBonus(bonus: SkillBonus, skillLevel: number): number {
    const level = Math.min(skillLevel, bonus.maxLevel || 5)

    switch (bonus.bonusType) {
      case 'linear':
        return bonus.perLevel * level
      case 'exponential':
        return bonus.perLevel * Math.pow(level, 2)
      case 'threshold':
        return level >= (bonus.maxLevel || 5) ? bonus.perLevel : 0
      default:
        return 0
    }
  }

  /**
   * Check if an attribute ID modifies another attribute
   */
  private isModifierAttribute(modifierAttributeId: number, targetAttributeId: number): boolean {
    // This would contain the mapping of modifier attributes to target attributes
    // For example, a module with damageMultiplier attribute affects weapon damage

    const modifierMappings: Record<number, number[]> = {
      [DOGMA_ATTRIBUTES.DAMAGE_MULTIPLIER]: [
        DOGMA_ATTRIBUTES.EM_DAMAGE,
        DOGMA_ATTRIBUTES.THERMAL_DAMAGE,
        DOGMA_ATTRIBUTES.KINETIC_DAMAGE,
        DOGMA_ATTRIBUTES.EXPLOSIVE_DAMAGE,
      ],
      // Add more mappings as needed
    }

    return modifierMappings[modifierAttributeId]?.includes(targetAttributeId) || false
  }

  /**
   * Get modifier operation type for an attribute
   */
  private getModifierOperation(attributeId: number): ModifierOperation {
    // Different attributes use different modifier operations
    const percentAttributes = [
      DOGMA_ATTRIBUTES.DAMAGE_MULTIPLIER,
      DOGMA_ATTRIBUTES.SHIELD_EM_RESIST as number,
      DOGMA_ATTRIBUTES.SHIELD_THERMAL_RESIST as number,
      // Add more percentage-based attributes
    ]

    if (percentAttributes.includes(attributeId)) {
      return 'percent'
    }

    return 'add' // Default to additive
  }

  /**
   * Convert character modifier to attribute modifier
   */
  private convertToAttributeModifier(modifier: CharacterModifier): AttributeModifier {
    return {
      sourceType: modifier.type,
      sourceId: modifier.sourceId,
      operation: modifier.operation,
      value: modifier.modifier,
    }
  }

  /**
   * Get all ship attributes with calculated values
   */
  async calculateAllShipAttributes(context: FittingContext): Promise<Record<number, number>> {
    const ship = await sdeIntegration.getShipType(context.ship.typeId)
    if (!ship?.dogma_attributes) return {}

    const results: Record<number, number> = {}

    for (const attr of ship.dogma_attributes) {
      const calculation = await this.calculateAttribute(attr.attribute_id, attr.value, context)
      results[attr.attribute_id] = calculation.modifiedValue
    }

    return results
  }

  /**
   * Calculate module fitting requirements
   */
  async calculateModuleRequirements(
    moduleTypeId: number,
    context: FittingContext
  ): Promise<{
    cpu: number
    powergrid: number
    calibration?: number
  }> {
    const moduleType = await sdeIntegration.getModuleType(moduleTypeId)
    if (!moduleType?.dogma_attributes) {
      return { cpu: 0, powergrid: 0 }
    }

    const getAttributeValue = (attributeId: number): number => {
      const attr = moduleType.dogma_attributes?.find(a => a.attribute_id === attributeId)
      return attr?.value || 0
    }

    const baseCpu = getAttributeValue(DOGMA_ATTRIBUTES.CPU_USAGE)
    const basePowergrid = getAttributeValue(DOGMA_ATTRIBUTES.POWERGRID_USAGE)
    const baseCalibration = getAttributeValue(DOGMA_ATTRIBUTES.UPGRADE_CAPACITY)

    // Apply character modifiers to fitting requirements
    const cpuCalc = await this.calculateAttribute(DOGMA_ATTRIBUTES.CPU_USAGE, baseCpu, context)
    const pgCalc = await this.calculateAttribute(
      DOGMA_ATTRIBUTES.POWERGRID_USAGE,
      basePowergrid,
      context
    )

    const result: { cpu: number; powergrid: number; calibration?: number } = {
      cpu: cpuCalc.modifiedValue,
      powergrid: pgCalc.modifiedValue,
    }

    if (baseCalibration > 0) {
      const calCalc = await this.calculateAttribute(
        DOGMA_ATTRIBUTES.UPGRADE_CAPACITY,
        baseCalibration,
        context
      )
      result.calibration = calCalc.modifiedValue
    }

    return result
  }
}
