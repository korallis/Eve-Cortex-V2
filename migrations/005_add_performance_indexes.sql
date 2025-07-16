-- Migration: Add Performance Optimization Indexes
-- Created: 2024-01-01T00:00:00Z
-- Requirements: 7.1, 7.2 - Database performance optimization

-- Add partial indexes for common filtered queries
CREATE INDEX idx_characters_active_location ON characters(location_id) 
  WHERE location_id IS NOT NULL;

CREATE INDEX idx_characters_with_alliance ON characters(alliance_id) 
  WHERE alliance_id IS NOT NULL;

CREATE INDEX idx_fittings_public_recent ON fittings(created_at DESC) 
  WHERE is_public = TRUE;

CREATE INDEX idx_skill_plans_active_by_priority ON skill_plans(priority DESC, created_at DESC) 
  WHERE is_active = TRUE;

-- Add expression indexes for common calculations
CREATE INDEX idx_characters_name_lower ON characters(LOWER(name));
CREATE INDEX idx_fittings_name_lower ON fittings(LOWER(name));
CREATE INDEX idx_skill_plans_name_lower ON skill_plans(LOWER(name));

-- Add JSONB path indexes for common queries
CREATE INDEX idx_fittings_ship_type_from_data ON fittings((fitting_data->>'ship_type_id'));
CREATE INDEX idx_fittings_module_count ON fittings((jsonb_array_length(fitting_data->'modules')));

-- Performance indexes for skill plan queries
CREATE INDEX idx_skill_plans_completion_time ON skill_plans(estimated_completion_time) 
  WHERE estimated_completion_time IS NOT NULL;

CREATE INDEX idx_skill_plans_near_complete ON skill_plans(progress_percentage) 
  WHERE progress_percentage >= 90.00;

-- Add statistics collection for better query planning
ALTER TABLE characters ALTER COLUMN eve_character_id SET STATISTICS 1000;
ALTER TABLE character_skills ALTER COLUMN skill_type_id SET STATISTICS 1000;
ALTER TABLE fittings ALTER COLUMN ship_type_id SET STATISTICS 1000;
ALTER TABLE skill_plans ALTER COLUMN character_id SET STATISTICS 1000;

-- Create function to clean up old unused data
CREATE OR REPLACE FUNCTION cleanup_old_data() 
RETURNS void AS $$
BEGIN
  -- Clean up old fitting data (older than 1 year and not public)
  DELETE FROM fittings 
  WHERE created_at < NOW() - INTERVAL '1 year' 
    AND is_public = FALSE 
    AND updated_at < NOW() - INTERVAL '6 months';
  
  -- Clean up completed skill plans (older than 6 months)
  DELETE FROM skill_plans 
  WHERE progress_percentage = 100.00 
    AND updated_at < NOW() - INTERVAL '6 months';
  
  RAISE NOTICE 'Cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Add comments for maintenance functions
COMMENT ON FUNCTION cleanup_old_data() IS 'Removes old unused fitting and skill plan data';
COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function to update updated_at timestamps';
COMMENT ON FUNCTION validate_fitting_data(JSONB) IS 'Validates fitting_data JSONB structure';
COMMENT ON FUNCTION validate_skill_goals(JSONB) IS 'Validates skill goals JSONB structure';
COMMENT ON FUNCTION validate_training_queue(JSONB) IS 'Validates training queue JSONB structure';