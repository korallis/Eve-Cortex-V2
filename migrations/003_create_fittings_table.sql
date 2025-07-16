-- Migration: Create Fittings Table
-- Created: 2024-01-01T00:00:00Z
-- Requirements: 7.1, 7.2 - Database setup with ship fitting data storage

-- Create fittings table with JSONB data storage
CREATE TABLE fittings (
  id SERIAL PRIMARY KEY,
  character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
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

-- Add indexes for performance optimization
CREATE INDEX idx_fittings_character_id ON fittings(character_id);
CREATE INDEX idx_fittings_ship_type_id ON fittings(ship_type_id);
CREATE INDEX idx_fittings_career_path ON fittings(career_path);
CREATE INDEX idx_fittings_is_public ON fittings(is_public);
CREATE INDEX idx_fittings_updated_at ON fittings(updated_at);

-- JSONB indexes for efficient querying
CREATE INDEX idx_fittings_fitting_data ON fittings USING GIN(fitting_data);
CREATE INDEX idx_fittings_performance_data ON fittings USING GIN(performance_data);

-- Array index for tags
CREATE INDEX idx_fittings_tags ON fittings USING GIN(tags);

-- Composite indexes for common queries
CREATE INDEX idx_fittings_char_ship ON fittings(character_id, ship_type_id);
CREATE INDEX idx_fittings_public_career ON fittings(is_public, career_path) WHERE is_public = TRUE;

-- Add comments for documentation
COMMENT ON TABLE fittings IS 'Ship fitting configurations with performance data';
COMMENT ON COLUMN fittings.character_id IS 'Reference to characters table';
COMMENT ON COLUMN fittings.ship_type_id IS 'EVE ship type ID from SDE';
COMMENT ON COLUMN fittings.name IS 'User-defined fitting name';
COMMENT ON COLUMN fittings.description IS 'Optional fitting description';
COMMENT ON COLUMN fittings.fitting_data IS 'JSONB data containing modules, rigs, and configuration';
COMMENT ON COLUMN fittings.career_path IS 'Career path this fitting is optimized for';
COMMENT ON COLUMN fittings.tags IS 'Array of tags for categorization';
COMMENT ON COLUMN fittings.is_public IS 'Whether this fitting is publicly visible';
COMMENT ON COLUMN fittings.performance_data IS 'JSONB data containing calculated performance metrics';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_fittings_updated_at 
  BEFORE UPDATE ON fittings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add check constraint for career_path
ALTER TABLE fittings ADD CONSTRAINT check_career_path 
  CHECK (career_path IN ('missions', 'pvp', 'mining', 'exploration', 'trading', 'industrial', 'general'));

-- Create function to validate fitting_data structure
CREATE OR REPLACE FUNCTION validate_fitting_data(data JSONB) 
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if required fields exist
  IF NOT (data ? 'modules' AND data ? 'ship_type_id') THEN
    RETURN FALSE;
  END IF;
  
  -- Check if modules is an array
  IF NOT (jsonb_typeof(data->'modules') = 'array') THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add check constraint for fitting_data structure
ALTER TABLE fittings ADD CONSTRAINT check_fitting_data_structure 
  CHECK (validate_fitting_data(fitting_data));