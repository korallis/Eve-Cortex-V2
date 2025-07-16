/**
 * EVE Static Data Export (SDE) Integration
 * Provides access to EVE Online static game data for Dogma calculations
 */

import { esiClient } from '@/lib/esi/client'
import { redis } from '@/lib/redis'
import type {
  SDEData,
  DogmaAttribute,
  DogmaEffect,
  TypeDogma,
  TypeDogmaAttribute,
  TypeDogmaEffect,
} from '@/types/dogma'
import type { ESIType, ESIGroup, ESICategory } from '@/types/esi'

export class SDEIntegration {
  private static instance: SDEIntegration
  private data: SDEData | null = null
  private readonly cachePrefix = 'sde:'
  private readonly cacheVersion = 'v1'
  private readonly cacheTTL = 24 * 60 * 60 // 24 hours

  private constructor() {}

  static getInstance(): SDEIntegration {
    if (!SDEIntegration.instance) {
      SDEIntegration.instance = new SDEIntegration()
    }
    return SDEIntegration.instance
  }

  /**
   * Initialize SDE data with caching
   */
  async initialize(): Promise<void> {
    console.log('Initializing SDE data...')

    // Try to load from cache first
    const cached = await this.loadFromCache()
    if (cached) {
      this.data = cached
      console.log('SDE data loaded from cache')
      return
    }

    // Load fresh data from ESI
    await this.loadFromESI()
    console.log('SDE data loaded from ESI')
  }

  /**
   * Get ship type information with Dogma data
   */
  async getShipType(typeId: number): Promise<ESIType | null> {
    await this.ensureInitialized()
    return this.data?.types.get(typeId) || null
  }

  /**
   * Get module type information
   */
  async getModuleType(typeId: number): Promise<ESIType | null> {
    await this.ensureInitialized()
    return this.data?.types.get(typeId) || null
  }

  /**
   * Get Dogma attribute definition
   */
  async getAttribute(attributeId: number): Promise<DogmaAttribute | null> {
    await this.ensureInitialized()
    return this.data?.attributes.get(attributeId) || null
  }

  /**
   * Get Dogma effect definition
   */
  async getEffect(effectId: number): Promise<DogmaEffect | null> {
    await this.ensureInitialized()
    return this.data?.effects.get(effectId) || null
  }

  /**
   * Get type group information
   */
  async getGroup(groupId: number): Promise<ESIGroup | null> {
    await this.ensureInitialized()
    return this.data?.groups.get(groupId) || null
  }

  /**
   * Get type category information
   */
  async getCategory(categoryId: number): Promise<ESICategory | null> {
    await this.ensureInitialized()
    return this.data?.categories.get(categoryId) || null
  }

  /**
   * Get all types in a specific group
   */
  async getTypesByGroup(groupId: number): Promise<ESIType[]> {
    await this.ensureInitialized()

    const group = this.data?.groups.get(groupId)
    if (!group) return []

    const types: ESIType[] = []
    for (const typeId of group.types) {
      const type = this.data?.types.get(typeId)
      if (type) {
        types.push(type)
      }
    }

    return types
  }

  /**
   * Search types by name
   */
  async searchTypes(query: string, limit: number = 50): Promise<ESIType[]> {
    await this.ensureInitialized()

    if (!this.data) return []

    const searchTerm = query.toLowerCase()
    const results: ESIType[] = []

    for (const [, type] of this.data.types) {
      if (type.name.toLowerCase().includes(searchTerm)) {
        results.push(type)
        if (results.length >= limit) break
      }
    }

    return results.sort((a, b) => a.name.localeCompare(b.name))
  }

  /**
   * Get complete Dogma data for a type
   */
  async getTypeDogma(typeId: number): Promise<TypeDogma | null> {
    const type = await this.getShipType(typeId)
    if (!type) return null

    const attributes: TypeDogmaAttribute[] =
      type.dogma_attributes?.map(attr => ({
        attributeId: attr.attribute_id,
        value: attr.value,
      })) || []

    const effects: TypeDogmaEffect[] =
      type.dogma_effects?.map(effect => ({
        effectId: effect.effect_id,
        isDefault: effect.is_default,
      })) || []

    return {
      typeId,
      attributes,
      effects,
    }
  }

