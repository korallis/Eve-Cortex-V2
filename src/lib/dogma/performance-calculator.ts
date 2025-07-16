/**
 * Ship Performance Calculator
 * Calculates comprehensive ship performance metrics using Dogma system
 */

import type {
  FittingContext,
  ShipPerformance,
  EffectiveHitPoints,
  DamagePerSecond,
  SpeedMetrics,
  CapacitorMetrics,
  TargetingMetrics,
  DamageResistances,
  WeaponDPS,
  CapacitorUsage,
  FittingUsage,
  DogmaConfig,
} from '@/types/dogma'
import { DOGMA_ATTRIBUTES, DEFAULTS, CALCULATION_PRECISION } from './constants'
import { AttributeCalculator } from './attribute-calculator'
import { sdeIntegration } from './sde-integration'

export class PerformanceCalculator {
  private attributeCalculator: AttributeCalculator
  private config: DogmaConfig

  constructor(attributeCalculator: AttributeCalculator, config: DogmaConfig) {
    this.attributeCalculator = attributeCalculator
    this.config = config
    void this.config
  }

  /**
   * Calculate comprehensive ship performance metrics
   */
  async calculatePerformance(context: FittingContext): Promise<ShipPerformance> {
    // Calculate all ship attributes with modifiers
    const shipAttributes = await this.attributeCalculator.calculateAllShipAttributes(context)

    // Calculate individual performance metrics
    const [ehp, dps, speed, capacitor, targeting, fittingUsage] = await Promise.all([
      this.calculateEHP(shipAttributes, context),
      this.calculateDPS(shipAttributes, context),
      this.calculateSpeed(shipAttributes, context),
      this.calculateCapacitor(shipAttributes, context),
      this.calculateTargeting(shipAttributes, context),
      this.calculateFittingUsage(shipAttributes, context),
    ])

    // Calculate estimated fitting cost
    const cost = await this.calculateFittingCost(context)

    return {
      ehp,
      dps,
      speed,
      capacitor,
      targeting,
      cost,
      fittingUsed: fittingUsage,
    }
  }

  /**
   * Calculate Effective Hit Points (EHP)
   */
  private async calculateEHP(
    shipAttributes: Record<number, number>,
    context: FittingContext
  ): Promise<EffectiveHitPoints> {
    // Get base HP values
    const shieldHP = shipAttributes[DOGMA_ATTRIBUTES.SHIELD_HP] || 0
    const armorHP = shipAttributes[DOGMA_ATTRIBUTES.ARMOR_HP] || 0
    const hullHP = shipAttributes[DOGMA_ATTRIBUTES.HP] || 0

    // Calculate resistances
    const shieldResistances = this.calculateResistances(shipAttributes, 'shield')
    const armorResistances = this.calculateResistances(shipAttributes, 'armor')
    const hullResistances = this.calculateResistances(shipAttributes, 'hull')

    // Calculate effective HP considering resistances
    const shieldEHP = this.calculateEffectiveHP(shieldHP, shieldResistances)
    const armorEHP = this.calculateEffectiveHP(armorHP, armorResistances)
    const hullEHP = this.calculateEffectiveHP(hullHP, hullResistances)

    // Calculate shield recharge rate
    const shieldRecharge = this.calculateShieldRecharge(shieldHP, shipAttributes)

    // Calculate repair rates from modules
    const armorRepair = await this.calculateArmorRepairRate(context)
    const hullRepair = await this.calculateHullRepairRate(context)

    return {
      shield: shieldEHP,
      armor: armorEHP,
      hull: hullEHP,
      total: shieldEHP + armorEHP + hullEHP,
      shieldResistances,
      armorResistances,
      hullResistances,
      shieldRecharge,
      ...(armorRepair > 0 && { armorRepair }),
      ...(hullRepair > 0 && { hullRepair }),
    }
  }

