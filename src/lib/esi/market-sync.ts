/**
 * Market Data Synchronization Service
 * Handles fetching and caching market data from ESI
 */

import { esiClient } from './client'
import { redis } from '@/lib/redis'
import type { ESIMarketOrder, ESIMarketHistory, ESIMarketPrice } from '@/types/esi'

export interface MarketStats {
  typeId: number
  regionId: number
  buyPrice: number
  sellPrice: number
  spread: number
  spreadPercent: number
  buyVolume: number
  sellVolume: number
  buyOrders: number
  sellOrders: number
  avgDailyVolume: number
  volatility: number
  lastUpdate: Date
}

export interface MarketAnalysis {
  typeId: number
  regionId: number
  currentStats: MarketStats
  priceHistory: ESIMarketHistory[]
  profitOpportunities: ProfitOpportunity[]
  trendAnalysis: TrendAnalysis
}

export interface ProfitOpportunity {
  type: 'arbitrage' | 'trend' | 'volatility'
  buyPrice: number
  sellPrice: number
  profit: number
  profitPercent: number
  volume: number
  confidence: number
  description: string
}

export interface TrendAnalysis {
  trend: 'rising' | 'falling' | 'stable'
  momentum: number
  support: number
  resistance: number
  movingAverage7: number
  movingAverage30: number
  rsi: number
  volatility: number
}

export class MarketSyncService {
  private historyPrefix = 'market:history:'
  private ordersPrefix = 'market:orders:'
  private pricesPrefix = 'market:prices:'
  private analysisPrefix = 'market:analysis:'

  // Default regions for market analysis
  private defaultRegions = [
    10000002, // The Forge (Jita)
    10000043, // Domain (Amarr)
    10000032, // Sinq Laison (Dodixie)
    10000042, // Metropolis (Hek)
    10000030, // Heimatar (Rens)
  ]

  /**
   * Fetch and analyze market data for a type
   */
  async analyzeMarket(
    typeId: number,
    regionId: number = 10000002 // Default to The Forge
  ): Promise<MarketAnalysis> {
    // Fetch all required data in parallel
    const [orders, history, globalPrices] = await Promise.all([
      this.fetchMarketOrders(typeId, regionId),
      this.fetchMarketHistory(typeId, regionId),
      this.fetchGlobalPrices(),
    ])

    // Calculate current market stats
    const currentStats = this.calculateMarketStats(typeId, regionId, orders, history)

    // Find profit opportunities
    const profitOpportunities = await this.findProfitOpportunities(
      typeId,
      regionId,
      orders,
      history,
      globalPrices
    )

    // Perform trend analysis
    const trendAnalysis = this.analyzeTrends(history)

    const analysis: MarketAnalysis = {
      typeId,
      regionId,
      currentStats,
      priceHistory: history,
      profitOpportunities,
      trendAnalysis,
    }

    // Cache analysis
    await this.cacheAnalysis(typeId, regionId, analysis)

    return analysis
  }

  /**
   * Fetch market orders for a type in a region
   */
  private async fetchMarketOrders(typeId: number, regionId: number): Promise<ESIMarketOrder[]> {
    const cacheKey = `${this.ordersPrefix}${regionId}:${typeId}`

    // Check cache first
    const cached = await redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    const orders: ESIMarketOrder[] = []

    // Fetch all pages
    for await (const page of esiClient.paginate<ESIMarketOrder>(
      `/markets/${regionId}/orders/`,
      '', // Public endpoint, no token needed
      {
        params: { type_id: typeId },
      }
    )) {
      orders.push(...page)
    }

    // Cache for 5 minutes
    await redis.set(cacheKey, JSON.stringify(orders), 'EX', 300)

    return orders
  }

  /**
   * Fetch market history for a type in a region
   */
  private async fetchMarketHistory(typeId: number, regionId: number): Promise<ESIMarketHistory[]> {
    const cacheKey = `${this.historyPrefix}${regionId}:${typeId}`

    // Check cache first
    const cached = await redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    const response = await esiClient.publicRequest<ESIMarketHistory[]>(
      `/markets/${regionId}/history/`,
      {
        params: { type_id: typeId },
      }
    )

    const history = response.data

    // Cache until next downtime
    const now = new Date()
    const nextDowntime = new Date(now)
    nextDowntime.setUTCHours(11, 0, 0, 0) // EVE downtime is at 11:00 UTC
    if (nextDowntime <= now) {
      nextDowntime.setDate(nextDowntime.getDate() + 1)
    }
    const ttl = Math.floor((nextDowntime.getTime() - now.getTime()) / 1000)

    await redis.set(cacheKey, JSON.stringify(history), 'EX', ttl)

    return history
  }

