-- 003_fix_schema_and_add_enhancements.sql
-- Fix schema issues and add enhancements

-- First, let's check and create missing tables safely
DO $$
BEGIN
    -- Create users table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            user_id UUID DEFAULT uuid_generate_v4() UNIQUE,
            full_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL CHECK (role IN ('SuperAdmin', 'SchoolAdmin', 'Coach', 'Referee')),
            school_id INTEGER,
            is_active BOOLEAN DEFAULT TRUE,
            email_verified BOOLEAN DEFAULT FALSE,
            last_login TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;

    -- Create schools table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schools') THEN
        CREATE TABLE schools (
            id SERIAL PRIMARY KEY,
            school_id UUID DEFAULT uuid_generate_v4() UNIQUE,
            school_code VARCHAR(20) UNIQUE NOT NULL,
            name VARCHAR(200) NOT NULL,
            address TEXT NOT NULL,
            country VARCHAR(100) DEFAULT 'Nepal',
            province VARCHAR(100),
            district VARCHAR(100),
            city VARCHAR(100),
            ward VARCHAR(10),
            phone VARCHAR(20),
            email VARCHAR(255),
            website VARCHAR(255),
            principal_name VARCHAR(100),
            admin_user_id INTEGER,
            onboarding_status VARCHAR(20) DEFAULT 'pending' CHECK (onboarding_status IN ('pending', 'completed', 'verified')),
            is_active BOOLEAN DEFAULT TRUE,
            logo_url VARCHAR(500),
            registration_number VARCHAR(50),
            school_type VARCHAR(50) CHECK (school_type IN ('Public', 'Private', 'Community')),
            established_year INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;

    -- Create players table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'players') THEN
        CREATE TABLE players (
            id SERIAL PRIMARY KEY,
            player_id UUID DEFAULT uuid_generate_v4() UNIQUE,
            player_code VARCHAR(20) UNIQUE NOT NULL,
            full_name VARCHAR(100) NOT NULL,
            full_name_nepali VARCHAR(100),
            date_of_birth DATE NOT NULL,
            gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
            school_id INTEGER NOT NULL,
            profile_photo_url VARCHAR(500),
            birth_cert_url VARCHAR(500),
            guardian_name VARCHAR(100),
            guardian_phone VARCHAR(20),
            guardian_email VARCHAR(255),
            address TEXT,
            blood_group VARCHAR(5),
            medical_conditions TEXT,
            emergency_contact VARCHAR(20),
            is_active BOOLEAN DEFAULT TRUE,
            verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
            created_by INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            CONSTRAINT unique_player_per_school UNIQUE (full_name, date_of_birth, school_id),
            CONSTRAINT valid_age CHECK (date_of_birth > '1995-01-01' AND date_of_birth < CURRENT_DATE)
        );
    END IF;

    -- Create teams table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teams') THEN
        CREATE TABLE teams (
            id SERIAL PRIMARY KEY,
            team_id UUID DEFAULT uuid_generate_v4() UNIQUE,
            team_code VARCHAR(20) UNIQUE,
            name VARCHAR(100) NOT NULL,
            sport VARCHAR(50) NOT NULL,
            coach_name VARCHAR(100),
            coach_phone VARCHAR(20),
            coach_email VARCHAR(255),
            school_id INTEGER NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            max_players INTEGER DEFAULT 25,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            CONSTRAINT unique_team_per_school_sport UNIQUE (name, sport, school_id)
        );
    END IF;

    -- Create matches table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'matches') THEN
        CREATE TABLE matches (
            id SERIAL PRIMARY KEY,
            match_id UUID DEFAULT uuid_generate_v4() UNIQUE,
            match_code VARCHAR(20) UNIQUE NOT NULL,
            tournament_id INTEGER NOT NULL,
            sport_category_id INTEGER,
            round INTEGER DEFAULT 1,
            match_number INTEGER,
            home_team_id INTEGER,
            away_team_id INTEGER,
            venue VARCHAR(200),
            scheduled_at TIMESTAMP,
            started_at TIMESTAMP,
            ended_at TIMESTAMP,
            status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled', 'postponed')),
            home_score INTEGER DEFAULT 0,
            away_score INTEGER DEFAULT 0,
            winner_team_id INTEGER,
            match_type VARCHAR(20) DEFAULT 'regular' CHECK (match_type IN ('regular', 'playoff', 'final', 'third_place')),
            referee_id INTEGER,
            notes TEXT,
            weather_conditions VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            CHECK (home_team_id != away_team_id),
            CHECK (ended_at >= started_at OR ended_at IS NULL),
            CHECK (scheduled_at > '2020-01-01' OR status = 'completed')
        );
    END IF;