  /**
   * Calculate damage resistances for a defense layer
   */
  private calculateResistances(
    shipAttributes: Record<number, number>,
    layer: 'shield' | 'armor' | 'hull'
  ): DamageResistances {
    const getResistanceValue = (damageType: 'em' | 'thermal' | 'kinetic' | 'explosive'): number => {
      let attributeId: number

      switch (layer) {
        case 'shield':
          attributeId = {
            em: DOGMA_ATTRIBUTES.SHIELD_EM_RESIST,
            thermal: DOGMA_ATTRIBUTES.SHIELD_THERMAL_RESIST,
            kinetic: DOGMA_ATTRIBUTES.SHIELD_KINETIC_RESIST,
            explosive: DOGMA_ATTRIBUTES.SHIELD_EXPLOSIVE_RESIST,
          }[damageType]
          break
        case 'armor':
          attributeId = {
            em: DOGMA_ATTRIBUTES.ARMOR_EM_RESIST,
            thermal: DOGMA_ATTRIBUTES.ARMOR_THERMAL_RESIST,
            kinetic: DOGMA_ATTRIBUTES.ARMOR_KINETIC_RESIST,
            explosive: DOGMA_ATTRIBUTES.ARMOR_EXPLOSIVE_RESIST,
          }[damageType]
          break
        case 'hull':
          attributeId = {
            em: DOGMA_ATTRIBUTES.HULL_EM_RESIST,
            thermal: DOGMA_ATTRIBUTES.HULL_THERMAL_RESIST,
            kinetic: DOGMA_ATTRIBUTES.HULL_KINETIC_RESIST,
            explosive: DOGMA_ATTRIBUTES.HULL_EXPLOSIVE_RESIST,
          }[damageType]
          break
      }

      const resistance = shipAttributes[attributeId] || 0
      return Math.max(0, Math.min(1, resistance)) // Clamp between 0 and 1
    }

    return {
      em: getResistanceValue('em'),
      thermal: getResistanceValue('thermal'),
      kinetic: getResistanceValue('kinetic'),
      explosive: getResistanceValue('explosive'),
    }
  }

  /**
   * Calculate effective HP considering average resistance
   */
  private calculateEffectiveHP(baseHP: number, resistances: DamageResistances): number {
    if (baseHP === 0) return 0

    // Calculate average resistance (weighted equally across damage types)
    const avgResistance =
      (resistances.em + resistances.thermal + resistances.kinetic + resistances.explosive) / 4

    // EHP = HP / (1 - resistance)
    return Number((baseHP / (1 - avgResistance)).toFixed(CALCULATION_PRECISION.HP))
  }

  /**
   * Calculate shield recharge rate
   */
  private calculateShieldRecharge(
    shieldHP: number,
    shipAttributes: Record<number, number>
  ): number {
    if (shieldHP === 0) return 0

    const rechargeTime =
      shipAttributes[DOGMA_ATTRIBUTES.CAPACITOR_RECHARGE] || DEFAULTS.SHIELD_RECHARGE_TIME

    // Shield recharge follows a specific curve, peak recharge is at ~25% shield
    // Simplified calculation: average recharge rate
    const averageRechargeRate = shieldHP / (rechargeTime / 1000) // HP per second

    return Number(averageRechargeRate.toFixed(CALCULATION_PRECISION.HP))
  }

  /**
   * Calculate armor repair rate from modules
   */
  private async calculateArmorRepairRate(context: FittingContext): Promise<number> {
    let totalRepairRate = 0

    for (const fittedModule of context.modules) {
      if (fittedModule.active) {
        const moduleType = await sdeIntegration.getModuleType(fittedModule.typeId)
        if (moduleType && this.isArmorRepairer(moduleType.group_id)) {
          const repairAmount = await this.getModuleRepairAmount(fittedModule.typeId, context)
          const cycleTime = await this.getModuleCycleTime(fittedModule.typeId, context)
          totalRepairRate += repairAmount / (cycleTime / 1000)
        }
      }
    }

    return Number(totalRepairRate.toFixed(CALCULATION_PRECISION.HP))
  }