  /**
   * Fetch global average prices
   */
  private async fetchGlobalPrices(): Promise<ESIMarketPrice[]> {
    const cacheKey = this.pricesPrefix + 'global'

    // Check cache first
    const cached = await redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    const response = await esiClient.publicRequest<ESIMarketPrice[]>('/markets/prices/')

    const prices = response.data

    // Cache for 1 hour
    await redis.set(cacheKey, JSON.stringify(prices), 'EX', 3600)

    return prices
  }

  /**
   * Calculate market statistics from orders and history
   */
  private calculateMarketStats(
    typeId: number,
    regionId: number,
    orders: ESIMarketOrder[],
    history: ESIMarketHistory[]
  ): MarketStats {
    // Separate buy and sell orders
    const buyOrders = orders
      .filter(o => o.is_buy_order)
      .filter(o => o.price !== undefined)
      .sort((a, b) => b.price - a.price) // Highest buy price first

    const sellOrders = orders
      .filter(o => !o.is_buy_order)
      .filter(o => o.price !== undefined)
      .sort((a, b) => a.price - b.price) // Lowest sell price first

    // Calculate prices
    const buyPrice = buyOrders.length > 0 && buyOrders[0] ? buyOrders[0].price : 0
    const sellPrice = sellOrders.length > 0 && sellOrders[0] ? sellOrders[0].price : 0
    const spread = sellPrice - buyPrice
    const spreadPercent = buyPrice > 0 ? (spread / buyPrice) * 100 : 0

    // Calculate volumes
    const buyVolume = buyOrders.reduce((sum, o) => sum + o.volume_remain, 0)
    const sellVolume = sellOrders.reduce((sum, o) => sum + o.volume_remain, 0)

    // Calculate average daily volume from history
    const recentHistory = history.slice(-30) // Last 30 days
    const avgDailyVolume =
      recentHistory.length > 0
        ? recentHistory.reduce((sum, h) => sum + h.volume, 0) / recentHistory.length
        : 0

    // Calculate volatility
    const prices = recentHistory.map(h => h.average)
    const volatility = this.calculateVolatility(prices)

    return {
      typeId,
      regionId,
      buyPrice,
      sellPrice,
      spread,
      spreadPercent,
      buyVolume,
      sellVolume,
      buyOrders: buyOrders.length,
      sellOrders: sellOrders.length,
      avgDailyVolume,
      volatility,
      lastUpdate: new Date(),
    }
  }

