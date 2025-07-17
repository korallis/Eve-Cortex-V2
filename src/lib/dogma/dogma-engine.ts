/**
 * Dogma Calculation Engine
 * Main engine that orchestrates all Dogma calculations and provides a unified interface
 */

import type {
  FittingContext,
  DogmaCalculationResult,
  DogmaConfig,
  DogmaWarning,
  DogmaError,
  ShipPerformance,
  ModuleValidation,
  FittedModule,
} from '@/types/dogma'
import { AttributeCalculator } from './attribute-calculator'
import { FittingValidator } from './fitting-validator'
import { PerformanceCalculator } from './performance-calculator'
import { sdeIntegration } from './sde-integration'

export class DogmaEngine {
  private attributeCalculator: AttributeCalculator
  private fittingValidator: FittingValidator
  private performanceCalculator: PerformanceCalculator
  private config: DogmaConfig

  constructor(config?: Partial<DogmaConfig>) {
    this.config = {
      enableStackingPenalties: true,
      enableSkillBonuses: true,
      enableImplantBonuses: true,
      enableBoosterBonuses: false,
      precision: 2,
      cacheResults: true,
      debugMode: false,
      ...config,
    }

    this.attributeCalculator = new AttributeCalculator(this.config)
    this.fittingValidator = new FittingValidator(this.attributeCalculator)
    this.performanceCalculator = new PerformanceCalculator(this.attributeCalculator, this.config)
  }

  /**
   * Initialize the Dogma engine
   */
  async initialize(): Promise<void> {
    console.log('Initializing Dogma Engine...')

    try {
      await sdeIntegration.initialize()
      console.log('Dogma Engine initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Dogma Engine:', error)
      throw error
    }
  }