  /**
   * Calculate hull repair rate from modules
   */
  private async calculateHullRepairRate(context: FittingContext): Promise<number> {
    let totalRepairRate = 0

    for (const fittedModule of context.modules) {
      if (fittedModule.active) {
        const moduleType = await sdeIntegration.getModuleType(fittedModule.typeId)
        if (moduleType && this.isHullRepairer(moduleType.group_id)) {
          const repairAmount = await this.getModuleRepairAmount(fittedModule.typeId, context)
          const cycleTime = await this.getModuleCycleTime(fittedModule.typeId, context)
          totalRepairRate += repairAmount / (cycleTime / 1000)
        }
      }
    }

    return Number(totalRepairRate.toFixed(CALCULATION_PRECISION.HP))
  }

  /**
   * Calculate Damage Per Second (DPS)
   */
  private async calculateDPS(
    shipAttributes: Record<number, number>,
    context: FittingContext
  ): Promise<DamagePerSecond> {
    void shipAttributes
    const weapons: WeaponDPS[] = []
    let totalDPS = 0

    // Calculate DPS for each weapon module
    for (const fittedModule of context.modules) {
      if (fittedModule.active) {
        const moduleType = await sdeIntegration.getModuleType(fittedModule.typeId)
        if (moduleType && this.isWeaponModule(moduleType.group_id)) {
          const weaponDPS = await this.calculateWeaponDPS(fittedModule, context)
          if (weaponDPS) {
            weapons.push(weaponDPS)
            totalDPS += weaponDPS.dps
          }
        }
      }
    }

    // Calculate damage type breakdown
    const damageBreakdown = this.calculateDamageTypeBreakdown(weapons)

    // Calculate range metrics
    const rangeMetrics = this.calculateRangeMetrics(weapons)

    return {
      total: Number(totalDPS.toFixed(CALCULATION_PRECISION.DAMAGE)),
      weapon: weapons,
      ...damageBreakdown,
      ...rangeMetrics,
    }
  }

  /**
   * Calculate DPS for a weapon module
   */
  private async calculateWeaponDPS(
    fittedModule: any,
    context: FittingContext
  ): Promise<WeaponDPS | null> {
    const moduleType = await sdeIntegration.getModuleType(fittedModule.typeId)
    if (!moduleType?.dogma_attributes) return null

    // Get weapon attributes
    const damageMultiplier = await this.getWeaponAttribute(
      fittedModule.typeId,
      DOGMA_ATTRIBUTES.DAMAGE_MULTIPLIER,
      context
    )
    const rateOfFire = await this.getWeaponAttribute(
      fittedModule.typeId,
      DOGMA_ATTRIBUTES.RATE_OF_FIRE,
      context
    )
    const optimalRange = await this.getWeaponAttribute(
      fittedModule.typeId,
      DOGMA_ATTRIBUTES.OPTIMAL_RANGE,
      context
    )
    const falloffRange = await this.getWeaponAttribute(
      fittedModule.typeId,
      DOGMA_ATTRIBUTES.FALLOFF_RANGE,
      context
    )
    const tracking = await this.getWeaponAttribute(
      fittedModule.typeId,
      DOGMA_ATTRIBUTES.TRACKING_SPEED,
      context
    )

    // Calculate damage values
    const baseDamage = await this.getBaseDamage(fittedModule.typeId, fittedModule.chargeTypeId)
    void falloffRange // Avoid unused variable warning
    const modifiedDamage = baseDamage * (damageMultiplier / 100)
    const cycleTime = rateOfFire / 1000 // Convert to seconds
    const dps = modifiedDamage / cycleTime

    // Get damage type breakdown
    const damageTypes = await this.getWeaponDamageTypes(
      fittedModule.typeId,
      fittedModule.chargeTypeId
    )

    return {
      groupName: this.getWeaponGroupName(moduleType.group_id),
      dps: Number(dps.toFixed(CALCULATION_PRECISION.DAMAGE)),
      alpha: Number(modifiedDamage.toFixed(CALCULATION_PRECISION.DAMAGE)),
      rof: Number(cycleTime.toFixed(CALCULATION_PRECISION.TIME)),
      range: Number(optimalRange.toFixed(CALCULATION_PRECISION.DAMAGE)),
      tracking: tracking ? Number(tracking.toFixed(CALCULATION_PRECISION.DAMAGE)) : 0,
      damageTypes,
    }
  }

