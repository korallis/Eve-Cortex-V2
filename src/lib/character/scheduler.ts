/**
 * Character Data Synchronization Scheduler
 * Handles automated scheduling and execution of character data syncs
 */

import { redis } from '@/lib/redis'
import { characterManager } from './manager'
import { characterRepository } from '@/lib/repositories/character-repository'

export interface SyncSchedule {
  characterId: number
  nextSyncAt: Date
  interval: number // minutes
  priority: 'high' | 'normal' | 'low'
  retryCount: number
  lastError?: string | undefined
  enabled: boolean
}

export class CharacterSyncScheduler {
  private schedulePrefix = 'character:schedule:'
  private queuePrefix = 'character:sync:queue:'
  private lockPrefix = 'character:scheduler:lock:'
  private isRunning = false
  private schedulerInterval: NodeJS.Timeout | null = null

  /**
   * Start the scheduler
   */
  async start(intervalSeconds = 60): Promise<void> {
    if (this.isRunning) {
      throw new Error('Scheduler is already running')
    }

    // Acquire scheduler lock
    const lockKey = `${this.lockPrefix}main`
    const locked = await redis.set(lockKey, '1', 'EX', intervalSeconds * 2, 'NX')

    if (!locked) {
      throw new Error('Another scheduler instance is already running')
    }

    this.isRunning = true

    // Run scheduler loop
    this.schedulerInterval = setInterval(async () => {
      try {
        // Refresh lock
        await redis.expire(lockKey, intervalSeconds * 2)

        // Process scheduled syncs
        await this.processSyncQueue()
      } catch (error) {
        console.error('Scheduler error:', error)
      }
    }, intervalSeconds * 1000)

    // Initial run
    await this.processSyncQueue()
  }

  /**
   * Stop the scheduler
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false

    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval)
      this.schedulerInterval = null
    }

    // Release lock
    const lockKey = `${this.lockPrefix}main`
    await redis.del(lockKey)
  }

  /**
   * Schedule a character sync
   */
  async scheduleSync(
    characterId: number,
    options: Partial<SyncSchedule> = {}
  ): Promise<SyncSchedule> {
    const scheduleKey = `${this.schedulePrefix}${characterId}`

    // Get existing schedule if any
    const existing = await this.getSchedule(characterId)

    const schedule: SyncSchedule = {
      characterId,
      nextSyncAt: options.nextSyncAt || new Date(Date.now() + (options.interval || 60) * 60 * 1000),
      interval: options.interval || existing?.interval || 60,
      priority: options.priority || existing?.priority || 'normal',
      retryCount: options.retryCount ?? existing?.retryCount ?? 0,
      lastError: options.lastError || existing?.lastError,
      enabled: options.enabled ?? existing?.enabled ?? true,
    }

    // Store schedule
    await redis.set(scheduleKey, JSON.stringify(schedule))

    // Add to queue if due
    if (schedule.enabled && schedule.nextSyncAt <= new Date()) {
      await this.addToQueue(schedule)
    }

    return schedule
  }

  /**
   * Get schedule for a character
   */
  async getSchedule(characterId: number): Promise<SyncSchedule | null> {
    const scheduleKey = `${this.schedulePrefix}${characterId}`
    const data = await redis.get(scheduleKey)

    if (!data) {
      return null
    }

    const schedule = JSON.parse(data) as SyncSchedule
    schedule.nextSyncAt = new Date(schedule.nextSyncAt)

    return schedule
  }

  /**
   * Update schedule
   */
  async updateSchedule(
    characterId: number,
    updates: Partial<SyncSchedule>
  ): Promise<SyncSchedule | null> {
    const schedule = await this.getSchedule(characterId)
    if (!schedule) {
      return null
    }

    const updated = { ...schedule, ...updates }
    await this.scheduleSync(characterId, updated)

    return updated
  }

  /**
   * Enable/disable schedule
   */
  async setScheduleEnabled(characterId: number, enabled: boolean): Promise<void> {
    await this.updateSchedule(characterId, { enabled })
  }

  /**
   * Get all schedules
   */
  async getAllSchedules(): Promise<SyncSchedule[]> {
    const pattern = `${this.schedulePrefix}*`
    const keys = await redis.keys(pattern)

    const schedules: SyncSchedule[] = []
    for (const key of keys) {
      const data = await redis.get(key)
      if (data) {
        const schedule = JSON.parse(data) as SyncSchedule
        schedule.nextSyncAt = new Date(schedule.nextSyncAt)
        schedules.push(schedule)
      }
    }

    return schedules
  }