  /**
   * Get ship fitting constraints
   */
  async getShipConstraints(shipTypeId: number): Promise<{
    cpu: number
    powergrid: number
    upgradeCapacity: number
    slots: {
      high: number
      med: number
      low: number
      rig: number
      launcher?: number
      turret?: number
    }
  } | null> {
    const ship = await this.getShipType(shipTypeId)
    if (!ship?.dogma_attributes) return null

    const getAttributeValue = (attributeId: number): number => {
      const attr = ship.dogma_attributes?.find(a => a.attribute_id === attributeId)
      return attr?.value || 0
    }

    return {
      cpu: getAttributeValue(48), // CPU
      powergrid: getAttributeValue(11), // Powergrid
      upgradeCapacity: getAttributeValue(1132), // Rig calibration
      slots: {
        high: getAttributeValue(14), // High slots
        med: getAttributeValue(13), // Med slots
        low: getAttributeValue(12), // Low slots
        rig: getAttributeValue(1137), // Rig slots
        launcher: getAttributeValue(101), // Launcher hardpoints
        turret: getAttributeValue(102), // Turret hardpoints
      },
    }
  }

  /**
   * Check if SDE data needs refresh
   */
  async needsRefresh(): Promise<boolean> {
    if (!this.data) return true

    const age = Date.now() - this.data.lastUpdated.getTime()
    return age > this.cacheTTL * 1000
  }

  /**
   * Force refresh of SDE data
   */
  async refresh(): Promise<void> {
    await this.clearCache()
    await this.loadFromESI()
  }

  /**
   * Ensure SDE data is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.data || (await this.needsRefresh())) {
      await this.initialize()
    }
  }

  /**
   * Load SDE data from cache
   */
  private async loadFromCache(): Promise<SDEData | null> {
    try {
      const cacheKey = `${this.cachePrefix}${this.cacheVersion}:data`
      const cached = await redis.get(cacheKey)

      if (!cached) return null

      const data = JSON.parse(cached) as {
        types: Array<[number, ESIType]>
        attributes: Array<[number, DogmaAttribute]>
        effects: Array<[number, DogmaEffect]>
        groups: Array<[number, ESIGroup]>
        categories: Array<[number, ESICategory]>
        lastUpdated: string
      }

      return {
        types: new Map(data.types),
        attributes: new Map(data.attributes),
        effects: new Map(data.effects),
        groups: new Map(data.groups),
        categories: new Map(data.categories),
        lastUpdated: new Date(data.lastUpdated),
      }
    } catch (error) {
      console.error('Failed to load SDE data from cache:', error)
      return null
    }
  }

  /**
   * Save SDE data to cache
   */
  private async saveToCache(data: SDEData): Promise<void> {
    try {
      const cacheKey = `${this.cachePrefix}${this.cacheVersion}:data`

      const serializable = {
        types: Array.from(data.types.entries()),
        attributes: Array.from(data.attributes.entries()),
        effects: Array.from(data.effects.entries()),
        groups: Array.from(data.groups.entries()),
        categories: Array.from(data.categories.entries()),
        lastUpdated: data.lastUpdated.toISOString(),
      }

      await redis.set(cacheKey, JSON.stringify(serializable), 'EX', this.cacheTTL)
    } catch (error) {
      console.error('Failed to save SDE data to cache:', error)
    }
  }

  /**
   * Load SDE data from ESI API
   */
  private async loadFromESI(): Promise<void> {
    console.log('Loading SDE data from ESI...')

    const data: SDEData = {
      types: new Map(),
      attributes: new Map(),
      effects: new Map(),
      groups: new Map(),
      categories: new Map(),
      lastUpdated: new Date(),
    }

    try {
      // Load critical ship and module types
      await this.loadShipTypes(data)
      await this.loadModuleTypes(data)
      await this.loadGroups(data)
      await this.loadCategories(data)

      // Note: Dogma attributes and effects are not directly available via ESI
      // They would need to be loaded from the SDE dump or hardcoded
      await this.loadCriticalAttributes(data)
      await this.loadCriticalEffects(data)

      this.data = data
      await this.saveToCache(data)
    } catch (error) {
      console.error('Failed to load SDE data from ESI:', error)
      throw error
    }
  }

  /**
   * Load ship types from ESI
   */
  private async loadShipTypes(data: SDEData): Promise<void> {
    // Load common ship type IDs (this would typically come from a more complete source)
    const shipTypeIds = [
      587,
      588,
      589,
      590, // T1 frigates
      585,
      586,
      591,
      592, // More T1 frigates
      639,
      640,
      641,
      642, // Interceptors
      11194,
      11200,
      11202,
      11174, // T2 frigates
      1906,
      1904,
      1905,
      1903, // Cruisers
      17918,
      17920,
      17922,
      17924, // Battleships
    ]

    for (const typeId of shipTypeIds) {
      try {
        const response = await esiClient.publicRequest<ESIType>(`/universe/types/${typeId}/`)
        if (response.data) {
          data.types.set(typeId, response.data)
        }
      } catch (error) {
        console.warn(`Failed to load ship type ${typeId}:`, error)
      }
    }
  }

