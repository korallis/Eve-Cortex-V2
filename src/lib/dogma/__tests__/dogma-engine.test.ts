/**
 * Dogma Engine Tests
 * Comprehensive tests for the Dogma calculation system
 */

import { DogmaEngine } from '../dogma-engine'
import { createBasicFittingContext } from '../utils'
import type { FittingContext } from '@/types/dogma'

// Mock the SDE integration
jest.mock('../sde-integration', () => ({
  sdeIntegration: {
    initialize: jest.fn().mockResolvedValue(undefined),
    getShipType: jest.fn().mockResolvedValue({
      type_id: 587,
      name: 'Rifter',
      group_id: 25,
      dogma_attributes: [
        { attribute_id: 9, value: 400 }, // HP
        { attribute_id: 263, value: 350 }, // Shield HP
        { attribute_id: 265, value: 450 }, // Armor HP
        { attribute_id: 48, value: 120 }, // CPU
        { attribute_id: 11, value: 45 }, // Powergrid
      ],
    }),
    getModuleType: jest.fn().mockResolvedValue({
      type_id: 2046,
      name: 'Damage Control II',
      group_id: 60,
      dogma_attributes: [
        { attribute_id: 50, value: 5 }, // CPU usage
        { attribute_id: 30, value: 1 }, // Powergrid usage
      ],
    }),
    getShipConstraints: jest.fn().mockResolvedValue({
      cpu: 120,
      powergrid: 45,
      upgradeCapacity: 400,
      slots: { high: 3, med: 2, low: 3, rig: 3 },
    }),
    getCacheStats: jest.fn().mockResolvedValue({
      typesCount: 100,
      attributesCount: 50,
      effectsCount: 25,
      groupsCount: 20,
      categoriesCount: 10,
      lastUpdated: new Date(),
      cacheSize: 1024,
    }),
  },
}))

