-- Migration: Update Athlete ID Format to Nepal Country Code
-- Date: 2025-07-15
-- Description: Changes athlete ID format from UUID to NP-XXXXXXX for Nepal country specificity

BEGIN;

-- First, backup existing athlete IDs and create a temporary column
ALTER TABLE players ADD COLUMN athlete_id_backup VARCHAR(50);
UPDATE players SET athlete_id_backup = athlete_id::text WHERE athlete_id IS NOT NULL;

-- Drop the existing constraint and index if they exist
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_athlete_id_key;
DROP INDEX IF EXISTS idx_players_athlete_id;

-- Change the athlete_id column type from UUID to VARCHAR
ALTER TABLE players 
ALTER COLUMN athlete_id TYPE VARCHAR(50) USING athlete_id::text;

-- Create new index for the varchar athlete_id
CREATE INDEX idx_players_athlete_id ON players(athlete_id);

-- Add unique constraint back
ALTER TABLE players ADD CONSTRAINT players_athlete_id_key UNIQUE(athlete_id);

-- Update the generate_athlete_id function to use Nepal country code
CREATE OR REPLACE FUNCTION generate_athlete_id()
RETURNS VARCHAR(20) AS $$
BEGIN
    -- Note: This function is maintained for compatibility but actual ID generation
    -- is now handled by the athleteIdGenerator service using alphanumeric format
    -- Format: NP + 6 alphanumeric characters = 8 characters total
    -- Example: NP3F7K2M (no sequential numbers, fully random alphanumeric)
    RETURN 'NP000000'; -- Placeholder - actual generation done by service
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining the new format
COMMENT ON FUNCTION generate_athlete_id() IS 
'Legacy function for Nepal-specific athlete IDs. 
Actual generation now handled by athleteIdGenerator service.
Format: NP + 6 alphanumeric characters = 8 characters total.
Example: NP3F7K2M
Uses non-ambiguous characters (excludes I, O, 0, 1).';

-- Update any existing athlete IDs if needed (optional - can be run separately)
-- This would update existing ATH codes to NP format, but should be done carefully
/*
DO $$
DECLARE
    update_count INTEGER;
BEGIN
    -- Count existing ATH format IDs
    SELECT COUNT(*) INTO update_count 
    FROM players 
    WHERE athlete_id LIKE 'ATH%';
    
    IF update_count > 0 THEN
        RAISE NOTICE 'Found % existing ATH-format athlete IDs. Manual migration may be needed.', update_count;
        
        -- Uncomment the following to actually update existing IDs:
        /*
        UPDATE players 
        SET athlete_id = 'NP' || SUBSTRING(athlete_id FROM 4)
        WHERE athlete_id LIKE 'ATH%';
        
        RAISE NOTICE 'Updated % athlete IDs from ATH to NP format', update_count;
        */
    ELSE
        RAISE NOTICE 'No existing ATH-format athlete IDs found.';
    END IF;
END $$;
*/

-- Add index for the new format if not exists
CREATE INDEX IF NOT EXISTS idx_players_athlete_id_np ON players(athlete_id) 
WHERE athlete_id LIKE 'NP%';

-- Update enhanced_athlete_flow migration references if needed
-- This ensures the enhanced athlete flow uses the new format
UPDATE registration_codes 
SET description = REPLACE(description, 'ATH-format', 'NP-format')
WHERE description LIKE '%ATH-format%';

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully updated athlete ID format to Nepal country code (NP).';
    RAISE NOTICE 'New athlete IDs will be generated in format: NP + 5 digits + 2 checksum = NP1234567';
    RAISE NOTICE 'Enhanced athleteIdGenerator service will handle checksum calculation.';
END $$;
