-- =====================================================
-- ATHLETIQ TEAMS AND PLAYERS MANAGEMENT SYSTEM
-- Database Migration for Team Management Features
-- Version: 1.0
-- Date: January 2025
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SECTION 1: TEAMS MANAGEMENT SYSTEM
-- =====================================================

-- School Teams Table
CREATE TABLE IF NOT EXISTS school_teams (
    id SERIAL PRIMARY KEY,
    team_id UUID DEFAULT uuid_generate_v4() UNIQUE,
    school_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    sport VARCHAR(50) NOT NULL,
    sport_category VARCHAR(50), -- 'boys', 'girls', 'mixed', 'junior', 'senior'
    age_group VARCHAR(20), -- 'u12', 'u14', 'u16', 'u18', 'open'
    season VARCHAR(20), -- '2024-2025', 'spring-2025'
    max_players INTEGER DEFAULT 11,
    min_players INTEGER DEFAULT 7,
    coach_id INTEGER, -- Staff member who coaches this team
    assistant_coach_id INTEGER,
    team_captain_id INTEGER, -- Player who is team captain
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'disbanded')),
    formation VARCHAR(20), -- '4-4-2', '3-5-2' for football teams
    home_colors JSONB, -- {"primary": "#ff0000", "secondary": "#ffffff"}
    away_colors JSONB,
    team_logo_url VARCHAR(500),
    achievements JSONB, -- Array of achievements and awards
    statistics JSONB, -- Win/loss records, goals scored, etc.
    notes TEXT,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (coach_id) REFERENCES users(id),
    FOREIGN KEY (assistant_coach_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE(school_id, name, sport, season)
);

-- Team Players Junction Table
CREATE TABLE IF NOT EXISTS team_players (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    jersey_number INTEGER,
    position VARCHAR(50), -- 'Goalkeeper', 'Defender', 'Midfielder', 'Forward'
    position_code VARCHAR(10), -- 'GK', 'DF', 'MF', 'FW'
    is_starter BOOLEAN DEFAULT FALSE,
    is_captain BOOLEAN DEFAULT FALSE,
    is_vice_captain BOOLEAN DEFAULT FALSE,
    date_joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_left TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'injured', 'suspended', 'transferred', 'inactive')),
    player_stats JSONB, -- Goals, assists, cards, etc.
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES school_teams(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    UNIQUE(team_id, player_id),
    UNIQUE(team_id, jersey_number) -- No duplicate jersey numbers per team
);

-- Add team captain foreign key after team_players table is created
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'school_teams_team_captain_id_fkey'
    ) THEN
        ALTER TABLE school_teams 
        ADD CONSTRAINT school_teams_team_captain_id_fkey 
        FOREIGN KEY (team_captain_id) REFERENCES team_players(id);
    END IF;
END $$;

-- =====================================================
-- SECTION 2: SPORTS CONFIGURATION
-- =====================================================

-- Sports Configuration Table
CREATE TABLE IF NOT EXISTS sports_config (
    id SERIAL PRIMARY KEY,
    sport_code VARCHAR(20) UNIQUE NOT NULL,
    sport_name VARCHAR(100) NOT NULL,
    category VARCHAR(50), -- 'team', 'individual', 'relay'
    max_players_per_team INTEGER DEFAULT 11,
    min_players_per_team INTEGER DEFAULT 7,
    substitute_players INTEGER DEFAULT 7,
    positions JSONB, -- Array of valid positions for this sport
    equipment_required JSONB, -- Array of required equipment
    match_duration INTEGER, -- Minutes
    scoring_system VARCHAR(50), -- 'goals', 'points', 'time', 'distance'
    tournament_format JSONB, -- Default tournament formats for this sport
    rules_summary TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default sports configurations
INSERT INTO sports_config (sport_code, sport_name, category, max_players_per_team, min_players_per_team, substitute_players, positions, match_duration, scoring_system) VALUES
('football', 'Football (Soccer)', 'team', 11, 7, 7, 
 '["Goalkeeper", "Centre-back", "Full-back", "Wing-back", "Defensive midfielder", "Central midfielder", "Attacking midfielder", "Winger", "Striker", "Centre-forward"]', 
 90, 'goals'),
('basketball', 'Basketball', 'team', 5, 5, 7, 
 '["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"]', 
 48, 'points'),
('volleyball', 'Volleyball', 'team', 6, 6, 6, 
 '["Setter", "Outside Hitter", "Middle Blocker", "Opposite Hitter", "Libero", "Defensive Specialist"]', 
 60, 'points'),
('athletics', 'Track & Field', 'individual', 20, 1, 0, 
 '["Sprinter", "Distance Runner", "Jumper", "Thrower", "Hurdler", "Relay Runner"]', 
 480, 'time'),
('swimming', 'Swimming', 'individual', 15, 1, 0, 
 '["Freestyle", "Backstroke", "Breaststroke", "Butterfly", "Individual Medley", "Relay"]', 
 240, 'time')
ON CONFLICT (sport_code) DO NOTHING;

-- =====================================================
-- SECTION 3: TEAM TOURNAMENT PARTICIPATION
-- =====================================================

-- Team Tournament Registrations
CREATE TABLE IF NOT EXISTS tournament_team_registrations (
    id SERIAL PRIMARY KEY,
    registration_id UUID DEFAULT uuid_generate_v4() UNIQUE,
    tournament_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    school_id INTEGER NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    squad_list JSONB, -- List of players selected for this tournament
    coach_details JSONB, -- Coach information for tournament
    medical_officer JSONB, -- Medical officer details if required
    equipment_checklist JSONB, -- Equipment verification
    fees_paid BOOLEAN DEFAULT FALSE,
    payment_reference VARCHAR(100),
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'withdrawn')),
    approved_by INTEGER,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    group_assignment VARCHAR(10), -- Tournament group (A, B, C, etc.)
    seed_position INTEGER, -- Seeding position in tournament
    special_requirements TEXT,
    emergency_contact JSONB,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES school_teams(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE(tournament_id, team_id)
);

