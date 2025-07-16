#!/usr/bin/env node

const postgres = require('postgres')
const fs = require('fs')
const path = require('path')

// Database connection
const sql = postgres(
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/eve_cortex',
  {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  }
)

// Migration files directory
const migrationsDir = path.join(__dirname, 'migrations')

async function runMigrations() {
  try {
    console.log('🔄 Starting database migrations...')

    // Create migrations table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Get executed migrations
    const executedMigrations = await sql`
      SELECT filename FROM migrations ORDER BY id
    `
    const executedFiles = executedMigrations.map(m => m.filename)

    // Create migrations directory if it doesn't exist
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true })
      console.log('📁 Created migrations directory')
    }

    // Get all migration files
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort()

    // Run pending migrations
    let migrationsRun = 0
    for (const file of migrationFiles) {
      if (!executedFiles.includes(file)) {
        console.log(`⚡ Running migration: ${file}`)

        const migrationSQL = fs.readFileSync(path.join(migrationsDir, file), 'utf8')

        await sql.begin(async sql => {
          // Execute migration
          await sql.unsafe(migrationSQL)

          // Record migration
          await sql`
            INSERT INTO migrations (filename) VALUES (${file})
          `
        })

        migrationsRun++
        console.log(`✅ Completed migration: ${file}`)
      }
    }

    if (migrationsRun === 0) {
      console.log('✅ No pending migrations')
    } else {
      console.log(`✅ Successfully ran ${migrationsRun} migration(s)`)
    }
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

// Run migrations if called directly
if (require.main === module) {
  runMigrations()
}

module.exports = { runMigrations }
