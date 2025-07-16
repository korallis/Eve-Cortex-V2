-- Migration: Create Character Skills Table
-- Created: 2024-01-01T00:00:00Z
-- Requirements: 7.1, 7.2 - Database setup with character skills storage

-- Create character_skills table with foreign key relationships
CREATE TABLE character_skills (
  id SERIAL PRIMARY KEY,
  character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  skill_type_id INTEGER NOT NULL,
  trained_skill_level INTEGER NOT NULL CHECK (trained_skill_level >= 0 AND trained_skill_level <= 5),
  skillpoints_in_skill BIGINT NOT NULL CHECK (skillpoints_in_skill >= 0),
  active_skill_level INTEGER NOT NULL CHECK (active_skill_level >= 0 AND active_skill_level <= 5),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure unique combination of character and skill
  UNIQUE(character_id, skill_type_id)
);

-- Add indexes for performance optimization
CREATE INDEX idx_character_skills_character_id ON character_skills(character_id);
CREATE INDEX idx_character_skills_skill_type_id ON character_skills(skill_type_id);
CREATE INDEX idx_character_skills_trained_level ON character_skills(trained_skill_level);
CREATE INDEX idx_character_skills_active_level ON character_skills(active_skill_level);
CREATE INDEX idx_character_skills_updated_at ON character_skills(updated_at);

-- Composite index for common queries
CREATE INDEX idx_character_skills_char_skill ON character_skills(character_id, skill_type_id);

-- Add comments for documentation
COMMENT ON TABLE character_skills IS 'Character skill levels and skillpoints from ESI API';
COMMENT ON COLUMN character_skills.character_id IS 'Reference to characters table';
COMMENT ON COLUMN character_skills.skill_type_id IS 'EVE skill type ID from SDE';
COMMENT ON COLUMN character_skills.trained_skill_level IS 'Trained skill level (0-5)';
COMMENT ON COLUMN character_skills.skillpoints_in_skill IS 'Total skillpoints invested in this skill';
COMMENT ON COLUMN character_skills.active_skill_level IS 'Active skill level (may differ from trained due to implants)';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_character_skills_updated_at 
  BEFORE UPDATE ON character_skills 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();