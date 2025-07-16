/**
 * Character Data Integrity API Route
 * Performs integrity checks on character data
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { characterManager } from '@/lib/character/manager'
import { characterRepository } from '@/lib/repositories/character-repository'

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

    // Perform integrity check
    const integrityResult = await characterManager.performIntegrityCheck(characterIdNum)

    // Get additional character details
    const character = await characterRepository.findByEveCharacterId(characterIdNum)

    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    // Get sync status
    const syncStatus = await characterManager.getSyncStatus(characterIdNum)

    // Prepare detailed response
    const response = {
      characterId: characterIdNum,
      characterName: character.name,
      integrity: {
        valid: integrityResult.valid,
        issues: integrityResult.issues,
        checkedAt: new Date().toISOString(),
      },
      data: {
        lastLogin: character.last_login,
        lastUpdated: character.updated_at,
        corporationId: character.corporation_id,
        allianceId: character.alliance_id,
        walletBalance: character.wallet_balance,
        location: {
          id: character.location_id,
          name: character.location_name,
        },
        securityStatus: character.security_status,
      },
      sync: {
        status: syncStatus,
        recommendations: [] as string[],
      },
    }

    // Add sync recommendations based on issues
    if (integrityResult.issues.length > 0) {
      if (integrityResult.issues.some(issue => issue.includes('never been synchronized'))) {
        response.sync.recommendations.push('Perform initial full synchronization')
      }
      if (integrityResult.issues.some(issue => issue.includes('hours old'))) {
        response.sync.recommendations.push('Schedule regular automatic synchronization')
      }
      if (integrityResult.issues.some(issue => issue.includes('missing'))) {
        response.sync.recommendations.push('Run full synchronization to update missing data')
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Integrity check error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to perform integrity check', message: errorMessage },
      { status: 500 }
    )
  }
}

// POST endpoint to fix integrity issues
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const { characterId, fixType } = body

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

    // Perform fixes based on type
    const fixes: string[] = []

    if (fixType === 'all' || fixType === 'sync') {
      // Trigger full sync to fix data issues
      await characterManager.syncCharacterData(characterIdNum, session.accessToken)
      fixes.push('Performed full character synchronization')
    }

    if (fixType === 'all' || fixType === 'validation') {
      // Re-validate character data
      await characterManager.registerCharacter(characterIdNum, session.accessToken)
      fixes.push('Re-validated character registration')
    }

    // Perform integrity check again
    const integrityResult = await characterManager.performIntegrityCheck(characterIdNum)

    return NextResponse.json({
      success: true,
      characterId: characterIdNum,
      fixes,
      integrity: {
        valid: integrityResult.valid,
        remainingIssues: integrityResult.issues,
        fixedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Fix integrity error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fix integrity issues', message: errorMessage },
      { status: 500 }
    )
  }
}
