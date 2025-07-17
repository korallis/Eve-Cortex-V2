/**
 * Fitting Validation System
 * Validates ship fittings against character skills, ship constraints, and game rules
 */

import type {
  FittingContext,
  ModuleValidation,
  ValidationError,
  ValidationWarning,
  RequiredSkill,
  FittedModule,
  CharacterData,
} from '@/types/dogma'
import { DOGMA_ATTRIBUTES, MODULE_GROUPS, ERROR_MESSAGES } from './constants'
import { sdeIntegration } from './sde-integration'
import { AttributeCalculator } from './attribute-calculator'

export class FittingValidator {
  private attributeCalculator: AttributeCalculator

  constructor(attributeCalculator: AttributeCalculator) {
    this.attributeCalculator = attributeCalculator
  }

  /**
   * Validate a complete ship fitting
   */
  async validateFitting(context: FittingContext): Promise<{
    isValid: boolean
    errors: ValidationError[]
    warnings: ValidationWarning[]
    totalCpu: number
    totalPowergrid: number
    totalCalibration: number
    availableCpu: number
    availablePowergrid: number
    availableCalibration: number
  }> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Get ship constraints
    const shipConstraints = await sdeIntegration.getShipConstraints(context.ship.typeId)
    if (!shipConstraints) {
      errors.push({
        type: 'fitting_restriction',
        message: ERROR_MESSAGES.INVALID_SHIP_TYPE,
        moduleTypeId: context.ship.typeId,
      })
      return {
        isValid: false,
        errors,
        warnings,
        totalCpu: 0,
        totalPowergrid: 0,
        totalCalibration: 0,
        availableCpu: 0,
        availablePowergrid: 0,
        availableCalibration: 0,
      }
    }

    // Calculate ship's modified CPU/PG/Calibration values
    const shipAttributes = await this.attributeCalculator.calculateAllShipAttributes(context)
    const availableCpu = shipAttributes[DOGMA_ATTRIBUTES.CPU] || shipConstraints.cpu
    const availablePowergrid =
      shipAttributes[DOGMA_ATTRIBUTES.POWERGRID] || shipConstraints.powergrid
    const availableCalibration =
      shipAttributes[DOGMA_ATTRIBUTES.UPGRADE_CAPACITY] || shipConstraints.upgradeCapacity

    // Validate each module
    let totalCpu = 0
    let totalPowergrid = 0
    let totalCalibration = 0

    const slotUsage = {
      high: 0,
      med: 0,
      low: 0,
      rig: 0,
      launcher: 0,
      turret: 0,
    }

    for (const fittedModule of context.modules) {
      // Validate individual module
      const moduleValidation = await this.validateModule(fittedModule, context)
      errors.push(...moduleValidation.errors)
      warnings.push(...moduleValidation.warnings)

      // Accumulate resource usage
      totalCpu += moduleValidation.cpuUsage
      totalPowergrid += moduleValidation.powergridUsage

      // Count slot usage
      if (fittedModule.slotType in slotUsage) {
        slotUsage[fittedModule.slotType as keyof typeof slotUsage]++
      }

      // Add calibration for rigs
      if (fittedModule.slotType === 'rig') {
        const requirements = await this.attributeCalculator.calculateModuleRequirements(
          fittedModule.typeId,
          context
        )
        totalCalibration += requirements.calibration || 0
      }
    }

    // Validate slot constraints
    this.validateSlotConstraints(slotUsage, shipConstraints, errors)

    // Validate resource constraints
    this.validateResourceConstraints(
      totalCpu,
      totalPowergrid,
      totalCalibration,
      availableCpu,
      availablePowergrid,
      availableCalibration,
      errors
    )

