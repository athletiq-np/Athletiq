-- Enhanced Athlete Flow Database Schema
-- Migration to support comprehensive athlete management system

-- 1. Add new columns to existing players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS guardian_contacts JSONB;
ALTER TABLE players ADD COLUMN IF NOT EXISTS medical_notes TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"profile_visible": true, "stats_visible": true, "contact_visible": false}';
ALTER TABLE players ADD COLUMN IF NOT EXISTS emergency_contact JSONB;
ALTER TABLE players ADD COLUMN IF NOT EXISTS claim_code VARCHAR(32) UNIQUE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS registration_method VARCHAR(50) DEFAULT 'school_admin';
ALTER TABLE players ADD COLUMN IF NOT EXISTS interested_sports JSONB DEFAULT '[]';
ALTER TABLE players ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE players ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(100);
ALTER TABLE players ADD COLUMN IF NOT EXISTS guardian_phone VARCHAR(20);
ALTER TABLE players ADD COLUMN IF NOT EXISTS guardian_email VARCHAR(255);
ALTER TABLE players ADD COLUMN IF NOT EXISTS address TEXT;

-- 2. Create athlete sport assignments table
CREATE TABLE IF NOT EXISTS athlete_sport_assignments (
    id SERIAL PRIMARY KEY,
    athlete_id VARCHAR(15) NOT NULL,
    sport_id INTEGER NOT NULL,
    age_group VARCHAR(10),
    team_id INTEGER,
    skill_level VARCHAR(20) DEFAULT 'Beginner',
    position VARCHAR(50),
    assigned_by INTEGER NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(athlete_id, sport_id),
    FOREIGN KEY (athlete_id) REFERENCES players(athlete_id) ON DELETE CASCADE,
    FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- 3. Create athlete transfers table
CREATE TABLE IF NOT EXISTS athlete_transfers (
    id SERIAL PRIMARY KEY,
    athlete_id VARCHAR(15) NOT NULL,
    current_school_id INTEGER NOT NULL,
    target_school_id INTEGER NOT NULL,
    transfer_reason TEXT NOT NULL,
    guardian_approval BOOLEAN DEFAULT FALSE,
    effective_date DATE,
    requested_by INTEGER NOT NULL,
    approved_by INTEGER,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES players(athlete_id) ON DELETE CASCADE,
    FOREIGN KEY (current_school_id) REFERENCES schools(id) ON DELETE RESTRICT,
    FOREIGN KEY (target_school_id) REFERENCES schools(id) ON DELETE RESTRICT,
    FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. Create registration codes table (for QR codes/invitation links)
CREATE TABLE IF NOT EXISTS registration_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    school_id INTEGER NOT NULL,
    code_type VARCHAR(20) DEFAULT 'registration', -- registration, invitation, claim
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    expires_at TIMESTAMP,
    created_by INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- 5. Create invitation codes table (similar but for specific invitations)
CREATE TABLE IF NOT EXISTS invitation_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    school_id INTEGER,
    event_id INTEGER,
    invited_by INTEGER NOT NULL,
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- 6. Create athlete stats table for comprehensive performance tracking
CREATE TABLE IF NOT EXISTS athlete_stats (
    id SERIAL PRIMARY KEY,
    athlete_id VARCHAR(15) NOT NULL,
    match_id INTEGER,
    tournament_id INTEGER,
    sport_id INTEGER NOT NULL,
    stat_type VARCHAR(50) NOT NULL, -- goals, assists, saves, etc.
    stat_value DECIMAL(10,2) NOT NULL,
    recorded_by INTEGER NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (athlete_id) REFERENCES players(athlete_id) ON DELETE CASCADE,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (sport_id) REFERENCES sports(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- 7. Create athlete achievements table
CREATE TABLE IF NOT EXISTS athlete_achievements (
    id SERIAL PRIMARY KEY,
    athlete_id VARCHAR(15) NOT NULL,
    achievement_type VARCHAR(50) NOT NULL, -- medal, certificate, milestone, etc.
    achievement_name VARCHAR(200) NOT NULL,
    achievement_description TEXT,
    tournament_id INTEGER,
    event_id INTEGER,
    awarded_date DATE DEFAULT CURRENT_DATE,
    certificate_url VARCHAR(500),
    verification_code VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES players(athlete_id) ON DELETE CASCADE,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE SET NULL
);

-- 8. Create athlete documents table for additional document management
CREATE TABLE IF NOT EXISTS athlete_documents (
    id SERIAL PRIMARY KEY,
    athlete_id VARCHAR(15) NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- birth_certificate, photo, medical, etc.
    document_name VARCHAR(200) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by INTEGER NOT NULL,
    ocr_extracted_data JSONB, -- Store OCR extracted information
    verified BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES players(athlete_id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- 9. Create notification preferences table
CREATE TABLE IF NOT EXISTS athlete_notifications (
    id SERIAL PRIMARY KEY,
    athlete_id VARCHAR(15) NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- sms, email, push
    contact_value VARCHAR(255) NOT NULL, -- phone number or email
    is_verified BOOLEAN DEFAULT FALSE,
    is_primary BOOLEAN DEFAULT FALSE,
    preferences JSONB DEFAULT '{"tournaments": true, "achievements": true, "team_updates": true}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (athlete_id) REFERENCES players(athlete_id) ON DELETE CASCADE
);

-- 10. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_athletes_athlete_id ON players(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athletes_school_id ON players(school_id);
CREATE INDEX IF NOT EXISTS idx_athletes_status ON players(status);
CREATE INDEX IF NOT EXISTS idx_athletes_claim_code ON players(claim_code);
CREATE INDEX IF NOT EXISTS idx_athlete_sport_assignments_athlete_id ON athlete_sport_assignments(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_sport_assignments_sport_id ON athlete_sport_assignments(sport_id);
CREATE INDEX IF NOT EXISTS idx_athlete_transfers_athlete_id ON athlete_transfers(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_transfers_status ON athlete_transfers(status);
CREATE INDEX IF NOT EXISTS idx_athlete_stats_athlete_id ON athlete_stats(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_stats_match_id ON athlete_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_athlete_achievements_athlete_id ON athlete_achievements(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_documents_athlete_id ON athlete_documents(athlete_id);

-- 11. Create updated trigger for athlete_sport_assignments
CREATE OR REPLACE FUNCTION update_athlete_assignment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_athlete_assignment_timestamp
    BEFORE UPDATE ON athlete_sport_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_athlete_assignment_timestamp();

-- 12. Create updated trigger for athlete_transfers
CREATE TRIGGER trigger_update_athlete_transfer_timestamp
    BEFORE UPDATE ON athlete_transfers
    FOR EACH ROW
    EXECUTE FUNCTION update_athlete_assignment_timestamp();

-- 13. Create function to generate claim codes
CREATE OR REPLACE FUNCTION generate_claim_code()
RETURNS VARCHAR(32) AS $$
DECLARE
    new_code VARCHAR(32);
    code_exists BOOLEAN;
BEGIN
    LOOP
        new_code := 'CLAIM' || TO_CHAR(EXTRACT(EPOCH FROM NOW()), 'FM999999999') || 
                   LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        
        SELECT EXISTS(SELECT 1 FROM players WHERE claim_code = new_code) INTO code_exists;
        
        IF NOT code_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- 14. Add trigger to auto-generate claim codes for new athletes
CREATE OR REPLACE FUNCTION auto_generate_claim_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.claim_code IS NULL AND NEW.registration_method != 'direct_registration' THEN
        NEW.claim_code := generate_claim_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_claim_code
    BEFORE INSERT ON players
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_claim_code();

-- 15. Create view for athlete summary
CREATE OR REPLACE VIEW athlete_summary AS
SELECT 
    p.athlete_id,
    p.full_name,
    p.date_of_birth,
    p.gender,
    p.class,
    p.status,
    p.profile_photo_url,
    s.name AS school_name,
    s.school_code,
    COUNT(DISTINCT asa.sport_id) AS sports_count,
    COUNT(DISTINCT aa.id) AS achievements_count,
    COUNT(DISTINCT ast.id) AS stats_records_count,
    p.created_at,
    p.updated_at
FROM players p
LEFT JOIN schools s ON p.school_id = s.id
LEFT JOIN athlete_sport_assignments asa ON p.athlete_id = asa.athlete_id AND asa.is_active = TRUE
LEFT JOIN athlete_achievements aa ON p.athlete_id = aa.athlete_id
LEFT JOIN athlete_stats ast ON p.athlete_id = ast.athlete_id
WHERE p.is_active = TRUE
GROUP BY p.athlete_id, p.full_name, p.date_of_birth, p.gender, p.class, p.status, 
         p.profile_photo_url, s.name, s.school_code, p.created_at, p.updated_at;

-- 16. Create function to check athlete eligibility
CREATE OR REPLACE FUNCTION check_athlete_eligibility(athlete_id_param VARCHAR(15))
RETURNS JSONB AS $$
DECLARE
    athlete_record RECORD;
    eligibility_result JSONB;
BEGIN
    SELECT * FROM players WHERE athlete_id = athlete_id_param INTO athlete_record;
    
    IF athlete_record IS NULL THEN
        RETURN '{"eligible": false, "reason": "Athlete not found"}'::JSONB;
    END IF;
    
    IF athlete_record.status != 'verified' THEN
        RETURN '{"eligible": false, "reason": "Athlete not verified"}'::JSONB;
    END IF;
    
    IF NOT athlete_record.is_active THEN
        RETURN '{"eligible": false, "reason": "Athlete not active"}'::JSONB;
    END IF;
    
    -- Check for required documents
    IF athlete_record.birth_cert_url IS NULL THEN
        RETURN '{"eligible": false, "reason": "Birth certificate missing"}'::JSONB;
    END IF;
    
    RETURN '{"eligible": true, "reason": "All requirements met"}'::JSONB;
END;
$$ LANGUAGE plpgsql;

-- Add comments to tables
COMMENT ON TABLE athlete_sport_assignments IS 'Tracks athlete assignments to sports, teams, and positions';
COMMENT ON TABLE athlete_transfers IS 'Manages athlete transfers between schools';
COMMENT ON TABLE registration_codes IS 'QR codes and invitation links for registration';
COMMENT ON TABLE athlete_stats IS 'Comprehensive athlete performance statistics';
COMMENT ON TABLE athlete_achievements IS 'Athlete awards, medals, and recognition';
COMMENT ON TABLE athlete_documents IS 'Document management with OCR support';
COMMENT ON TABLE athlete_notifications IS 'Athlete notification preferences and contacts';

-- Insert sample data for testing (optional)
INSERT INTO registration_codes (code, school_id, code_type, max_uses, expires_at, created_by) VALUES
('QR_SUNRISE_2025', 1, 'registration', 100, '2025-12-31 23:59:59', 1),
('INVITE_FOOTBALL_U16', 1, 'invitation', 50, '2025-08-31 23:59:59', 1);

COMMIT;
