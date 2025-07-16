/**
 * Database Connection and Query Utilities
 * Provides centralized database connection management for Eve-Cortex
 */

import postgres from 'postgres'

// Database connection configuration
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/eve_cortex'

// Connection options
const connectionOptions = {
  max: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  onnotice: process.env.NODE_ENV === 'development' ? console.log : undefined,
}

// Create database connection
export const sql = postgres(DATABASE_URL, connectionOptions)

// Database health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await sql`SELECT 1`
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

// Database connection info
export async function getDatabaseInfo() {
  try {
    const result = await sql`
      SELECT 
        current_database() as database,
        current_user as user,
        version() as version,
        NOW() as current_time
    `
    return result[0]
  } catch (error) {
    console.error('Failed to get database info:', error)
    return null
  }
}

// Execute query with error handling
export async function executeQuery<T>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  try {
    const result = await sql.unsafe(query, params)
    return result as T[]
  } catch (error) {
    console.error('Query execution failed:', error)
    throw error
  }
}

// Transaction wrapper
export async function withTransaction<T>(
  callback: (sql: typeof postgres) => Promise<T>
): Promise<T> {
  return await sql.begin(callback)
}

// Close database connection
export async function closeDatabaseConnection(): Promise<void> {
  await sql.end()
}

// Database types for TypeScript
export interface DatabaseRow {
  [key: string]: any
}

export interface QueryResult<T = DatabaseRow> {
  rows: T[]
  command: string
  rowCount: number
}

// Error handling utilities
export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly detail?: string
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export function handleDatabaseError(error: any): never {
  if (error.code) {
    throw new DatabaseError(
      error.message,
      error.code,
      error.detail
    )
  }
  throw error
}

// Common query builders
export const queries = {
  // Character queries
  findCharacterByEveId: (eveId: number) => sql`
    SELECT * FROM characters WHERE eve_character_id = ${eveId}
  `,
  
  // Skill queries
  getCharacterSkills: (characterId: number) => sql`
    SELECT * FROM character_skills 
    WHERE character_id = ${characterId}
    ORDER BY skill_type_id
  `,
  
  // Fitting queries
  getFittingsByCharacter: (characterId: number) => sql`
    SELECT * FROM fittings 
    WHERE character_id = ${characterId}
    ORDER BY updated_at DESC
  `,
  
  // Skill plan queries
  getActiveSkillPlans: (characterId: number) => sql`
    SELECT * FROM skill_plans 
    WHERE character_id = ${characterId} AND is_active = TRUE
    ORDER BY priority DESC, created_at DESC
  `,
}

// Export default connection for direct use
export default sql