  /**
   * Find profit opportunities
   */
  private async findProfitOpportunities(
    _typeId: number,
    _regionId: number,
    orders: ESIMarketOrder[],
    history: ESIMarketHistory[],
    _globalPrices: ESIMarketPrice[]
  ): Promise<ProfitOpportunity[]> {
    const opportunities: ProfitOpportunity[] = []

    // Find station trading opportunities (buy orders vs sell orders)
    const buyOrders = orders
      .filter(o => o.is_buy_order)
      .filter(o => o.price !== undefined)
      .sort((a, b) => b.price - a.price)
    const sellOrders = orders
      .filter(o => !o.is_buy_order)
      .filter(o => o.price !== undefined)
      .sort((a, b) => a.price - b.price)

    if (buyOrders.length > 0 && sellOrders.length > 0) {
      const highestBuy = buyOrders[0]
      const lowestSell = sellOrders[0]
      if (highestBuy && lowestSell) {
        const immediateProfit = highestBuy.price - lowestSell.price
        if (immediateProfit > 0) {
          opportunities.push({
            type: 'arbitrage',
            buyPrice: lowestSell.price,
            sellPrice: highestBuy.price,
            profit: immediateProfit,
            profitPercent: (immediateProfit / lowestSell.price) * 100,
            volume: Math.min(highestBuy.volume_remain, lowestSell.volume_remain),
            confidence: 0.95,
            description: 'Immediate arbitrage opportunity between buy and sell orders',
          })
        }
      }
    }

    // Find trend-based opportunities
    if (history.length >= 7) {
      const recentPrices = history.slice(-7).map(h => h.average)
      const avgRecent = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length
      const currentPrice = sellOrders.length > 0 && sellOrders[0] ? sellOrders[0].price : 0

      if (currentPrice > 0) {
        const priceChange = ((currentPrice - avgRecent) / avgRecent) * 100

        if (priceChange < -10) {
          const lastHistoryEntry = history[history.length - 1]
          if (lastHistoryEntry) {
            opportunities.push({
              type: 'trend',
              buyPrice: currentPrice,
              sellPrice: avgRecent,
              profit: avgRecent - currentPrice,
              profitPercent: ((avgRecent - currentPrice) / currentPrice) * 100,
              volume: lastHistoryEntry.volume,
              confidence: 0.7,
              description: 'Price is significantly below 7-day average, potential rebound',
            })
          }
        }
      }
    }

    // Find volatility-based opportunities
    if (history.length >= 30) {
      const prices = history.slice(-30).map(h => h.average)
      const volatility = this.calculateVolatility(prices)
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length
      const currentPrice = sellOrders.length > 0 && sellOrders[0] ? sellOrders[0].price : 0

      if (volatility > 20 && currentPrice > 0) {
        const potentialSwing = avg * (volatility / 100)
        const lastHistoryEntry = history[history.length - 1]
        if (lastHistoryEntry) {
          opportunities.push({
            type: 'volatility',
            buyPrice: currentPrice,
            sellPrice: currentPrice + potentialSwing,
            profit: potentialSwing,
            profitPercent: (potentialSwing / currentPrice) * 100,
            volume: lastHistoryEntry.volume,
            confidence: 0.6,
            description: `High volatility (${volatility.toFixed(1)}%) suggests potential price swings`,
          })
        }
      }
    }

    // Sort by profit percent
    opportunities.sort((a, b) => b.profitPercent - a.profitPercent)

    return opportunities
  }

  /**
   * Analyze price trends
   */
  private analyzeTrends(history: ESIMarketHistory[]): TrendAnalysis {
    if (history.length < 7) {
      return {
        trend: 'stable',
        momentum: 0,
        support: 0,
        resistance: 0,
        movingAverage7: 0,
        movingAverage30: 0,
        rsi: 50,
        volatility: 0,
      }
    }

    const prices = history.map(h => h.average).filter(p => p !== undefined)
    const recent = prices.slice(-7)
    const older = prices.slice(-14, -7)

    // Calculate moving averages
    const ma7 = recent.reduce((a, b) => a + b, 0) / recent.length
    const ma30 = prices.slice(-30).reduce((a, b) => a + b, 0) / Math.min(prices.length, 30)

    // Determine trend
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg
    const momentum = ((recentAvg - olderAvg) / olderAvg) * 100

    let trend: 'rising' | 'falling' | 'stable'
    if (momentum > 5) trend = 'rising'
    else if (momentum < -5) trend = 'falling'
    else trend = 'stable'

    // Calculate support and resistance
    const highs = history.slice(-30).map(h => h.highest)
    const lows = history.slice(-30).map(h => h.lowest)
    const support = Math.min(...lows)
    const resistance = Math.max(...highs)

    // Calculate RSI
    const rsi = this.calculateRSI(prices.slice(-14))

    // Calculate volatility
    const volatility = this.calculateVolatility(prices.slice(-30))

    return {
      trend,
      momentum,
      support,
      resistance,
      movingAverage7: ma7,
      movingAverage30: ma30,
      rsi,
      volatility,
    }
  }

  /**
   * Calculate volatility (standard deviation as percentage of mean)
   */
  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0

    const mean = prices.reduce((a, b) => a + b, 0) / prices.length
    const variance =
      prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length
    const stdDev = Math.sqrt(variance)

