-- Initial database schema for Eve-Cortex
-- This migration creates the core tables for the application

-- Characters table
CREATE TABLE IF NOT EXISTS characters (
  id SERIAL PRIMARY KEY,
  eve_character_id BIGINT UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  corporation_id BIGINT,
  alliance_id BIGINT,
  wallet_balance DECIMAL(15,2) DEFAULT 0,
  location_id BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for characters
CREATE INDEX IF NOT EXISTS idx_characters_eve_id ON characters(eve_character_id);
CREATE INDEX IF NOT EXISTS idx_characters_corp ON characters(corporation_id);
CREATE INDEX IF NOT EXISTS idx_characters_alliance ON characters(alliance_id);

-- Character skills table
CREATE TABLE IF NOT EXISTS character_skills (
  id SERIAL PRIMARY KEY,
  character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
  skill_type_id INTEGER NOT NULL,
  trained_skill_level INTEGER NOT NULL CHECK (trained_skill_level >= 0 AND trained_skill_level <= 5),
  skillpoints_in_skill BIGINT NOT NULL DEFAULT 0,
  active_skill_level INTEGER NOT NULL CHECK (active_skill_level >= 0 AND active_skill_level <= 5),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(character_id, skill_type_id)
);

-- Create indexes for character_skills
CREATE INDEX IF NOT EXISTS idx_character_skills_char_id ON character_skills(character_id);
CREATE INDEX IF NOT EXISTS idx_character_skills_skill_type ON character_skills(skill_type_id);
CREATE INDEX IF NOT EXISTS idx_character_skills_level ON character_skills(trained_skill_level);

-- Ship fittings table
CREATE TABLE IF NOT EXISTS fittings (
  id SERIAL PRIMARY KEY,
  character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
  ship_type_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  fitting_data JSONB NOT NULL,
  career_path VARCHAR(50) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  performance_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for fittings
CREATE INDEX IF NOT EXISTS idx_fittings_char_id ON fittings(character_id);
CREATE INDEX IF NOT EXISTS idx_fittings_ship_type ON fittings(ship_type_id);
CREATE INDEX IF NOT EXISTS idx_fittings_career_path ON fittings(career_path);
CREATE INDEX IF NOT EXISTS idx_fittings_public ON fittings(is_public);
CREATE INDEX IF NOT EXISTS idx_fittings_tags ON fittings USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_fittings_data ON fittings USING GIN(fitting_data);

-- Skill plans table
CREATE TABLE IF NOT EXISTS skill_plans (
  id SERIAL PRIMARY KEY,
  character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  goals JSONB NOT NULL,
  training_queue JSONB NOT NULL,
  estimated_completion_time BIGINT,
  priority INTEGER DEFAULT 0,
  career_path VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for skill_plans
CREATE INDEX IF NOT EXISTS idx_skill_plans_char_id ON skill_plans(character_id);
CREATE INDEX IF NOT EXISTS idx_skill_plans_career_path ON skill_plans(career_path);
CREATE INDEX IF NOT EXISTS idx_skill_plans_priority ON skill_plans(priority);
CREATE INDEX IF NOT EXISTS idx_skill_plans_goals ON skill_plans USING GIN(goals);

-- Character assets table (for tracking items and locations)
CREATE TABLE IF NOT EXISTS character_assets (
  id SERIAL PRIMARY KEY,
  character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
  item_id BIGINT NOT NULL,
  type_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  location_id BIGINT NOT NULL,
  location_type VARCHAR(50) NOT NULL, -- 'station', 'structure', 'ship', etc.
  location_flag VARCHAR(50), -- 'Hangar', 'CargoHold', etc.
  is_singleton BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(character_id, item_id)
);

-- Create indexes for character_assets
CREATE INDEX IF NOT EXISTS idx_character_assets_char_id ON character_assets(character_id);
CREATE INDEX IF NOT EXISTS idx_character_assets_type_id ON character_assets(type_id);
CREATE INDEX IF NOT EXISTS idx_character_assets_location ON character_assets(location_id);
CREATE INDEX IF NOT EXISTS idx_character_assets_flag ON character_assets(location_flag);

-- Market data cache table
CREATE TABLE IF NOT EXISTS market_data (
  id SERIAL PRIMARY KEY,
  type_id INTEGER NOT NULL,
  region_id INTEGER NOT NULL,
  buy_price DECIMAL(15,2),
  sell_price DECIMAL(15,2),
  volume BIGINT DEFAULT 0,
  order_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(type_id, region_id)
);

-- Create indexes for market_data
CREATE INDEX IF NOT EXISTS idx_market_data_type_id ON market_data(type_id);
CREATE INDEX IF NOT EXISTS idx_market_data_region_id ON market_data(region_id);
CREATE INDEX IF NOT EXISTS idx_market_data_updated ON market_data(last_updated);
CREATE INDEX IF NOT EXISTS idx_market_data_prices ON market_data(buy_price, sell_price);

-- User sessions table for NextAuth
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type VARCHAR(255),
  scope VARCHAR(255),
  id_token TEXT,
  session_state VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  expires TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  email_verified TIMESTAMP,
  image VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires TIMESTAMP NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Create indexes for auth tables
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_character_skills_updated_at BEFORE UPDATE ON character_skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fittings_updated_at BEFORE UPDATE ON fittings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_skill_plans_updated_at BEFORE UPDATE ON skill_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_character_assets_updated_at BEFORE UPDATE ON character_assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();