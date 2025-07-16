/**
 * Character Statistics API Route
 * Provides character statistics and analytics
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { characterManager } from '@/lib/character/manager'
import { characterSyncScheduler } from '@/lib/character/scheduler'
import { characterRepository } from '@/lib/repositories/character-repository'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'overview'
    const characterId = searchParams.get('characterId')

    if (characterId && isNaN(Number(characterId))) {
      return NextResponse.json({ error: 'Invalid character ID' }, { status: 400 })
    }

    const characterIdNum = characterId ? Number(characterId) : null

    // Verify character ownership if specified
    if (characterIdNum && session.user?.characterId !== characterIdNum) {
      return NextResponse.json(
        { error: 'Character does not belong to authenticated user' },
        { status: 403 }
      )
    }

    let response

    switch (type) {
      case 'overview':
        response = await getOverviewStats(characterIdNum)
        break

      case 'sync':
        response = await getSyncStats(characterIdNum)
        break

      case 'detailed':
        if (!characterIdNum) {
          return NextResponse.json(
            { error: 'Character ID required for detailed stats' },
            { status: 400 }
          )
        }
        response = await getDetailedStats(characterIdNum)
        break

      default:
        return NextResponse.json({ error: 'Invalid stats type' }, { status: 400 })
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Character stats error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to get character statistics', message: errorMessage },
      { status: 500 }
    )
  }
}

// Get overview statistics
async function getOverviewStats(characterId?: number | null) {
  const globalStats = await characterManager.getCharacterStatistics()
  const syncStats = await characterSyncScheduler.getSyncStatistics()

  const response = {
    global: {
      totalCharacters: globalStats.totalCharacters,
      activeCharacters: globalStats.activeCharacters,
      uniqueCorporations: globalStats.uniqueCorporations,
      uniqueAlliances: globalStats.uniqueAlliances,
      averageWalletBalance: globalStats.averageWalletBalance,
    },
    sync: {
      totalSchedules: syncStats.totalSchedules,
      enabledSchedules: syncStats.enabledSchedules,
      overdueSchedules: syncStats.overdueSchedules,
      averageInterval: syncStats.averageInterval,
      errorRate: syncStats.errorRate,
    },
    timestamp: new Date().toISOString(),
  }

  // Add character-specific stats if ID provided
  if (characterId) {
    const character = await characterRepository.findByEveCharacterId(characterId)
    if (character) {
      const integrityResult = await characterManager.performIntegrityCheck(characterId)
      const syncStatus = await characterManager.getSyncStatus(characterId)
      const schedule = await characterSyncScheduler.getSchedule(characterId)

      const characterData = {
        id: character.id,
        name: character.name,
        corporation_id: character.corporation_id,
        alliance_id: character.alliance_id,
        wallet_balance: character.wallet_balance,
        last_login: character.last_login,
        integrity: integrityResult,
        sync: {
          status: syncStatus,
          schedule: schedule,
        },
      }
      ;(response as any).character = characterData
    }
  }

  return response
}

// Get sync statistics
async function getSyncStats(characterId?: number | null) {
  const syncStats = await characterSyncScheduler.getSyncStatistics()

  const response = {
    schedules: {
      total: syncStats.totalSchedules,
      enabled: syncStats.enabledSchedules,
      disabled: syncStats.disabledSchedules,
      overdue: syncStats.overdueSchedules,
      byPriority: syncStats.schedulesByPriority,
    },
    performance: {
      averageInterval: syncStats.averageInterval,
      errorRate: syncStats.errorRate,
    },
    timestamp: new Date().toISOString(),
  }

  if (characterId) {
    const syncStatus = await characterManager.getSyncStatus(characterId)
    const schedule = await characterSyncScheduler.getSchedule(characterId)

    const characterData = {
      id: characterId,
      sync: {
        status: syncStatus,
        schedule: schedule,
      },
    }
    ;(response as any).character = characterData
  }

  return response
}

// Get detailed character statistics
async function getDetailedStats(characterId: number) {
  const character = await characterRepository.findByEveCharacterId(characterId)
  if (!character) {
    throw new Error('Character not found')
  }

  const integrityResult = await characterManager.performIntegrityCheck(characterId)
  const syncStatus = await characterManager.getSyncStatus(characterId)
  const schedule = await characterSyncScheduler.getSchedule(characterId)

  // Calculate additional metrics
  const lastSyncTime = syncStatus?.timestamp ? new Date(syncStatus.timestamp) : null
  const hoursSinceLastSync = lastSyncTime
    ? (Date.now() - lastSyncTime.getTime()) / (1000 * 60 * 60)
    : null

  const response = {
    character: {
      id: character.id,
      eve_character_id: character.eve_character_id,
      name: character.name,
      corporation_id: character.corporation_id,
      alliance_id: character.alliance_id,
      wallet_balance: character.wallet_balance,
      location: {
        id: character.location_id,
        name: character.location_name,
      },
      security_status: character.security_status,
      birthday: character.birthday,
      last_login: character.last_login,
      created_at: character.created_at,
      updated_at: character.updated_at,
    },
    integrity: {
      valid: integrityResult.valid,
      issues: integrityResult.issues,
      issueCount: integrityResult.issues.length,
    },
    sync: {
      status: syncStatus,
      schedule: schedule,
      metrics: {
        hoursSinceLastSync,
        isOverdue: schedule?.enabled && schedule.nextSyncAt < new Date(),
        nextSyncIn: schedule?.enabled
          ? Math.max(0, schedule.nextSyncAt.getTime() - Date.now()) / (1000 * 60 * 60)
          : null,
      },
    },
    health: {
      overall:
        integrityResult.valid &&
        (!schedule || !schedule.enabled || schedule.nextSyncAt >= new Date()),
      dataFreshness: hoursSinceLastSync ? (hoursSinceLastSync < 24 ? 'fresh' : 'stale') : 'unknown',
      syncHealth: schedule?.enabled ? 'enabled' : 'disabled',
    },
    timestamp: new Date().toISOString(),
  }

  return response
}
