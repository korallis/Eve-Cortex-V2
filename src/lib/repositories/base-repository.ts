/**
 * Base Repository Implementation
 * Provides common database operations using the repository pattern
 */

import { sql } from '@/lib/database'
import type { DatabaseRecord, QueryOptions, PaginatedResult } from '@/types/database'

export abstract class BaseRepository<T extends DatabaseRecord> {
  protected abstract tableName: string

  /**
   * Find a record by ID
   */
  async findById(id: number): Promise<T | null> {
    try {
      const result = await sql`
        SELECT * FROM ${sql(this.tableName)} WHERE id = ${id}
      `
      return result[0] as T || null
    } catch (error) {
      console.error(`Error finding ${this.tableName} by ID:`, error)
      throw error
    }
  }

  /**
   * Find all records with optional filtering and pagination
   */
  async findAll(options: QueryOptions = {}): Promise<T[]> {
    try {
      const { limit = 100, offset = 0, orderBy = 'id', orderDirection = 'ASC' } = options
      
      const result = await sql`
        SELECT * FROM ${sql(this.tableName)}
        ORDER BY ${sql(orderBy)} ${sql(orderDirection)}
        LIMIT ${limit} OFFSET ${offset}
      `
      
      return result as unknown as T[]
    } catch (error) {
      console.error(`Error finding all ${this.tableName}:`, error)
      throw error
    }
  }

  /**
   * Find records with pagination
   */
  async findPaginated(page: number = 1, limit: number = 10, options: QueryOptions = {}): Promise<PaginatedResult<T>> {
    try {
      const offset = (page - 1) * limit
      const { orderBy = 'id', orderDirection = 'ASC' } = options

      // Get total count
      const countResult = await sql`
        SELECT COUNT(*) as total FROM ${sql(this.tableName)}
      `
      const total = parseInt(countResult[0]?.['total'] || '0')

      // Get paginated data
      const result = await sql`
        SELECT * FROM ${sql(this.tableName)}
        ORDER BY ${sql(orderBy)} ${sql(orderDirection)}
        LIMIT ${limit} OFFSET ${offset}
      `

      return {
        data: result as unknown as T[],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    } catch (error) {
      console.error(`Error paginating ${this.tableName}:`, error)
      throw error
    }
  }

  /**
   * Create a new record
   */
  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    try {
      const dataWithTimestamps = {
        ...data,
        created_at: new Date(),
        updated_at: new Date()
      }

      const columns = Object.keys(dataWithTimestamps)
      const values = Object.values(dataWithTimestamps)
      
      const result = await sql`
        INSERT INTO ${sql(this.tableName)} (${sql(columns)})
        VALUES (${sql(values)})
        RETURNING *
      `
      
      return result[0] as T
    } catch (error) {
      console.error(`Error creating ${this.tableName}:`, error)
      throw error
    }
  }

  /**
   * Update a record by ID
   */
  async update(id: number, data: Partial<T>): Promise<T | null> {
    try {
      const dataWithTimestamp = {
        ...data,
        updated_at: new Date()
      }

      const setPairs = Object.entries(dataWithTimestamp)
        .map(([key, value]) => `${key} = ${sql`${value}`}`)
        .join(', ')

      const result = await sql`
        UPDATE ${sql(this.tableName)} 
        SET ${sql(setPairs)}
        WHERE id = ${id}
        RETURNING *
      `
      
      return result[0] as T || null
    } catch (error) {
      console.error(`Error updating ${this.tableName}:`, error)
      throw error
    }
  }

  /**
   * Delete a record by ID
   */
  async delete(id: number): Promise<boolean> {
    try {
      const result = await sql`
        DELETE FROM ${sql(this.tableName)} WHERE id = ${id}
      `
      
      return result.count > 0
    } catch (error) {
      console.error(`Error deleting ${this.tableName}:`, error)
      throw error
    }
  }

  /**
   * Check if a record exists
   */
  async exists(id: number): Promise<boolean> {
    try {
      const result = await sql`
        SELECT EXISTS(SELECT 1 FROM ${sql(this.tableName)} WHERE id = ${id})
      `
      
      return result[0]?.['exists'] || false
    } catch (error) {
      console.error(`Error checking existence in ${this.tableName}:`, error)
      throw error
    }
  }

  /**
   * Get total count of records
   */
  async count(where?: Record<string, unknown>): Promise<number> {
    try {
      if (where) {
        // Simple where clause - would need more sophisticated handling for complex queries
        const firstCondition = Object.entries(where)[0]
        if (firstCondition) {
          const [key, value] = firstCondition
          const result = await sql`SELECT COUNT(*) as total FROM ${sql(this.tableName)} WHERE ${sql(key)} = ${value as string | number | boolean}`
          return parseInt(result[0]?.['total'] || '0')
        }
      }
      
      const result = await sql`SELECT COUNT(*) as total FROM ${sql(this.tableName)}`
      return parseInt(result[0]?.['total'] || '0')
    } catch (error) {
      console.error(`Error counting ${this.tableName}:`, error)
      throw error
    }
  }

  /**
   * Error handling helper
   */
  protected async handleError(error: unknown, operation: string): Promise<never> {
    console.error(`${this.tableName} repository error in ${operation}:`, error)
    throw error
  }

  /**
   * Log and throw error
   */
  protected async logAndThrow(error: unknown, operation: string): Promise<never> {
    console.error(`${this.tableName} repository error in ${operation}:`, error)
    throw error
  }
}