-- =====================================================
-- ATHLETIQ RENAME PLAYER_ID TO ATHLETE_ID
-- Migration to rename player_id column to athlete_id
-- Version: 1.1
-- Date: July 2025
-- =====================================================

-- Rename the column from player_id to athlete_id
ALTER TABLE players RENAME COLUMN player_id TO athlete_id;

-- Update the index name
DROP INDEX IF EXISTS idx_players_player_id;
CREATE INDEX idx_players_athlete_id ON players(athlete_id);

-- Update comments
COMMENT ON COLUMN players.athlete_id IS 'Unique UUID identifier for the athlete, never changes';

-- Commit the changes
COMMIT;
