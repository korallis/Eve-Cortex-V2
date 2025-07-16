/**
 * Character Sync API Route
 * Handles manual character data synchronization
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { characterManager } from '@/lib/character/manager'
import { z } from 'zod'

// Request body schema
const syncSchema = z.object({
  characterId: z.number().positive(),
  syncType: z.enum(['full', 'skills', 'assets', 'location', 'wallet']).optional().default('full'),
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate request body
    const body = await request.json()
    const validationResult = syncSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { characterId, syncType } = validationResult.data

    // Verify the character belongs to the authenticated user
    if (session.user?.characterId !== characterId) {
      return NextResponse.json(
        { error: 'Character does not belong to authenticated user' },
        { status: 403 }
      )
    }

    // Check if sync is already in progress
    const syncStatus = await characterManager.getSyncStatus(characterId)
    if (syncStatus?.status === 'syncing') {
      return NextResponse.json(
        {
          error: 'Sync already in progress',
          status: syncStatus,
        },
        { status: 409 }
      )
    }

    // Perform sync based on type
    let syncResult
    switch (syncType) {
      case 'skills':
        await characterManager.updateCharacterSkills(characterId, session.accessToken)
        syncResult = { type: 'skills', message: 'Skills synchronized successfully' }
        break

      case 'assets':
        await characterManager.updateCharacterAssets(characterId, session.accessToken)
        syncResult = { type: 'assets', message: 'Assets synchronized successfully' }
        break

      case 'location':
        await characterManager.updateCharacterLocation(characterId, session.accessToken)
        syncResult = { type: 'location', message: 'Location synchronized successfully' }
        break

      case 'wallet':
        await characterManager.updateWalletBalance(characterId, session.accessToken)
        syncResult = { type: 'wallet', message: 'Wallet synchronized successfully' }
        break

      case 'full':
      default:
        await characterManager.syncCharacterData(characterId, session.accessToken)
        syncResult = { type: 'full', message: 'Full synchronization completed successfully' }
        break
    }

    // Get updated sync status
    const updatedStatus = await characterManager.getSyncStatus(characterId)

    // Return success response
    return NextResponse.json({
      success: true,
      sync: syncResult,
      status: updatedStatus,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Character sync error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to sync character', message: errorMessage },
      { status: 500 }
    )
  }
}

// GET endpoint to check sync status
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get character ID from query params
    const { searchParams } = new URL(request.url)
    const characterId = searchParams.get('characterId')

    if (!characterId || isNaN(Number(characterId))) {
      return NextResponse.json({ error: 'Invalid character ID' }, { status: 400 })
    }

    const characterIdNum = Number(characterId)

    // Verify the character belongs to the authenticated user
    if (session.user?.characterId !== characterIdNum) {
      return NextResponse.json(
        { error: 'Character does not belong to authenticated user' },
        { status: 403 }
      )
    }

    // Get sync status
    const status = await characterManager.getSyncStatus(characterIdNum)

    return NextResponse.json({
      characterId: characterIdNum,
      status: status || {
        status: 'never_synced',
        message: 'Character has never been synchronized',
      },
    })
  } catch (error) {
    console.error('Get sync status error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to get sync status', message: errorMessage },
      { status: 500 }
    )
  }
}