  /**
   * Load module types from ESI
   */
  private async loadModuleTypes(data: SDEData): Promise<void> {
    // Load common module type IDs
    const moduleTypeIds = [
      2046, // Damage Control II
      5973, // Medium Shield Booster II
      2281, // Medium Armor Repairer II
      438, // Small Energy Turret
    ]

    for (const typeId of moduleTypeIds) {
      try {
        const response = await esiClient.publicRequest<ESIType>(`/universe/types/${typeId}/`)
        if (response.data) {
          data.types.set(typeId, response.data)
        }
      } catch (error) {
        console.warn(`Failed to load module type ${typeId}:`, error)
      }
    }
  }

  /**
   * Load groups from ESI
   */
  private async loadGroups(data: SDEData): Promise<void> {
    const groupIds = [25, 26, 27, 28, 29, 30, 31] // Common ship groups

    for (const groupId of groupIds) {
      try {
        const response = await esiClient.publicRequest<ESIGroup>(`/universe/groups/${groupId}/`)
        if (response.data) {
          data.groups.set(groupId, response.data)
        }
      } catch (error) {
        console.warn(`Failed to load group ${groupId}:`, error)
      }
    }
  }

  /**
   * Load categories from ESI
   */
  private async loadCategories(data: SDEData): Promise<void> {
    const categoryIds = [6, 7, 8, 16, 18] // Ships, modules, charges, etc.

    for (const categoryId of categoryIds) {
      try {
        const response = await esiClient.publicRequest<ESICategory>(
          `/universe/categories/${categoryId}/`
        )
        if (response.data) {
          data.categories.set(categoryId, response.data)
        }
      } catch (error) {
        console.warn(`Failed to load category ${categoryId}:`, error)
      }
    }
  }

  /**
   * Load critical Dogma attributes (hardcoded since not available via ESI)
   */
  private async loadCriticalAttributes(data: SDEData): Promise<void> {
    // These would typically come from the SDE dump
    const criticalAttributes: DogmaAttribute[] = [
      {
        attributeId: 9,
        attributeName: 'hp',
        description: 'The number of hit points of an object.',
        defaultValue: 0,
        published: true,
        stackable: true,
        highIsGood: true,
      },
      {
        attributeId: 263,
        attributeName: 'shieldCapacity',
        description: 'Amount of shield HP on the item.',
        defaultValue: 0,
        published: true,
        stackable: true,
        highIsGood: true,
      },
      {
        attributeId: 265,
        attributeName: 'armorHP',
        description: 'Amount of armor HP on the item.',
        defaultValue: 0,
        published: true,
        stackable: true,
        highIsGood: true,
      },
      // Add more critical attributes as needed
    ]

    for (const attribute of criticalAttributes) {
      data.attributes.set(attribute.attributeId, attribute)
    }
  }

  /**
   * Load critical Dogma effects (hardcoded since not available via ESI)
   */
  private async loadCriticalEffects(data: SDEData): Promise<void> {
    // These would typically come from the SDE dump
    const criticalEffects: DogmaEffect[] = [
      {
        effectId: 16,
        effectName: 'online',
        description: 'Effect applied when module is online',
        effectCategory: 1,
        published: true,
        isOffensive: false,
        isAssistance: false,
        disallowAutoRepeat: false,
        isWarpSafe: true,
      },
      // Add more critical effects as needed
    ]

    for (const effect of criticalEffects) {
      data.effects.set(effect.effectId, effect)
    }
  }

  /**
   * Clear all cached SDE data
   */
  private async clearCache(): Promise<void> {
    const pattern = `${this.cachePrefix}${this.cacheVersion}:*`
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    typesCount: number
    attributesCount: number
    effectsCount: number
    groupsCount: number
    categoriesCount: number
    lastUpdated: Date | null
    cacheSize: number
  }> {
    await this.ensureInitialized()

    if (!this.data) {
      return {
        typesCount: 0,
        attributesCount: 0,
        effectsCount: 0,
        groupsCount: 0,
        categoriesCount: 0,
        lastUpdated: null,
        cacheSize: 0,
      }
    }

    const cacheKey = `${this.cachePrefix}${this.cacheVersion}:data`
    const cached = await redis.get(cacheKey)

    return {
      typesCount: this.data.types.size,
      attributesCount: this.data.attributes.size,
      effectsCount: this.data.effects.size,
      groupsCount: this.data.groups.size,
      categoriesCount: this.data.categories.size,
      lastUpdated: this.data.lastUpdated,
      cacheSize: cached ? cached.length : 0,
    }
  }
}

// Export singleton instance
export const sdeIntegration = SDEIntegration.getInstance()
