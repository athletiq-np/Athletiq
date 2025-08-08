-- =====================================================
-- ATHLETIQ RENAME PLAYER_ID TO ATHLETE_ID
-- Migration to rename player_id column to athlete_id
-- Version: 1.1
-- Date: July 2025
-- =====================================================

DO $$
BEGIN
	-- Only rename if legacy player_id column exists and athlete_id column does not
	IF EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name='players' AND column_name='player_id'
	) AND NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name='players' AND column_name='athlete_id'
	) THEN
		EXECUTE 'ALTER TABLE players RENAME COLUMN player_id TO athlete_id';
	END IF;
END $$;

-- Ensure index reflects athlete_id naming
DROP INDEX IF EXISTS idx_players_player_id;
CREATE INDEX IF NOT EXISTS idx_players_athlete_id ON players(athlete_id);

-- Update comment safely
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name='players' AND column_name='athlete_id'
	) THEN
		COMMENT ON COLUMN players.athlete_id IS 'Unique UUID identifier for the athlete, never changes';
	END IF;
END $$;
