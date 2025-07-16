/**
 * Redis Connection and Caching Utilities
 * Provides centralized Redis connection management for Eve-Cortex
 */

import Redis from 'ioredis'

// Redis connection configuration
const REDIS_URL = process.env['REDIS_URL'] || 'redis://localhost:6379'

// Connection options
const connectionOptions = {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  lazyConnect: true,
  keepAlive: 30000,
  family: 4,
  ...(process.env.NODE_ENV === 'development' && {
    showFriendlyErrorStack: true,
  }),
}

// Create Redis connection
export const redis = new Redis(REDIS_URL, connectionOptions)

// Redis health check
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const result = await redis.ping()
    return result === 'PONG'
  } catch (error) {
    console.error('Redis health check failed:', error)
    return false
  }
}

// Redis connection info
export async function getRedisInfo() {
  try {
    const info = await redis.info()
    const lines = info.split('\n')
    const parsed = {} as Record<string, string>

    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':')
        if (key && value !== undefined) {
          parsed[key] = value.trim()
        }
      }
    })

    return {
      redis_version: parsed['redis_version'],
      connected_clients: parsed['connected_clients'],
      used_memory_human: parsed['used_memory_human'],
      uptime_in_seconds: parsed['uptime_in_seconds'],
    }
  } catch (error) {
    console.error('Failed to get Redis info:', error)
    return null
  }
}

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  CHARACTER_DATA: 300, // 5 minutes
  MARKET_DATA: 60, // 1 minute
  ESI_RATE: 1, // 1 second
  SKILL_PLANS: 1800, // 30 minutes
  FITTINGS: 600, // 10 minutes
  STATIC_DATA: 86400, // 24 hours
} as const

// Cache key prefixes
export const CACHE_KEYS = {
  CHARACTER: 'character',
  MARKET: 'market',
  ESI_RATE: 'esi_rate',
  SKILL_PLAN: 'skill_plan',
  FITTING: 'fitting',
  STATIC: 'static',
} as const

// Generate cache key with prefix
export function generateCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `eve_cortex:${prefix}:${parts.join(':')}`
}

// Generic cache operations
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get(key)
    return cached ? JSON.parse(cached) : null
  } catch (error) {
    console.error(`Failed to get cached value for key ${key}:`, error)
    return null
  }
}

export async function setCached<T>(
  key: string,
  value: T,
  ttl: number = CACHE_TTL.CHARACTER_DATA
): Promise<boolean> {
  try {
    await redis.setex(key, ttl, JSON.stringify(value))
    return true
  } catch (error) {
    console.error(`Failed to set cached value for key ${key}:`, error)
    return false
  }
}

export async function deleteCached(key: string): Promise<boolean> {
  try {
    await redis.del(key)
    return true
  } catch (error) {
    console.error(`Failed to delete cached value for key ${key}:`, error)
    return false
  }
}

// Cache invalidation patterns
export async function invalidatePattern(pattern: string): Promise<number> {
  try {
    const keys = await redis.keys(`eve_cortex:${pattern}`)
    if (keys.length === 0) return 0

    const deleted = await redis.del(...keys)
    return deleted
  } catch (error) {
    console.error(`Failed to invalidate pattern ${pattern}:`, error)
    return 0
  }
}

// Character data caching
export async function getCachedCharacterData(characterId: number) {
  const key = generateCacheKey(CACHE_KEYS.CHARACTER, characterId)
  return getCached(key)
}

export async function setCachedCharacterData(characterId: number, data: any) {
  const key = generateCacheKey(CACHE_KEYS.CHARACTER, characterId)
  return setCached(key, data, CACHE_TTL.CHARACTER_DATA)
}

export async function invalidateCharacterData(characterId: number) {
  const pattern = `${CACHE_KEYS.CHARACTER}:${characterId}*`
  return invalidatePattern(pattern)
}

// Market data caching
export async function getCachedMarketData(regionId: number, typeId?: number) {
  const key = typeId
    ? generateCacheKey(CACHE_KEYS.MARKET, regionId, typeId)
    : generateCacheKey(CACHE_KEYS.MARKET, regionId)
  return getCached(key)
}

export async function setCachedMarketData(regionId: number, data: any, typeId?: number) {
  const key = typeId
    ? generateCacheKey(CACHE_KEYS.MARKET, regionId, typeId)
    : generateCacheKey(CACHE_KEYS.MARKET, regionId)
  return setCached(key, data, CACHE_TTL.MARKET_DATA)
}

