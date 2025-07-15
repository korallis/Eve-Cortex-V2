#!/usr/bin/env node

const postgres = require('postgres')

// Database connection
const sql = postgres(
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/eve_cortex',
  {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  }
)

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...')

    // Check if we're in test environment
    const isTest = process.env.NODE_ENV === 'test'

    if (isTest) {
      console.log('🧪 Test environment detected - seeding test data')

      // Seed test data
      await seedTestData()
    } else {
      console.log('🏗️ Development environment detected - seeding development data')

      // Seed development data
      await seedDevelopmentData()
    }

    console.log('✅ Database seeding completed successfully')
  } catch (error) {
    console.error('❌ Database seeding failed:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

async function seedTestData() {
  // Clear existing test data
  await sql`TRUNCATE TABLE characters, character_skills, fittings, skill_plans RESTART IDENTITY CASCADE`

  // Insert test character
  const [character] = await sql`
    INSERT INTO characters (eve_character_id, name, corporation_id, wallet_balance)
    VALUES (12345678, 'Test Pilot', 98000001, 1000000.00)
    RETURNING id
  `

  // Insert test skills
  await sql`
    INSERT INTO character_skills (character_id, skill_type_id, trained_skill_level, skillpoints_in_skill, active_skill_level)
    VALUES 
      (${character.id}, 3327, 5, 256000, 5),  -- Spaceship Command V
      (${character.id}, 3328, 4, 113137, 4),  -- Frigate IV
      (${character.id}, 3329, 3, 40000, 3)    -- Cruiser III
  `

  // Insert test fitting
  await sql`
    INSERT INTO fittings (character_id, ship_type_id, name, fitting_data, career_path)
    VALUES (
      ${character.id}, 
      587, 
      'Test Rifter Fit',
      '{"modules": [{"typeId": 2456, "slot": "high", "quantity": 3}]}',
      'pvp'
    )
  `

  console.log('✅ Test data seeded')
}

async function seedDevelopmentData() {
  // Check if development data already exists
  const existingChars = await sql`SELECT COUNT(*) as count FROM characters`

  if (existingChars[0].count > 0) {
    console.log('📊 Development data already exists, skipping seed')
    return
  }

  // Insert sample development data
  const [character] = await sql`
    INSERT INTO characters (eve_character_id, name, corporation_id, wallet_balance)
    VALUES (87654321, 'Dev Pilot', 98000001, 50000000.00)
    RETURNING id
  `

  // Insert sample skills for development
  await sql`
    INSERT INTO character_skills (character_id, skill_type_id, trained_skill_level, skillpoints_in_skill, active_skill_level)
    VALUES 
      (${character.id}, 3327, 5, 256000, 5),   -- Spaceship Command V
      (${character.id}, 3328, 5, 256000, 5),   -- Frigate V
      (${character.id}, 3329, 4, 113137, 4),   -- Cruiser IV
      (${character.id}, 3330, 3, 40000, 3),    -- Battlecruiser III
      (${character.id}, 11207, 4, 113137, 4),  -- Advanced Weapon Upgrades IV
      (${character.id}, 1315, 5, 256000, 5)    -- Mechanics V
  `

  // Insert sample fittings
  await sql`
    INSERT INTO fittings (character_id, ship_type_id, name, fitting_data, career_path, is_public)
    VALUES 
      (
        ${character.id}, 
        587, 
        'PvP Rifter',
        '{"modules": [{"typeId": 2456, "slot": "high", "quantity": 3}, {"typeId": 1978, "slot": "mid", "quantity": 1}]}',
        'pvp',
        true
      ),
      (
        ${character.id}, 
        621, 
        'Mission Caracal',
        '{"modules": [{"typeId": 2456, "slot": "high", "quantity": 5}, {"typeId": 1978, "slot": "mid", "quantity": 4}]}',
        'missions',
        true
      )
  `

  // Insert sample skill plan
  await sql`
    INSERT INTO skill_plans (character_id, name, goals, training_queue, career_path, priority)
    VALUES (
      ${character.id},
      'PvP Frigate Mastery',
      '{"target_ships": [587, 596], "focus": "small_weapons"}',
      '{"skills": [{"skill_id": 3328, "target_level": 5}, {"skill_id": 3327, "target_level": 5}]}',
      'pvp',
      1
    )
  `

  console.log('✅ Development data seeded')
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
}

module.exports = { seedDatabase, seedTestData, seedDevelopmentData }
