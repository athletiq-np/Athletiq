-- Migration: Create live match tracking tables
-- File: migrations/create_live_match_tables.sql

-- Matches table (enhanced with live tracking fields)
CREATE TABLE IF NOT EXISTS matches (
    id VARCHAR(50) PRIMARY KEY,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    team1_id INTEGER,
    team2_id INTEGER,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    venue VARCHAR(255),
    status VARCHAR(20) DEFAULT 'scheduled',
    score JSONB DEFAULT '{"team1": 0, "team2": 0}',
    elapsed_time INTEGER DEFAULT 0,
    additional_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table (if not exists)
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    logo TEXT,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    sport_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match Events table
CREATE TABLE IF NOT EXISTS match_events (
    id VARCHAR(50) PRIMARY KEY,
    match_id VARCHAR(50) NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    minute INTEGER NOT NULL,
    description TEXT NOT NULL,
    player_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
    team_id INTEGER,
    additional_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match Comments table
CREATE TABLE IF NOT EXISTS match_comments (
    id VARCHAR(50) PRIMARY KEY,
    match_id VARCHAR(50) NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match Likes table
CREATE TABLE IF NOT EXISTS match_likes (
    id SERIAL PRIMARY KEY,
    match_id VARCHAR(50) NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(match_id, user_id)
);

-- Match Followers table (for notifications)
CREATE TABLE IF NOT EXISTS match_followers (
    id SERIAL PRIMARY KEY,
    match_id VARCHAR(50) NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(match_id, user_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_scheduled_time ON matches(scheduled_time);

CREATE INDEX IF NOT EXISTS idx_match_events_match_id ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_match_events_minute ON match_events(minute);
CREATE INDEX IF NOT EXISTS idx_match_events_type ON match_events(type);

CREATE INDEX IF NOT EXISTS idx_match_comments_match_id ON match_comments(match_id);
CREATE INDEX IF NOT EXISTS idx_match_comments_created_at ON match_comments(created_at);

CREATE INDEX IF NOT EXISTS idx_match_likes_match_id ON match_likes(match_id);
CREATE INDEX IF NOT EXISTS idx_match_followers_match_id ON match_followers(match_id);
CREATE INDEX IF NOT EXISTS idx_match_followers_user_id ON match_followers(user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_matches_updated_at
    BEFORE UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION update_matches_updated_at();

-- Add constraints
ALTER TABLE matches ADD CONSTRAINT check_match_status 
    CHECK (status IN ('scheduled', 'live', 'halftime', 'finished', 'postponed', 'cancelled'));

ALTER TABLE match_events ADD CONSTRAINT check_event_type 
    CHECK (type IN ('goal', 'card', 'substitution', 'timeout', 'penalty', 'foul', 'corner', 'offside', 'halftime', 'fulltime'));

ALTER TABLE match_events ADD CONSTRAINT check_minute_range 
    CHECK (minute >= 0 AND minute <= 120);

-- Sample data for testing (optional)
INSERT INTO teams (name, logo, sport_type) VALUES 
    ('Team Alpha', '/logos/team-alpha.png', 'Football'),
    ('Team Beta', '/logos/team-beta.png', 'Football'),
    ('Team Gamma', '/logos/team-gamma.png', 'Basketball'),
    ('Team Delta', '/logos/team-delta.png', 'Basketball')
ON CONFLICT DO NOTHING;

-- Table comments
COMMENT ON TABLE matches IS 'Live match tracking with real-time updates';
COMMENT ON TABLE match_events IS 'Real-time events during matches (goals, cards, etc.)';
COMMENT ON TABLE match_comments IS 'Live user comments during matches';
COMMENT ON TABLE match_likes IS 'User likes for matches';
COMMENT ON TABLE match_followers IS 'Users following matches for notifications';

COMMENT ON COLUMN matches.status IS 'Current match status: scheduled, live, halftime, finished, postponed, cancelled';
COMMENT ON COLUMN matches.score IS 'JSON object containing team scores';
COMMENT ON COLUMN matches.elapsed_time IS 'Match elapsed time in minutes';
COMMENT ON COLUMN match_events.type IS 'Type of event: goal, card, substitution, etc.';
COMMENT ON COLUMN match_events.minute IS 'Minute when the event occurred (0-120)';
