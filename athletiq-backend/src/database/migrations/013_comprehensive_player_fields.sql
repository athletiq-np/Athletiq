-- =====================================================
-- ATHLETIQ COMPREHENSIVE PLAYER FIELDS MIGRATION
-- Adding all fields from the comprehensive specification
-- Version: 1.0
-- Date: July 2025
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop and recreate players table with comprehensive fields
DO $$
BEGIN
    -- Backup existing players data if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'players') THEN
        -- Create backup table
        CREATE TABLE IF NOT EXISTS players_backup_20250714 AS SELECT * FROM players;
        
        -- Drop the existing table (cascade will handle foreign keys)
        DROP TABLE IF EXISTS players CASCADE;
    END IF;
END $$;

-- Create comprehensive players table
CREATE TABLE players (
    -- 1. Core Identification
    id SERIAL PRIMARY KEY,
    athlete_id UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    full_name_nepali VARCHAR(100),
    profile_photo_url VARCHAR(500),
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    date_of_birth DATE NOT NULL,
    nationality VARCHAR(50) DEFAULT 'Nepali',
    citizenship_no VARCHAR(20),
    grade VARCHAR(10) NOT NULL, -- e.g., '7', '8', '9', '10'
    section VARCHAR(5), -- e.g., 'A', 'B', 'C'

    -- 2. Contact & Guardian Info
    guardian_name VARCHAR(100) NOT NULL,
    relationship_to_player VARCHAR(20) NOT NULL CHECK (relationship_to_player IN ('Father', 'Mother', 'Guardian', 'Uncle', 'Aunt', 'Grandfather', 'Grandmother', 'Other')),
    guardian_phone VARCHAR(20) NOT NULL,
    guardian_email VARCHAR(255),
    address TEXT NOT NULL,
    province VARCHAR(50),
    district VARCHAR(50),
    municipality_or_rural_municipality VARCHAR(100),
    ward_no VARCHAR(10),

    -- 3. School Info
    school_id INTEGER NOT NULL,
    school_name VARCHAR(200), -- auto-populated
    school_code VARCHAR(20), -- auto-populated
    admission_no VARCHAR(50), -- school-side identifier
    enrollment_status VARCHAR(20) DEFAULT 'Active' CHECK (enrollment_status IN ('Active', 'Graduated', 'Left', 'Suspended', 'Transferred')),

    -- 4. Sports & Participation
    registered_sports JSONB DEFAULT '[]'::jsonb, -- Array: ['Football', 'Basketball', 'Athletics']
    primary_sport VARCHAR(50),
    player_position JSONB DEFAULT '{}'::jsonb, -- Object by sport: {"Football": ["Goalkeeper"], "Basketball": ["Point Guard"]}
    jersey_number JSONB DEFAULT '{}'::jsonb, -- Object by sport/season: {"Football": "10", "Basketball": "23"}
    team_ids JSONB DEFAULT '[]'::jsonb, -- Array of team IDs
    tournaments_participated JSONB DEFAULT '[]'::jsonb, -- Array of tournament IDs

    -- 5. Documents & Verification
    birth_certificate_url VARCHAR(500),
    citizenship_certificate_url VARCHAR(500),
    parent_national_id_url VARCHAR(500),
    photo_verified BOOLEAN DEFAULT FALSE,
    document_verified BOOLEAN DEFAULT FALSE,
    registration_method VARCHAR(20) DEFAULT 'By school' CHECK (registration_method IN ('By school', 'By guardian', 'Self-claimed')),
    verification_status VARCHAR(20) DEFAULT 'Pending' CHECK (verification_status IN ('Pending', 'Approved', 'Flagged', 'Rejected')),

    -- 6. Health & Consent
    blood_group VARCHAR(5),
    medical_conditions JSONB DEFAULT '[]'::jsonb, -- Array of conditions
    allergies JSONB DEFAULT '[]'::jsonb, -- Array of allergies
    emergency_contact VARCHAR(100), -- Name and Number
    parental_consent BOOLEAN DEFAULT FALSE,

    -- 7. Player Profile/Extras
    nickname VARCHAR(50),
    bio TEXT,
    achievements JSONB DEFAULT '[]'::jsonb, -- Array of achievements
    social_links JSONB DEFAULT '{}'::jsonb, -- Object: {"instagram": "@username", "facebook": "profile"}
    profile_completion INTEGER DEFAULT 0, -- Percentage 0-100

    -- 8. System & Analytics
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    last_login TIMESTAMP,
    active_status VARCHAR(20) DEFAULT 'Active' CHECK (active_status IN ('Active', 'Inactive', 'Suspended', 'Graduated')),
    profile_status VARCHAR(20) DEFAULT 'Incomplete' CHECK (profile_status IN ('Incomplete', 'Complete', 'Missing Docs', 'Flagged')),

    -- Constraints
    CONSTRAINT unique_player_per_school UNIQUE (full_name, date_of_birth, school_id),
    CONSTRAINT valid_age CHECK (date_of_birth > '1995-01-01' AND date_of_birth < CURRENT_DATE),
    CONSTRAINT valid_grade CHECK (grade IN ('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12')),
    CONSTRAINT valid_profile_completion CHECK (profile_completion >= 0 AND profile_completion <= 100),

    -- Foreign Keys
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_players_school_id ON players(school_id);
CREATE INDEX idx_players_athlete_id ON players(athlete_id);
CREATE INDEX idx_players_verification_status ON players(verification_status);
CREATE INDEX idx_players_active_status ON players(active_status);
CREATE INDEX idx_players_grade ON players(grade);
CREATE INDEX idx_players_primary_sport ON players(primary_sport);
CREATE INDEX idx_players_guardian_phone ON players(guardian_phone);
CREATE INDEX idx_players_created_at ON players(created_at);

-- Add GIN indexes for JSONB fields for efficient querying
CREATE INDEX idx_players_registered_sports ON players USING GIN (registered_sports);
CREATE INDEX idx_players_player_position ON players USING GIN (player_position);
CREATE INDEX idx_players_achievements ON players USING GIN (achievements);
CREATE INDEX idx_players_team_ids ON players USING GIN (team_ids);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_players_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    
    -- Auto-calculate profile completion percentage
    NEW.profile_completion = (
        CASE WHEN NEW.full_name IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN NEW.full_name_nepali IS NOT NULL THEN 5 ELSE 0 END +
        CASE WHEN NEW.profile_photo_url IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN NEW.date_of_birth IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN NEW.guardian_name IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN NEW.guardian_phone IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN NEW.address IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN NEW.birth_certificate_url IS NOT NULL THEN 15 ELSE 0 END +
        CASE WHEN NEW.registered_sports::text != '[]' THEN 10 ELSE 0 END +
        CASE WHEN NEW.primary_sport IS NOT NULL THEN 5 ELSE 0 END +
        CASE WHEN NEW.parental_consent = TRUE THEN 5 ELSE 0 END
    );
    
    -- Auto-update profile status based on completion
    IF NEW.profile_completion >= 80 AND NEW.document_verified = TRUE THEN
        NEW.profile_status = 'Complete';
    ELSIF NEW.profile_completion >= 50 THEN
        NEW.profile_status = 'Missing Docs';
    ELSE
        NEW.profile_status = 'Incomplete';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_players_updated_at
    BEFORE UPDATE ON players
    FOR EACH ROW
    EXECUTE FUNCTION update_players_updated_at();

-- Create trigger to auto-populate school info
CREATE OR REPLACE FUNCTION auto_populate_school_info()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-populate school_name and school_code from schools table
    SELECT name, school_code INTO NEW.school_name, NEW.school_code
    FROM schools 
    WHERE id = NEW.school_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_populate_school_info
    BEFORE INSERT OR UPDATE ON players
    FOR EACH ROW
    EXECUTE FUNCTION auto_populate_school_info();

-- Insert sample data for testing (optional)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM schools LIMIT 1) THEN
        INSERT INTO players (
            full_name, full_name_nepali, gender, date_of_birth, grade, section,
            guardian_name, relationship_to_player, guardian_phone, address,
            school_id, registered_sports, primary_sport, birth_certificate_url,
            parental_consent, created_by
        ) VALUES 
        (
            'Ram Bahadur Thapa', 'राम बहादुर थापा', 'Male', '2008-03-15', '10', 'A',
            'Gopal Thapa', 'Father', '+977-9841234567', 'Kathmandu, Nepal',
            (SELECT id FROM schools LIMIT 1), '["Football", "Athletics"]', 'Football',
            '/uploads/certificates/ram_birth_cert.pdf', TRUE,
            (SELECT id FROM users WHERE role = 'school_admin' LIMIT 1)
        ),
        (
            'Sita Kumari Poudel', 'सीता कुमारी पौडेल', 'Female', '2009-07-22', '9', 'B',
            'Krishna Poudel', 'Father', '+977-9851234567', 'Lalitpur, Nepal',
            (SELECT id FROM schools LIMIT 1), '["Basketball", "Volleyball"]', 'Basketball',
            '/uploads/certificates/sita_birth_cert.pdf', TRUE,
            (SELECT id FROM users WHERE role = 'school_admin' LIMIT 1)
        );
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors if sample data insertion fails
    RAISE NOTICE 'Sample data insertion skipped: %', SQLERRM;
END $$;

-- Add comments for documentation
COMMENT ON TABLE players IS 'Comprehensive player/athlete information table with all required fields for tournament registration and management';
COMMENT ON COLUMN players.athlete_id IS 'Unique UUID identifier for the athlete, never changes';
COMMENT ON COLUMN players.profile_completion IS 'Auto-calculated percentage of profile completion (0-100)';
COMMENT ON COLUMN players.registered_sports IS 'JSONB array of sports the player is registered for';
COMMENT ON COLUMN players.player_position IS 'JSONB object mapping sports to positions';
COMMENT ON COLUMN players.verification_status IS 'Document and identity verification status';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON players TO public;
GRANT USAGE, SELECT ON SEQUENCE players_id_seq TO public;

COMMIT;
