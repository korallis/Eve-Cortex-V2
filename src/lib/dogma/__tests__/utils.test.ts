/**
 * Dogma Utils Tests
 * Tests for utility functions and helper methods
 */

import {
  createBasicFittingContext,
  validateModuleSlot,
  calculateStackingPenalty,
  formatPerformanceMetrics,
  calculateEffectiveHPAgainstDamage,
  calculateDPSAgainstResistances,
  getCommonDamageProfiles,
  getCommonResistanceProfiles,
  calculateRangeEffectiveness,
  formatTrainingTime,
} from '../utils'
import type { ShipPerformance, DamageResistances } from '@/types/dogma'

describe('Dogma Utils', () => {
  describe('createBasicFittingContext', () => {
    it('should create a basic fitting context', () => {
      const context = createBasicFittingContext(587, [
        { skillId: 3327, level: 4 },
        { skillId: 3300, level: 3 },
      ])

      expect(context.ship.typeId).toBe(587)
      expect(context.character.skills).toHaveLength(2)
      expect(context.character.skills[0]?.level).toBe(4)
      expect(context.character.attributes.intelligence).toBe(20)
      expect(context.modules).toHaveLength(0)
      expect(context.implants).toHaveLength(0)
    })

    it('should create context with default skills when none provided', () => {
      const context = createBasicFittingContext(587)

      expect(context.ship.typeId).toBe(587)
      expect(context.character.skills).toHaveLength(0)
      expect(context.character.attributes).toBeDefined()
    })
  })

  describe('validateModuleSlot', () => {
    it('should validate high slot modules correctly', () => {
      expect(validateModuleSlot(53, 'high')).toBe(true) // Energy weapons
      expect(validateModuleSlot(55, 'high')).toBe(true) // Projectile weapons
      expect(validateModuleSlot(62, 'high')).toBe(false) // Armor repairers
    })

    it('should validate med slot modules correctly', () => {
      expect(validateModuleSlot(40, 'med')).toBe(true) // Shield boosters
      expect(validateModuleSlot(76, 'med')).toBe(true) // Capacitor boosters
      expect(validateModuleSlot(53, 'med')).toBe(false) // Energy weapons
    })

    it('should validate low slot modules correctly', () => {
      expect(validateModuleSlot(62, 'low')).toBe(true) // Armor repairers
      expect(validateModuleSlot(60, 'low')).toBe(true) // Damage controls
      expect(validateModuleSlot(40, 'low')).toBe(false) // Shield boosters
    })

    it('should validate rig slot modules correctly', () => {
      expect(validateModuleSlot(774, 'rig')).toBe(true) // Shield rigs
      expect(validateModuleSlot(772, 'rig')).toBe(true) // Armor rigs
      expect(validateModuleSlot(53, 'rig')).toBe(false) // Energy weapons
    })
  })

  describe('calculateStackingPenalty', () => {
    it('should apply no penalties when disabled', () => {
      const modifiers = [
        { value: 10, operation: 'percent' as const },
        { value: 8, operation: 'percent' as const },
        { value: 6, operation: 'percent' as const },
      ]

      const result = calculateStackingPenalty(modifiers, false)

      expect(result).toHaveLength(3)
      result.forEach(mod => {
        expect(mod.penalty).toBe(1.0)
        expect(mod.effectiveValue).toBe(mod.value)
      })
    })

    it('should apply stacking penalties to percentage modifiers', () => {
      const modifiers = [
        { value: 10, operation: 'percent' as const },
        { value: 8, operation: 'percent' as const },
        { value: 6, operation: 'percent' as const },
      ]

      const result = calculateStackingPenalty(modifiers, true)

      expect(result).toHaveLength(3)
      expect(result[0]?.penalty).toBe(1.0) // First module, no penalty
      expect(result[1]?.penalty).toBeLessThan(1.0) // Second module, penalty applied
      expect(result[2]?.penalty).toBeLessThan(result[1]?.penalty || 0) // Third module, higher penalty
    })

    it('should not apply penalties to non-percentage modifiers', () => {
      const modifiers = [
        { value: 100, operation: 'add' as const },
        { value: 50, operation: 'add' as const },
        { value: 1.5, operation: 'multiply' as const },
      ]

      const result = calculateStackingPenalty(modifiers, true)

      expect(result).toHaveLength(3)
      result.forEach(mod => {
        expect(mod.penalty).toBe(1.0)
        expect(mod.effectiveValue).toBe(mod.value)
      })
    })

    it('should sort modifiers by effectiveness', () => {
      const modifiers = [
        { value: 5, operation: 'percent' as const },
        { value: 10, operation: 'percent' as const },
        { value: 7, operation: 'percent' as const },
      ]

      const result = calculateStackingPenalty(modifiers, true)

      // Should be sorted by absolute value: 10, 7, 5
      expect(result[0]?.value).toBe(10)
      expect(result[1]?.value).toBe(7)
      expect(result[2]?.value).toBe(5)
    })
  })

  describe('formatPerformanceMetrics', () => {
    it('should format performance metrics correctly', () => {
      const performance: ShipPerformance = {
        ehp: {
          shield: 1500,
          armor: 2000,
          hull: 800,
          total: 4300,
          shieldResistances: { em: 0.0, thermal: 0.2, kinetic: 0.4, explosive: 0.5 },
          armorResistances: { em: 0.5, thermal: 0.35, kinetic: 0.25, explosive: 0.1 },
          hullResistances: { em: 0.0, thermal: 0.0, kinetic: 0.0, explosive: 0.0 },
          shieldRecharge: 15.5,
        },
        dps: {
          total: 250,
          weapon: [],
          em: 50,
          thermal: 75,
          kinetic: 75,
          explosive: 50,
          optimal: 12.5,
          falloff: 8.0,
          effective: 16.5,
        },
        speed: {
          maxVelocity: 285,
          acceleration: 28.5,
          agility: 3.2,
          warpSpeed: 4.5,
        },
        capacitor: {
          capacity: 425,
          rechargeRate: 2.1,
          stable: true,
          peakRecharge: 0.525,
          usage: [],
        },
        targeting: {
          maxTargets: 5,
          maxRange: 45.5,
          scanResolution: 850,
          signatureRadius: 32,
          lockTime: 2.1,
        },
        cost: 15000000,
        fittingUsed: {
          cpu: { used: 85, total: 120, percentage: 70.83 },
          powergrid: { used: 38, total: 45, percentage: 84.44 },
        },
      }

      const formatted = formatPerformanceMetrics(performance)

      expect(formatted.ehp).toContain('4.30K HP')
      expect(formatted.dps).toContain('250.00 DPS')
      expect(formatted.speed).toContain('285.00 m/s')
      expect(formatted.capacitor).toContain('425.00 GJ (Stable)')
      expect(formatted.targeting).toContain('5 @')
      expect(formatted.efficiency.cpuUsage).toContain('70.8%')
      expect(formatted.efficiency.powergridUsage).toContain('84.4%')
    })

    it('should format large numbers with appropriate units', () => {
      const performance: ShipPerformance = {
        ehp: {
          shield: 150000,
          armor: 200000,
          hull: 80000,
          total: 430000,
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
        speed: { maxVelocity: 0, acceleration: 0, agility: 0, warpSpeed: 0 },
        capacitor: { capacity: 0, rechargeRate: 0, stable: false, peakRecharge: 0, usage: [] },
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

      const formatted = formatPerformanceMetrics(performance)
      expect(formatted.ehp).toContain('430.00K HP')
    })
  })

  describe('calculateEffectiveHPAgainstDamage', () => {
    it('should calculate effective HP against uniform damage', () => {
      const resistances: DamageResistances = { em: 0.5, thermal: 0.3, kinetic: 0.2, explosive: 0.1 }
      const uniformDamage: DamageResistances = {
        em: 0.25,
        thermal: 0.25,
        kinetic: 0.25,
        explosive: 0.25,
      }

      const ehp = calculateEffectiveHPAgainstDamage(1000, resistances, uniformDamage)

      expect(ehp).toBeGreaterThan(1000) // Should be higher due to resistances
      expect(ehp).toBeCloseTo(1379.31) // Calculated value
    })

    it('should handle zero resistances', () => {
      const resistances: DamageResistances = { em: 0, thermal: 0, kinetic: 0, explosive: 0 }
      const uniformDamage: DamageResistances = {
        em: 0.25,
        thermal: 0.25,
        kinetic: 0.25,
        explosive: 0.25,
      }

      const ehp = calculateEffectiveHPAgainstDamage(1000, resistances, uniformDamage)

      expect(ehp).toBe(1000) // No resistances = no change
    })
  })

  describe('calculateDPSAgainstResistances', () => {
    it('should calculate effective DPS against target resistances', () => {
      const weaponDamage: DamageResistances = {
        em: 0.6,
        thermal: 0.4,
        kinetic: 0.0,
        explosive: 0.0,
      }
      const targetResistances: DamageResistances = {
        em: 0.8,
        thermal: 0.5,
        kinetic: 0.3,
        explosive: 0.2,
      }

      const effectiveDPS = calculateDPSAgainstResistances(100, weaponDamage, targetResistances)

      expect(effectiveDPS).toBeLessThan(100) // Should be reduced due to target resistances
      expect(effectiveDPS).toBeCloseTo(32) // 60 * (1-0.8) + 40 * (1-0.5) = 12 + 20 = 32
    })

    it('should handle perfect resistances', () => {
      const weaponDamage: DamageResistances = {
        em: 1.0,
        thermal: 0.0,
        kinetic: 0.0,
        explosive: 0.0,
      }
      const perfectResistances: DamageResistances = {
        em: 1.0,
        thermal: 0.0,
        kinetic: 0.0,
        explosive: 0.0,
      }

      const effectiveDPS = calculateDPSAgainstResistances(100, weaponDamage, perfectResistances)

      expect(effectiveDPS).toBe(0) // Perfect resistance = no damage
    })
  })

  describe('getCommonDamageProfiles', () => {
    it('should provide common damage profiles', () => {
      const profiles = getCommonDamageProfiles()

      expect(profiles['uniform']).toEqual({
        em: 0.25,
        thermal: 0.25,
        kinetic: 0.25,
        explosive: 0.25,
      })
      expect(profiles['em_heavy']?.em).toBe(0.6)
      expect(profiles['guristas']?.thermal).toBe(0.7)
      expect(profiles['blood_raiders']?.em).toBe(0.5)
      expect(profiles['blood_raiders']?.thermal).toBe(0.5)
    })

    it('should have damage profiles that sum to 1.0', () => {
      const profiles = getCommonDamageProfiles()

      Object.values(profiles).forEach(profile => {
        const sum = profile.em + profile.thermal + profile.kinetic + profile.explosive
        expect(sum).toBeCloseTo(1.0, 5)
      })
    })
  })

  describe('getCommonResistanceProfiles', () => {
    it('should provide common resistance profiles', () => {
      const profiles = getCommonResistanceProfiles()

      expect(profiles['amarr_ship']).toBeDefined()
      expect(profiles['amarr_ship']?.shield).toBeDefined()
      expect(profiles['amarr_ship']?.armor).toBeDefined()
      expect(profiles['amarr_ship']?.hull).toBeDefined()
    })

    it('should have valid resistance values', () => {
      const profiles = getCommonResistanceProfiles()

      Object.values(profiles).forEach(shipProfile => {
        Object.values(shipProfile).forEach(layerResistances => {
          Object.values(layerResistances).forEach(resistance => {
            expect(resistance).toBeGreaterThanOrEqual(0)
            expect(resistance).toBeLessThanOrEqual(1)
          })
        })
      })
    })
  })

  describe('calculateRangeEffectiveness', () => {
    it('should return 100% effectiveness within optimal range', () => {
      const effectiveness = calculateRangeEffectiveness(5000, 10000, 5000)
      expect(effectiveness).toBe(1.0)
    })

    it('should reduce effectiveness beyond optimal range', () => {
      const effectiveness = calculateRangeEffectiveness(15000, 10000, 5000)
      expect(effectiveness).toBeLessThan(1.0)
      expect(effectiveness).toBeGreaterThan(0)
    })

    it('should return 0% effectiveness with no falloff beyond optimal', () => {
      const effectiveness = calculateRangeEffectiveness(15000, 10000, 0)
      expect(effectiveness).toBe(0)
    })

    it('should follow EVE falloff formula', () => {
      const effectiveness = calculateRangeEffectiveness(15000, 10000, 5000) // 1 falloff beyond optimal
      expect(effectiveness).toBeCloseTo(0.5, 2) // Should be 50% at 1x falloff
    })
  })

  describe('formatTrainingTime', () => {
    it('should format seconds correctly', () => {
      expect(formatTrainingTime(45)).toBe('0m')
      expect(formatTrainingTime(120)).toBe('2m')
      expect(formatTrainingTime(3600)).toBe('1h')
      expect(formatTrainingTime(86400)).toBe('1d')
    })

    it('should format complex durations', () => {
      const time = 2 * 86400 + 3 * 3600 + 45 * 60 // 2 days, 3 hours, 45 minutes
      expect(formatTrainingTime(time)).toBe('2d 3h 45m')
    })

    it('should handle zero and small values', () => {
      expect(formatTrainingTime(0)).toBe('0m')
      expect(formatTrainingTime(30)).toBe('0m')
    })

    it('should format large durations', () => {
      const time = 365 * 86400 + 12 * 3600 + 30 * 60 // 1 year, 12 hours, 30 minutes
      expect(formatTrainingTime(time)).toBe('365d 12h 30m')
    })
  })
})