  /**
   * Calculate ship performance with full validation
   */
  async calculateShipPerformance(context: FittingContext): Promise<DogmaCalculationResult> {
    const startTime = Date.now()
    const warnings: DogmaWarning[] = []
    const errors: DogmaError[] = []

    try {
      // Validate the fitting first
      const validation = await this.fittingValidator.validateFitting(context)

      // Convert validation errors and warnings
      validation.errors.forEach(error => {
        errors.push({
          type: 'validation',
          message: error.message,
          moduleTypeId: error.moduleTypeId,
        })
      })

      validation.warnings.forEach(warning => {
        warnings.push({
          type: 'fitting',
          message: warning.message,
          severity: warning.severity as 'low' | 'medium' | 'high',
          moduleTypeId: warning.moduleTypeId,
        })
      })

      // Calculate performance even with validation errors (for partial results)
      let performance: ShipPerformance

      try {
        performance = await this.performanceCalculator.calculatePerformance(context)
      } catch (perfError) {
        errors.push({
          type: 'calculation',
          message: `Performance calculation failed: ${perfError instanceof Error ? perfError.message : 'Unknown error'}`,
        })

        // Return a default performance object
        performance = this.getDefaultPerformance()
      }

      const calculationTime = Date.now() - startTime

      return {
        success: errors.length === 0,
        performance,
        warnings,
        errors,
        calculationTime,
      }
    } catch (error) {
      const calculationTime = Date.now() - startTime

      errors.push({
        type: 'calculation',
        message: `Dogma calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })

      return {
        success: false,
        performance: this.getDefaultPerformance(),
        warnings,
        errors,
        calculationTime,
      }
    }
  }

  /**
   * Validate a ship fitting without calculating performance
   */
  async validateFitting(context: FittingContext): Promise<{
    isValid: boolean
    errors: DogmaError[]
    warnings: DogmaWarning[]
    resourceUsage: {
      cpu: { used: number; total: number; percentage: number }
      powergrid: { used: number; total: number; percentage: number }
      calibration?: { used: number; total: number; percentage: number }
    }
  }> {
    try {
      const validation = await this.fittingValidator.validateFitting(context)

      const errors: DogmaError[] = validation.errors.map(error => ({
        type: 'validation',
        message: error.message,
        moduleTypeId: error.moduleTypeId,
      }))

      const warnings: DogmaWarning[] = validation.warnings.map(warning => ({
        type: 'fitting',
        message: warning.message,
        severity: warning.severity as 'low' | 'medium' | 'high',
        moduleTypeId: warning.moduleTypeId,
      }))

      const resourceUsage = {
        cpu: {
          used: validation.totalCpu,
          total: validation.availableCpu,
          percentage: (validation.totalCpu / validation.availableCpu) * 100,
        },
        powergrid: {
          used: validation.totalPowergrid,
          total: validation.availablePowergrid,
          percentage: (validation.totalPowergrid / validation.availablePowergrid) * 100,
        },
        ...(validation.totalCalibration > 0 && {
          calibration: {
            used: validation.totalCalibration,
            total: validation.availableCalibration,
            percentage: (validation.totalCalibration / validation.availableCalibration) * 100,
          },
        }),
      }

      return {
        isValid: validation.isValid,
        errors,
        warnings,
        resourceUsage,
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [
          {
            type: 'validation',
            message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        warnings: [],
        resourceUsage: {
          cpu: { used: 0, total: 0, percentage: 0 },
          powergrid: { used: 0, total: 0, percentage: 0 },
        },
      }
    }
  }

  /**
   * Validate a single module
   */
  async validateModule(
    moduleTypeId: number,
    slotType: 'high' | 'med' | 'low' | 'rig' | 'subsystem',
    context: FittingContext
  ): Promise<ModuleValidation> {
    const fittedModule = {
      typeId: moduleTypeId,
      slotType,
      slotIndex: 0,
      state: 'online' as const,
      attributes: {},
      effects: [],
      online: true,
      active: false,
    } as FittedModule

    return this.fittingValidator.validateModule(fittedModule, context)
  }

  /**
   * Calculate attribute value with character modifiers
   */
  async calculateAttribute(attributeId: number, baseValue: number, context: FittingContext) {
    return this.attributeCalculator.calculateAttribute(attributeId, baseValue, context)
  }

  /**
   * Get ship constraints and capabilities
   */
  async getShipConstraints(shipTypeId: number) {
    return sdeIntegration.getShipConstraints(shipTypeId)
  }

  /**
   * Get module fitting requirements
   */
  async getModuleRequirements(moduleTypeId: number, context: FittingContext) {
    return this.attributeCalculator.calculateModuleRequirements(moduleTypeId, context)
  }

  /**
   * Search for ship or module types
   */
  async searchTypes(query: string, limit: number = 50) {
    return sdeIntegration.searchTypes(query, limit)
  }

  /**
   * Get types by group
   */
  async getTypesByGroup(groupId: number) {
    return sdeIntegration.getTypesByGroup(groupId)
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<DogmaConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.attributeCalculator = new AttributeCalculator(this.config)
    this.performanceCalculator = new PerformanceCalculator(this.attributeCalculator, this.config)
  }

  /**
   * Get current configuration
   */
  getConfig(): DogmaConfig {
    return { ...this.config }
  }

  /**
   * Get SDE cache statistics
   */
  async getCacheStats() {
    return sdeIntegration.getCacheStats()
  }

  /**
   * Refresh SDE data
   */
  async refreshSDE(): Promise<void> {
    await sdeIntegration.refresh()
  }

  /**
   * Check if engine is ready
   */
  async isReady(): Promise<boolean> {
    try {
      const stats = await this.getCacheStats()
      return stats.typesCount > 0
    } catch {
      return false
    }
  }

  /**
   * Get health status of the Dogma engine
   */
  async getHealthStatus(): Promise<{
    healthy: boolean
    sdeLoaded: boolean
    typesCount: number
    lastUpdated: Date | null
    errors: string[]
  }> {
    try {
      const stats = await this.getCacheStats()
      const errors: string[] = []

      if (stats.typesCount === 0) {
        errors.push('No ship/module types loaded')
      }

      if (stats.attributesCount === 0) {
        errors.push('No Dogma attributes loaded')
      }

      const healthy = errors.length === 0

      return {
        healthy,
        sdeLoaded: stats.typesCount > 0,
        typesCount: stats.typesCount,
        lastUpdated: stats.lastUpdated,
        errors,
      }
    } catch (error) {
      return {
        healthy: false,
        sdeLoaded: false,
        typesCount: 0,
        lastUpdated: null,
        errors: [
          `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      }
    }
  }

  /**
   * Create a fitting context from character and ship data
   */
  createFittingContext(
    shipTypeId: number,
    modules: Array<{
      typeId: number
      slotType: 'high' | 'med' | 'low' | 'rig' | 'subsystem'
      chargeTypeId?: number
      online?: boolean
      active?: boolean
    }>,
    characterData: {
      characterId: number
      skills: Array<{ skillId: number; level: number; skillpoints: number }>
      attributes: {
        intelligence: number
        memory: number
        perception: number
        willpower: number
        charisma: number
      }
    },
    implants: number[] = [],
    boosters: any[] = []
  ): FittingContext {
    const ship = {
      typeId: shipTypeId,
      attributes: {},
      effects: [],
      slots: {
        high: 8,
        med: 4,
        low: 4,
        rig: 3,
      },
    }

    const fittedModules = modules.map((fittingModule, index) => {
      const fitted: FittedModule = {
        typeId: fittingModule.typeId,
        slotType: fittingModule.slotType,
        slotIndex: index,
        state: fittingModule.active
          ? ('active' as const)
          : fittingModule.online !== false
            ? ('online' as const)
            : ('offline' as const),
        attributes: {},
        effects: [],
        online: fittingModule.online !== false,
        active: fittingModule.active || false,
      }

      if (fittingModule.chargeTypeId !== undefined) {
        fitted.chargeTypeId = fittingModule.chargeTypeId
      }

      return fitted
    })

    return {
      ship,
      modules: fittedModules,
      character: characterData,
      implants,
      boosters,
    }
  }

  /**
   * Get default performance object for error cases
   */
  private getDefaultPerformance(): ShipPerformance {
    return {
      ehp: {
        shield: 0,
        armor: 0,
        hull: 0,
        total: 0,
        shieldResistances: { em: 0, thermal: 0, kinetic: 0, explosive: 0 },
        armorResistances: { em: 0, thermal: 0, kinetic: 0, explosive: 0 },
        hullResistances: { em: 0, thermal: 0, kinetic: 0, explosive: 0 },
        shieldRecharge: 0,
      },
      dps: {
        total: 0,
        weapon: [],
        em: 0,
        thermal: 0,
        kinetic: 0,
        explosive: 0,
        optimal: 0,
        falloff: 0,
        effective: 0,
      },
      speed: {
        maxVelocity: 0,
        acceleration: 0,
        agility: 0,
        warpSpeed: 0,
      },
      capacitor: {
        capacity: 0,
        rechargeRate: 0,
        stable: false,
        peakRecharge: 0,
        usage: [],
      },
      targeting: {
        maxTargets: 0,
        maxRange: 0,
        scanResolution: 0,
        signatureRadius: 0,
        lockTime: 0,
      },
      cost: 0,
      fittingUsed: {
        cpu: { used: 0, total: 0, percentage: 0 },
        powergrid: { used: 0, total: 0, percentage: 0 },
      },
    }
  }
}

// Export singleton instance with default configuration
export const dogmaEngine = new DogmaEngine()