-- =====================================================
-- SECTION 4: INDEXES FOR PERFORMANCE
-- =====================================================

-- School Teams Indexes
CREATE INDEX IF NOT EXISTS idx_school_teams_school_sport ON school_teams(school_id, sport);
CREATE INDEX IF NOT EXISTS idx_school_teams_status ON school_teams(status);
CREATE INDEX IF NOT EXISTS idx_school_teams_season ON school_teams(season);
CREATE INDEX IF NOT EXISTS idx_school_teams_coach ON school_teams(coach_id);

-- Team Players Indexes
CREATE INDEX IF NOT EXISTS idx_team_players_team ON team_players(team_id);
CREATE INDEX IF NOT EXISTS idx_team_players_player ON team_players(player_id);
CREATE INDEX IF NOT EXISTS idx_team_players_status ON team_players(status);
CREATE INDEX IF NOT EXISTS idx_team_players_position ON team_players(position);

-- Tournament Team Registrations Indexes
CREATE INDEX IF NOT EXISTS idx_tournament_team_reg_tournament ON tournament_team_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_team_reg_team ON tournament_team_registrations(team_id);
CREATE INDEX IF NOT EXISTS idx_tournament_team_reg_school ON tournament_team_registrations(school_id);
CREATE INDEX IF NOT EXISTS idx_tournament_team_reg_status ON tournament_team_registrations(approval_status);

-- =====================================================
-- SECTION 5: TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
DROP TRIGGER IF EXISTS update_school_teams_updated_at ON school_teams;
CREATE TRIGGER update_school_teams_updated_at 
    BEFORE UPDATE ON school_teams 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_players_updated_at ON team_players;
CREATE TRIGGER update_team_players_updated_at 
    BEFORE UPDATE ON team_players 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tournament_team_registrations_updated_at ON tournament_team_registrations;
CREATE TRIGGER update_tournament_team_registrations_updated_at 
    BEFORE UPDATE ON tournament_team_registrations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SECTION 6: SAMPLE DATA AND VIEWS
-- =====================================================

-- View for complete team information with player count
CREATE OR REPLACE VIEW team_overview AS
SELECT 
    st.id,
    st.team_id,
    st.school_id,
    s.name as school_name,
    st.name as team_name,
    st.sport,
    st.sport_category,
    st.age_group,
    st.season,
    st.status,
    COUNT(tp.player_id) as player_count,
    st.max_players,
    st.min_players,
    coach.full_name as coach_name,
    captain_player.full_name as captain_name,
    st.created_at
FROM school_teams st
LEFT JOIN schools s ON st.school_id = s.id
LEFT JOIN team_players tp ON st.id = tp.team_id AND tp.status = 'active'
LEFT JOIN users coach ON st.coach_id = coach.id
LEFT JOIN team_players captain_tp ON st.team_captain_id = captain_tp.id
LEFT JOIN players captain_player ON captain_tp.player_id = captain_player.id
GROUP BY st.id, s.name, coach.full_name, captain_player.full_name;

-- View for team roster with player details
CREATE OR REPLACE VIEW team_roster AS
SELECT 
    tp.team_id,
    st.name as team_name,
    st.sport,
    tp.player_id,
    p.full_name as player_name,
    p.class as grade,
    tp.jersey_number,
    tp.position,
    tp.is_starter,
    tp.is_captain,
    tp.is_vice_captain,
    tp.status as player_status,
    tp.date_joined,
    tp.player_stats
FROM team_players tp
JOIN school_teams st ON tp.team_id = st.id
JOIN players p ON tp.player_id = p.id
WHERE tp.status = 'active'
ORDER BY tp.team_id, tp.jersey_number;

COMMENT ON TABLE school_teams IS 'School sports teams with coach assignments and team configuration';
COMMENT ON TABLE team_players IS 'Junction table linking players to teams with position and role information';
COMMENT ON TABLE sports_config IS 'Configuration settings for different sports including positions and rules';
COMMENT ON TABLE tournament_team_registrations IS 'Team registrations for tournaments with squad lists and approval workflow';

-- Migration completion message
DO $$
BEGIN
    RAISE NOTICE 'Teams and Players Management System migration completed successfully!';
    RAISE NOTICE 'Created tables: school_teams, team_players, sports_config, tournament_team_registrations';
    RAISE NOTICE 'Created views: team_overview, team_roster';
    RAISE NOTICE 'Created indexes for optimal performance';
END $$;
