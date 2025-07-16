-- Migration: Create Skill Plans Table
-- Created: 2024-01-01T00:00:00Z
-- Requirements: 7.1, 7.2 - Database setup with skill planning data storage

-- Create skill_plans table for training optimization
CREATE TABLE skill_plans (
  id SERIAL PRIMARY KEY,
  character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  goals JSONB NOT NULL,
  training_queue JSONB NOT NULL,
  estimated_completion_time BIGINT,
  priority INTEGER DEFAULT 0,
  career_path VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance optimization
CREATE INDEX idx_skill_plans_character_id ON skill_plans(character_id);
CREATE INDEX idx_skill_plans_career_path ON skill_plans(career_path);
CREATE INDEX idx_skill_plans_is_active ON skill_plans(is_active);
CREATE INDEX idx_skill_plans_priority ON skill_plans(priority);
CREATE INDEX idx_skill_plans_updated_at ON skill_plans(updated_at);

-- JSONB indexes for efficient querying
CREATE INDEX idx_skill_plans_goals ON skill_plans USING GIN(goals);
CREATE INDEX idx_skill_plans_training_queue ON skill_plans USING GIN(training_queue);

-- Composite indexes for common queries
CREATE INDEX idx_skill_plans_char_active ON skill_plans(character_id, is_active);
CREATE INDEX idx_skill_plans_char_career ON skill_plans(character_id, career_path);
CREATE INDEX idx_skill_plans_priority_active ON skill_plans(priority, is_active) WHERE is_active = TRUE;

-- Add comments for documentation
COMMENT ON TABLE skill_plans IS 'Character skill training plans and progress tracking';
COMMENT ON COLUMN skill_plans.character_id IS 'Reference to characters table';
COMMENT ON COLUMN skill_plans.name IS 'User-defined skill plan name';
COMMENT ON COLUMN skill_plans.description IS 'Optional skill plan description';
COMMENT ON COLUMN skill_plans.goals IS 'JSONB data containing skill goals and targets';
COMMENT ON COLUMN skill_plans.training_queue IS 'JSONB data containing ordered skill training queue';
COMMENT ON COLUMN skill_plans.estimated_completion_time IS 'Estimated completion time in seconds';
COMMENT ON COLUMN skill_plans.priority IS 'Priority level (higher number = higher priority)';
COMMENT ON COLUMN skill_plans.career_path IS 'Career path this skill plan supports';
COMMENT ON COLUMN skill_plans.is_active IS 'Whether this skill plan is currently active';
COMMENT ON COLUMN skill_plans.progress_percentage IS 'Completion percentage (0-100)';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_skill_plans_updated_at 
  BEFORE UPDATE ON skill_plans 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add check constraint for career_path
ALTER TABLE skill_plans ADD CONSTRAINT check_skill_plans_career_path 
  CHECK (career_path IN ('missions', 'pvp', 'mining', 'exploration', 'trading', 'industrial', 'general'));

-- Add check constraint for progress_percentage
ALTER TABLE skill_plans ADD CONSTRAINT check_progress_percentage 
  CHECK (progress_percentage >= 0.00 AND progress_percentage <= 100.00);

-- Create function to validate goals structure
CREATE OR REPLACE FUNCTION validate_skill_goals(data JSONB) 
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if goals is an array
  IF NOT (jsonb_typeof(data) = 'array') THEN
    RETURN FALSE;
  END IF;
  
  -- Check each goal has required fields
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(data) AS goal
    WHERE NOT (goal ? 'skill_type_id' AND goal ? 'target_level')
  ) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate training_queue structure
CREATE OR REPLACE FUNCTION validate_training_queue(data JSONB) 
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if training_queue is an array
  IF NOT (jsonb_typeof(data) = 'array') THEN
    RETURN FALSE;
  END IF;
  
  -- Check each queue item has required fields
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(data) AS item
    WHERE NOT (item ? 'skill_type_id' AND item ? 'target_level' AND item ? 'training_time')
  ) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add check constraints for data structure
ALTER TABLE skill_plans ADD CONSTRAINT check_goals_structure 
  CHECK (validate_skill_goals(goals));

ALTER TABLE skill_plans ADD CONSTRAINT check_training_queue_structure 
  CHECK (validate_training_queue(training_queue));