  /**
   * Calculate Speed Metrics
   */
  private async calculateSpeed(
    shipAttributes: Record<number, number>,
    context: FittingContext
  ): Promise<SpeedMetrics> {
    void context // Avoid unused parameter warning
    const maxVelocity = shipAttributes[DOGMA_ATTRIBUTES.MAX_VELOCITY] || 0
    const mass = shipAttributes[DOGMA_ATTRIBUTES.MASS] || 1000000 // 1M kg default
    const agility = shipAttributes[DOGMA_ATTRIBUTES.AGILITY] || 1
    const warpSpeed =
      (shipAttributes[DOGMA_ATTRIBUTES.WARP_SPEED_MULTIPLIER] || 1) * DEFAULTS.WARP_SPEED

    // Calculate acceleration (simplified)
    const acceleration = maxVelocity / 10 // m/s²

    // Calculate align time: time = -ln(0.25) * mass * agility / 1000000
    const alignTime = (-Math.log(0.25) * mass * agility) / 1000000

    return {
      maxVelocity: Number(maxVelocity.toFixed(CALCULATION_PRECISION.SPEED)),
      acceleration: Number(acceleration.toFixed(CALCULATION_PRECISION.SPEED)),
      agility: Number(alignTime.toFixed(CALCULATION_PRECISION.TIME)),
      warpSpeed: Number(warpSpeed.toFixed(CALCULATION_PRECISION.SPEED)),
    }
  }

  /**
   * Calculate Capacitor Metrics
   */
  private async calculateCapacitor(
    shipAttributes: Record<number, number>,
    context: FittingContext
  ): Promise<CapacitorMetrics> {
    const capacity = shipAttributes[DOGMA_ATTRIBUTES.CAPACITOR_CAPACITY] || 0
    const rechargeTime =
      shipAttributes[DOGMA_ATTRIBUTES.CAPACITOR_RECHARGE] || DEFAULTS.CAPACITOR_RECHARGE_TIME

    // Calculate recharge rate (peak recharge at 25% cap)
    const rechargeRate = (capacity * 2.5) / (rechargeTime / 1000) // GJ/s at peak

    // Calculate capacitor usage from active modules
    const usage = await this.calculateCapacitorUsage(context)
    const totalUsage = usage.reduce((sum, u) => sum + u.usage, 0)

    // Determine if capacitor is stable
    const stable = totalUsage <= rechargeRate * 0.25 // Conservative estimate
    const stableTime = stable ? 0 : capacity / (totalUsage - rechargeRate * 0.25)

    return {
      capacity: Number(capacity.toFixed(CALCULATION_PRECISION.CAPACITOR)),
      rechargeRate: Number(rechargeRate.toFixed(CALCULATION_PRECISION.CAPACITOR)),
      stable,
      stableTime: stableTime ? Number(stableTime.toFixed(CALCULATION_PRECISION.TIME)) : 0,
      peakRecharge: Number((rechargeRate * 0.25).toFixed(CALCULATION_PRECISION.CAPACITOR)),
      usage,
    }
  }

  /**
   * Calculate Targeting Metrics
   */
  private async calculateTargeting(
    shipAttributes: Record<number, number>,
    context: FittingContext
  ): Promise<TargetingMetrics> {
    void context // Avoid unused parameter warning
    const maxTargets = shipAttributes[DOGMA_ATTRIBUTES.MAX_TARGETS] || 1
    const maxRange = shipAttributes[DOGMA_ATTRIBUTES.MAX_TARGET_RANGE] || 0
    const scanResolution = shipAttributes[DOGMA_ATTRIBUTES.SCAN_RESOLUTION] || 100
    const signatureRadius = shipAttributes[DOGMA_ATTRIBUTES.SIGNATURE_RADIUS] || 100

    // Calculate average lock time (simplified formula)
    const lockTime = 40000 / (scanResolution * Math.asinh(signatureRadius)) ** 2

    return {
      maxTargets: Number(maxTargets.toFixed(0)),
      maxRange: Number((maxRange / 1000).toFixed(CALCULATION_PRECISION.DAMAGE)), // Convert to km
      scanResolution: Number(scanResolution.toFixed(CALCULATION_PRECISION.DAMAGE)),
      signatureRadius: Number(signatureRadius.toFixed(CALCULATION_PRECISION.DAMAGE)),
      lockTime: Number(lockTime.toFixed(CALCULATION_PRECISION.TIME)),
    }
  }

