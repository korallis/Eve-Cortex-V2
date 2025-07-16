#!/usr/bin/env node

/**
 * Database Seeding Script
 * Populates the database with sample data for development
 */

const postgres = require('postgres')
const fs = require('fs').promises
const path = require('path')

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/eve_cortex'

// Initialize database connection
const sql = postgres(DATABASE_URL, {
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
})

// Sample data
const sampleCharacters = [
  {
    eve_character_id: 2112625428,
    name: 'Test Pilot Alpha',
    corporation_id: 1000169,
    alliance_id: null,
    wallet_balance: 1000000.00,
    location_id: 30000142,
    location_name: 'Jita IV - Moon 4 - Caldari Navy Assembly Plant',
    security_status: 5.0,
    birthday: '2020-01-15T10:30:00Z',
    last_login: new Date().toISOString()
  },
  {
    eve_character_id: 2112625429,
    name: 'Test Pilot Beta',
    corporation_id: 1000169,
    alliance_id: null,
    wallet_balance: 500000.00,
    location_id: 30000142,
    location_name: 'Jita IV - Moon 4 - Caldari Navy Assembly Plant',
    security_status: 2.3,
    birthday: '2019-06-22T14:45:00Z',
    last_login: new Date().toISOString()
  }
]

const sampleSkills = [
  { skill_type_id: 20533, trained_skill_level: 5, skillpoints_in_skill: 256000, active_skill_level: 5 },
  { skill_type_id: 3327, trained_skill_level: 4, skillpoints_in_skill: 90510, active_skill_level: 4 },
  { skill_type_id: 3449, trained_skill_level: 5, skillpoints_in_skill: 256000, active_skill_level: 5 },
  { skill_type_id: 3300, trained_skill_level: 5, skillpoints_in_skill: 256000, active_skill_level: 5 },
]

const sampleFittings = [
  {
    ship_type_id: 11134,
    name: 'Fast Tackle Stiletto',
    description: 'High-speed interceptor for fast tackle',
    fitting_data: {
      ship_type_id: 11134,
      modules: [
        { type_id: 2456, slot_type: 'high', quantity: 1 },
        { type_id: 1978, slot_type: 'med', quantity: 1 },
      ]
    },
    career_path: 'pvp',
    tags: ['interceptor', 'tackle'],
    is_public: true,
    performance_data: {
      dps: 45.2,
      ehp: 2180,
      speed: 4250,
      cost_estimate: 12500000
    }
  }
]

/**
 * Clear existing data
 */
async function clearData() {
  console.log('🧹 Clearing existing data...')
  
  try {
    await sql.begin(async sql => {
      await sql`DELETE FROM skill_plans`
      await sql`DELETE FROM fittings`
      await sql`DELETE FROM character_skills`
      await sql`DELETE FROM characters`
      
      await sql`ALTER SEQUENCE characters_id_seq RESTART WITH 1`
      await sql`ALTER SEQUENCE character_skills_id_seq RESTART WITH 1`
      await sql`ALTER SEQUENCE fittings_id_seq RESTART WITH 1`
      await sql`ALTER SEQUENCE skill_plans_id_seq RESTART WITH 1`
    })
    
    console.log('✅ Data cleared successfully')
  } catch (error) {
    console.error('❌ Error clearing data:', error)
    throw error
  }
}

/**
 * Seed characters
 */
async function seedCharacters() {
  console.log('👤 Seeding characters...')
  
  try {
    const createdCharacters = []
    
    for (const character of sampleCharacters) {
      const result = await sql`
        INSERT INTO characters (
          eve_character_id, name, corporation_id, alliance_id, wallet_balance,
          location_id, location_name, security_status, birthday, last_login
        )
        VALUES (
          ${character.eve_character_id}, ${character.name}, ${character.corporation_id},
          ${character.alliance_id}, ${character.wallet_balance}, ${character.location_id},
          ${character.location_name}, ${character.security_status}, ${character.birthday},
          ${character.last_login}
        )
        RETURNING *
      `
      
      createdCharacters.push(result[0])
      console.log(`  ✅ Created character: ${character.name}`)
    }
    
    return createdCharacters
  } catch (error) {
    console.error('❌ Error seeding characters:', error)
    throw error
  }
}

/**
 * Main seeding function
 */
async function seedDatabase() {
  console.log('🌱 Starting database seeding...')
  
  try {
    await clearData()
    const characters = await seedCharacters()
    
    // Seed skills for first character
    if (characters.length > 0) {
      const characterId = characters[0].id
      
      for (const skill of sampleSkills) {
        await sql`
          INSERT INTO character_skills (
            character_id, skill_type_id, trained_skill_level,
            skillpoints_in_skill, active_skill_level
          )
          VALUES (
            ${characterId}, ${skill.skill_type_id}, ${skill.trained_skill_level},
            ${skill.skillpoints_in_skill}, ${skill.active_skill_level}
          )
        `
      }
      
      // Seed fittings
      for (const fitting of sampleFittings) {
        await sql`
          INSERT INTO fittings (
            character_id, ship_type_id, name, description, fitting_data,
            career_path, tags, is_public, performance_data
          )
          VALUES (
            ${characterId}, ${fitting.ship_type_id}, ${fitting.name}, ${fitting.description},
            ${fitting.fitting_data}, ${fitting.career_path}, ${fitting.tags},
            ${fitting.is_public}, ${fitting.performance_data}
          )
        `
      }
    }
    
    console.log('🎉 Database seeding completed successfully!')
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
