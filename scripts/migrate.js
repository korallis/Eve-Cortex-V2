#!/usr/bin/env node

/**
 * Database Migration System
 * Handles PostgreSQL schema migrations for Eve-Cortex
 */

const fs = require('fs').promises
const path = require('path')
const postgres = require('postgres')

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations')
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/eve_cortex'

// Initialize database connection
const sql = postgres(DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
})

/**
 * Ensure migrations table exists
 */
async function ensureMigrationsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `
    console.log('✅ Migrations table ready')
  } catch (error) {
    console.error('❌ Failed to create migrations table:', error.message)
    process.exit(1)
  }
}

/**
 * Get executed migrations from database
 */
async function getExecutedMigrations() {
  try {
    const rows = await sql`
      SELECT filename FROM migrations ORDER BY executed_at
    `
    return rows.map(row => row.filename)
  } catch (error) {
    console.error('❌ Failed to get executed migrations:', error.message)
    return []
  }
}

/**
 * Get migration files from filesystem
 */
async function getMigrationFiles() {
  try {
    await fs.access(MIGRATIONS_DIR)
    const files = await fs.readdir(MIGRATIONS_DIR)
    return files
      .filter(file => file.endsWith('.sql'))
      .sort()
  } catch (error) {
    console.log('📁 Creating migrations directory...')
    await fs.mkdir(MIGRATIONS_DIR, { recursive: true })
    return []
  }
}

/**
 * Execute a single migration file
 */
async function executeMigration(filename) {
  try {
    const filePath = path.join(MIGRATIONS_DIR, filename)
    const migrationSQL = await fs.readFile(filePath, 'utf8')
    
    console.log(`🔄 Executing migration: ${filename}`)
    
    // Execute migration in transaction
    await sql.begin(async sql => {
      // Execute the migration SQL
      await sql.unsafe(migrationSQL)
      
      // Record migration as executed
      await sql`
        INSERT INTO migrations (filename) VALUES (${filename})
      `
    })
    
    console.log(`✅ Migration completed: ${filename}`)
  } catch (error) {
    console.error(`❌ Migration failed: ${filename}`)
    console.error('Error:', error.message)
    throw error
  }
}

/**
 * Run pending migrations
 */
async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...')
    
    await ensureMigrationsTable()
    
    const [executedMigrations, migrationFiles] = await Promise.all([
      getExecutedMigrations(),
      getMigrationFiles()
    ])
    
    const pendingMigrations = migrationFiles.filter(
      file => !executedMigrations.includes(file)
    )
    
    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations')
      return
    }
    
    console.log(`📋 Found ${pendingMigrations.length} pending migrations:`)
    pendingMigrations.forEach(file => console.log(`  - ${file}`))
    
    for (const migration of pendingMigrations) {
      await executeMigration(migration)
    }
    
    console.log(`🎉 Successfully executed ${pendingMigrations.length} migrations`)
  } catch (error) {
    console.error('❌ Migration process failed:', error.message)
    process.exit(1)
  }
}

/**
 * Create a new migration file
 */
async function createMigration(name) {
  try {
    if (!name) {
      console.error('❌ Migration name is required')
      console.log('Usage: npm run db:migrate create <migration_name>')
      process.exit(1)
    }
    
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0]
    const filename = `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}.sql`
    const filePath = path.join(MIGRATIONS_DIR, filename)
    
    const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

-- Add your migration SQL here
-- Example:
-- CREATE TABLE example (
--   id SERIAL PRIMARY KEY,
--   name VARCHAR(255) NOT NULL,
--   created_at TIMESTAMP DEFAULT NOW()
-- );

-- Remember to add appropriate indexes:
-- CREATE INDEX idx_example_name ON example(name);
`
    
    await fs.mkdir(MIGRATIONS_DIR, { recursive: true })
    await fs.writeFile(filePath, template)
    
    console.log(`✅ Created migration: ${filename}`)
    console.log(`📁 File: ${filePath}`)
  } catch (error) {
    console.error('❌ Failed to create migration:', error.message)
    process.exit(1)
  }
}

/**
 * Show migration status
 */
async function showStatus() {
  try {
    await ensureMigrationsTable()
    
    const [executedMigrations, migrationFiles] = await Promise.all([
      getExecutedMigrations(),
      getMigrationFiles()
    ])
    
    console.log('\n📊 Migration Status:')
    console.log(`  Total migrations: ${migrationFiles.length}`)
    console.log(`  Executed: ${executedMigrations.length}`)
    console.log(`  Pending: ${migrationFiles.length - executedMigrations.length}`)
    
    if (migrationFiles.length > 0) {
      console.log('\n📋 Migration Files:')
      migrationFiles.forEach(file => {
        const status = executedMigrations.includes(file) ? '✅' : '⏳'
        console.log(`  ${status} ${file}`)
      })
    }
  } catch (error) {
    console.error('❌ Failed to show status:', error.message)
    process.exit(1)
  }
}

/**
 * Main function
 */
async function main() {
  const command = process.argv[2]
  const arg = process.argv[3]
  
  try {
    switch (command) {
      case 'create':
        await createMigration(arg)
        break
      case 'status':
        await showStatus()
        break
      case 'run':
      default:
        await runMigrations()
        break
    }
  } finally {
    await sql.end()
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Migration interrupted')
  await sql.end()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 Migration terminated')
  await sql.end()
  process.exit(0)
})

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Migration system error:', error.message)
    process.exit(1)
  })
}

module.exports = { runMigrations, createMigration, showStatus }
