/**
 * Cache Health Monitoring Tests
 * Test suite for cache health monitoring and performance metrics
 */

import {
  CacheMonitor,
  cacheMonitor,
  performQuickHealthCheck,
  getDetailedHealthReport,
  optimizeCache,
  validateCacheIntegrity,
} from '../cache-health'

import { checkRedisHealth, getRedisInfo, getCacheStats } from '../redis'

// Mock the redis module
jest.mock('../redis', () => ({
  redis: {
    ping: jest.fn(),
    info: jest.fn(),
    setex: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    eval: jest.fn(),
  },
  checkRedisHealth: jest.fn(),
  getRedisInfo: jest.fn(),
  getCacheStats: jest.fn(),
}))

describe('Cache Health Monitoring', () => {
  let monitor: CacheMonitor

  beforeEach(() => {
    monitor = new CacheMonitor()
    jest.clearAllMocks()
  })

  describe('CacheMonitor', () => {
    describe('Health Checks', () => {
      test('should perform healthy check successfully', async () => {
        ;(checkRedisHealth as jest.Mock).mockResolvedValue(true)
        ;(getRedisInfo as jest.Mock).mockResolvedValue({
          redis_version: '7.0.0',
          connected_clients: '1',
          used_memory_human: '1.2M',
          uptime_in_seconds: '3600',
        })
        ;(getCacheStats as jest.Mock).mockResolvedValue({
          connected: true,
          key_count: 1000,
          memory_usage: '1.2M',
          uptime: '3600',
          connected_clients: '1',
        })

        const result = await monitor.performHealthCheck()

        expect(result.service).toBe('redis-cache')
        expect(result.status).toBe('healthy')
        expect(result.details.connected).toBe(true)
        expect(result.details.key_count).toBe(1000)
        expect(result.details.memory_usage).toBe('1.2M')
        expect(result.response_time).toBeGreaterThanOrEqual(0)
        expect(result.timestamp).toBeInstanceOf(Date)
      })

      test('should handle unhealthy Redis connection', async () => {
        ;(checkRedisHealth as jest.Mock).mockResolvedValue(false)
        ;(getRedisInfo as jest.Mock).mockResolvedValue(null)
        ;(getCacheStats as jest.Mock).mockResolvedValue(null)

        const result = await monitor.performHealthCheck()

        expect(result.service).toBe('redis-cache')
        expect(result.status).toBe('unhealthy')
        expect(result.details.connected).toBe(false)
        expect(result.details.key_count).toBe(0)
        expect(result.details.memory_usage).toBe('unknown')
      })

      test('should detect degraded performance', async () => {
        ;(checkRedisHealth as jest.Mock).mockImplementation(async () => {
          // Simulate slow response
          await new Promise(resolve => setTimeout(resolve, 1100))
          return true
        })
        ;(getRedisInfo as jest.Mock).mockResolvedValue({
          redis_version: '7.0.0',
          connected_clients: '1',
          used_memory_human: '1.2M',
          uptime_in_seconds: '3600',
        })
        ;(getCacheStats as jest.Mock).mockResolvedValue({
          connected: true,
          key_count: 1000,
          memory_usage: '1.2M',
          uptime: '3600',
          connected_clients: '1',
        })

        const result = await monitor.performHealthCheck()

        expect(result.status).toBe('degraded')
        expect(result.response_time).toBeGreaterThan(1000)
      })

      test('should handle health check errors', async () => {
        ;(checkRedisHealth as jest.Mock).mockRejectedValue(new Error('Connection failed'))

        const result = await monitor.performHealthCheck()

        expect(result.status).toBe('unhealthy')
        expect(result.details.connected).toBe(false)
        expect(result.details.last_error).toBe('Connection failed')
      })

      test('should maintain health check history', async () => {
        ;(checkRedisHealth as jest.Mock).mockResolvedValue(true)
        ;(getRedisInfo as jest.Mock).mockResolvedValue({})
        ;(getCacheStats as jest.Mock).mockResolvedValue({
          connected: true,
          key_count: 1000,
          memory_usage: '1.2M',
          uptime: '3600',
          connected_clients: '1',
        })

        await monitor.performHealthCheck()
        await monitor.performHealthCheck()

        const history = monitor.getHealthHistory()
        expect(history).toHaveLength(2)
        expect(history[0]?.timestamp).toBeInstanceOf(Date)
        expect(history[1]?.timestamp).toBeInstanceOf(Date)
      })

      test('should limit health check history size', async () => {
        ;(checkRedisHealth as jest.Mock).mockResolvedValue(true)
        ;(getRedisInfo as jest.Mock).mockResolvedValue({})
        ;(getCacheStats as jest.Mock).mockResolvedValue({
          connected: true,
          key_count: 1000,
          memory_usage: '1.2M',
          uptime: '3600',
          connected_clients: '1',
        })

        // Add more than the max history size (100)
        for (let i = 0; i < 105; i++) {
          await monitor.performHealthCheck()
        }

        const history = monitor.getHealthHistory()
        expect(history).toHaveLength(100)
      })

      test('should get latest health status', async () => {
        ;(checkRedisHealth as jest.Mock).mockResolvedValue(true)
        ;(getRedisInfo as jest.Mock).mockResolvedValue({})
        ;(getCacheStats as jest.Mock).mockResolvedValue({
          connected: true,
          key_count: 1000,
          memory_usage: '1.2M',
          uptime: '3600',
          connected_clients: '1',
        })

        const latestBeforeCheck = monitor.getLatestHealthStatus()
        expect(latestBeforeCheck).toBeNull()

        await monitor.performHealthCheck()
        const latestAfterCheck = monitor.getLatestHealthStatus()
        expect(latestAfterCheck).not.toBeNull()
        expect(latestAfterCheck?.service).toBe('redis-cache')
      })
    })

    describe('Performance Metrics', () => {
      test('should collect performance metrics successfully', async () => {
        const mockStatsInfo =
          'total_commands_processed:1000\r\nkeyspace_hits:800\r\nkeyspace_misses:200\r\nused_memory_peak:1048576\r\ntotal_connections_received:10\r\nexpired_keys:5\r\nevicted_keys:2\r\n'

        const mockRedis = require('../redis').redis
        mockRedis.info.mockResolvedValue(mockStatsInfo)

        const result = await monitor.collectPerformanceMetrics()

        expect(result.hit_rate).toBe(0.8) // 800 / 1000
        expect(result.miss_rate).toBe(0.2) // 200 / 1000
        expect(result.total_commands).toBe(1000)
        expect(result.peak_memory_usage).toBe(1048576)
        expect(result.connections_received).toBe(10)
        expect(result.expired_keys).toBe(5)
        expect(result.evicted_keys).toBe(2)
        expect(result.timestamp).toBeInstanceOf(Date)
      })

      test('should handle zero keyspace operations', async () => {
        const mockStatsInfo =
          'total_commands_processed:1000\r\nkeyspace_hits:0\r\nkeyspace_misses:0\r\n'

        const mockRedis = require('../redis').redis
        mockRedis.info.mockResolvedValue(mockStatsInfo)

        const result = await monitor.collectPerformanceMetrics()

        expect(result.hit_rate).toBe(0)
        expect(result.miss_rate).toBe(0)
        expect(result.total_commands).toBe(1000)
      })

      test('should handle performance metrics collection error', async () => {
        const mockRedis = require('../redis').redis
        mockRedis.info.mockRejectedValue(new Error('Connection failed'))

        await expect(monitor.collectPerformanceMetrics()).rejects.toThrow('Connection failed')
      })

      test('should maintain performance metrics history', async () => {
        const mockStatsInfo =
          'total_commands_processed:1000\r\nkeyspace_hits:800\r\nkeyspace_misses:200\r\n'

        const mockRedis = require('../redis').redis
        mockRedis.info.mockResolvedValue(mockStatsInfo)

        await monitor.collectPerformanceMetrics()
        await monitor.collectPerformanceMetrics()

        const history = monitor.getPerformanceHistory()
        expect(history).toHaveLength(2)
      })

      test('should get latest performance metrics', async () => {
        const mockStatsInfo =
          'total_commands_processed:1000\r\nkeyspace_hits:800\r\nkeyspace_misses:200\r\n'

        const mockRedis = require('../redis').redis
        mockRedis.info.mockResolvedValue(mockStatsInfo)

        const latestBefore = monitor.getLatestPerformanceMetrics()
        expect(latestBefore).toBeNull()

        await monitor.collectPerformanceMetrics()
        const latestAfter = monitor.getLatestPerformanceMetrics()
        expect(latestAfter).not.toBeNull()
        expect(latestAfter?.hit_rate).toBe(0.8)
      })
    })

    describe('Monitoring Summary', () => {
      test('should generate monitoring summary', async () => {
        ;(checkRedisHealth as jest.Mock).mockResolvedValue(true)
        ;(getRedisInfo as jest.Mock).mockResolvedValue({})
        ;(getCacheStats as jest.Mock).mockResolvedValue({
          connected: true,
          key_count: 1000,
          memory_usage: '1.2M',
          uptime: '3600',
          connected_clients: '1',
        })

        const mockStatsInfo =
          'total_commands_processed:1000\r\nkeyspace_hits:800\r\nkeyspace_misses:200\r\n'
        const mockRedis = require('../redis').redis
        mockRedis.info.mockResolvedValue(mockStatsInfo)

        const result = await monitor.getMonitoringSummary()

        expect(result.health.service).toBe('redis-cache')
        expect(result.performance.hit_rate).toBe(0.8)
        expect(result.summary.overall_status).toBe('healthy')
        expect(result.summary.cache_efficiency).toBe(0.8)
        expect(result.summary.memory_usage).toBe('1.2M')
        expect(result.summary.total_keys).toBe(1000)
      })
    })

    describe('History Management', () => {
      test('should clear history', async () => {
        ;(checkRedisHealth as jest.Mock).mockResolvedValue(true)
        ;(getRedisInfo as jest.Mock).mockResolvedValue({})
        ;(getCacheStats as jest.Mock).mockResolvedValue({
          connected: true,
          key_count: 1000,
          memory_usage: '1.2M',
          uptime: '3600',
          connected_clients: '1',
        })

        const mockStatsInfo =
          'total_commands_processed:1000\r\nkeyspace_hits:800\r\nkeyspace_misses:200\r\n'
        const mockRedis = require('../redis').redis
        mockRedis.info.mockResolvedValue(mockStatsInfo)

        await monitor.performHealthCheck()
        await monitor.collectPerformanceMetrics()

        expect(monitor.getHealthHistory()).toHaveLength(1)
        expect(monitor.getPerformanceHistory()).toHaveLength(1)

        monitor.clearHistory()

        expect(monitor.getHealthHistory()).toHaveLength(0)
        expect(monitor.getPerformanceHistory()).toHaveLength(0)
      })
    })
  })

  describe('Utility Functions', () => {
    test('should perform quick health check', async () => {
      ;(checkRedisHealth as jest.Mock).mockResolvedValue(true)
      ;(getRedisInfo as jest.Mock).mockResolvedValue({})
      ;(getCacheStats as jest.Mock).mockResolvedValue({
        connected: true,
        key_count: 1000,
        memory_usage: '1.2M',
        uptime: '3600',
        connected_clients: '1',
      })

      const result = await performQuickHealthCheck()
      expect(result).toBe(true)
    })

    test('should handle quick health check failure', async () => {
      ;(checkRedisHealth as jest.Mock).mockRejectedValue(new Error('Connection failed'))

      const result = await performQuickHealthCheck()
      expect(result).toBe(false)
    })

    test('should get detailed health report', async () => {
      ;(checkRedisHealth as jest.Mock).mockResolvedValue(true)
      ;(getRedisInfo as jest.Mock).mockResolvedValue({})
      ;(getCacheStats as jest.Mock).mockResolvedValue({
        connected: true,
        key_count: 1000,
        memory_usage: '1.2M',
        uptime: '3600',
        connected_clients: '1',
      })

      const mockStatsInfo =
        'total_commands_processed:1000\r\nkeyspace_hits:800\r\nkeyspace_misses:200\r\n'
      const mockRedis = require('../redis').redis
      mockRedis.info.mockResolvedValue(mockStatsInfo)

      const result = await getDetailedHealthReport()
      expect(result).not.toBeNull()
      expect(result!.health.service).toBe('redis-cache')
      expect(result!.performance.hit_rate).toBe(0.8)
      expect(result!.summary.overall_status).toBe('healthy')
    })

    test('should handle detailed health report error', async () => {
      ;(checkRedisHealth as jest.Mock).mockRejectedValue(new Error('Connection failed'))

      const result = await getDetailedHealthReport()
      expect(result).toBeNull()
    })

    test('should optimize cache', async () => {
      ;(getRedisInfo as jest.Mock).mockResolvedValue({
        used_memory_human: '1.2M',
      })

      const mockRedis = require('../redis').redis
      mockRedis.eval.mockResolvedValue(10)

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      await optimizeCache()

      expect(consoleSpy).toHaveBeenCalledWith('Starting cache optimization...')
      expect(consoleSpy).toHaveBeenCalledWith('Current memory usage: 1.2M')
      expect(consoleSpy).toHaveBeenCalledWith('Cache optimization completed')

      consoleSpy.mockRestore()
    })

    test('should handle cache optimization error', async () => {
      ;(getRedisInfo as jest.Mock).mockRejectedValue(new Error('Connection failed'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      await optimizeCache()

      expect(consoleSpy).toHaveBeenCalledWith('Failed to optimize cache:', expect.any(Error))

      consoleSpy.mockRestore()
    })

    test('should validate cache integrity successfully', async () => {
      const mockRedis = require('../redis').redis
      mockRedis.setex.mockResolvedValue('OK')
      mockRedis.get.mockResolvedValue('{"test":true,"timestamp":1234567890}')
      mockRedis.del.mockResolvedValue(1)

      const result = await validateCacheIntegrity()
      expect(result).toBe(true)
    })

    test('should detect cache integrity failure', async () => {
      const mockRedis = require('../redis').redis
      mockRedis.setex.mockResolvedValue('OK')
      mockRedis.get.mockResolvedValue('{"test":false,"timestamp":"invalid"}')
      mockRedis.del.mockResolvedValue(1)

      const result = await validateCacheIntegrity()
      expect(result).toBe(false)
    })

    test('should handle cache integrity validation error', async () => {
      const mockRedis = require('../redis').redis
      mockRedis.setex.mockRejectedValue(new Error('Connection failed'))

      const result = await validateCacheIntegrity()
      expect(result).toBe(false)
    })
  })

  describe('Singleton Instance', () => {
    test('should export singleton cache monitor instance', () => {
      expect(cacheMonitor).toBeInstanceOf(CacheMonitor)
    })

    test('should use same instance across imports', () => {
      const monitor1 = cacheMonitor
      const monitor2 = cacheMonitor
      expect(monitor1).toBe(monitor2)
    })
  })
})
