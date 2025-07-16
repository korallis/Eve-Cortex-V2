/**
 * Database Health Check and Monitoring
 * Provides health monitoring and diagnostic utilities
 */

import { sql } from '@/lib/database'
import type { DatabaseHealth } from '@/types/database'

/**
 * Comprehensive database health check
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  try {
    // Basic connectivity test
    const result = await sql`
      SELECT 
        current_database() as database,
        current_user as user,
        version() as version,
        NOW() as current_time
    `

    // Get connection pool information
    const poolInfo = await sql`
      SELECT 
        COUNT(*) as connection_count
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `

    return {
      isHealthy: true,
      database: result[0]?.['database'] || 'unknown',
      user: result[0]?.['user'] || 'unknown',
      version: result[0]?.['version'] || 'unknown',
      currentTime: result[0]?.['current_time'] || new Date(),
      connectionCount: parseInt(poolInfo[0]?.['connection_count'] || '0') || 0,
    }
  } catch (error) {
    console.error('Database health check failed:', error)

    return {
      isHealthy: false,
      database: 'unknown',
      user: 'unknown',
      version: 'unknown',
      currentTime: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check table existence and structure
 */
export async function checkTableStructure() {
  try {
    const tables = await sql`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('characters', 'character_skills', 'fittings', 'skill_plans', 'migrations')
      ORDER BY table_name, ordinal_position
    `

    // Group by table name
    const tableStructure = tables.reduce(
      (acc, row) => {
        const tableName = row['table_name'] as string
        if (!acc[tableName]) {
          acc[tableName] = []
        }
        acc[tableName].push({
          column: row['column_name'],
          type: row['data_type'],
          nullable: row['is_nullable'] === 'YES',
          default: row['column_default'],
        })
        return acc
      },
      {} as Record<string, unknown[]>
    )

    return tableStructure
  } catch (error) {
    console.error('Error checking table structure:', error)
    throw error
  }
}

/**
 * Check index information
 */
export async function checkIndexes() {
  try {
    const indexes = await sql`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('characters', 'character_skills', 'fittings', 'skill_plans')
      ORDER BY tablename, indexname
    `

    return indexes
  } catch (error) {
    console.error('Error checking indexes:', error)
    throw error
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  try {
    const stats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM characters) as character_count,
        (SELECT COUNT(*) FROM character_skills) as skill_count,
        (SELECT COUNT(*) FROM fittings) as fitting_count,
        (SELECT COUNT(*) FROM skill_plans) as skill_plan_count,
        (SELECT COUNT(*) FROM migrations) as migration_count,
        (SELECT pg_database_size(current_database())) as database_size
    `

    return {
      characterCount: parseInt(stats[0]?.['character_count'] || '0') || 0,
      skillCount: parseInt(stats[0]?.['skill_count'] || '0') || 0,
      fittingCount: parseInt(stats[0]?.['fitting_count'] || '0') || 0,
      skillPlanCount: parseInt(stats[0]?.['skill_plan_count'] || '0') || 0,
      migrationCount: parseInt(stats[0]?.['migration_count'] || '0') || 0,
      databaseSize: parseInt(stats[0]?.['database_size'] || '0') || 0,
    }
  } catch (error) {
    console.error('Error getting database stats:', error)
    throw error
  }
}

/**
 * Test database performance
 */
export async function performanceTest() {
  try {
    const startTime = Date.now()

    // Simple query performance test
    await sql`SELECT 1`

    const queryTime = Date.now() - startTime

    // Connection test
    const connectionStart = Date.now()
    await sql`SELECT NOW()`
    const connectionTime = Date.now() - connectionStart

    return {
      queryLatency: queryTime,
      connectionLatency: connectionTime,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('Error performing performance test:', error)
    throw error
  }
}

/**
 * Check for long-running queries
 */
export async function checkLongRunningQueries() {
  try {
    const queries = await sql`
      SELECT 
        pid,
        now() - pg_stat_activity.query_start AS duration,
        query,
        state
      FROM pg_stat_activity
      WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
        AND state = 'active'
      ORDER BY duration DESC
    `

    return queries
  } catch (error) {
    console.error('Error checking long-running queries:', error)
    throw error
  }
}

/**
 * Get migration status
 */
export async function getMigrationStatus() {
  try {
    const migrations = await sql`
      SELECT 
        filename,
        executed_at
      FROM migrations
      ORDER BY executed_at DESC
    `

    return migrations
  } catch (error) {
    console.error('Error getting migration status:', error)
    throw error
  }
}

/**
 * Comprehensive database diagnostics
 */
export async function runDatabaseDiagnostics() {
  try {
    const [health, structure, indexes, stats, performance, longQueries, migrations] =
      await Promise.all([
        checkDatabaseHealth(),
        checkTableStructure(),
        checkIndexes(),
        getDatabaseStats(),
        performanceTest(),
        checkLongRunningQueries(),
        getMigrationStatus(),
      ])

    return {
      health,
      structure,
      indexes,
      stats,
      performance,
      longQueries,
      migrations,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error('Error running database diagnostics:', error)
    throw error
  }
}