    // Validate fitting combinations
    this.validateFittingCombinations(context.modules, warnings)

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalCpu,
      totalPowergrid,
      totalCalibration,
      availableCpu,
      availablePowergrid,
      availableCalibration,
    }
  }

  /**
   * Validate a single module
   */
  async validateModule(module: FittedModule, context: FittingContext): Promise<ModuleValidation> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const requiredSkills: RequiredSkill[] = []

    // Get module type data
    const moduleType = await sdeIntegration.getModuleType(module.typeId)
    if (!moduleType) {
      errors.push({
        type: 'fitting_restriction',
        message: ERROR_MESSAGES.INVALID_MODULE_TYPE,
        moduleTypeId: module.typeId,
      })
      return {
        isValid: false,
        errors,
        warnings,
        requiredSkills,
        cpuUsage: 0,
        powergridUsage: 0,
      }
    }

    // Calculate module resource requirements
    const requirements = await this.attributeCalculator.calculateModuleRequirements(
      module.typeId,
      context
    )

    // Validate required skills
    await this.validateModuleSkills(module, context.character, requiredSkills, errors, warnings)

    // Validate slot type compatibility
    this.validateSlotType(module, moduleType, errors)

    // Validate module state
    this.validateModuleState(module, moduleType, warnings)

    // Validate charge compatibility
    if (module.chargeTypeId) {
      await this.validateCharge(module, moduleType, errors, warnings)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      requiredSkills,
      cpuUsage: requirements.cpu,
      powergridUsage: requirements.powergrid,
    }
  }

  /**
   * Validate module skill requirements
   */
  private async validateModuleSkills(
    module: FittedModule,
    character: CharacterData,
    requiredSkills: RequiredSkill[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<void> {
    const moduleType = await sdeIntegration.getModuleType(module.typeId)
    if (!moduleType) return

    // Get skill requirements from module type
    // Note: This would typically come from the SDE data
    const skillRequirements = await this.getModuleSkillRequirements(module.typeId)

    for (const requirement of skillRequirements) {
      const characterSkill = character.skills.find(s => s.skillId === requirement.skillId)
      const currentLevel = characterSkill?.level || 0

      requiredSkills.push({
        skillId: requirement.skillId,
        requiredLevel: requirement.requiredLevel,
        currentLevel,
        trained: currentLevel >= requirement.requiredLevel,
      })

      if (currentLevel < requirement.requiredLevel) {
        errors.push({
          type: 'skill',
          message: `${ERROR_MESSAGES.SKILL_REQUIRED}: Level ${requirement.requiredLevel} required, have ${currentLevel}`,
          moduleTypeId: module.typeId,
          requiredValue: requirement.requiredLevel,
          currentValue: currentLevel,
        })
      } else if (currentLevel === requirement.requiredLevel) {
        warnings.push({
          type: 'skill_level',
          message: `Minimum skill level for optimal performance. Consider training higher.`,
          moduleTypeId: module.typeId,
          severity: 'low',
        })
      }
    }
  }

  /**
   * Validate slot type compatibility
   */
  private validateSlotType(module: FittedModule, moduleType: any, errors: ValidationError[]): void {
    // Get module group to determine valid slot types
    const validSlotTypes = this.getValidSlotTypes(moduleType.group_id)

    if (!validSlotTypes.includes(module.slotType)) {
      errors.push({
        type: 'slot',
        message: `${ERROR_MESSAGES.INVALID_SLOT_TYPE}: ${module.slotType}`,
        moduleTypeId: module.typeId,
      })
    }
  }

  /**
   * Validate module state
   */
  private validateModuleState(
    module: FittedModule,
    moduleType: any,
    warnings: ValidationWarning[]
  ): void {
    // Check if module can be active
    if (module.active && !this.canModuleBeActive(moduleType)) {
      warnings.push({
        type: 'fitting_conflict',
        message: 'Module cannot be activated',
        moduleTypeId: module.typeId,
        severity: 'medium',
      })
    }

    // Check if module is offline when it should be online
    if (!module.online && module.active) {
      warnings.push({
        type: 'fitting_conflict',
        message: 'Module must be online to be active',
        moduleTypeId: module.typeId,
        severity: 'high',
      })
    }
  }

  /**
   * Validate charge compatibility
   */
  private async validateCharge(
    module: FittedModule,
    moduleType: any,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<void> {
    void warnings
    if (!module.chargeTypeId) return

    const chargeType = await sdeIntegration.getModuleType(module.chargeTypeId)
    if (!chargeType) {
      errors.push({
        type: 'fitting_restriction',
        message: 'Invalid charge type',
        moduleTypeId: module.typeId,
      })
      return
    }

    // Validate charge size and compatibility
    const isCompatible = await this.isChargeCompatible(moduleType, chargeType)
    if (!isCompatible) {
      errors.push({
        type: 'fitting_restriction',
        message: 'Charge not compatible with module',
        moduleTypeId: module.typeId,
      })
    }
  }

  /**
   * Validate slot constraints
   */
  private validateSlotConstraints(
    slotUsage: Record<string, number>,
    shipConstraints: any,
    errors: ValidationError[]
  ): void {
    if ((slotUsage['high'] || 0) > shipConstraints.slots['high']) {
      errors.push({
        type: 'slot',
        message: `Too many high slot modules: ${slotUsage['high'] || 0}/${shipConstraints.slots['high']}`,
        moduleTypeId: 0,
        requiredValue: shipConstraints.slots['high'],
        currentValue: slotUsage['high'] || 0,
      })
    }

    if ((slotUsage['med'] || 0) > shipConstraints.slots['med']) {
      errors.push({
        type: 'slot',
        message: `Too many med slot modules: ${slotUsage['med'] || 0}/${shipConstraints.slots['med']}`,
        moduleTypeId: 0,
        requiredValue: shipConstraints.slots['med'],
        currentValue: slotUsage['med'] || 0,
      })
    }

    if ((slotUsage['low'] || 0) > shipConstraints.slots['low']) {
      errors.push({
        type: 'slot',
        message: `Too many low slot modules: ${slotUsage['low'] || 0}/${shipConstraints.slots['low']}`,
        moduleTypeId: 0,
        requiredValue: shipConstraints.slots['low'],
        currentValue: slotUsage['low'] || 0,
      })
    }

    if ((slotUsage['rig'] || 0) > shipConstraints.slots['rig']) {
      errors.push({
        type: 'slot',
        message: `Too many rig slot modules: ${slotUsage['rig'] || 0}/${shipConstraints.slots['rig']}`,
        moduleTypeId: 0,
        requiredValue: shipConstraints.slots['rig'],
        currentValue: slotUsage['rig'] || 0,
      })
    }
  }

  /**
   * Validate resource constraints
   */
  private validateResourceConstraints(
    totalCpu: number,
    totalPowergrid: number,
    totalCalibration: number,
    availableCpu: number,
    availablePowergrid: number,
    availableCalibration: number,
    errors: ValidationError[]
  ): void {
    if (totalCpu > availableCpu) {
      errors.push({
        type: 'cpu',
        message: `${ERROR_MESSAGES.INSUFFICIENT_CPU}: ${totalCpu.toFixed(2)}/${availableCpu.toFixed(2)}`,
        moduleTypeId: 0,
        requiredValue: totalCpu,
        currentValue: availableCpu,
      })
    }

    if (totalPowergrid > availablePowergrid) {
      errors.push({
        type: 'powergrid',
        message: `${ERROR_MESSAGES.INSUFFICIENT_POWERGRID}: ${totalPowergrid.toFixed(2)}/${availablePowergrid.toFixed(2)}`,
        moduleTypeId: 0,
        requiredValue: totalPowergrid,
        currentValue: availablePowergrid,
      })
    }

    if (totalCalibration > availableCalibration) {
      errors.push({
        type: 'fitting_restriction',
        message: `Insufficient calibration: ${totalCalibration}/${availableCalibration}`,
        moduleTypeId: 0,
        requiredValue: totalCalibration,
        currentValue: availableCalibration,
      })
    }
  }

  /**
   * Validate fitting combinations and conflicts
   */
  private validateFittingCombinations(
    modules: FittedModule[],
    warnings: ValidationWarning[]
  ): void {
    // Check for conflicting modules
    this.checkConflictingModules(modules, warnings)

    // Check for suboptimal combinations
    this.checkSuboptimalCombinations(modules, warnings)

    // Check for duplicate modules that don't stack
    this.checkNonStackingDuplicates(modules, warnings)
  }

  /**
   * Check for conflicting modules
   */
  private checkConflictingModules(modules: FittedModule[], warnings: ValidationWarning[]): void {
    // Example: Multiple prop mods
    const propMods = modules.filter(
      m =>
        this.isModuleInGroup(m.typeId, MODULE_GROUPS.AFTERBURNER) ||
        this.isModuleInGroup(m.typeId, MODULE_GROUPS.MICROWARPDRIVE)
    )

    if (propMods.length > 1) {
      warnings.push({
        type: 'fitting_conflict',
        message: 'Multiple propulsion modules detected - only one can be active',
        moduleTypeId: propMods[1]?.typeId || 0,
        severity: 'medium',
      })
    }
  }

  /**
   * Check for suboptimal combinations
   */
  private checkSuboptimalCombinations(
    modules: FittedModule[],
    warnings: ValidationWarning[]
  ): void {
    // Example: Mixing weapon types without good reason
    const weaponTypes = new Set()
    modules.forEach(module => {
      if (this.isWeaponModule(module.typeId)) {
        weaponTypes.add(this.getWeaponType(module.typeId))
      }
    })

    if (weaponTypes.size > 2) {
      warnings.push({
        type: 'suboptimal',
        message: 'Mixing many weapon types may be suboptimal',
        moduleTypeId: 0,
        severity: 'low',
      })
    }
  }

  /**
   * Check for non-stacking duplicate modules
   */
  private checkNonStackingDuplicates(modules: FittedModule[], warnings: ValidationWarning[]): void {
    const moduleTypes = new Map<number, number>()

    modules.forEach(module => {
      const count = moduleTypes.get(module.typeId) || 0
      moduleTypes.set(module.typeId, count + 1)
    })

    moduleTypes.forEach((count, typeId) => {
      if (count > 1 && !this.doesModuleStack(typeId)) {
        warnings.push({
          type: 'fitting_conflict',
          message: 'Multiple non-stacking modules of same type',
          moduleTypeId: typeId,
          severity: 'high',
        })
      }
    })
  }

  /**
   * Helper methods
   */
  private async getModuleSkillRequirements(moduleTypeId: number): Promise<
    Array<{
      skillId: number
      requiredLevel: number
    }>
  > {
    // This would typically come from SDE data
    // For now, return basic skill requirements based on module group
    const moduleType = await sdeIntegration.getModuleType(moduleTypeId)
    if (!moduleType) return []

    const requirements = []

    // Add group-specific skill requirements
    switch (moduleType.group_id) {
      case MODULE_GROUPS.ENERGY_WEAPON:
        requirements.push({ skillId: 3300, requiredLevel: 1 }) // Gunnery
        break
      case MODULE_GROUPS.SHIELD_BOOSTER:
        requirements.push({ skillId: 3416, requiredLevel: 1 }) // Shield Operation
        break
      // Add more group mappings
    }

    return requirements
  }

  private getValidSlotTypes(groupId: number): string[] {
    const slotMappings: Record<number, string[]> = {
      [MODULE_GROUPS.ENERGY_WEAPON]: ['high'],
      [MODULE_GROUPS.PROJECTILE_WEAPON]: ['high'],
      [MODULE_GROUPS.HYBRID_WEAPON]: ['high'],
      [MODULE_GROUPS.MISSILE_LAUNCHER]: ['high'],
      [MODULE_GROUPS.SHIELD_BOOSTER]: ['med'],
      [MODULE_GROUPS.ARMOR_REPAIRER]: ['low'],
      [MODULE_GROUPS.DAMAGE_CONTROL]: ['low'],
      [MODULE_GROUPS.SHIELD_RIG]: ['rig'],
      [MODULE_GROUPS.ARMOR_RIG]: ['rig'],
    }

    return slotMappings[groupId] || []
  }

  private canModuleBeActive(moduleType: any): boolean {
    // Check if module has activation effects
    return (
      moduleType.dogma_effects?.some(
        (effect: any) => effect.effect_id === 11 // Activation effect
      ) || false
    )
  }

  private async isChargeCompatible(moduleType: any, chargeType: any): Promise<boolean> {
    void moduleType
    void chargeType
    // Check charge size and type compatibility
    // This would require parsing charge size and module charge size attributes
    return true // Simplified for now
  }

  private isModuleInGroup(typeId: number, groupId: number): boolean {
    void typeId
    void groupId
    // This would check the module's group ID
    // Simplified implementation
    return false
  }

  private isWeaponModule(typeId: number): boolean {
    void typeId
    // Check if module is a weapon
    return false // Simplified
  }

  private getWeaponType(typeId: number): string {
    void typeId
    // Return weapon type classification
    return 'unknown'
  }

  private doesModuleStack(typeId: number): boolean {
    void typeId
    // Check if multiple modules of this type provide stacking benefits
    // Most modules don't stack, but some do (like damage mods with penalties)
    return true // Simplified - assume stacking for now
  }
}