  /**
   * Calculate Fitting Usage
   */
  private async calculateFittingUsage(
    shipAttributes: Record<number, number>,
    context: FittingContext
  ): Promise<FittingUsage> {
    const totalCpu = shipAttributes[DOGMA_ATTRIBUTES.CPU] || 0
    const totalPowergrid = shipAttributes[DOGMA_ATTRIBUTES.POWERGRID] || 0
    const totalCalibration = shipAttributes[DOGMA_ATTRIBUTES.UPGRADE_CAPACITY] || 0

    let usedCpu = 0
    let usedPowergrid = 0
    let usedCalibration = 0

    for (const fittedModule of context.modules) {
      const requirements = await this.attributeCalculator.calculateModuleRequirements(
        fittedModule.typeId,
        context
      )

      usedCpu += requirements.cpu
      usedPowergrid += requirements.powergrid

      if (fittedModule.slotType === 'rig') {
        usedCalibration += requirements.calibration || 0
      }
    }

    const result: FittingUsage = {
      cpu: {
        used: Number(usedCpu.toFixed(CALCULATION_PRECISION.DAMAGE)),
        total: Number(totalCpu.toFixed(CALCULATION_PRECISION.DAMAGE)),
        percentage: Number(((usedCpu / totalCpu) * 100).toFixed(CALCULATION_PRECISION.PERCENTAGE)),
      },
      powergrid: {
        used: Number(usedPowergrid.toFixed(CALCULATION_PRECISION.DAMAGE)),
        total: Number(totalPowergrid.toFixed(CALCULATION_PRECISION.DAMAGE)),
        percentage: Number(
          ((usedPowergrid / totalPowergrid) * 100).toFixed(CALCULATION_PRECISION.PERCENTAGE)
        ),
      },
    }

    if (totalCalibration > 0) {
      result.calibration = {
        used: Number(usedCalibration.toFixed(CALCULATION_PRECISION.DAMAGE)),
        total: Number(totalCalibration.toFixed(CALCULATION_PRECISION.DAMAGE)),
        percentage: Number(
          ((usedCalibration / totalCalibration) * 100).toFixed(CALCULATION_PRECISION.PERCENTAGE)
        ),
      }
    }

    return result
  }

  /**
   * Helper methods
   */
  private async calculateCapacitorUsage(context: FittingContext): Promise<CapacitorUsage[]> {
    const usage: CapacitorUsage[] = []

    for (const fittedModule of context.modules) {
      if (fittedModule.active) {
        const activationCost = await this.getModuleAttribute(
          fittedModule.typeId,
          DOGMA_ATTRIBUTES.ACTIVATION_COST,
          context
        )
        const cycleTime = await this.getModuleCycleTime(fittedModule.typeId, context)

        if (activationCost > 0) {
          const moduleType = await sdeIntegration.getModuleType(fittedModule.typeId)
          usage.push({
            moduleTypeId: fittedModule.typeId,
            moduleName: moduleType?.name || 'Unknown Module',
            usage: Number(
              (activationCost / (cycleTime / 1000)).toFixed(CALCULATION_PRECISION.CAPACITOR)
            ),
            cycle: Number((cycleTime / 1000).toFixed(CALCULATION_PRECISION.TIME)),
          })
        }
      }
    }

    return usage
  }

  private async calculateFittingCost(context: FittingContext): Promise<number> {
    void context
    // This would integrate with market data to calculate fitting costs
    // For now, return a placeholder
    return 0
  }

