/**
 * Character Manager Tests
 * Tests for character data management functionality
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { CharacterManager } from '../manager'
import { characterRepository } from '@/lib/repositories/character-repository'
import { characterSyncService } from '@/lib/esi/character-sync'
import { esiClient } from '@/lib/esi/client'
import { redis } from '@/lib/redis'

// Mock dependencies
jest.mock('@/lib/repositories/character-repository')
jest.mock('@/lib/esi/character-sync')
jest.mock('@/lib/esi/client')
jest.mock('@/lib/redis')

const mockCharacterRepository = characterRepository as jest.Mocked<typeof characterRepository>
const mockCharacterSyncService = characterSyncService as jest.Mocked<typeof characterSyncService>
const mockESIClient = esiClient as jest.Mocked<typeof esiClient>
const mockRedis = redis as jest.Mocked<typeof redis>

describe.skip('CharacterManager', () => {
  let characterManager: CharacterManager

  beforeEach(() => {
    characterManager = new CharacterManager()
    jest.clearAllMocks()
  })

  describe('registerCharacter', () => {
    const mockCharacterId = 123456789
    const mockAccessToken = 'mock-access-token'
    const mockESICharacter = {
      name: 'Test Character',
      corporation_id: 98765432,
      alliance_id: 11111111,
      security_status: 0.5,
      birthday: '2010-01-01T00:00:00Z',
    }

    test('should register new character successfully', async () => {
      // Mock ESI response
      mockESIClient.request.mockResolvedValue({
        data: mockESICharacter,
        headers: {},
        status: 200,
        cached: false,
      })

      // Mock repository responses
      mockCharacterRepository.findByEveCharacterId.mockResolvedValue(null)
      mockCharacterRepository.create.mockResolvedValue({
        id: 1,
        eve_character_id: mockCharacterId,
        name: mockESICharacter.name,
        corporation_id: mockESICharacter.corporation_id,
        alliance_id: mockESICharacter.alliance_id,
        wallet_balance: 0,
        location_id: null,
        location_name: null,
        security_status: mockESICharacter.security_status,
        birthday: new Date(mockESICharacter.birthday),
        last_login: null,
        created_at: new Date(),
        updated_at: new Date(),
      })

      // Mock Redis operations
      mockRedis.set.mockResolvedValue('OK')

      const result = await characterManager.registerCharacter(mockCharacterId, mockAccessToken)

      expect(result.isNew).toBe(true)
      expect(result.character.name).toBe(mockESICharacter.name)
      expect(mockCharacterRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eve_character_id: mockCharacterId,
          name: mockESICharacter.name,
          corporation_id: mockESICharacter.corporation_id,
          alliance_id: mockESICharacter.alliance_id,
        })
      )
    })

    test('should update existing character', async () => {
      const existingCharacter = {
        id: 1,
        eve_character_id: mockCharacterId,
        name: 'Old Name',
        corporation_id: 99999999,
        alliance_id: null,
        wallet_balance: 1000000,
        location_id: 30000142,
        location_name: 'Jita IV - Moon 4',
        security_status: 0.3,
        birthday: new Date('2010-01-01'),
        last_login: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      }

      // Mock ESI response
      mockESIClient.request.mockResolvedValue({
        data: mockESICharacter,
        headers: {},
        status: 200,
        cached: false,
      })

      // Mock repository responses
      mockCharacterRepository.findByEveCharacterId.mockResolvedValue(existingCharacter)
      mockCharacterRepository.update.mockResolvedValue({
        ...existingCharacter,
        name: mockESICharacter.name,
        corporation_id: mockESICharacter.corporation_id,
        alliance_id: mockESICharacter.alliance_id,
      })

      // Mock Redis operations
      mockRedis.set.mockResolvedValue('OK')

      const result = await characterManager.registerCharacter(mockCharacterId, mockAccessToken)

      expect(result.isNew).toBe(false)
      expect(result.character.name).toBe(mockESICharacter.name)
      expect(mockCharacterRepository.update).toHaveBeenCalledWith(
        existingCharacter.id,
        expect.objectContaining({
          name: mockESICharacter.name,
          corporation_id: mockESICharacter.corporation_id,
          alliance_id: mockESICharacter.alliance_id,
        })
      )
    })

    test('should handle ESI errors gracefully', async () => {
      // Mock ESI error
      mockESIClient.request.mockRejectedValue(new Error('ESI service unavailable'))

      await expect(
        characterManager.registerCharacter(mockCharacterId, mockAccessToken)
      ).rejects.toThrow('ESI service unavailable')
    })

    test('should validate character data before registration', async () => {
      const invalidESICharacter = {
        name: '', // Invalid empty name
        corporation_id: 0, // Invalid corporation ID
        security_status: 15, // Invalid security status
        birthday: '1990-01-01T00:00:00Z', // Before EVE Online existed
      }

      // Mock ESI response with invalid data
      mockESIClient.request.mockResolvedValue({
        data: invalidESICharacter,
        headers: {},
        status: 200,
        cached: false,
      })

      // Mock Redis operations
      mockRedis.set.mockResolvedValue('OK')

      await expect(
        characterManager.registerCharacter(mockCharacterId, mockAccessToken)
      ).rejects.toThrow('Character validation failed')
    })
  })

  describe('syncCharacterData', () => {
    const mockCharacterId = 123456789
    const mockAccessToken = 'mock-access-token'

    test('should sync character data successfully', async () => {
      // Mock sync service response
      mockCharacterSyncService.syncCharacter.mockResolvedValue({
        character: {} as any,
        skills: [],
        assets: [],
        location: {} as any,
        ship: null,
        online: {} as any,
        skillQueue: [],
        wallet: {} as any,
        clones: {} as any,
        implants: [],
        syncedAt: new Date(),
      })

      // Mock Redis operations
      mockRedis.set.mockResolvedValue('OK')

      await expect(
        characterManager.syncCharacterData(mockCharacterId, mockAccessToken)
      ).resolves.not.toThrow()

      expect(mockCharacterSyncService.syncCharacter).toHaveBeenCalledWith(
        mockCharacterId,
        mockAccessToken
      )
    })

    test('should handle sync errors and schedule retries', async () => {
      // Mock sync service error
      mockCharacterSyncService.syncCharacter.mockRejectedValue(new Error('Sync failed'))

      // Mock Redis operations
      mockRedis.incr.mockResolvedValue(1)
      mockRedis.expire.mockResolvedValue(1)
      mockRedis.set.mockResolvedValue('OK')

      await expect(
        characterManager.syncCharacterData(mockCharacterId, mockAccessToken)
      ).rejects.toThrow('Sync failed')

      // Should log error for monitoring
      expect(mockRedis.incr).toHaveBeenCalled()
      expect(mockRedis.set).toHaveBeenCalled()
    })
  })

  describe('updateCharacterSkills', () => {
    const mockCharacterId = 123456789
    const mockAccessToken = 'mock-access-token'
    const mockSkillsData = {
      skills: [
        {
          skill_id: 3402,
          trained_skill_level: 5,
          skillpoints_in_skill: 256000,
          active_skill_level: 5,
        },
        {
          skill_id: 3413,
          trained_skill_level: 4,
          skillpoints_in_skill: 113137,
          active_skill_level: 4,
        },
      ],
      total_sp: 369137,
    }

    test('should update character skills successfully', async () => {
      // Mock character lookup
      mockCharacterRepository.findByEveCharacterId.mockResolvedValue({
        id: 1,
        eve_character_id: mockCharacterId,
      } as any)

      // Mock ESI response
      mockESIClient.request.mockResolvedValue({
        data: mockSkillsData,
        headers: {},
        status: 200,
        cached: false,
      })

      // Mock repository operations
      mockCharacterRepository.deleteSkills.mockResolvedValue()
      mockCharacterRepository.createSkill.mockResolvedValue({} as any)

      await expect(
        characterManager.updateCharacterSkills(mockCharacterId, mockAccessToken)
      ).resolves.not.toThrow()

      expect(mockCharacterRepository.deleteSkills).toHaveBeenCalledWith(1)
      expect(mockCharacterRepository.createSkill).toHaveBeenCalledTimes(2)
    })

    test('should throw error if character not found', async () => {
      // Mock character not found
      mockCharacterRepository.findByEveCharacterId.mockResolvedValue(null)

      await expect(
        characterManager.updateCharacterSkills(mockCharacterId, mockAccessToken)
      ).rejects.toThrow('Character not found')
    })
  })

  describe('performIntegrityCheck', () => {
    const mockCharacterId = 123456789

    test('should perform integrity check and return results', async () => {
      const mockCharacter = {
        id: 1,
        eve_character_id: mockCharacterId,
        name: 'Test Character',
        corporation_id: 98765432,
        alliance_id: null,
        wallet_balance: 1000000,
        location_id: 30000142,
        location_name: 'Jita IV - Moon 4',
        security_status: 0.5,
        birthday: new Date('2010-01-01'),
        last_login: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      }

      // Mock character lookup
      mockCharacterRepository.findByEveCharacterId.mockResolvedValue(mockCharacter)

      // Mock sync status
      mockCharacterSyncService.getSyncStatus.mockResolvedValue({
        status: 'completed',
        message: 'Sync completed',
        timestamp: new Date().toISOString(),
      })

      const result = await characterManager.performIntegrityCheck(mockCharacterId)

      expect(result.valid).toBe(true)
      expect(result.issues).toBeDefined()
      expect(Array.isArray(result.issues)).toBe(true)
    })

    test('should identify missing character', async () => {
      // Mock character not found
      mockCharacterRepository.findByEveCharacterId.mockResolvedValue(null)

      const result = await characterManager.performIntegrityCheck(mockCharacterId)

      expect(result.valid).toBe(false)
      expect(result.issues).toContain('Character not found in database')
    })

    test('should identify stale data', async () => {
      const staleCharacter = {
        id: 1,
        eve_character_id: mockCharacterId,
        name: 'Test Character',
        corporation_id: 98765432,
        alliance_id: null,
        wallet_balance: 1000000,
        location_id: 30000142,
        location_name: 'Jita IV - Moon 4',
        security_status: 0.5,
        birthday: new Date('2010-01-01'),
        last_login: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        created_at: new Date(),
        updated_at: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
      }

      // Mock character lookup
      mockCharacterRepository.findByEveCharacterId.mockResolvedValue(staleCharacter)

      // Mock no sync status (never synced)
      mockCharacterSyncService.getSyncStatus.mockResolvedValue(null)

      const result = await characterManager.performIntegrityCheck(mockCharacterId)

      expect(result.issues.length).toBeGreaterThan(0)
      expect(result.issues.some(issue => issue.includes('never been synchronized'))).toBe(true)
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })
})