    return (stdDev / mean) * 100
  }

  /**
   * Calculate Relative Strength Index (RSI)
   */
  private calculateRSI(prices: number[]): number {
    if (prices.length < 2) return 50

    let gains = 0
    let losses = 0

    for (let i = 1; i < prices.length; i++) {
      const current = prices[i]
      const previous = prices[i - 1]
      if (current !== undefined && previous !== undefined) {
        const change = current - previous
        if (change > 0) gains += change
        else losses += Math.abs(change)
      }
    }

    const avgGain = gains / (prices.length - 1)
    const avgLoss = losses / (prices.length - 1)

    if (avgLoss === 0) return 100

    const rs = avgGain / avgLoss
    const rsi = 100 - 100 / (1 + rs)

    return rsi
  }

  /**
   * Cache market analysis
   */
  private async cacheAnalysis(
    typeId: number,
    regionId: number,
    analysis: MarketAnalysis
  ): Promise<void> {
    const cacheKey = `${this.analysisPrefix}${regionId}:${typeId}`
    await redis.set(cacheKey, JSON.stringify(analysis), 'EX', 300) // 5 minutes
  }

  /**
   * Get cached market analysis
   */
  async getCachedAnalysis(typeId: number, regionId: number): Promise<MarketAnalysis | null> {
    const cacheKey = `${this.analysisPrefix}${regionId}:${typeId}`
    const cached = await redis.get(cacheKey)
    return cached ? JSON.parse(cached) : null
  }

  /**
   * Find arbitrage opportunities across regions
   */
  async findArbitrageOpportunities(
    typeId: number,
    minProfit: number = 1000000 // 1M ISK minimum
  ): Promise<
    Array<{
      buyRegion: number
      sellRegion: number
      buyPrice: number
      sellPrice: number
      profit: number
      profitPercent: number
    }>
  > {
    const opportunities = []

    // Fetch orders from all major trade hubs
    const regionOrders = await Promise.all(
      this.defaultRegions.map(async regionId => ({
        regionId,
        orders: await this.fetchMarketOrders(typeId, regionId),
      }))
    )

    // Compare prices between regions
    for (let i = 0; i < regionOrders.length; i++) {
      for (let j = i + 1; j < regionOrders.length; j++) {
        const region1 = regionOrders[i]
        const region2 = regionOrders[j]

        if (!region1 || !region2) continue

        // Get best prices in each region
        const sellOrders1 = region1.orders
          .filter(o => !o.is_buy_order)
          .filter(o => o.price !== undefined)
          .sort((a, b) => a.price - b.price)
        const sellOrders2 = region2.orders
          .filter(o => !o.is_buy_order)
          .filter(o => o.price !== undefined)
          .sort((a, b) => a.price - b.price)

        if (sellOrders1.length > 0 && sellOrders2.length > 0) {
          const lowestSell1 = sellOrders1[0]
          const lowestSell2 = sellOrders2[0]
          if (lowestSell1 && lowestSell2) {
            const price1 = lowestSell1.price
            const price2 = lowestSell2.price

            // Check both directions
            if (price2 - price1 > minProfit) {
              opportunities.push({
                buyRegion: region1.regionId,
                sellRegion: region2.regionId,
                buyPrice: price1,
                sellPrice: price2,
                profit: price2 - price1,
                profitPercent: ((price2 - price1) / price1) * 100,
              })
            }

            if (price1 - price2 > minProfit) {
              opportunities.push({
                buyRegion: region2.regionId,
                sellRegion: region1.regionId,
                buyPrice: price2,
                sellPrice: price1,
                profit: price1 - price2,
                profitPercent: ((price1 - price2) / price2) * 100,
              })
            }
          }
        }
      }
    }

    // Sort by profit
    opportunities.sort((a, b) => b.profit - a.profit)

    return opportunities
  }

  /**
   * Clear market cache
   */
  async clearCache(typeId?: number, regionId?: number): Promise<void> {
    const patterns = []

    if (typeId && regionId) {
      patterns.push(
        `${this.ordersPrefix}${regionId}:${typeId}`,
        `${this.historyPrefix}${regionId}:${typeId}`,
        `${this.analysisPrefix}${regionId}:${typeId}`
      )
    } else if (regionId) {
      patterns.push(
        `${this.ordersPrefix}${regionId}:*`,
        `${this.historyPrefix}${regionId}:*`,
        `${this.analysisPrefix}${regionId}:*`
      )
    } else {
      patterns.push(
        `${this.ordersPrefix}*`,
        `${this.historyPrefix}*`,
        `${this.analysisPrefix}*`,
        `${this.pricesPrefix}*`
      )
    }

    for (const pattern of patterns) {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    }
  }
}

// Export singleton instance
export const marketSyncService = new MarketSyncService()