  private calculateDamageTypeBreakdown(weapons: WeaponDPS[]): {
    em: number
    thermal: number
    kinetic: number
    explosive: number
  } {
    let em = 0,
      thermal = 0,
      kinetic = 0,
      explosive = 0

    for (const weapon of weapons) {
      const weaponDPS = weapon.dps
      em += weaponDPS * weapon.damageTypes.em
      thermal += weaponDPS * weapon.damageTypes.thermal
      kinetic += weaponDPS * weapon.damageTypes.kinetic
      explosive += weaponDPS * weapon.damageTypes.explosive
    }

    return {
      em: Number(em.toFixed(CALCULATION_PRECISION.DAMAGE)),
      thermal: Number(thermal.toFixed(CALCULATION_PRECISION.DAMAGE)),
      kinetic: Number(kinetic.toFixed(CALCULATION_PRECISION.DAMAGE)),
      explosive: Number(explosive.toFixed(CALCULATION_PRECISION.DAMAGE)),
    }
  }

  private calculateRangeMetrics(weapons: WeaponDPS[]): {
    optimal: number
    falloff: number
    effective: number
  } {
    if (weapons.length === 0) return { optimal: 0, falloff: 0, effective: 0 }

    // Calculate weighted averages based on DPS
    const totalDPS = weapons.reduce((sum, w) => sum + w.dps, 0)

    let weightedOptimal = 0
    const weightedFalloff = 0 // Would be calculated from weapon attributes

    for (const weapon of weapons) {
      const weight = weapon.dps / totalDPS
      weightedOptimal += weapon.range * weight
      // Falloff would come from weapon attributes
    }

    const effective = weightedOptimal + weightedFalloff * 0.5 // Simplified effective range

    return {
      optimal: Number((weightedOptimal / 1000).toFixed(CALCULATION_PRECISION.DAMAGE)), // km
      falloff: Number((weightedFalloff / 1000).toFixed(CALCULATION_PRECISION.DAMAGE)), // km
      effective: Number((effective / 1000).toFixed(CALCULATION_PRECISION.DAMAGE)), // km
    }
  }

  // Simplified helper methods (would need full implementation)
  private async getWeaponAttribute(
    moduleTypeId: number,
    attributeId: number,
    context: FittingContext
  ): Promise<number> {
    void context
    const moduleType = await sdeIntegration.getModuleType(moduleTypeId)
    const attr = moduleType?.dogma_attributes?.find(a => a.attribute_id === attributeId)
    return attr?.value || 0
  }

  private async getModuleAttribute(
    moduleTypeId: number,
    attributeId: number,
    context: FittingContext
  ): Promise<number> {
    void context
    return this.getWeaponAttribute(moduleTypeId, attributeId, context)
  }

  private async getModuleCycleTime(moduleTypeId: number, context: FittingContext): Promise<number> {
    return (
      (await this.getModuleAttribute(moduleTypeId, DOGMA_ATTRIBUTES.DURATION, context)) ||
      DEFAULTS.MODULE_CYCLE_TIME * 1000
    )
  }

  private async getModuleRepairAmount(
    moduleTypeId: number,
    context: FittingContext
  ): Promise<number> {
    void moduleTypeId
    void context
    // This would get the repair amount from module attributes
    return 0
  }

  private async getBaseDamage(moduleTypeId: number, chargeTypeId?: number): Promise<number> {
    void moduleTypeId
    void chargeTypeId
    // Calculate base damage from weapon and charge
    return 100 // Placeholder
  }

  private async getWeaponDamageTypes(
    moduleTypeId: number,
    chargeTypeId?: number
  ): Promise<DamageResistances> {
    void moduleTypeId
    void chargeTypeId
    // Get damage type breakdown
    return { em: 0.25, thermal: 0.25, kinetic: 0.25, explosive: 0.25 } // Placeholder
  }

  private getWeaponGroupName(groupId: number): string {
    const groupNames: Record<number, string> = {
      53: 'Energy Weapons',
      55: 'Projectile Weapons',
      74: 'Hybrid Weapons',
      507: 'Missile Launchers',
    }
    return groupNames[groupId] || 'Unknown Weapon'
  }

  private isArmorRepairer(groupId: number): boolean {
    return groupId === 62 // Armor repair modules
  }

  private isHullRepairer(groupId: number): boolean {
    return groupId === 63 // Hull repair modules
  }

  private isWeaponModule(groupId: number): boolean {
    const weaponGroups = [53, 55, 74, 507, 506, 510] // Various weapon groups
    return weaponGroups.includes(groupId)
  }
}
