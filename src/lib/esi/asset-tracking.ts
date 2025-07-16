/**
 * Asset Tracking Service
 * Handles asset location monitoring and valuation
 */

import { esiClient } from './client'
import { marketSyncService } from './market-sync'
import { redis } from '@/lib/redis'
import type { ESIAsset, ESIStation, ESISolarSystem, ESIType } from '@/types/esi'

export interface AssetLocation {
  locationId: number
  locationType: 'station' | 'solar_system' | 'item' | 'other'
  locationName: string
  solarSystemId: number
  solarSystemName: string
  securityStatus: number
  regionId: number
  regionName: string
}

export interface AssetGroup {
  location: AssetLocation
  assets: EnrichedAsset[]
  totalValue: number
  totalVolume: number
  itemCount: number
}

export interface EnrichedAsset extends ESIAsset {
  typeName: string
  groupId: number
  groupName: string
  categoryId: number
  categoryName: string
  volume: number
  value: number
  packaged: boolean
}

export interface AssetSummary {
  totalValue: number
  totalVolume: number
  totalItems: number
  locationCount: number
  assetGroups: AssetGroup[]
  topValueItems: EnrichedAsset[]
  categoryBreakdown: CategoryBreakdown[]
}

export interface CategoryBreakdown {
  categoryId: number
  categoryName: string
  itemCount: number
  totalValue: number
  percentage: number
}

export class AssetTrackingService {
  private typeCache = new Map<number, ESIType>()
  private locationCache = new Map<number, AssetLocation>()
  private assetPrefix = 'assets:'
  private locationPrefix = 'location:'
  private typePrefix = 'type:'

  /**
   * Get comprehensive asset summary for a character
   */
  async getAssetSummary(characterId: number, accessToken: string): Promise<AssetSummary> {
    // Fetch all assets
    const assets = await this.fetchCharacterAssets(characterId, accessToken)

    // Enrich assets with type information and values
    const enrichedAssets = await this.enrichAssets(assets)

    // Group assets by location
    const assetGroups = await this.groupAssetsByLocation(enrichedAssets)

    // Calculate totals
    const totalValue = assetGroups.reduce((sum, group) => sum + group.totalValue, 0)
    const totalVolume = assetGroups.reduce((sum, group) => sum + group.totalVolume, 0)
    const totalItems = enrichedAssets.length

    // Get top value items
    const topValueItems = [...enrichedAssets].sort((a, b) => b.value - a.value).slice(0, 20)

    // Calculate category breakdown
    const categoryBreakdown = this.calculateCategoryBreakdown(enrichedAssets, totalValue)

    const summary: AssetSummary = {
      totalValue,
      totalVolume,
      totalItems,
      locationCount: assetGroups.length,
      assetGroups: assetGroups.sort((a, b) => b.totalValue - a.totalValue),
      topValueItems,
      categoryBreakdown,
    }

    // Cache summary
    await this.cacheSummary(characterId, summary)

    return summary
  }

  /**
   * Track asset changes over time
   */
  async trackAssetChanges(
    characterId: number,
    accessToken: string
  ): Promise<{
    added: EnrichedAsset[]
    removed: EnrichedAsset[]
    moved: Array<{
      asset: EnrichedAsset
      fromLocation: AssetLocation
      toLocation: AssetLocation
    }>
  }> {
    // Get current assets
    const currentAssets = await this.fetchCharacterAssets(characterId, accessToken)
    const currentEnriched = await this.enrichAssets(currentAssets)

    // Get previous snapshot
    const previousSnapshot = await this.getAssetSnapshot(characterId)

    if (!previousSnapshot) {
      // First time tracking, save snapshot
      await this.saveAssetSnapshot(characterId, currentEnriched)
      return { added: [], removed: [], moved: [] }
    }

    // Compare assets
    const currentMap = new Map(currentEnriched.map(a => [a.item_id, a]))
    const previousMap = new Map(previousSnapshot.map(a => [a.item_id, a]))

    const added: EnrichedAsset[] = []
    const removed: EnrichedAsset[] = []
    const moved: Array<{
      asset: EnrichedAsset
      fromLocation: AssetLocation
      toLocation: AssetLocation
    }> = []

    // Find added and moved assets
    for (const [itemId, asset] of currentMap) {
      const prev = previousMap.get(itemId)
      if (!prev) {
        added.push(asset)
      } else if (prev.location_id !== asset.location_id) {
        const fromLocation = await this.getLocation(prev.location_id, prev.location_type)
        const toLocation = await this.getLocation(asset.location_id, asset.location_type)
        moved.push({ asset, fromLocation, toLocation })
      }
    }

    // Find removed assets
    for (const [itemId, asset] of previousMap) {
      if (!currentMap.has(itemId)) {
        removed.push(asset)
      }
    }

    // Save new snapshot
    await this.saveAssetSnapshot(characterId, currentEnriched)

    return { added, removed, moved }
  }

