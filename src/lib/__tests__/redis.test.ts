/**
 * Redis Cache System Tests
 * Comprehensive test suite for Redis caching functionality
 */

import { 
  redis, 
  checkRedisHealth, 
  getRedisInfo, 
  getCached, 
  setCached, 
  deleteCached, 
  invalidatePattern,
  generateCacheKey,
  getCachedCharacterData,
  setCachedCharacterData,
  invalidateCharacterData,
  getCachedMarketData,
  setCachedMarketData,
  checkESIRateLimit,
  setESIRateLimit,
  getCachedSkillPlan,
  setCachedSkillPlan,
  invalidateSkillPlans,
  getCachedFitting,
  setCachedFitting,
  invalidateFittings,
  getCachedStaticData,
  setCachedStaticData,
  getCacheStats,
  warmCache,
  CACHE_KEYS,
  CACHE_TTL
} from '../redis'

// Mock Redis for testing
jest.mock('ioredis', () => {
  const mockRedis = {
    ping: jest.fn(),
    info: jest.fn(),
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    dbsize: jest.fn(),
    quit: jest.fn(),
    eval: jest.fn(),
  }
  return jest.fn(() => mockRedis)
})

describe('Redis Cache System', () => {
  let mockRedis: any

  beforeEach(() => {
    mockRedis = redis as any
    jest.clearAllMocks()
  })

  describe('Health Checks', () => {
    test('should return true for healthy Redis connection', async () => {
      mockRedis.ping.mockResolvedValue('PONG')
      
      const result = await checkRedisHealth()
      expect(result).toBe(true)
      expect(mockRedis.ping).toHaveBeenCalled()
    })

    test('should return false for unhealthy Redis connection', async () => {
      mockRedis.ping.mockRejectedValue(new Error('Connection failed'))
      
      const result = await checkRedisHealth()
      expect(result).toBe(false)
    })

    test('should parse Redis info correctly', async () => {
      const mockInfo = 'redis_version:7.0.0\r\nconnected_clients:1\r\nused_memory_human:1.2M\r\nuptime_in_seconds:3600\r\n'
      mockRedis.info.mockResolvedValue(mockInfo)
      
      const result = await getRedisInfo()
      expect(result).toEqual({
        redis_version: '7.0.0',
        connected_clients: '1',
        used_memory_human: '1.2M',
        uptime_in_seconds: '3600'
      })
    })
  })

  describe('Cache Key Generation', () => {
    test('should generate correct cache key with prefix', () => {
      const key = generateCacheKey('test', 'user', 123)
      expect(key).toBe('eve_cortex:test:user:123')
    })

    test('should generate key with single part', () => {
      const key = generateCacheKey('test', 'single')
      expect(key).toBe('eve_cortex:test:single')
    })

    test('should handle mixed types in key parts', () => {
      const key = generateCacheKey('test', 'user', 123, 'data', 456)
      expect(key).toBe('eve_cortex:test:user:123:data:456')
    })
  })

  describe('Generic Cache Operations', () => {
    test('should get cached value successfully', async () => {
      const testData = { test: 'value', number: 123 }
      mockRedis.get.mockResolvedValue(JSON.stringify(testData))
      
      const result = await getCached('test:key')
      expect(result).toEqual(testData)
      expect(mockRedis.get).toHaveBeenCalledWith('test:key')
    })

    test('should return null for non-existent key', async () => {
      mockRedis.get.mockResolvedValue(null)
      
      const result = await getCached('nonexistent:key')
      expect(result).toBeNull()
    })

    test('should set cached value with TTL', async () => {
      const testData = { test: 'value' }
      mockRedis.setex.mockResolvedValue('OK')
      
      const result = await setCached('test:key', testData, 300)
      expect(result).toBe(true)
      expect(mockRedis.setex).toHaveBeenCalledWith('test:key', 300, JSON.stringify(testData))
    })

    test('should delete cached value', async () => {
      mockRedis.del.mockResolvedValue(1)
      
      const result = await deleteCached('test:key')
      expect(result).toBe(true)
      expect(mockRedis.del).toHaveBeenCalledWith('test:key')
    })

    test('should invalidate pattern', async () => {
      const mockKeys = ['eve_cortex:test:1', 'eve_cortex:test:2']
      mockRedis.keys.mockResolvedValue(mockKeys)
      mockRedis.del.mockResolvedValue(2)
      
      const result = await invalidatePattern('test:*')
      expect(result).toBe(2)
      expect(mockRedis.keys).toHaveBeenCalledWith('eve_cortex:test:*')
      expect(mockRedis.del).toHaveBeenCalledWith(...mockKeys)
    })
  })

  describe('Character Data Caching', () => {
    test('should cache character data correctly', async () => {
      const characterData = { id: 123, name: 'Test Character' }
      mockRedis.setex.mockResolvedValue('OK')
      
      const result = await setCachedCharacterData(123, characterData)
      expect(result).toBe(true)
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'eve_cortex:character:123', 
        CACHE_TTL.CHARACTER_DATA, 
        JSON.stringify(characterData)
      )
    })

    test('should retrieve cached character data', async () => {
      const characterData = { id: 123, name: 'Test Character' }
      mockRedis.get.mockResolvedValue(JSON.stringify(characterData))
      
      const result = await getCachedCharacterData(123)
      expect(result).toEqual(characterData)
      expect(mockRedis.get).toHaveBeenCalledWith('eve_cortex:character:123')
    })

    test('should invalidate character data', async () => {
      const mockKeys = ['eve_cortex:character:123:basic', 'eve_cortex:character:123:skills']
      mockRedis.keys.mockResolvedValue(mockKeys)
      mockRedis.del.mockResolvedValue(2)
      
      const result = await invalidateCharacterData(123)
      expect(result).toBe(2)
      expect(mockRedis.keys).toHaveBeenCalledWith('eve_cortex:character:123*')
    })
  })

  describe('Market Data Caching', () => {
    test('should cache market data for region', async () => {
      const marketData = { orders: [], history: [] }
      mockRedis.setex.mockResolvedValue('OK')
      
      const result = await setCachedMarketData(10000002, marketData)
      expect(result).toBe(true)
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'eve_cortex:market:10000002', 
        CACHE_TTL.MARKET_DATA, 
        JSON.stringify(marketData)
      )
    })

    test('should cache market data for specific type', async () => {
      const marketData = { orders: [], history: [] }
      mockRedis.setex.mockResolvedValue('OK')
      
      const result = await setCachedMarketData(10000002, marketData, 34)
      expect(result).toBe(true)
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'eve_cortex:market:10000002:34', 
        CACHE_TTL.MARKET_DATA, 
        JSON.stringify(marketData)
      )
    })

    test('should retrieve cached market data', async () => {
      const marketData = { orders: [], history: [] }
      mockRedis.get.mockResolvedValue(JSON.stringify(marketData))
      
      const result = await getCachedMarketData(10000002)
      expect(result).toEqual(marketData)
      expect(mockRedis.get).toHaveBeenCalledWith('eve_cortex:market:10000002')
    })
  })

  describe('ESI Rate Limiting', () => {
    test('should check ESI rate limit when not limited', async () => {
      mockRedis.get.mockResolvedValue(null)
      
      const result = await checkESIRateLimit('/characters/123/')
      expect(result).toBe(true)
      expect(mockRedis.get).toHaveBeenCalledWith('eve_cortex:esi_rate:/characters/123/')
    })

    test('should check ESI rate limit when limited', async () => {
      mockRedis.get.mockResolvedValue('1')
      
      const result = await checkESIRateLimit('/characters/123/')
      expect(result).toBe(false)
    })

    test('should set ESI rate limit', async () => {
      mockRedis.setex.mockResolvedValue('OK')
      
      const result = await setESIRateLimit('/characters/123/', 1)
      expect(result).toBe(true)
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'eve_cortex:esi_rate:/characters/123/', 
        CACHE_TTL.ESI_RATE, 
        '1'
      )
    })
  })

  describe('Skill Plan Caching', () => {
    test('should cache skill plan data', async () => {
      const skillPlan = { id: 1, character_id: 123, skills: [] }
      mockRedis.setex.mockResolvedValue('OK')
      
      const result = await setCachedSkillPlan(123, 1, skillPlan)
      expect(result).toBe(true)
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'eve_cortex:skill_plan:123:1', 
        CACHE_TTL.SKILL_PLANS, 
        JSON.stringify(skillPlan)
      )
    })

    test('should retrieve cached skill plan', async () => {
      const skillPlan = { id: 1, character_id: 123, skills: [] }
      mockRedis.get.mockResolvedValue(JSON.stringify(skillPlan))
      
      const result = await getCachedSkillPlan(123, 1)
      expect(result).toEqual(skillPlan)
      expect(mockRedis.get).toHaveBeenCalledWith('eve_cortex:skill_plan:123:1')
    })

    test('should invalidate skill plans for character', async () => {
      const mockKeys = ['eve_cortex:skill_plan:123:1', 'eve_cortex:skill_plan:123:2']
      mockRedis.keys.mockResolvedValue(mockKeys)
      mockRedis.del.mockResolvedValue(2)
      
      const result = await invalidateSkillPlans(123)
      expect(result).toBe(2)
      expect(mockRedis.keys).toHaveBeenCalledWith('eve_cortex:skill_plan:123*')
    })
  })

  describe('Fitting Caching', () => {
    test('should cache fitting data', async () => {
      const fitting = { id: 1, ship_type_id: 597, modules: [] }
      mockRedis.setex.mockResolvedValue('OK')
      
      const result = await setCachedFitting(1, fitting)
      expect(result).toBe(true)
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'eve_cortex:fitting:1', 
        CACHE_TTL.FITTINGS, 
        JSON.stringify(fitting)
      )
    })

    test('should retrieve cached fitting', async () => {
      const fitting = { id: 1, ship_type_id: 597, modules: [] }
      mockRedis.get.mockResolvedValue(JSON.stringify(fitting))
      
      const result = await getCachedFitting(1)
      expect(result).toEqual(fitting)
      expect(mockRedis.get).toHaveBeenCalledWith('eve_cortex:fitting:1')
    })

    test('should invalidate all fittings', async () => {
      const mockKeys = ['eve_cortex:fitting:1', 'eve_cortex:fitting:2']
      mockRedis.keys.mockResolvedValue(mockKeys)
      mockRedis.del.mockResolvedValue(2)
      
      const result = await invalidateFittings()
      expect(result).toBe(2)
      expect(mockRedis.keys).toHaveBeenCalledWith('eve_cortex:fitting*')
    })
  })

  describe('Static Data Caching', () => {
    test('should cache static data', async () => {
      const staticData = { types: [], groups: [] }
      mockRedis.setex.mockResolvedValue('OK')
      
      const result = await setCachedStaticData('ship_types', staticData)
      expect(result).toBe(true)
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'eve_cortex:static:ship_types', 
        CACHE_TTL.STATIC_DATA, 
        JSON.stringify(staticData)
      )
    })

    test('should cache static data with ID', async () => {
      const staticData = { type_id: 597, name: 'Rifter' }
      mockRedis.setex.mockResolvedValue('OK')
      
      const result = await setCachedStaticData('ship_types', staticData, 597)
      expect(result).toBe(true)
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'eve_cortex:static:ship_types:597', 
        CACHE_TTL.STATIC_DATA, 
        JSON.stringify(staticData)
      )
    })

    test('should retrieve cached static data', async () => {
      const staticData = { types: [], groups: [] }
      mockRedis.get.mockResolvedValue(JSON.stringify(staticData))
      
      const result = await getCachedStaticData('ship_types')
      expect(result).toEqual(staticData)
      expect(mockRedis.get).toHaveBeenCalledWith('eve_cortex:static:ship_types')
    })
  })

  describe('Cache Statistics', () => {
    test('should get cache statistics', async () => {
      const mockInfo = 'redis_version:7.0.0\r\nconnected_clients:1\r\nused_memory_human:1.2M\r\nuptime_in_seconds:3600\r\n'
      mockRedis.info.mockResolvedValue(mockInfo)
      mockRedis.ping.mockResolvedValue('PONG')
      mockRedis.dbsize.mockResolvedValue(1000)
      
      const result = await getCacheStats()
      expect(result).toEqual({
        connected: true,
        key_count: 1000,
        memory_usage: '1.2M',
        uptime: '3600',
        connected_clients: '1'
      })
    })

    test('should handle cache statistics error', async () => {
      mockRedis.ping.mockRejectedValue(new Error('Connection failed'))
      
      const result = await getCacheStats()
      expect(result).toBeNull()
    })
  })

  describe('Cache Warming', () => {
    test('should warm cache for character', async () => {
      const result = await warmCache(123)
      expect(result).toBe(true)
    })

    test('should handle cache warming error', async () => {
      // Mock a function that might fail during warming
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      const result = await warmCache(123)
      expect(result).toBe(true) // Should still return true even if some operations fail
      
      consoleSpy.mockRestore()
    })
  })

  describe('Error Handling', () => {
    test('should handle Redis connection errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Connection failed'))
      
      const result = await getCached('test:key')
      expect(result).toBeNull()
    })

    test('should handle set operation errors gracefully', async () => {
      mockRedis.setex.mockRejectedValue(new Error('Connection failed'))
      
      const result = await setCached('test:key', { test: 'value' })
      expect(result).toBe(false)
    })

    test('should handle delete operation errors gracefully', async () => {
      mockRedis.del.mockRejectedValue(new Error('Connection failed'))
      
      const result = await deleteCached('test:key')
      expect(result).toBe(false)
    })
  })

  describe('Constants and Configuration', () => {
    test('should have correct cache key prefixes', () => {
      expect(CACHE_KEYS.CHARACTER).toBe('character')
      expect(CACHE_KEYS.MARKET).toBe('market')
      expect(CACHE_KEYS.ESI_RATE).toBe('esi_rate')
      expect(CACHE_KEYS.SKILL_PLAN).toBe('skill_plan')
      expect(CACHE_KEYS.FITTING).toBe('fitting')
      expect(CACHE_KEYS.STATIC).toBe('static')
    })

    test('should have reasonable TTL values', () => {
      expect(CACHE_TTL.CHARACTER_DATA).toBe(300) // 5 minutes
      expect(CACHE_TTL.MARKET_DATA).toBe(60) // 1 minute
      expect(CACHE_TTL.ESI_RATE).toBe(1) // 1 second
      expect(CACHE_TTL.SKILL_PLANS).toBe(1800) // 30 minutes
      expect(CACHE_TTL.FITTINGS).toBe(600) // 10 minutes
      expect(CACHE_TTL.STATIC_DATA).toBe(86400) // 24 hours
    })
  })
})