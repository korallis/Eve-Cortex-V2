-- Migration: Create Characters Table
-- Created: 2024-01-01T00:00:00Z
-- Requirements: 7.1, 7.2 - Database setup with character data storage

-- Create characters table with proper indexes
CREATE TABLE characters (
  id SERIAL PRIMARY KEY,
  eve_character_id BIGINT UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  corporation_id BIGINT,
  alliance_id BIGINT,
  wallet_balance DECIMAL(15,2) DEFAULT 0.00,
  location_id BIGINT,
  location_name VARCHAR(255),
  security_status DECIMAL(3,2) DEFAULT 0.00,
  birthday TIMESTAMP,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance optimization
CREATE INDEX idx_characters_eve_character_id ON characters(eve_character_id);
CREATE INDEX idx_characters_corporation_id ON characters(corporation_id);
CREATE INDEX idx_characters_alliance_id ON characters(alliance_id);
CREATE INDEX idx_characters_name ON characters(name);
CREATE INDEX idx_characters_updated_at ON characters(updated_at);

-- Add comments for documentation
COMMENT ON TABLE characters IS 'EVE Online character data from ESI API';
COMMENT ON COLUMN characters.eve_character_id IS 'Unique EVE character ID from ESI';
COMMENT ON COLUMN characters.name IS 'Character name from EVE Online';
COMMENT ON COLUMN characters.corporation_id IS 'Corporation ID from EVE Online';
COMMENT ON COLUMN characters.alliance_id IS 'Alliance ID from EVE Online (nullable)';
COMMENT ON COLUMN characters.wallet_balance IS 'Current ISK balance';
COMMENT ON COLUMN characters.location_id IS 'Current location ID';
COMMENT ON COLUMN characters.security_status IS 'Character security status';
COMMENT ON COLUMN characters.birthday IS 'Character creation date';
COMMENT ON COLUMN characters.last_login IS 'Last login timestamp';