END $$;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add enhanced columns to existing tables
DO $$
BEGIN
    -- Add columns to users table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'organization_id') THEN
        ALTER TABLE users ADD COLUMN organization_id INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'google_id') THEN
        ALTER TABLE users ADD COLUMN google_id VARCHAR(100) UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') THEN
        ALTER TABLE users ADD COLUMN phone VARCHAR(20) UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'two_factor_enabled') THEN
        ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profile_photo_url') THEN
        ALTER TABLE users ADD COLUMN profile_photo_url VARCHAR(500);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'timezone') THEN
        ALTER TABLE users ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'notification_preferences') THEN
        ALTER TABLE users ADD COLUMN notification_preferences JSONB DEFAULT '{}';
    END IF;

    -- Add columns to schools table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schools' AND column_name = 'organization_id') THEN
        ALTER TABLE schools ADD COLUMN organization_id INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schools' AND column_name = 'latitude') THEN
        ALTER TABLE schools ADD COLUMN latitude DECIMAL(10, 8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schools' AND column_name = 'longitude') THEN
        ALTER TABLE schools ADD COLUMN longitude DECIMAL(11, 8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schools' AND column_name = 'verification_status') THEN
        ALTER TABLE schools ADD COLUMN verification_status VARCHAR(20) DEFAULT 'pending';
    END IF;

    -- Add columns to players table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'athlete_id') THEN
        ALTER TABLE players ADD COLUMN athlete_id VARCHAR(20) UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'nationality') THEN
        ALTER TABLE players ADD COLUMN nationality VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'height_cm') THEN
        ALTER TABLE players ADD COLUMN height_cm INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'weight_kg') THEN
        ALTER TABLE players ADD COLUMN weight_kg DECIMAL(5,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'eligibility_status') THEN
        ALTER TABLE players ADD COLUMN eligibility_status VARCHAR(20) DEFAULT 'pending';
    END IF;
END $$;

-- Create new enhanced tables
CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    organization_id UUID DEFAULT uuid_generate_v4() UNIQUE,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('federation', 'league', 'district', 'province', 'national', 'international')),
    country VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en',
    currency VARCHAR(3) DEFAULT 'USD',
    settings JSONB DEFAULT '{}',
    subscription_plan VARCHAR(50) DEFAULT 'free',
    subscription_status VARCHAR(20) DEFAULT 'active',
    subscription_expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_uploads (
    id SERIAL PRIMARY KEY,
    document_id UUID DEFAULT uuid_generate_v4() UNIQUE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    ocr_text TEXT,
    extracted_data JSONB,
    ai_analysis JSONB,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'requires_review')),
    verified_by INTEGER,
    verified_at TIMESTAMP,
    rejection_reason TEXT,
    uploaded_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_processing_queue (
    id SERIAL PRIMARY KEY,
    job_id UUID DEFAULT uuid_generate_v4() UNIQUE,
    job_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    priority INTEGER DEFAULT 5,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    result JSONB,
    error_message TEXT,
    processing_started_at TIMESTAMP,
    processing_completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    log_id UUID DEFAULT uuid_generate_v4() UNIQUE,
    user_id INTEGER,
    organization_id INTEGER,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    notification_id UUID DEFAULT uuid_generate_v4() UNIQUE,
    user_id INTEGER NOT NULL,
    organization_id INTEGER,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    delivery_method VARCHAR(20) DEFAULT 'in_app' CHECK (delivery_method IN ('in_app', 'email', 'sms', 'push')),
    scheduled_for TIMESTAMP,
    sent_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    event_id UUID DEFAULT uuid_generate_v4() UNIQUE,
    user_id INTEGER,
    organization_id INTEGER,
    session_id VARCHAR(100),
    event_type VARCHAR(50) NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    properties JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    platform VARCHAR(20),
    version VARCHAR(20)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_schools_organization ON schools(organization_id);
CREATE INDEX IF NOT EXISTS idx_players_school ON players(school_id);
CREATE INDEX IF NOT EXISTS idx_players_athlete_id ON players(athlete_id);
CREATE INDEX IF NOT EXISTS idx_document_uploads_entity ON document_uploads(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_queue_status ON ai_processing_queue(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_schools_updated_at') THEN
        CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_players_updated_at') THEN
        CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_teams_updated_at') THEN
        CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_organizations_updated_at') THEN
        CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_document_uploads_updated_at') THEN
        CREATE TRIGGER update_document_uploads_updated_at BEFORE UPDATE ON document_uploads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_ai_processing_queue_updated_at') THEN
        CREATE TRIGGER update_ai_processing_queue_updated_at BEFORE UPDATE ON ai_processing_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create sequence for global athlete IDs
CREATE SEQUENCE IF NOT EXISTS athlete_id_seq START 1000000;

-- Function to generate athlete IDs
CREATE OR REPLACE FUNCTION generate_athlete_id()
RETURNS VARCHAR(20) AS $$
BEGIN
    RETURN 'ATH' || LPAD(nextval('athlete_id_seq')::TEXT, 7, '0');
END;
$$ LANGUAGE plpgsql;

-- Add foreign key constraints safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_users_organization') THEN
        ALTER TABLE users ADD CONSTRAINT fk_users_organization FOREIGN KEY (organization_id) REFERENCES organizations(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_schools_organization') THEN
        ALTER TABLE schools ADD CONSTRAINT fk_schools_organization FOREIGN KEY (organization_id) REFERENCES organizations(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_players_school') THEN
        ALTER TABLE players ADD CONSTRAINT fk_players_school FOREIGN KEY (school_id) REFERENCES schools(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_teams_school') THEN
        ALTER TABLE teams ADD CONSTRAINT fk_teams_school FOREIGN KEY (school_id) REFERENCES schools(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_document_uploads_user') THEN
        ALTER TABLE document_uploads ADD CONSTRAINT fk_document_uploads_user FOREIGN KEY (uploaded_by) REFERENCES users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_notifications_user') THEN
        ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_audit_logs_user') THEN
        ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id);
    END IF;
END $$;

-- Update existing players with athlete IDs
UPDATE players SET athlete_id = generate_athlete_id() WHERE athlete_id IS NULL;