  /**
   * Process sync queue
   */
  private async processSyncQueue(): Promise<void> {
    // Get all schedules
    const schedules = await this.getAllSchedules()

    // Filter due schedules
    const now = new Date()
    const dueSchedules = schedules.filter(
      schedule => schedule.enabled && schedule.nextSyncAt <= now
    )

    // Sort by priority and next sync time
    dueSchedules.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return a.nextSyncAt.getTime() - b.nextSyncAt.getTime()
    })

    // Process each due sync
    for (const schedule of dueSchedules) {
      await this.processSyncForCharacter(schedule)
    }
  }

  /**
   * Process sync for a single character
   */
  private async processSyncForCharacter(schedule: SyncSchedule): Promise<void> {
    const lockKey = `${this.lockPrefix}character:${schedule.characterId}`

    // Try to acquire lock for this character
    const locked = await redis.set(lockKey, '1', 'EX', 300, 'NX') // 5 minute lock
    if (!locked) {
      // Another process is already syncing this character
      return
    }

    try {
      // Get character and access token
      const character = await characterRepository.findByEveCharacterId(schedule.characterId)
      if (!character) {
        throw new Error('Character not found')
      }

      // Get access token from session/auth system
      // This would need to be implemented based on your auth system
      const accessToken = await this.getAccessToken(schedule.characterId)
      if (!accessToken) {
        throw new Error('No valid access token for character')
      }

      // Perform sync
      await characterManager.syncCharacterData(schedule.characterId, accessToken)

      // Update schedule for next sync
      await this.scheduleSync(schedule.characterId, {
        nextSyncAt: new Date(Date.now() + schedule.interval * 60 * 1000),
        retryCount: 0,
        lastError: undefined as undefined,
      })
    } catch (error) {
      // Handle sync error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Update retry count and schedule
      const retryCount = schedule.retryCount + 1
      const maxRetries = 3

      if (retryCount < maxRetries) {
        // Schedule retry with exponential backoff
        const retryDelay = Math.min(5 * Math.pow(2, retryCount), 60) // Max 60 minutes
        await this.scheduleSync(schedule.characterId, {
          nextSyncAt: new Date(Date.now() + retryDelay * 60 * 1000),
          retryCount,
          lastError: errorMessage,
        })
      } else {
        // Max retries reached, disable schedule
        await this.scheduleSync(schedule.characterId, {
          enabled: false,
          retryCount,
          lastError: `Max retries reached: ${errorMessage}`,
        })
      }
    } finally {
      // Release lock
      await redis.del(lockKey)
    }
  }

  /**
   * Add schedule to processing queue
   */
  private async addToQueue(schedule: SyncSchedule): Promise<void> {
    const queueKey = `${this.queuePrefix}${schedule.priority}`
    await redis.lpush(
      queueKey,
      JSON.stringify({
        characterId: schedule.characterId,
        addedAt: new Date().toISOString(),
      })
    )
  }

  /**
   * Get access token for character
   * This is a placeholder - needs to be implemented based on auth system
   */
  private async getAccessToken(characterId: number): Promise<string | null> {
    // This would need to integrate with your NextAuth session management
    // For now, we'll check if there's a cached token
    const tokenKey = `character:token:${characterId}`
    const token = await redis.get(tokenKey)
    return token
  }

  /**
   * Get sync statistics
   */
  async getSyncStatistics(): Promise<{
    totalSchedules: number
    enabledSchedules: number
    disabledSchedules: number
    overdueSchedules: number
    schedulesByPriority: Record<string, number>
    averageInterval: number
    errorRate: number
  }> {
    const schedules = await this.getAllSchedules()
    const now = new Date()

    const stats = {
      totalSchedules: schedules.length,
      enabledSchedules: schedules.filter(s => s.enabled).length,
      disabledSchedules: schedules.filter(s => !s.enabled).length,
      overdueSchedules: schedules.filter(s => s.enabled && s.nextSyncAt < now).length,
      schedulesByPriority: {
        high: schedules.filter(s => s.priority === 'high').length,
        normal: schedules.filter(s => s.priority === 'normal').length,
        low: schedules.filter(s => s.priority === 'low').length,
      },
      averageInterval:
        schedules.length > 0
          ? schedules.reduce((sum, s) => sum + s.interval, 0) / schedules.length
          : 0,
      errorRate:
        schedules.length > 0 ? schedules.filter(s => s.lastError).length / schedules.length : 0,
    }

    return stats
  }

  /**
   * Bulk schedule updates
   */
  async bulkScheduleUpdate(characterIds: number[], updates: Partial<SyncSchedule>): Promise<void> {
    for (const characterId of characterIds) {
      await this.updateSchedule(characterId, updates)
    }
  }

  /**
   * Clean up old schedules
   */
  async cleanupSchedules(): Promise<number> {
    const allCharacters = await characterRepository.findAll()
    const characterIds = new Set(allCharacters.map(c => c.eve_character_id))

    const schedules = await this.getAllSchedules()
    let cleaned = 0

    for (const schedule of schedules) {
      if (!characterIds.has(schedule.characterId)) {
        const scheduleKey = `${this.schedulePrefix}${schedule.characterId}`
        await redis.del(scheduleKey)
        cleaned++
      }
    }

    return cleaned
  }
}

// Export singleton instance
export const characterSyncScheduler = new CharacterSyncScheduler()