export async function invalidateMarketData(regionId?: number) {
  const pattern = regionId ? `${CACHE_KEYS.MARKET}:${regionId}*` : `${CACHE_KEYS.MARKET}*`
  return invalidatePattern(pattern)
}

// ESI rate limiting
export async function checkESIRateLimit(endpoint: string): Promise<boolean> {
  const key = generateCacheKey(CACHE_KEYS.ESI_RATE, endpoint)
  try {
    const current = await redis.get(key)
    return current === null
  } catch (error) {
    console.error(`Failed to check ESI rate limit for ${endpoint}:`, error)
    return false
  }
}

export async function setESIRateLimit(endpoint: string, limit: number = 1): Promise<boolean> {
  const key = generateCacheKey(CACHE_KEYS.ESI_RATE, endpoint)
  try {
    await redis.setex(key, CACHE_TTL.ESI_RATE, limit.toString())
    return true
  } catch (error) {
    console.error(`Failed to set ESI rate limit for ${endpoint}:`, error)
    return false
  }
}

// Skill plan caching
export async function getCachedSkillPlan(characterId: number, planId: number) {
  const key = generateCacheKey(CACHE_KEYS.SKILL_PLAN, characterId, planId)
  return getCached(key)
}

export async function setCachedSkillPlan(characterId: number, planId: number, data: any) {
  const key = generateCacheKey(CACHE_KEYS.SKILL_PLAN, characterId, planId)
  return setCached(key, data, CACHE_TTL.SKILL_PLANS)
}

export async function invalidateSkillPlans(characterId: number) {
  const pattern = `${CACHE_KEYS.SKILL_PLAN}:${characterId}*`
  return invalidatePattern(pattern)
}

// Fitting caching
export async function getCachedFitting(fittingId: number) {
  const key = generateCacheKey(CACHE_KEYS.FITTING, fittingId)
  return getCached(key)
}

export async function setCachedFitting(fittingId: number, data: any) {
  const key = generateCacheKey(CACHE_KEYS.FITTING, fittingId)
  return setCached(key, data, CACHE_TTL.FITTINGS)
}

export async function invalidateFittings(characterId?: number) {
  const pattern = characterId ? `${CACHE_KEYS.FITTING}:*:${characterId}*` : `${CACHE_KEYS.FITTING}*`
  return invalidatePattern(pattern)
}

// Static data caching (SDE data)
export async function getCachedStaticData(dataType: string, id?: number) {
  const key = id
    ? generateCacheKey(CACHE_KEYS.STATIC, dataType, id)
    : generateCacheKey(CACHE_KEYS.STATIC, dataType)
  return getCached(key)
}

export async function setCachedStaticData(dataType: string, data: any, id?: number) {
  const key = id
    ? generateCacheKey(CACHE_KEYS.STATIC, dataType, id)
    : generateCacheKey(CACHE_KEYS.STATIC, dataType)
  return setCached(key, data, CACHE_TTL.STATIC_DATA)
}

// Cache statistics and monitoring
export async function getCacheStats() {
  try {
    const info = await getRedisInfo()
    const keyCount = await redis.dbsize()

    return {
      connected: await checkRedisHealth(),
      key_count: keyCount,
      memory_usage: info?.used_memory_human || 'unknown',
      uptime: info?.uptime_in_seconds || 'unknown',
      connected_clients: info?.connected_clients || 'unknown',
    }
  } catch (error) {
    console.error('Failed to get cache stats:', error)
    return null
  }
}

// Cache warming utilities
export async function warmCache(characterId: number) {
  try {
    // This would typically fetch and cache frequently accessed data
    // Implementation depends on the specific data sources
    console.log(`Warming cache for character ${characterId}`)

    // Example: Pre-load character data, skills, active fittings
    // These would be actual API calls in production
    const warmingTasks: Promise<any>[] = [
      // getCachedCharacterData(characterId),
      // getCachedSkillPlan(characterId, 1),
      // getCachedFitting(1),
    ]

    await Promise.allSettled(warmingTasks)
    return true
  } catch (error) {
    console.error(`Failed to warm cache for character ${characterId}:`, error)
    return false
  }
}

// Close Redis connection
export async function closeRedisConnection(): Promise<void> {
  await redis.quit()
}

// Error handling utilities
export class CacheError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly key?: string
  ) {
    super(message)
    this.name = 'CacheError'
  }
}

export function handleCacheError(error: unknown, operation: string, key?: string): never {
  if (error instanceof Error) {
    throw new CacheError(error.message, operation, key)
  }
  throw error
}

// Export default connection for direct use
export default redis
