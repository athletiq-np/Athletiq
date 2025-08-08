-- Migration: Update Athlete ID Format to Nepal Country Code
-- Date: 2025-07-15
-- Description: Changes athlete ID format from UUID to NP-XXXXXXX for Nepal country specificity

-- Wrapped logic (transaction handled by migration runner)

-- First, backup existing athlete IDs and create a temporary column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='players' AND column_name='athlete_id_backup'
    ) THEN
        EXECUTE 'ALTER TABLE players ADD COLUMN athlete_id_backup VARCHAR(50)';
        EXECUTE 'UPDATE players SET athlete_id_backup = athlete_id::text WHERE athlete_id IS NOT NULL';
    END IF;
END $$;

-- Drop the existing constraint and index if they exist
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_athlete_id_key;
DROP INDEX IF EXISTS idx_players_athlete_id;

-- Change the athlete_id column type from UUID to VARCHAR
DO $$
BEGIN
    -- Only alter type if it is still uuid
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='players' AND column_name='athlete_id' AND data_type='uuid'
    ) THEN
        EXECUTE 'ALTER TABLE players ALTER COLUMN athlete_id TYPE VARCHAR(50) USING athlete_id::text';
    END IF;
END $$;

-- Create new index for the varchar athlete_id
CREATE INDEX IF NOT EXISTS idx_players_athlete_id ON players(athlete_id);

-- Add unique constraint back
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name='players' AND constraint_name='players_athlete_id_key'
    ) THEN
        EXECUTE 'ALTER TABLE players ADD CONSTRAINT players_athlete_id_key UNIQUE(athlete_id)';
    END IF;
END $$;

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
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name='registration_codes'
    ) THEN
        EXECUTE 'UPDATE registration_codes SET description = REPLACE(description, ''ATH-format'', ''NP-format'') WHERE description LIKE ''%ATH-format%''';
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully updated athlete ID format to Nepal country code (NP).';
    RAISE NOTICE 'New athlete IDs will be generated in format: NP + 5 digits + 2 checksum = NP1234567';
    RAISE NOTICE 'Enhanced athleteIdGenerator service will handle checksum calculation.';
END $$;
