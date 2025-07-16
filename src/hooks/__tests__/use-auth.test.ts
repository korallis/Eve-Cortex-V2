/**
 * Authentication Hook Tests
 */

import { renderHook } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useAuth } from '../use-auth'

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

describe('useAuth', () => {
  beforeEach(() => {
    mockUseSession.mockClear()
  })

  it('returns loading state when session is loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isUnauthenticated).toBe(false)
  })

  it('returns authenticated state when session exists', () => {
    const mockSession = {
      user: {
        id: '1',
        name: 'Test Character',
        email: 'test@example.com',
        characterId: '12345',
        characterName: 'Test Character',
        scopes: ['esi-characters.read_character_info.v1', 'esi-skills.read_skills.v1'],
      },
      expires: '2024-12-31T23:59:59.999Z',
    }

    mockUseSession.mockReturnValue({
      data: mockSession as any,
      status: 'authenticated',
      update: jest.fn(),
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isUnauthenticated).toBe(false)
    expect(result.current.user).toEqual(mockSession.user)
  })

  it('correctly checks for single scope', () => {
    const mockSession = {
      user: {
        id: '1',
        name: 'Test Character',
        scopes: ['esi-characters.read_character_info.v1', 'esi-skills.read_skills.v1'],
      },
      expires: '2024-12-31T23:59:59.999Z',
    }

    mockUseSession.mockReturnValue({
      data: mockSession as any,
      status: 'authenticated',
      update: jest.fn(),
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.hasScope('esi-characters.read_character_info.v1')).toBe(true)
    expect(result.current.hasScope('esi-wallet.read_character_wallet.v1')).toBe(false)
  })

  it('correctly checks feature access', () => {
    const mockSession = {
      user: {
        id: '1',
        name: 'Test Character',
        scopes: [
          'esi-characters.read_character_info.v1',
          'esi-skills.read_skills.v1',
          'esi-skills.read_skillqueue.v1',
        ],
      },
      expires: '2024-12-31T23:59:59.999Z',
    }

    mockUseSession.mockReturnValue({
      data: mockSession as any,
      status: 'authenticated',
      update: jest.fn(),
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.canAccessFeature('character-info')).toBe(true)
    expect(result.current.canAccessFeature('skills')).toBe(true)
    expect(result.current.canAccessFeature('wallet')).toBe(false)
  })
})
