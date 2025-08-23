-- Create tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
    id SERIAL PRIMARY KEY,
    tournament_id UUID DEFAULT uuid_generate_v4() UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    sport VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    registration_deadline DATE,
    max_teams INTEGER,
    min_teams INTEGER DEFAULT 2,
    max_players_per_team INTEGER,
    location VARCHAR(200),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Nepal',
    organizer_id INTEGER,
    organizer_type VARCHAR(50) CHECK (organizer_type IN ('school', 'district', 'national', 'other')),
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('draft', 'upcoming', 'ongoing', 'completed', 'cancelled', 'postponed')),
    format VARCHAR(50) CHECK (format IN ('knockout', 'league', 'group_stage', 'round_robin', 'double_elimination')),
    rules TEXT,
    prize_details TEXT,
    entry_fee DECIMAL(10, 2) DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_dates CHECK (end_date >= start_date),
    CONSTRAINT valid_teams CHECK (max_teams >= min_teams AND min_teams >= 2)
);

-- Add foreign key to users table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE tournaments 
        ADD CONSTRAINT fk_tournaments_created_by 
        FOREIGN KEY (created_by) 
        REFERENCES users(id) 
        ON DELETE SET NULL;
        
        ALTER TABLE tournaments 
        ADD CONSTRAINT fk_tournaments_organizer 
        FOREIGN KEY (organizer_id) 
        REFERENCES users(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tournaments_sport ON tournaments(sport);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_dates ON tournaments(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_organizer ON tournaments(organizer_type, organizer_id);

-- Add comments for better documentation
COMMENT ON TABLE tournaments IS 'Stores information about sports tournaments';
COMMENT ON COLUMN tournaments.tournament_id IS 'Unique UUID identifier for the tournament';
COMMENT ON COLUMN tournaments.status IS 'Current status of the tournament: draft, upcoming, ongoing, completed, cancelled, or postponed';
COMMENT ON COLUMN tournaments.format IS 'Tournament format: knockout, league, group_stage, round_robin, or double_elimination';

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_tournaments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tournaments_updated_at
BEFORE UPDATE ON tournaments
FOR EACH ROW
EXECUTE FUNCTION update_tournaments_updated_at();
