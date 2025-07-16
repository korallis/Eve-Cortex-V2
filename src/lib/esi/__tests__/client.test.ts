/**
 * Tests for ESI Client
 */

import { ESIClient } from '../client'
import { redis } from '@/lib/redis'
import type { ESIError } from '@/types/esi'

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

describe('ESIClient', () => {
  let client: ESIClient
  const mockAccessToken = 'mock-access-token'

  beforeEach(() => {
    client = new ESIClient({
      baseUrl: 'https://esi.test.com',
      timeout: 5000,
      maxRetries: 2,
    })
    jest.clearAllMocks()
  })

  describe('request', () => {
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
      ;(redis.incr as jest.Mock).mockResolvedValue(1)

      const result = await client.request<typeof mockData>('/characters/123/', mockAccessToken)

      expect(result.data).toEqual(mockData)
      expect(result.status).toBe(200)
      expect(result.cached).toBe(false)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/characters/123/'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockAccessToken}`,
          }),
        })
      )
    })

    it('should return cached response when available', async () => {
      const cachedData = {
        data: { character_id: 123, name: 'Cached Character' },
        headers: { etag: '"abc123"' },
        status: 200,
        cached: false,
      }

      ;(redis.get as jest.Mock)
        .mockResolvedValueOnce(null) // rate limit window
        .mockResolvedValueOnce(JSON.stringify(cachedData)) // cached data
      ;(redis.set as jest.Mock).mockResolvedValue('OK')
      ;(redis.incr as jest.Mock).mockResolvedValue(1)

      const result = await client.request('/characters/123/', mockAccessToken)

      expect(result.data).toEqual(cachedData.data)
      expect(result.cached).toBe(true)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should handle rate limiting', async () => {
      const mockData = { character_id: 123 }
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: jest.fn().mockResolvedValue(mockData),
      }

      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)
      ;(redis.get as jest.Mock)
        .mockResolvedValueOnce(String(Date.now())) // Window start time
        .mockResolvedValueOnce(null) // No cache
      ;(redis.incr as jest.Mock)
        .mockResolvedValueOnce(21) // Over limit first time
        .mockResolvedValueOnce(1) // Under limit after retry
      ;(redis.set as jest.Mock).mockResolvedValue('OK')

      const result = await client.request('/characters/123/', mockAccessToken)

      expect(result.data).toEqual(mockData)
      // Should have retried the rate limit check
      expect(redis.incr).toHaveBeenCalledTimes(2)
    })

    it('should retry on server errors', async () => {
      const mockData = { character_id: 123 }
      const errorResponse = {
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: jest.fn().mockResolvedValue({ error: 'Server error' }),
      }
      const successResponse = {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: jest.fn().mockResolvedValue(mockData),
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(successResponse)
      ;(redis.get as jest.Mock).mockResolvedValue(null)
      ;(redis.incr as jest.Mock).mockResolvedValue(1)

      const result = await client.request('/characters/123/', mockAccessToken)

      expect(result.data).toEqual(mockData)
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('should throw error after max retries', async () => {
      const errorResponse = {
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: jest.fn().mockResolvedValue({ error: 'Server error' }),
      }

      ;(global.fetch as jest.Mock).mockResolvedValue(errorResponse)
      ;(redis.get as jest.Mock).mockResolvedValue(null)
      ;(redis.incr as jest.Mock).mockResolvedValue(1)

      await expect(
        client.request('/characters/123/', mockAccessToken, { retries: 1 })
      ).rejects.toThrow()

      expect(global.fetch).toHaveBeenCalledTimes(2) // Initial + 1 retry
    })
  })

  describe('publicRequest', () => {
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
      ;(redis.incr as jest.Mock).mockResolvedValue(1)

      const result = await client.publicRequest<typeof mockData>('/universe/types/587/')

      expect(result.data).toEqual(mockData)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/universe/types/587/'),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.anything(),
          }),
        })
      )
    })
  })

  describe('paginate', () => {
    it('should fetch all pages', async () => {
      const page1 = [{ order_id: 1 }, { order_id: 2 }]
      const page2 = [{ order_id: 3 }, { order_id: 4 }]

      const response1 = {
        ok: true,
        status: 200,
        headers: new Headers({ 'x-pages': '2' }),
        json: jest.fn().mockResolvedValue(page1),
      }
      const response2 = {
        ok: true,
        status: 200,
        headers: new Headers({ 'x-pages': '2' }),
        json: jest.fn().mockResolvedValue(page2),
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce(response1).mockResolvedValueOnce(response2)
      ;(redis.get as jest.Mock).mockResolvedValue(null)
      ;(redis.incr as jest.Mock).mockResolvedValue(1)

      const results = []
      for await (const page of client.paginate('/markets/10000002/orders/', mockAccessToken)) {
        results.push(...page)
      }

      expect(results).toEqual([...page1, ...page2])
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('caching', () => {
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
      ;(redis.incr as jest.Mock).mockResolvedValue(1)

      await client.request('/characters/123/', mockAccessToken)

      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining('esi:cache:'),
        expect.any(String),
        'EX',
        300
      )
    })

    it('should respect etag for cache validation', async () => {
      const cachedData = {
        data: { character_id: 123 },
        headers: { etag: '"abc123"' },
        status: 200,
        cached: false,
      }

      ;(redis.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedData))

      const result = await client.request('/characters/123/', mockAccessToken, {
        etag: '"abc123"',
      })

      expect(result.cached).toBe(true)
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('clearCache', () => {
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

    it('should clear all cache when no path specified', async () => {
      ;(redis.keys as jest.Mock).mockResolvedValue([
        'esi:cache:/characters/123/:{}',
        'esi:cache:/universe/types/587/:{}',
      ])

      await client.clearCache()

      expect(redis.keys).toHaveBeenCalledWith('esi:cache:*')
      expect(redis.del).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should handle timeout errors', async () => {
      ;(global.fetch as jest.Mock).mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('AbortError')), 100)
        })
      })
      ;(redis.get as jest.Mock).mockResolvedValue(null)
      ;(redis.incr as jest.Mock).mockResolvedValue(1)

      const client = new ESIClient({ timeout: 50, maxRetries: 0 })

      await expect(client.request('/characters/123/', mockAccessToken)).rejects.toThrow('timeout')
    })

    it('should parse ESI error responses', async () => {
      const esiError: ESIError = {
        error: 'Invalid token',
        error_description: 'The access token is invalid',
      }

      const errorResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: jest.fn().mockResolvedValue(esiError),
      }

      ;(global.fetch as jest.Mock).mockResolvedValue(errorResponse)
      ;(redis.get as jest.Mock).mockResolvedValue(null)
      ;(redis.incr as jest.Mock).mockResolvedValue(1)

      await expect(
        client.request('/characters/123/', mockAccessToken, { retries: 0 })
      ).rejects.toThrow('Invalid token')
    })
  })
})
