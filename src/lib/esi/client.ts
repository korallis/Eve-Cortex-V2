/**
 * EVE Online ESI API Client
 * Provides rate-limited access to ESI endpoints with caching and error handling
 */

import { redis } from '@/lib/redis'
import type {
  ESIConfig,
  ESIError,
  ESIHeaders,
  ESIRequestOptions,
  ESIResponse,
  ESIRateLimitInfo,
  ESIPaginationOptions,
} from '@/types/esi'

export class ESIClient {
  private config: ESIConfig
  private rateLimitKey = 'esi:rate_limit'
  private cachePrefix = 'esi:cache:'

  constructor(config?: Partial<ESIConfig>) {
    this.config = {
      baseUrl: 'https://esi.evetech.net/latest',
      userAgent: 'Eve-Cortex/1.0 (https://eve-cortex.com)',
      datasource: 'tranquility',
      timeout: 30000,
      maxRetries: 3,
      rateLimitWindow: 1000, // 1 second
      rateLimitMax: 20, // 20 requests per second
      ...config,
    }
  }

  /**
   * Make an authenticated ESI API request
   */
  async request<T>(
    path: string,
    accessToken: string,
    options: ESIRequestOptions = {}
  ): Promise<ESIResponse<T>> {
    // Check rate limit
    await this.checkRateLimit()

    // Check cache first
    const cacheKey = this.getCacheKey(path, options.params)
    const cached = await this.getFromCache<T>(cacheKey, options.etag)
    if (cached) {
      return cached
    }

    // Build request URL
    const url = new URL(path, this.config.baseUrl)
    url.searchParams.set('datasource', this.config.datasource)

    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.set(key, String(value))
      })
    }

    // Build headers
    const headers: Record<string, string> = {
      'User-Agent': this.config.userAgent,
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    }

    if (options.etag) {
      headers['If-None-Match'] = options.etag
    }

    // Make request with retries
    let lastError: Error | undefined
    for (let attempt = 0; attempt <= (options.retries ?? this.config.maxRetries); attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        // Handle rate limit headers
        await this.updateRateLimitInfo(response.headers)

        // Handle 304 Not Modified
        if (response.status === 304 && cached) {
          return cached
        }

        // Handle errors
        if (!response.ok) {
          const error = await this.handleErrorResponse(response)

          // Check if we should retry
          if (this.shouldRetry(response.status, attempt)) {
            await this.waitForRetry(attempt)
            continue
          }

          throw error
        }

        // Parse response
        const data = (await response.json()) as T
        const responseHeaders = this.extractHeaders(response.headers)

        const result: ESIResponse<T> = {
          data,
          headers: responseHeaders,
          status: response.status,
          cached: false,
        }

        // Cache successful response
        await this.cacheResponse(cacheKey, result, responseHeaders)

        return result
      } catch (error) {
        lastError = error as Error

        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(`ESI request timeout after ${this.config.timeout}ms`)
        }

        if (attempt < (options.retries ?? this.config.maxRetries)) {
          await this.waitForRetry(attempt)
          continue
        }
      }
    }

    throw lastError || new Error('ESI request failed after all retries')
  }

  /**
   * Make a public ESI API request (no authentication required)
   */
  async publicRequest<T>(path: string, options: ESIRequestOptions = {}): Promise<ESIResponse<T>> {
    // Check rate limit
    await this.checkRateLimit()

    // Check cache first
    const cacheKey = this.getCacheKey(path, options.params)
    const cached = await this.getFromCache<T>(cacheKey, options.etag)
    if (cached) {
      return cached
    }

    // Build request URL
    const url = new URL(path, this.config.baseUrl)
    url.searchParams.set('datasource', this.config.datasource)

    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.set(key, String(value))
      })
    }

    // Build headers
    const headers: Record<string, string> = {
      'User-Agent': this.config.userAgent,
      Accept: 'application/json',
      ...options.headers,
    }

    if (options.etag) {
      headers['If-None-Match'] = options.etag
    }

    // Make request with retries
    let lastError: Error | undefined
    for (let attempt = 0; attempt <= (options.retries ?? this.config.maxRetries); attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        // Handle rate limit headers
        await this.updateRateLimitInfo(response.headers)

        // Handle 304 Not Modified
        if (response.status === 304 && cached) {
          return cached
        }

        // Handle errors
        if (!response.ok) {
          const error = await this.handleErrorResponse(response)

          // Check if we should retry
          if (this.shouldRetry(response.status, attempt)) {
            await this.waitForRetry(attempt)
            continue
          }

          throw error
        }

        // Parse response
        const data = (await response.json()) as T
        const responseHeaders = this.extractHeaders(response.headers)

        const result: ESIResponse<T> = {
          data,
          headers: responseHeaders,
          status: response.status,
          cached: false,
        }

        // Cache successful response
        await this.cacheResponse(cacheKey, result, responseHeaders)

        return result
      } catch (error) {
        lastError = error as Error

        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(`ESI request timeout after ${this.config.timeout}ms`)
        }

        if (attempt < (options.retries ?? this.config.maxRetries)) {
          await this.waitForRetry(attempt)
          continue
        }
      }
    }

    throw lastError || new Error('ESI request failed after all retries')
  }

  /**
   * Fetch all pages of a paginated endpoint
   */
  async *paginate<T>(
    path: string,
    accessToken: string,
    options: ESIRequestOptions & ESIPaginationOptions = {}
  ): AsyncGenerator<T[], void, unknown> {
    let page = options.page || 1
    let totalPages = 1

    while (page <= totalPages) {
      const response = await this.request<T[]>(path, accessToken, {
        ...options,
        params: {
          ...options.params,
          page,
        },
      })

      // Get total pages from headers
      if (response.headers['x-pages']) {
        totalPages = parseInt(response.headers['x-pages'], 10)
      }

      yield response.data

      page++
    }
  }

  /**
   * Check and enforce rate limiting
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now()
    const windowKey = `${this.rateLimitKey}:window`
    const countKey = `${this.rateLimitKey}:count`

    // Get current window start time
    const windowStart = await redis.get(windowKey)

    if (!windowStart || now - parseInt(windowStart, 10) > this.config.rateLimitWindow) {
      // Start new window
      await redis.set(windowKey, now.toString(), 'PX', this.config.rateLimitWindow)
      await redis.set(countKey, '1', 'PX', this.config.rateLimitWindow)
      return
    }

    // Check current count
    const count = await redis.incr(countKey)

    if (count > this.config.rateLimitMax) {
      // Wait for next window
      const waitTime = this.config.rateLimitWindow - (now - parseInt(windowStart, 10))
      await new Promise(resolve => setTimeout(resolve, waitTime))

      // Retry
      await this.checkRateLimit()
    }
  }

  /**
   * Update rate limit information from response headers
   */
  private async updateRateLimitInfo(headers: Headers): Promise<void> {
    const errorLimitRemain = headers.get('x-esi-error-limit-remain')
    const errorLimitReset = headers.get('x-esi-error-limit-reset')

    if (errorLimitRemain && errorLimitReset) {
      const info: ESIRateLimitInfo = {
        errorLimitRemain: parseInt(errorLimitRemain, 10),
        errorLimitReset: new Date(parseInt(errorLimitReset, 10) * 1000),
        requestCount: 0,
        windowStart: new Date(),
      }

      await redis.set(`${this.rateLimitKey}:error_info`, JSON.stringify(info), 'EX', 3600)

      // If we're close to the error limit, slow down
      if (info.errorLimitRemain < 10) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }

  /**
   * Extract relevant headers from response
   */
  private extractHeaders(headers: Headers): ESIHeaders {
    const extracted: ESIHeaders = {}

    const relevantHeaders = [
      'x-esi-error-limit-remain',
      'x-esi-error-limit-reset',
      'x-pages',
      'etag',
      'expires',
      'last-modified',
      'cache-control',
    ]

    relevantHeaders.forEach(header => {
      const value = headers.get(header)
      if (value) {
        extracted[header as keyof ESIHeaders] = value
      }
    })

    return extracted
  }

  /**
   * Handle error responses from ESI
   */
  private async handleErrorResponse(response: Response): Promise<Error> {
    let errorData: ESIError | undefined

    try {
      errorData = (await response.json()) as ESIError
    } catch {
      // Response might not be JSON
    }

    const message = errorData?.error || `ESI request failed with status ${response.status}`
    const error = new Error(message)

    // Attach additional error information
    Object.assign(error, {
      status: response.status,
      statusText: response.statusText,
      esiError: errorData,
    })

    return error
  }

  /**
   * Determine if request should be retried
   */
  private shouldRetry(status: number, attempt: number): boolean {
    // Don't retry if we've exhausted attempts
    if (attempt >= this.config.maxRetries) {
      return false
    }

    // Retry on server errors and rate limits
    return status >= 500 || status === 420 || status === 429
  }

  /**
   * Wait before retrying with exponential backoff
   */
  private async waitForRetry(attempt: number): Promise<void> {
    const baseDelay = 1000 // 1 second
    const delay = baseDelay * Math.pow(2, attempt)
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Generate cache key for request
   */
  private getCacheKey(path: string, params?: Record<string, string | number | boolean>): string {
    const paramStr = params ? JSON.stringify(params, Object.keys(params).sort()) : ''
    return `${this.cachePrefix}${path}:${paramStr}`
  }

  /**
   * Get response from cache
   */
  private async getFromCache<T>(cacheKey: string, etag?: string): Promise<ESIResponse<T> | null> {
    const cached = await redis.get(cacheKey)
    if (!cached) {
      return null
    }

    const response = JSON.parse(cached) as ESIResponse<T>

    // Check if etag matches
    if (etag && response.headers.etag === etag) {
      response.cached = true
      return response
    }

    // Check if cache is still valid
    if (response.headers.expires) {
      const expires = new Date(response.headers.expires)
      if (expires > new Date()) {
        response.cached = true
        return response
      }
    }

    return null
  }

  /**
   * Cache response based on headers
   */
  private async cacheResponse<T>(
    cacheKey: string,
    response: ESIResponse<T>,
    headers: ESIHeaders
  ): Promise<void> {
    let ttl = 300 // Default 5 minutes

    // Use expires header if available
    if (headers.expires) {
      const expires = new Date(headers.expires)
      const now = new Date()
      ttl = Math.max(0, Math.floor((expires.getTime() - now.getTime()) / 1000))
    }

    // Use cache-control header if available
    const cacheControl = headers['cache-control']
    if (cacheControl) {
      const maxAgeMatch = cacheControl ? cacheControl.match(/max-age=(\d+)/) : null
      if (maxAgeMatch && maxAgeMatch[1]) {
        ttl = parseInt(maxAgeMatch[1], 10)
      }
    }

    // Don't cache if TTL is 0 or negative
    if (ttl <= 0) {
      return
    }

    // Cap TTL at 1 hour
    ttl = Math.min(ttl, 3600)

    await redis.set(cacheKey, JSON.stringify(response), 'EX', ttl)
  }

  /**
   * Clear cache for a specific path
   */
  async clearCache(path?: string): Promise<void> {
    if (path) {
      const pattern = `${this.cachePrefix}${path}*`
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } else {
      // Clear all ESI cache
      const keys = await redis.keys(`${this.cachePrefix}*`)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    }
  }

  /**
   * Get current rate limit information
   */
  async getRateLimitInfo(): Promise<ESIRateLimitInfo | null> {
    const info = await redis.get(`${this.rateLimitKey}:error_info`)
    return info ? JSON.parse(info) : null
  }
}

// Export singleton instance
export const esiClient = new ESIClient()
