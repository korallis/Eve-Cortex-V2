/**
 * Database Migration Runner
 * Handles database schema migrations and versioning
 */

import { sql } from '@/lib/database'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

export interface Migration {
  filename: string
  version: number
  sql: string
}

export interface MigrationRecord {
  id: number
  filename: string
  executed_at: Date
}

/**
 * Ensure migrations table exists
 */
export async function ensureMigrationsTable(): Promise<void> {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `
  } catch (error) {
    console.error('Failed to create migrations table:', error)
    throw error
  }
}

/**
 * Load migration files from the database directory
 */
export async function loadMigrations(migrationsDir: string): Promise<Migration[]> {
  try {
    const files = await readdir(migrationsDir)
    const migrationFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort()

    const migrations: Migration[] = []
    
    for (const filename of migrationFiles) {
      const filePath = join(migrationsDir, filename)
      const content = await readFile(filePath, 'utf8')
      
      // Extract version from filename (e.g., 001_create_users.sql -> 1)
      const versionMatch = filename.match(/^(\d+)_/)
      const version = versionMatch ? parseInt(versionMatch[1]) : 0
      
      migrations.push({
        filename,
        version,
        sql: content
      })
    }

    return migrations
  } catch (error) {
    console.error('Failed to load migrations:', error)
    throw error
  }
}

/**
 * Get executed migrations from database
 */
export async function getExecutedMigrations(): Promise<MigrationRecord[]> {
  try {
    const result = await sql`
      SELECT id, filename, executed_at
      FROM migrations
      ORDER BY executed_at
    `
    return result as unknown as MigrationRecord[]
  } catch (error) {
    console.error('Failed to get executed migrations:', error)
    throw error
  }
}

/**
 * Execute a single migration
 */
export async function executeMigration(migration: Migration): Promise<void> {
  try {
    await sql.begin(async (sql) => {
      // Execute the migration SQL
      await sql.unsafe(migration.sql)
      
      // Record the migration as executed
      await sql`
        INSERT INTO migrations (filename)
        VALUES (${migration.filename})
      `
    })
    
    console.log(`Migration ${migration.filename} executed successfully`)
  } catch (error) {
    console.error(`Failed to execute migration ${migration.filename}:`, error)
    throw error
  }
}

/**
 * Run pending migrations
 */
export async function runMigrations(migrationsDir: string): Promise<void> {
  try {
    await ensureMigrationsTable()
    
    const migrations = await loadMigrations(migrationsDir)
    const executed = await getExecutedMigrations()
    const executedFilenames = new Set(executed.map(m => m.filename))
    
    const pendingMigrations = migrations.filter(
      migration => !executedFilenames.has(migration.filename)
    )
    
    if (pendingMigrations.length === 0) {
      console.log('No pending migrations')
      return
    }
    
    console.log(`Running ${pendingMigrations.length} pending migrations...`)
    
    for (const migration of pendingMigrations) {
      await executeMigration(migration)
    }
    
    console.log('All migrations completed successfully')
  } catch (error) {
    console.error('Migration runner failed:', error)
    throw error
  }
}

/**
 * Check migration status
 */
export async function getMigrationStatus(migrationsDir: string): Promise<{
  total: number
  executed: number
  pending: string[]
}> {
  try {
    await ensureMigrationsTable()
    
    const migrations = await loadMigrations(migrationsDir)
    const executed = await getExecutedMigrations()
    const executedFilenames = new Set(executed.map(m => m.filename))
    
    const pendingMigrations = migrations.filter(
      migration => !executedFilenames.has(migration.filename)
    )
    
    return {
      total: migrations.length,
      executed: executed.length,
      pending: pendingMigrations.map(m => m.filename)
    }
  } catch (error) {
    console.error('Failed to get migration status:', error)
    throw error
  }
}

/**
 * Rollback last migration (dangerous - use with caution)
 */
export async function rollbackLastMigration(): Promise<void> {
  try {
    const executed = await getExecutedMigrations()
    
    if (executed.length === 0) {
      console.log('No migrations to rollback')
      return
    }
    
    const lastMigration = executed[executed.length - 1]
    
    if (!lastMigration) {
      console.log('No migrations to rollback')
      return
    }
    
    await sql`
      DELETE FROM migrations
      WHERE filename = ${lastMigration.filename}
    `
    
    console.log(`Rolled back migration: ${lastMigration.filename}`)
    console.log('⚠️  Note: This only removes the migration record, not the schema changes')
  } catch (error) {
    console.error('Failed to rollback migration:', error)
    throw error
  }
}