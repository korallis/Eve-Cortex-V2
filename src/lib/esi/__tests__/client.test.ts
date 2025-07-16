/**
 * Simplified ESI Client Tests to verify core functionality
 */

import { ESIClient } from '../client'
import { redis } from '@/lib/redis'

// Mock fetch
global.fetch = jest.fn()

// Mock redis
jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    keys: jest.fn(),
  },
}))

describe('ESIClient - Simplified Tests', () => {
  let client: ESIClient
  const mockAccessToken = 'mock-access-token'

  beforeEach(() => {
    client = new ESIClient({
      baseUrl: 'https://esi.test.com',
      timeout: 5000,
      maxRetries: 0, // Disable retries for simpler tests
    })
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  it('should make authenticated request successfully', async () => {
    const mockData = { character_id: 123, name: 'Test Character' }
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers({
        'x-esi-error-limit-remain': '100',
        'x-esi-error-limit-reset': '1234567890',
      }),
      json: jest.fn().mockResolvedValue(mockData),
    }

    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)
    ;(redis.get as jest.Mock).mockResolvedValue(null)
    ;(redis.set as jest.Mock).mockResolvedValue('OK')

    const result = await client.request<typeof mockData>('/characters/123/', mockAccessToken)

    expect(result.data).toEqual(mockData)
    expect(result.status).toBe(200)
    expect(result.cached).toBe(false)
  })

  it('should return cached response when available', async () => {
    const cachedData = {
      data: { character_id: 123, name: 'Cached Character' },
      headers: { 
        etag: '"abc123"',
        expires: new Date(Date.now() + 300000).toISOString()
      },
      status: 200,
      cached: false,
    }

    ;(redis.get as jest.Mock)
      .mockResolvedValueOnce(null) // rate limit window
      .mockResolvedValueOnce(JSON.stringify(cachedData)) // cached data
    ;(redis.set as jest.Mock).mockResolvedValue('OK')

    const result = await client.request('/characters/123/', mockAccessToken)

    expect(result.data).toEqual(cachedData.data)
    expect(result.cached).toBe(true)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should make public request without authentication', async () => {
    const mockData = { type_id: 587, name: 'Rifter' }
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers(),
      json: jest.fn().mockResolvedValue(mockData),
    }

    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)
    ;(redis.get as jest.Mock).mockResolvedValue(null)
    ;(redis.set as jest.Mock).mockResolvedValue('OK')

    const result = await client.publicRequest<typeof mockData>('/universe/types/587/')

    expect(result.data).toEqual(mockData)
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
    expect(fetchCall[1].headers).not.toHaveProperty('Authorization')
  })

  it('should handle timeout errors', async () => {
    const abortError = new Error('The operation was aborted due to timeout')
    abortError.name = 'AbortError'
    
    ;(global.fetch as jest.Mock).mockRejectedValue(abortError)
    ;(redis.get as jest.Mock).mockResolvedValue(null)
    ;(redis.set as jest.Mock).mockResolvedValue('OK')

    const client = new ESIClient({ timeout: 50, maxRetries: 0 })

    await expect(client.request('/characters/123/', mockAccessToken)).rejects.toThrow(
      'ESI request timeout after 50ms'
    )
  })

  it('should parse ESI error responses', async () => {
    const esiError = {
      error: 'Invalid token',
      error_description: 'The access token is invalid',
    }

    const errorResponse = {
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: new Headers({
        'x-esi-error-limit-remain': '100',
        'x-esi-error-limit-reset': '1234567890',
      }),
      json: jest.fn().mockResolvedValue(esiError),
    }

    ;(global.fetch as jest.Mock).mockResolvedValue(errorResponse)
    ;(redis.get as jest.Mock).mockResolvedValue(null)
    ;(redis.set as jest.Mock).mockResolvedValue('OK')

    await expect(
      client.request('/characters/123/', mockAccessToken)
    ).rejects.toThrow('Invalid token')
  })

  it('should cache successful responses', async () => {
    const mockData = { character_id: 123 }
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers({
        'cache-control': 'max-age=300',
      }),
      json: jest.fn().mockResolvedValue(mockData),
    }

    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)
    ;(redis.get as jest.Mock).mockResolvedValue(null)
    ;(redis.set as jest.Mock).mockResolvedValue('OK')

    await client.request('/characters/123/', mockAccessToken)

    expect(redis.set).toHaveBeenCalledWith(
      expect.stringContaining('esi:cache:'),
      expect.any(String),
      'EX',
      300
    )
  })

  it('should clear cache for specific path', async () => {
    ;(redis.keys as jest.Mock).mockResolvedValue([
      'esi:cache:/characters/123/:{}',
      'esi:cache:/characters/123/:{"page":1}',
    ])

    await client.clearCache('/characters/123/')

    expect(redis.keys).toHaveBeenCalledWith('esi:cache:/characters/123/*')
    expect(redis.del).toHaveBeenCalledWith(
      'esi:cache:/characters/123/:{}',
      'esi:cache:/characters/123/:{"page":1}'
    )
  })
})