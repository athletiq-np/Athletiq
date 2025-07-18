-- Migration: Add guardian_id foreign key to players table
-- This links players to the guardians table for proper guardian-athlete relationships

-- Add guardian_id column to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS guardian_id INTEGER;

-- Add foreign key constraint
ALTER TABLE players ADD CONSTRAINT fk_players_guardian_id 
FOREIGN KEY (guardian_id) REFERENCES guardians(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_players_guardian_id ON players(guardian_id);

-- Add column to track Nepal Athlete ID assignment
ALTER TABLE players ADD COLUMN IF NOT EXISTS nepal_athlete_id VARCHAR(20) UNIQUE;

-- Add index for Nepal Athlete ID
CREATE INDEX IF NOT EXISTS idx_players_nepal_athlete_id ON players(nepal_athlete_id);

-- Update registration_method to include guardian registration
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_registration_method_check;
ALTER TABLE players ADD CONSTRAINT players_registration_method_check 
CHECK (registration_method IN ('By school', 'By guardian', 'Self-claimed'));

-- Update verification_status to include proper workflow states
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_verification_status_check;
ALTER TABLE players ADD CONSTRAINT players_verification_status_check 
CHECK (verification_status IN ('Pending', 'Approved', 'Flagged', 'Rejected', 'pending_approval', 'verified'));

-- Add created_by_guardian column to track who created the record
ALTER TABLE players ADD COLUMN IF NOT EXISTS created_by_guardian INTEGER;
ALTER TABLE players ADD CONSTRAINT fk_players_created_by_guardian 
FOREIGN KEY (created_by_guardian) REFERENCES guardians(id) ON DELETE SET NULL;

-- Comments for clarity
COMMENT ON COLUMN players.guardian_id IS 'Links to guardians table - the guardian who manages this athlete';
COMMENT ON COLUMN players.nepal_athlete_id IS 'Official Nepal Athlete ID assigned when verification_status becomes verified';
COMMENT ON COLUMN players.created_by_guardian IS 'Guardian who initially created this athlete record (for audit trail)';
