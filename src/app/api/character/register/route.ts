/**
 * Character Registration API Route
 * Handles character registration and initial synchronization
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { characterManager } from '@/lib/character/manager'
import { characterSyncScheduler } from '@/lib/character/scheduler'
import { z } from 'zod'

// Request body schema
const registerSchema = z.object({
  characterId: z.number().positive(),
  enableAutoSync: z.boolean().optional().default(true),
  syncInterval: z.number().min(30).max(1440).optional().default(60), // 30 min to 24 hours
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
    const validationResult = registerSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { characterId, enableAutoSync, syncInterval } = validationResult.data

    // Verify the character belongs to the authenticated user
    // This would need to be implemented based on your auth system
    // For now, we'll assume the characterId in session matches
    if (session.user?.characterId !== characterId) {
      return NextResponse.json(
        { error: 'Character does not belong to authenticated user' },
        { status: 403 }
      )
    }

    // Register character
    const { character, isNew } = await characterManager.registerCharacter(
      characterId,
      session.accessToken
    )

    // Set up sync schedule if auto-sync is enabled
    if (enableAutoSync) {
      await characterSyncScheduler.scheduleSync(characterId, {
        interval: syncInterval,
        priority: isNew ? 'high' : 'normal',
        enabled: true,
      })
    }

    // Return success response
    return NextResponse.json({
      success: true,
      character: {
        id: character.id,
        eve_character_id: character.eve_character_id,
        name: character.name,
        corporation_id: character.corporation_id,
        alliance_id: character.alliance_id,
        is_new: isNew,
      },
      sync: {
        enabled: enableAutoSync,
        interval: syncInterval,
        status: await characterManager.getSyncStatus(characterId),
      },
    })
  } catch (error) {
    console.error('Character registration error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to register character', message: errorMessage },
      { status: 500 }
    )
  }
}