  /**
   * Fetch character assets
   */
  private async fetchCharacterAssets(
    characterId: number,
    accessToken: string
  ): Promise<ESIAsset[]> {
    const cacheKey = `${this.assetPrefix}${characterId}`

    // Check cache
    const cached = await redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    const assets: ESIAsset[] = []

    // Fetch all pages
    for await (const page of esiClient.paginate<ESIAsset>(
      `/characters/${characterId}/assets/`,
      accessToken
    )) {
      assets.push(...page)
    }

    // Cache for 5 minutes
    await redis.set(cacheKey, JSON.stringify(assets), 'EX', 300)

    return assets
  }

  /**
   * Enrich assets with type information and market values
   */
  private async enrichAssets(assets: ESIAsset[]): Promise<EnrichedAsset[]> {
    const enriched: EnrichedAsset[] = []

    // Get unique type IDs
    const typeIds = [...new Set(assets.map(a => a.type_id))]

    // Fetch type information for all types
    await Promise.all(typeIds.map(typeId => this.getTypeInfo(typeId)))

    // Get market prices for The Forge (Jita)
    const marketAnalyses = await Promise.all(
      typeIds.map(async typeId => {
        const cached = await marketSyncService.getCachedAnalysis(typeId, 10000002)
        if (cached) return cached
        return marketSyncService.analyzeMarket(typeId, 10000002)
      })
    )

    const priceMap = new Map(
      marketAnalyses.map(analysis => [analysis.typeId, analysis.currentStats.sellPrice || 0])
    )

    // Enrich each asset
    for (const asset of assets) {
      const typeInfo = this.typeCache.get(asset.type_id)
      if (!typeInfo) continue

      const price = priceMap.get(asset.type_id) || 0
      const volume = (typeInfo.volume || 0) * asset.quantity

      enriched.push({
        ...asset,
        typeName: typeInfo.name,
        groupId: typeInfo.group_id,
        groupName: '', // Will be filled by group info
        categoryId: 0, // Will be filled by category info
        categoryName: '', // Will be filled by category info
        volume,
        value: price * asset.quantity,
        packaged: !asset.is_singleton,
      })
    }

    return enriched
  }

  /**
   * Group assets by location
   */
  private async groupAssetsByLocation(assets: EnrichedAsset[]): Promise<AssetGroup[]> {
    const locationMap = new Map<number, EnrichedAsset[]>()

    // Group by location ID
    for (const asset of assets) {
      const existing = locationMap.get(asset.location_id) || []
      existing.push(asset)
      locationMap.set(asset.location_id, existing)
    }

    // Create asset groups
    const groups: AssetGroup[] = []

    for (const [locationId, locationAssets] of locationMap) {
      const firstAsset = locationAssets[0]
      if (!firstAsset) continue
      const location = await this.getLocation(locationId, firstAsset.location_type)

      const totalValue = locationAssets.reduce((sum, a) => sum + a.value, 0)
      const totalVolume = locationAssets.reduce((sum, a) => sum + a.volume, 0)

      groups.push({
        location,
        assets: locationAssets.sort((a, b) => b.value - a.value),
        totalValue,
        totalVolume,
        itemCount: locationAssets.length,
      })
    }

    return groups
  }

  /**
   * Get location information
   */
  private async getLocation(locationId: number, locationType: string): Promise<AssetLocation> {
    // Check cache
    if (this.locationCache.has(locationId)) {
      return this.locationCache.get(locationId)!
    }

    const cacheKey = `${this.locationPrefix}${locationId}`
    const cached = await redis.get(cacheKey)
    if (cached) {
      const location = JSON.parse(cached)
      this.locationCache.set(locationId, location)
      return location
    }

    let location: AssetLocation

    if (locationType === 'station') {
      // Fetch station information
      const response = await esiClient.publicRequest<ESIStation>(
        `/universe/stations/${locationId}/`
      )
      const station = response.data

      // Fetch system information
      const systemResponse = await esiClient.publicRequest<ESISolarSystem>(
        `/universe/systems/${station.system_id}/`
      )
      const system = systemResponse.data

      location = {
        locationId,
        locationType: 'station',
        locationName: station.name,
        solarSystemId: station.system_id,
        solarSystemName: system.name,
        securityStatus: system.security_status,
        regionId: 0, // Would need constellation lookup
        regionName: '', // Would need region lookup
      }
    } else if (locationType === 'solar_system') {
      // Fetch system information
      const response = await esiClient.publicRequest<ESISolarSystem>(
        `/universe/systems/${locationId}/`
      )
      const system = response.data

      location = {
        locationId,
        locationType: 'solar_system',
        locationName: system.name,
        solarSystemId: locationId,
        solarSystemName: system.name,
        securityStatus: system.security_status,
        regionId: 0, // Would need constellation lookup
        regionName: '', // Would need region lookup
      }
    } else {
      // Default for unknown locations
      location = {
        locationId,
        locationType: locationType as any,
        locationName: `Unknown Location (${locationId})`,
        solarSystemId: 0,
        solarSystemName: 'Unknown',
        securityStatus: 0,
        regionId: 0,
        regionName: 'Unknown',
      }
    }

    // Cache location
    await redis.set(cacheKey, JSON.stringify(location), 'EX', 86400) // 24 hours
    this.locationCache.set(locationId, location)

    return location
  }

