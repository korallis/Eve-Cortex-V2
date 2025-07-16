/**
 * Cache Health Monitoring and Management
 * Provides comprehensive health checking and monitoring for Redis cache
 */

import { redis, checkRedisHealth, getRedisInfo, getCacheStats } from './redis'

// Health check result interface
export interface CacheHealthCheck {
  service: string
  status: 'healthy' | 'unhealthy' | 'degraded'
  response_time: number
  details: {
    connected: boolean
    key_count: number
    memory_usage: string
    uptime: string
    connected_clients: string
    last_error?: string
  }
  timestamp: Date
}

// Performance metrics interface
export interface CachePerformanceMetrics {
  hit_rate: number
  miss_rate: number
  total_commands: number
  average_response_time: number
  peak_memory_usage: number
  connections_received: number
  expired_keys: number
  evicted_keys: number
  timestamp: Date
}

// Cache monitoring class
export class CacheMonitor {
  private healthHistory: CacheHealthCheck[] = []
  private performanceHistory: CachePerformanceMetrics[] = []
  private readonly maxHistorySize = 100

  // Perform comprehensive health check
  async performHealthCheck(): Promise<CacheHealthCheck> {
    const startTime = Date.now()

    try {
      const [connected, stats] = await Promise.all([checkRedisHealth(), getCacheStats()])

      const responseTime = Date.now() - startTime

      const healthCheck: CacheHealthCheck = {
        service: 'redis-cache',
        status: this.determineHealthStatus(connected, responseTime, stats),
        response_time: responseTime,
        details: {
          connected,
          key_count: stats?.key_count || 0,
          memory_usage: stats?.memory_usage || 'unknown',
          uptime: stats?.uptime || 'unknown',
          connected_clients: stats?.connected_clients || 'unknown',
        },
        timestamp: new Date(),
      }

      this.addToHealthHistory(healthCheck)
      return healthCheck
    } catch (error) {
      const responseTime = Date.now() - startTime
      const healthCheck: CacheHealthCheck = {
        service: 'redis-cache',
        status: 'unhealthy',
        response_time: responseTime,
        details: {
          connected: false,
          key_count: 0,
          memory_usage: 'unknown',
          uptime: 'unknown',
          connected_clients: 'unknown',
          last_error: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date(),
      }

      this.addToHealthHistory(healthCheck)
      return healthCheck
    }
  }

  // Determine health status based on metrics
  private determineHealthStatus(
    connected: boolean,
    responseTime: number,
    stats: any
  ): 'healthy' | 'unhealthy' | 'degraded' {
    if (!connected) return 'unhealthy'

    // Consider degraded if response time > 1000ms
    if (responseTime > 1000) return 'degraded'

    // Consider degraded if memory usage is very high (this is a simplified check)
    if (stats?.key_count > 1000000) return 'degraded'

    return 'healthy'
  }

  // Add health check to history
  private addToHealthHistory(healthCheck: CacheHealthCheck): void {
    this.healthHistory.push(healthCheck)

    // Keep only the last N health checks
    if (this.healthHistory.length > this.maxHistorySize) {
      this.healthHistory.shift()
    }
  }

  // Get health check history
  getHealthHistory(): CacheHealthCheck[] {
    return [...this.healthHistory]
  }

  // Get latest health status
  getLatestHealthStatus(): CacheHealthCheck | null {
    if (this.healthHistory.length === 0) return null
    return this.healthHistory[this.healthHistory.length - 1] || null
  }

  // Collect performance metrics
  async collectPerformanceMetrics(): Promise<CachePerformanceMetrics> {
    try {
      const info = await redis.info('stats')
      const lines = info.split('\n')
      const stats = {} as Record<string, string>

      lines.forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':')
          if (key && value !== undefined) {
            stats[key] = value.trim()
          }
        }
      })

      const totalCommands = parseInt(stats['total_commands_processed'] || '0')
      const keyspaceHits = parseInt(stats['keyspace_hits'] || '0')
      const keyspaceMisses = parseInt(stats['keyspace_misses'] || '0')
      const totalKeyspaceOps = keyspaceHits + keyspaceMisses

      const metrics: CachePerformanceMetrics = {
        hit_rate: totalKeyspaceOps > 0 ? keyspaceHits / totalKeyspaceOps : 0,
        miss_rate: totalKeyspaceOps > 0 ? keyspaceMisses / totalKeyspaceOps : 0,
        total_commands: totalCommands,
        average_response_time: 0, // This would need to be calculated over time
        peak_memory_usage: parseInt(stats['used_memory_peak'] || '0'),
        connections_received: parseInt(stats['total_connections_received'] || '0'),
        expired_keys: parseInt(stats['expired_keys'] || '0'),
        evicted_keys: parseInt(stats['evicted_keys'] || '0'),
        timestamp: new Date(),
      }

      this.addToPerformanceHistory(metrics)
      return metrics
    } catch (error) {
      console.error('Failed to collect performance metrics:', error)
      throw error
    }
  }

  // Add performance metrics to history
  private addToPerformanceHistory(metrics: CachePerformanceMetrics): void {
    this.performanceHistory.push(metrics)

    // Keep only the last N performance records
    if (this.performanceHistory.length > this.maxHistorySize) {
      this.performanceHistory.shift()
    }
  }

  // Get performance history
  getPerformanceHistory(): CachePerformanceMetrics[] {
    return [...this.performanceHistory]
  }

  // Get latest performance metrics
  getLatestPerformanceMetrics(): CachePerformanceMetrics | null {
    if (this.performanceHistory.length === 0) return null
    return this.performanceHistory[this.performanceHistory.length - 1] || null
  }

  // Clear all monitoring data
  clearHistory(): void {
    this.healthHistory = []
    this.performanceHistory = []
  }

  // Get monitoring summary
  async getMonitoringSummary() {
    const [healthCheck, performanceMetrics] = await Promise.all([
      this.performHealthCheck(),
      this.collectPerformanceMetrics(),
    ])

    return {
      health: healthCheck,
      performance: performanceMetrics,
      summary: {
        overall_status: healthCheck.status,
        cache_efficiency: performanceMetrics.hit_rate,
        memory_usage: healthCheck.details.memory_usage,
        uptime: healthCheck.details.uptime,
        total_keys: healthCheck.details.key_count,
        response_time: healthCheck.response_time,
      },
    }
  }
}

