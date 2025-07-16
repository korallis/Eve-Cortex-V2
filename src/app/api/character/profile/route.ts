/**
 * Character Profile API Route
 * Provides comprehensive character profile data
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { characterProfileService } from '@/lib/character/profile'
import { z } from 'zod'

// Query parameter schema
const profileQuerySchema = z.object({
  characterId: z.string().transform(val => parseInt(val, 10)),
  type: z.enum(['full', 'basic', 'summary']).optional().default('full'),
  includeSkills: z
    .string()
    .optional()
    .transform(val => val === 'true'),
  includeAssets: z
    .string()
    .optional()
    .transform(val => val === 'true'),
  includeCorporation: z
    .string()
    .optional()
    .transform(val => val === 'true'),
  includeAlliance: z
    .string()
    .optional()
    .transform(val => val === 'true'),
  useCache: z
    .string()
    .optional()
    .transform(val => val !== 'false'),
  refreshCache: z
    .string()
    .optional()
    .transform(val => val === 'true'),
})

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    const validationResult = profileQuerySchema.safeParse(queryParams)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const {
      characterId,
      type,
      includeSkills,
      includeAssets,
      includeCorporation,
      includeAlliance,
      useCache,
      refreshCache,
    } = validationResult.data

    // Verify the character belongs to the authenticated user
    if (session.user?.characterId !== characterId) {
      return NextResponse.json(
        { error: 'Character does not belong to authenticated user' },
        { status: 403 }
      )
    }

    let profile

    switch (type) {
      case 'basic':
        profile = await characterProfileService.getBasicProfile(characterId)
        break

      case 'summary':
        const summaries = await characterProfileService.getProfileSummaries([characterId])
        profile = summaries[characterId]
        break

      case 'full':
      default:
        const options = {
          includeSkills,
          includeAssets,
          includeCorporation,
          includeAlliance,
          useCache,
          refreshCache,
        }

        profile = await characterProfileService.getProfile(
          characterId,
          session.accessToken,
          options
        )
        break
    }

    return NextResponse.json({
      success: true,
      profile,
      metadata: {
        type,
        characterId,
        retrievedAt: new Date().toISOString(),
        cached: useCache && !refreshCache,
      },
    })
  } catch (error) {
    console.error('Character profile error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to get character profile', message: errorMessage },
      { status: 500 }
    )
  }
}

// PUT endpoint to update profile data
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { characterId, updates } = body

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

    // Validate updates (only allow safe fields to be updated)
    const allowedFields = ['location_name']
    const filteredUpdates: any = {}

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = value
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 })
    }

    // Update profile
    const updatedProfile = await characterProfileService.updateProfile(
      characterIdNum,
      session.accessToken,
      filteredUpdates
    )

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      updates: filteredUpdates,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Update character profile error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to update character profile', message: errorMessage },
      { status: 500 }
    )
  }
}

// DELETE endpoint to clear profile cache
export async function DELETE(request: NextRequest) {
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

    // Clear profile cache
    await characterProfileService.clearProfileCache(characterIdNum)

    return NextResponse.json({
      success: true,
      message: 'Profile cache cleared',
      characterId: characterIdNum,
      clearedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Clear profile cache error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to clear profile cache', message: errorMessage },
      { status: 500 }
    )
  }
}