  /**
   * Get type information
   */
  private async getTypeInfo(typeId: number): Promise<ESIType | null> {
    // Check memory cache
    if (this.typeCache.has(typeId)) {
      return this.typeCache.get(typeId)!
    }

    // Check Redis cache
    const cacheKey = `${this.typePrefix}${typeId}`
    const cached = await redis.get(cacheKey)
    if (cached) {
      const typeInfo = JSON.parse(cached)
      this.typeCache.set(typeId, typeInfo)
      return typeInfo
    }

    try {
      // Fetch from ESI
      const response = await esiClient.publicRequest<ESIType>(`/universe/types/${typeId}/`)
      const typeInfo = response.data

      // Cache type info
      await redis.set(cacheKey, JSON.stringify(typeInfo), 'EX', 604800) // 7 days
      this.typeCache.set(typeId, typeInfo)

      return typeInfo
    } catch (error) {
      console.error(`Failed to fetch type info for ${typeId}:`, error)
      return null
    }
  }

  /**
   * Calculate category breakdown
   */
  private calculateCategoryBreakdown(
    assets: EnrichedAsset[],
    totalValue: number
  ): CategoryBreakdown[] {
    const categoryMap = new Map<
      number,
      {
        name: string
        count: number
        value: number
      }
    >()

    // Group by category
    for (const asset of assets) {
      const existing = categoryMap.get(asset.categoryId) || {
        name: asset.categoryName,
        count: 0,
        value: 0,
      }

      existing.count += 1
      existing.value += asset.value

      categoryMap.set(asset.categoryId, existing)
    }

    // Convert to breakdown array
    const breakdown: CategoryBreakdown[] = []

    for (const [categoryId, data] of categoryMap) {
      breakdown.push({
        categoryId,
        categoryName: data.name,
        itemCount: data.count,
        totalValue: data.value,
        percentage: (data.value / totalValue) * 100,
      })
    }

    // Sort by value
    breakdown.sort((a, b) => b.totalValue - a.totalValue)

    return breakdown
  }

  /**
   * Save asset snapshot for change tracking
   */
  private async saveAssetSnapshot(characterId: number, assets: EnrichedAsset[]): Promise<void> {
    const key = `${this.assetPrefix}snapshot:${characterId}`
    await redis.set(key, JSON.stringify(assets), 'EX', 86400) // 24 hours
  }

  /**
   * Get asset snapshot
   */
  private async getAssetSnapshot(characterId: number): Promise<EnrichedAsset[] | null> {
    const key = `${this.assetPrefix}snapshot:${characterId}`
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  }

  /**
   * Cache asset summary
   */
  private async cacheSummary(characterId: number, summary: AssetSummary): Promise<void> {
    const key = `${this.assetPrefix}summary:${characterId}`
    await redis.set(key, JSON.stringify(summary), 'EX', 300) // 5 minutes
  }

  /**
   * Get cached asset summary
   */
  async getCachedSummary(characterId: number): Promise<AssetSummary | null> {
    const key = `${this.assetPrefix}summary:${characterId}`
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  }

  /**
   * Clear asset cache
   */
  async clearCache(characterId?: number): Promise<void> {
    if (characterId) {
      const keys = [
        `${this.assetPrefix}${characterId}`,
        `${this.assetPrefix}summary:${characterId}`,
        `${this.assetPrefix}snapshot:${characterId}`,
      ]
      await redis.del(...keys)
    } else {
      // Clear all asset cache
      const keys = await redis.keys(`${this.assetPrefix}*`)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    }
  }
}

// Export singleton instance
export const assetTrackingService = new AssetTrackingService()