// Create singleton instance
export const cacheMonitor = new CacheMonitor()

// Utility functions for health monitoring
export async function performQuickHealthCheck(): Promise<boolean> {
  try {
    const healthCheck = await cacheMonitor.performHealthCheck()
    return healthCheck.status === 'healthy'
  } catch (error) {
    console.error('Quick health check failed:', error)
    return false
  }
}

export async function getDetailedHealthReport() {
  try {
    return await cacheMonitor.getMonitoringSummary()
  } catch (error) {
    console.error('Failed to get detailed health report:', error)
    return null
  }
}

// Cache warming and optimization utilities
export async function optimizeCache(): Promise<void> {
  try {
    console.log('Starting cache optimization...')

    // Get current memory usage
    const info = await getRedisInfo()
    console.log(`Current memory usage: ${info?.used_memory_human || 'unknown'}`)

    // Remove expired keys (this is automatic in Redis, but can be forced)
    await redis.eval(
      `
      local keys = redis.call('keys', 'eve_cortex:*')
      local expired = 0
      for i=1, #keys do
        if redis.call('ttl', keys[i]) == -1 then
          redis.call('del', keys[i])
          expired = expired + 1
        end
      end
      return expired
    `,
      0
    )

    console.log('Cache optimization completed')
  } catch (error) {
    console.error('Failed to optimize cache:', error)
  }
}

// Cache validation utilities
export async function validateCacheIntegrity(): Promise<boolean> {
  try {
    console.log('Validating cache integrity...')

    // Test basic operations
    const testKey = 'eve_cortex:health_check:test'
    const testValue = { test: true, timestamp: Date.now() }

    // Test write
    await redis.setex(testKey, 10, JSON.stringify(testValue))

    // Test read
    const retrieved = await redis.get(testKey)
    const parsed = JSON.parse(retrieved || '{}')

    // Test delete
    await redis.del(testKey)

    // Verify the test worked
    const isValid = parsed.test === true && typeof parsed.timestamp === 'number'

    console.log(`Cache integrity validation: ${isValid ? 'PASSED' : 'FAILED'}`)
    return isValid
  } catch (error) {
    console.error('Cache integrity validation failed:', error)
    return false
  }
}

export default cacheMonitor