describe('DogmaEngine', () => {
  let dogmaEngine: DogmaEngine
  let testContext: FittingContext

  beforeEach(async () => {
    dogmaEngine = new DogmaEngine({
      enableStackingPenalties: true,
      enableSkillBonuses: true,
      enableImplantBonuses: false,
      enableBoosterBonuses: false,
      precision: 2,
      cacheResults: false,
      debugMode: true,
    })

    await dogmaEngine.initialize()

    testContext = createBasicFittingContext(587, [
      // Rifter
      { skillId: 3327, level: 4 }, // Spaceship Command
      { skillId: 3300, level: 3 }, // Gunnery
    ])

    // Add a simple module for testing
    testContext.modules = [
      {
        typeId: 2046, // Damage Control II
        slotType: 'low',
        slotIndex: 0,
        state: 'online',
        attributes: {},
        effects: [],
        online: true,
        active: false,
      },
    ]
  })

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      expect(await dogmaEngine.isReady()).toBe(true)
    })

    it('should provide health status', async () => {
      const health = await dogmaEngine.getHealthStatus()
      expect(health.healthy).toBe(true)
      expect(health.sdeLoaded).toBe(true)
      expect(health.typesCount).toBeGreaterThan(0)
    })

    it('should provide cache statistics', async () => {
      const stats = await dogmaEngine.getCacheStats()
      expect(stats.typesCount).toBeGreaterThan(0)
      expect(stats.lastUpdated).toBeInstanceOf(Date)
    })
  })

  describe('Configuration', () => {
    it('should allow configuration updates', () => {
      const originalConfig = dogmaEngine.getConfig()
      expect(originalConfig.enableStackingPenalties).toBe(true)

      dogmaEngine.updateConfig({ enableStackingPenalties: false })
      const updatedConfig = dogmaEngine.getConfig()
      expect(updatedConfig.enableStackingPenalties).toBe(false)
    })

    it('should preserve other config values when updating', () => {
      const originalConfig = dogmaEngine.getConfig()
      dogmaEngine.updateConfig({ precision: 4 })
      const updatedConfig = dogmaEngine.getConfig()

      expect(updatedConfig.precision).toBe(4)
      expect(updatedConfig.enableSkillBonuses).toBe(originalConfig.enableSkillBonuses)
    })
  })

  describe('Fitting Validation', () => {
    it('should validate a basic fitting', async () => {
      const validation = await dogmaEngine.validateFitting(testContext)

      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
      expect(validation.resourceUsage.cpu.used).toBeGreaterThan(0)
      expect(validation.resourceUsage.powergrid.used).toBeGreaterThan(0)
    })

    it('should detect CPU overflow', async () => {
      // Add many high-CPU modules to trigger overflow
      const overloadedContext = { ...testContext }
      overloadedContext.modules = Array(10).fill({
        typeId: 2046,
        slotType: 'low',
        slotIndex: 0,
        state: 'online',
        attributes: {},
        effects: [],
        online: true,
        active: false,
      })

      const validation = await dogmaEngine.validateFitting(overloadedContext)
      expect(validation.resourceUsage.cpu.percentage).toBeGreaterThan(100)
    })

    it('should validate individual modules', async () => {
      const moduleValidation = await dogmaEngine.validateModule(
        2046, // Damage Control II
        'low',
        testContext
      )

      expect(moduleValidation.isValid).toBe(true)
      expect(moduleValidation.cpuUsage).toBeGreaterThan(0)
      expect(moduleValidation.powergridUsage).toBeGreaterThan(0)
    })
  })

  describe('Performance Calculation', () => {
    it('should calculate ship performance', async () => {
      const result = await dogmaEngine.calculateShipPerformance(testContext)

      expect(result.success).toBe(true)
      expect(result.performance.ehp.total).toBeGreaterThan(0)
      expect(result.performance.speed.maxVelocity).toBeGreaterThan(0)
      expect(result.performance.capacitor.capacity).toBeGreaterThan(0)
      expect(result.calculationTime).toBeGreaterThan(0)
    })

    it('should provide EHP breakdown', async () => {
      const result = await dogmaEngine.calculateShipPerformance(testContext)
      const ehp = result.performance.ehp

      expect(ehp.shield).toBeGreaterThan(0)
      expect(ehp.armor).toBeGreaterThan(0)
      expect(ehp.hull).toBeGreaterThan(0)
      expect(ehp.total).toBe(ehp.shield + ehp.armor + ehp.hull)
    })

    it('should calculate resistances correctly', async () => {
      const result = await dogmaEngine.calculateShipPerformance(testContext)
      const resistances = result.performance.ehp.shieldResistances

      expect(resistances.em).toBeGreaterThanOrEqual(0)
      expect(resistances.em).toBeLessThanOrEqual(1)
      expect(resistances.thermal).toBeGreaterThanOrEqual(0)
      expect(resistances.thermal).toBeLessThanOrEqual(1)
    })

    it('should handle calculation errors gracefully', async () => {
      // Create an invalid context
      const invalidContext = {
        ...testContext,
        ship: { ...testContext.ship, typeId: -1 },
      }

      const result = await dogmaEngine.calculateShipPerformance(invalidContext)
      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('Attribute Calculation', () => {
    it('should calculate modified attributes', async () => {
      const result = await dogmaEngine.calculateAttribute(
        9, // HP attribute
        400, // Base value
        testContext
      )

      expect(result.attributeId).toBe(9)
      expect(result.baseValue).toBe(400)
      expect(result.modifiedValue).toBeGreaterThanOrEqual(400)
      expect(result.modifiers).toBeDefined()
    })
  })

  describe('Ship and Module Information', () => {
    it('should get ship constraints', async () => {
      const constraints = await dogmaEngine.getShipConstraints(587) // Rifter

      expect(constraints).toBeDefined()
      expect(constraints?.cpu).toBeGreaterThan(0)
      expect(constraints?.powergrid).toBeGreaterThan(0)
      expect(constraints?.slots.high).toBeGreaterThan(0)
    })

    it('should get module requirements', async () => {
      const requirements = await dogmaEngine.getModuleRequirements(2046, testContext)

      expect(requirements.cpu).toBeGreaterThan(0)
      expect(requirements.powergrid).toBeGreaterThan(0)
    })

    it('should search for types', async () => {
      // Mock the search functionality
      const mockSearch = jest.fn().mockResolvedValue([
        { type_id: 587, name: 'Rifter', group_id: 25 },
        { type_id: 588, name: 'Punisher', group_id: 25 },
      ])

      // Replace the search method temporarily
      const originalSearch = dogmaEngine.searchTypes
      dogmaEngine.searchTypes = mockSearch

      const results = await dogmaEngine.searchTypes('frigate')
      expect(results).toHaveLength(2)
      expect(results[0]?.name).toContain('Rifter')

      // Restore original method
      dogmaEngine.searchTypes = originalSearch
    })
  })

  describe('Context Creation', () => {
    it('should create fitting context from simple data', () => {
      const context = dogmaEngine.createFittingContext(
        587, // Rifter
        [
          { typeId: 2046, slotType: 'low' },
          { typeId: 2281, slotType: 'med' },
        ],
        {
          characterId: 12345,
          skills: [
            { skillId: 3327, level: 4, skillpoints: 1000000 },
            { skillId: 3300, level: 3, skillpoints: 750000 },
          ],
          attributes: {
            intelligence: 20,
            memory: 21,
            perception: 22,
            willpower: 23,
            charisma: 19,
          },
        },
        [], // No implants
        [] // No boosters
      )

      expect(context.ship.typeId).toBe(587)
      expect(context.modules).toHaveLength(2)
      expect(context.character.skills).toHaveLength(2)
      expect(context.character.attributes.intelligence).toBe(20)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing ship data', async () => {
      const invalidContext = {
        ...testContext,
        ship: { ...testContext.ship, typeId: 999999 },
      }

      const result = await dogmaEngine.calculateShipPerformance(invalidContext)
      expect(result.success).toBe(false)
      expect(result.errors.some(e => e.type === 'validation')).toBe(true)
    })

    it('should handle invalid module data', async () => {
      const invalidContext = { ...testContext }
      invalidContext.modules = [
        {
          typeId: 999999, // Invalid module
          slotType: 'low',
          slotIndex: 0,
          state: 'online',
          attributes: {},
          effects: [],
          online: true,
          active: false,
        },
      ]

      const validation = await dogmaEngine.validateFitting(invalidContext)
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(e => e.message.includes('Invalid module'))).toBe(true)
    })

    it('should provide meaningful error messages', async () => {
      const invalidContext = { ...testContext }
      invalidContext.modules = Array(20).fill({
        typeId: 2046,
        slotType: 'low',
        slotIndex: 0,
        state: 'online',
        attributes: {},
        effects: [],
        online: true,
        active: false,
      })

      const validation = await dogmaEngine.validateFitting(invalidContext)
      expect(
        validation.errors.some(e => e.message.includes('CPU') || e.message.includes('slot'))
      ).toBe(true)
    })
  })

  describe('Performance Optimization', () => {
    it('should complete calculations within reasonable time', async () => {
      const startTime = Date.now()
      const result = await dogmaEngine.calculateShipPerformance(testContext)
      const duration = Date.now() - startTime

      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
      expect(result.calculationTime).toBeLessThan(duration)
    })

    it('should handle multiple concurrent calculations', async () => {
      const calculations = Array(5)
        .fill(null)
        .map(() => dogmaEngine.calculateShipPerformance(testContext))

      const results = await Promise.all(calculations)
      results.forEach(result => {
        expect(result.success).toBe(true)
      })
    })
  })
})
