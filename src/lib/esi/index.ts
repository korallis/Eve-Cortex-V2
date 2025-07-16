/**
 * EVE Online ESI API Module
 * Exports all ESI-related services and utilities
 */

export { esiClient, ESIClient } from './client'
export { characterSyncService, CharacterSyncService } from './character-sync'
export { marketSyncService, MarketSyncService } from './market-sync'
export { assetTrackingService, AssetTrackingService } from './asset-tracking'

// Re-export types
export type {
  ESIConfig,
  ESIError,
  ESIHeaders,
  ESIRequestOptions,
  ESIResponse,
  ESIRateLimitInfo,
  ESIPaginationOptions,
  ESIRoutes,
} from '@/types/esi'

export type { CharacterSyncResult } from './character-sync'

export type { MarketStats, MarketAnalysis, ProfitOpportunity, TrendAnalysis } from './market-sync'

export type {
  AssetLocation,
  AssetGroup,
  EnrichedAsset,
  AssetSummary,
  CategoryBreakdown,
} from './asset-tracking'

// Export error checking utility
export { isESIError } from '@/types/esi'
