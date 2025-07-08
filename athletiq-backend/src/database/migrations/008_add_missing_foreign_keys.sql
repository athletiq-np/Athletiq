-- 🔧 ATHLETIQ - Missing Foreign Key Constraints Migration
--
-- This migration adds missing foreign key constraints identified during
-- the database schema analysis to ensure proper referential integrity
--

-- Add missing foreign key from tournaments to users (created_by)
ALTER TABLE tournaments
ADD CONSTRAINT fk_tournaments_created_by
FOREIGN KEY (created_by) REFERENCES users(id)
ON DELETE SET NULL ON UPDATE NO ACTION;

-- Add missing foreign key from tournaments to users (organizer_id)
ALTER TABLE tournaments
ADD CONSTRAINT fk_tournaments_organizer
FOREIGN KEY (organizer_id) REFERENCES users(id)
ON DELETE SET NULL ON UPDATE NO ACTION;

-- Add missing foreign key from tournament_teams to tournaments
ALTER TABLE tournament_teams
ADD CONSTRAINT fk_tournament_teams_tournament
FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
ON DELETE CASCADE ON UPDATE NO ACTION;

-- Add missing foreign key from tournament_registrations to tournaments
ALTER TABLE tournament_registrations
ADD CONSTRAINT fk_tournament_registrations_tournament
FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
ON DELETE CASCADE ON UPDATE NO ACTION;

-- Add missing foreign key from tournament_audit_log to tournaments
ALTER TABLE tournament_audit_log
ADD CONSTRAINT fk_tournament_audit_log_tournament
FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
ON DELETE CASCADE ON UPDATE NO ACTION;

-- Add missing foreign key from tournament_audit_log to users
ALTER TABLE tournament_audit_log
ADD CONSTRAINT fk_tournament_audit_log_user
FOREIGN KEY (user_id) REFERENCES users(id)
ON DELETE SET NULL ON UPDATE NO ACTION;

-- Add missing foreign key from matches to tournaments
ALTER TABLE matches
ADD CONSTRAINT fk_matches_tournament
FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
ON DELETE CASCADE ON UPDATE NO ACTION;

-- Add winner_team_id column to matches if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'matches' AND column_name = 'winner_team_id') THEN
        ALTER TABLE matches ADD COLUMN winner_team_id INTEGER;
        ALTER TABLE matches ADD CONSTRAINT fk_matches_winner_team
        FOREIGN KEY (winner_team_id) REFERENCES tournament_teams(id)
        ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

-- Add home_score and away_score columns to matches if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'matches' AND column_name = 'home_score') THEN
        ALTER TABLE matches ADD COLUMN home_score INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'matches' AND column_name = 'away_score') THEN
        ALTER TABLE matches ADD COLUMN away_score INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add ended_at column to matches if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'matches' AND column_name = 'ended_at') THEN
        ALTER TABLE matches ADD COLUMN ended_at TIMESTAMP;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_sport ON tournaments(sport);
CREATE INDEX IF NOT EXISTS idx_tournaments_organizer ON tournaments(organizer_id);
CREATE INDEX IF NOT EXISTS idx_tournament_teams_status ON tournament_teams(registration_status);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_date ON tournament_registrations(registration_date);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_status ON matches(tournament_id, status);
CREATE INDEX IF NOT EXISTS idx_players_registration_status ON players(registration_status);

-- Add check constraints for status values
ALTER TABLE tournaments
ADD CONSTRAINT chk_tournament_status 
CHECK (status IN ('draft', 'pending', 'published', 'registration_open', 'registration_closed', 'active', 'completed', 'cancelled', 'archived'));

ALTER TABLE tournament_teams
ADD CONSTRAINT chk_tournament_team_status 
CHECK (registration_status IN ('pending', 'registered', 'rejected', 'withdrawn'));

ALTER TABLE players
ADD CONSTRAINT chk_player_registration_status 
CHECK (registration_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE matches
ADD CONSTRAINT chk_match_status 
CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'));

COMMENT ON TABLE tournaments IS 'Tournament management with enhanced status tracking and foreign key constraints';
COMMENT ON TABLE tournament_teams IS 'Team registrations for tournaments with proper referential integrity';
COMMENT ON TABLE tournament_audit_log IS 'Audit trail for tournament operations with user tracking';
COMMENT ON TABLE matches IS 'Tournament matches with score tracking and proper relationships';
