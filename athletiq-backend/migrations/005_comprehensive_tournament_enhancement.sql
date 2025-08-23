-- =====================================================
-- ATHLETIQ COMPREHENSIVE TOURNAMENT MANAGEMENT ENHANCEMENT
-- Database Migration for New Features
-- Version: 1.0
-- Date: January 2025
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SECTION 1: CERTIFICATES & AWARDS SYSTEM
-- =====================================================

-- Certificate Templates for Different Award Types
CREATE TABLE IF NOT EXISTS certificate_templates (
    id SERIAL PRIMARY KEY,
    template_id UUID DEFAULT uuid_generate_v4() UNIQUE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('winner', 'runner_up', 'participation', 'achievement', 'mvp', 'best_player', 'fair_play')),
    tournament_type VARCHAR(50), -- 'school', 'district', 'national'
    sport VARCHAR(50),
    template_design JSONB NOT NULL, -- SVG/HTML template with placeholders
    background_image_url VARCHAR(500),
    logo_positions JSONB, -- Position coordinates for logos
    text_positions JSONB, -- Position coordinates for dynamic text
    signature_positions JSONB, -- Position for authority signatures
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Generated Certificates for Tournament Participants
CREATE TABLE IF NOT EXISTS tournament_certificates (
    id SERIAL PRIMARY KEY,
    certificate_id UUID DEFAULT uuid_generate_v4() UNIQUE,
    certificate_number VARCHAR(50) UNIQUE NOT NULL, -- Official certificate number
    tournament_id INTEGER NOT NULL,
    template_id INTEGER NOT NULL,
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('player', 'team', 'coach', 'official')),
    recipient_id INTEGER NOT NULL, -- player_id, team_id, etc.
    recipient_name VARCHAR(200) NOT NULL,
    award_type VARCHAR(50) NOT NULL, -- 'first_place', 'second_place', 'participation', etc.
    position INTEGER, -- Final ranking/position
    sport VARCHAR(50),
    category VARCHAR(50), -- Age group, gender, etc.
    achievement_details JSONB, -- Specific achievements, scores, records
    issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    issued_by INTEGER, -- User who issued the certificate
    verification_code VARCHAR(50) UNIQUE NOT NULL, -- QR code verification
    certificate_url VARCHAR(500), -- Generated PDF/image URL
    download_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT TRUE,
    metadata JSONB, -- Additional certificate data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY (template_id) REFERENCES certificate_templates(id),
    FOREIGN KEY (issued_by) REFERENCES users(id)
);

-- Certificate Verification Log
CREATE TABLE IF NOT EXISTS certificate_verifications (
    id SERIAL PRIMARY KEY,
    certificate_id INTEGER NOT NULL,
    verification_code VARCHAR(50) NOT NULL,
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_by_ip INET,
    user_agent TEXT,
    verification_result BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (certificate_id) REFERENCES tournament_certificates(id)
);

-- =====================================================
-- SECTION 2: LIVE SCORING & EVENTS SYSTEM
-- =====================================================

-- Real-time Match Events for Live Coverage
CREATE TABLE IF NOT EXISTS live_match_events (
    id SERIAL PRIMARY KEY,
    event_id UUID DEFAULT uuid_generate_v4() UNIQUE,
    match_id INTEGER NOT NULL,
    tournament_id INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'goal', 'card', 'substitution', 'timeout', 'injury', 'penalty'
    event_subtype VARCHAR(50), -- 'yellow_card', 'red_card', 'corner_kick', etc.
    event_time INTEGER NOT NULL, -- Minutes from match start
    event_time_display VARCHAR(10), -- "45+2" format for display
    period VARCHAR(20) DEFAULT 'first_half', -- 'first_half', 'second_half', 'overtime', 'penalty_shootout'
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    player_id INTEGER, -- Player involved in event
    team_id INTEGER, -- Team event belongs to
    opponent_player_id INTEGER, -- For fouls, tackles, etc.
    position VARCHAR(50), -- Field position where event occurred
    description TEXT, -- Detailed event description
    event_data JSONB, -- Additional event-specific data
    is_key_event BOOLEAN DEFAULT FALSE, -- Goals, cards, etc.
    recorded_by INTEGER NOT NULL, -- Official/scorer who recorded
    approved_by INTEGER, -- Supervisor approval
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(id),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- Live Match Commentary
CREATE TABLE IF NOT EXISTS match_commentary (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL,
    event_id INTEGER, -- Link to specific event if applicable
    minute INTEGER,
    commentary_type VARCHAR(30) DEFAULT 'play_by_play', -- 'play_by_play', 'analysis', 'highlight'
    message TEXT NOT NULL,
    commentator_id INTEGER,
    language VARCHAR(10) DEFAULT 'en',
    is_automated BOOLEAN DEFAULT FALSE, -- AI-generated vs human
    priority INTEGER DEFAULT 5, -- 1-10, for filtering important updates
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(id),
    FOREIGN KEY (event_id) REFERENCES live_match_events(id),
    FOREIGN KEY (commentator_id) REFERENCES users(id)
);

-- Live Match Media (Photos, Videos, Audio)
CREATE TABLE IF NOT EXISTS match_media (
    id SERIAL PRIMARY KEY,
    media_id UUID DEFAULT uuid_generate_v4() UNIQUE,
    match_id INTEGER NOT NULL,
    event_id INTEGER, -- Link to specific event
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('photo', 'video', 'audio', 'stream')),
    media_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    caption TEXT,
    match_time INTEGER, -- When during match this was captured
    uploaded_by INTEGER,
    is_highlight BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    metadata JSONB, -- Resolution, duration, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(id),
    FOREIGN KEY (event_id) REFERENCES live_match_events(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- =====================================================
-- SECTION 3: ENHANCED ANALYTICS & REPORTING
-- =====================================================

-- Tournament Attendance and Financials
CREATE TABLE IF NOT EXISTS tournament_attendance (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL,
    match_id INTEGER, -- NULL for overall tournament attendance
    date DATE NOT NULL,
    venue VARCHAR(200),
    total_attendance INTEGER DEFAULT 0,
    paid_attendance INTEGER DEFAULT 0,
    free_attendance INTEGER DEFAULT 0,
    vip_attendance INTEGER DEFAULT 0,
    gate_receipts DECIMAL(12,2) DEFAULT 0.00,
    expenses DECIMAL(12,2) DEFAULT 0.00,
    weather_conditions VARCHAR(100),
    attendance_notes TEXT,
    recorded_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY (match_id) REFERENCES matches(id),
    FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- Tournament Financial Tracking
CREATE TABLE IF NOT EXISTS tournament_finances (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL,
    transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN ('entry_fee', 'sponsorship', 'gate_receipts', 'prize_money', 'expenses', 'refund')),
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NPR',
    description TEXT,
    category VARCHAR(50), -- 'venue_cost', 'equipment', 'officials', 'marketing'
    team_id INTEGER, -- For entry fees
    transaction_date DATE DEFAULT CURRENT_DATE,
    payment_method VARCHAR(30), -- 'cash', 'bank_transfer', 'digital_wallet'
    payment_reference VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by INTEGER,
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (verified_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Tournament Statistics Cache (for performance)
CREATE TABLE IF NOT EXISTS tournament_statistics (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL UNIQUE,
    total_matches INTEGER DEFAULT 0,
    completed_matches INTEGER DEFAULT 0,
    total_goals INTEGER DEFAULT 0,
    total_cards INTEGER DEFAULT 0,
    total_attendance INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0.00,
    top_scorer_id INTEGER,
    top_scorer_goals INTEGER DEFAULT 0,
    most_cards_player_id INTEGER,
    most_cards_count INTEGER DEFAULT 0,
    average_match_duration INTEGER, -- minutes
    highest_attendance INTEGER DEFAULT 0,
    highest_attendance_match_id INTEGER,
    statistics_data JSONB, -- Additional computed statistics
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY (top_scorer_id) REFERENCES players(id),
    FOREIGN KEY (most_cards_player_id) REFERENCES players(id),
    FOREIGN KEY (highest_attendance_match_id) REFERENCES matches(id)
);

-- =====================================================
-- SECTION 4: RESOURCE & EQUIPMENT MANAGEMENT
-- =====================================================

-- Tournament Equipment and Resources
CREATE TABLE IF NOT EXISTS tournament_resources (
    id SERIAL PRIMARY KEY,
    resource_id UUID DEFAULT uuid_generate_v4() UNIQUE,
    tournament_id INTEGER NOT NULL,
    resource_type VARCHAR(30) NOT NULL CHECK (resource_type IN ('equipment', 'venue', 'transport', 'medical', 'security', 'catering')),
    resource_name VARCHAR(100) NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 1,
    unit_cost DECIMAL(10,2) DEFAULT 0.00,
    total_cost DECIMAL(10,2) DEFAULT 0.00,
    supplier VARCHAR(100),
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'ordered', 'delivered', 'allocated', 'returned')),
    allocated_to VARCHAR(50), -- venue, match_id, or general
    allocation_date DATE,
    required_date DATE,
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Officials Assignment and Management
CREATE TABLE IF NOT EXISTS tournament_officials (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL, -- Reference to users table
    official_type VARCHAR(30) NOT NULL CHECK (official_type IN ('referee', 'linesmen', 'scorer', 'timekeeper', 'coordinator', 'medical')),
    certification_level VARCHAR(20), -- 'local', 'district', 'national', 'international'
    sports VARCHAR(100), -- JSON array of sports they can officiate
    availability JSONB, -- Available dates and times
    assigned_matches JSONB, -- Array of match IDs assigned
    contact_phone VARCHAR(20),
    emergency_contact VARCHAR(20),
    fee_per_match DECIMAL(8,2) DEFAULT 0.00,
    total_fee DECIMAL(10,2) DEFAULT 0.00,
    payment_status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- =====================================================
-- SECTION 5: PERFORMANCE INDEXES
-- =====================================================

-- Certificate System Indexes
CREATE INDEX IF NOT EXISTS idx_certificate_templates_category ON certificate_templates(category);
CREATE INDEX IF NOT EXISTS idx_certificate_templates_sport ON certificate_templates(sport);
CREATE INDEX IF NOT EXISTS idx_tournament_certificates_tournament ON tournament_certificates(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_certificates_verification ON tournament_certificates(verification_code);
CREATE INDEX IF NOT EXISTS idx_tournament_certificates_recipient ON tournament_certificates(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_certificate_verifications_code ON certificate_verifications(verification_code);

-- Live Events Indexes
CREATE INDEX IF NOT EXISTS idx_live_match_events_match ON live_match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_live_match_events_tournament ON live_match_events(tournament_id);
CREATE INDEX IF NOT EXISTS idx_live_match_events_time ON live_match_events(created_at);
CREATE INDEX IF NOT EXISTS idx_live_match_events_type ON live_match_events(event_type);
CREATE INDEX IF NOT EXISTS idx_match_commentary_match ON match_commentary(match_id);
CREATE INDEX IF NOT EXISTS idx_match_media_match ON match_media(match_id);

-- Analytics Indexes
CREATE INDEX IF NOT EXISTS idx_tournament_attendance_tournament ON tournament_attendance(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_attendance_date ON tournament_attendance(date);
CREATE INDEX IF NOT EXISTS idx_tournament_finances_tournament ON tournament_finances(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_finances_type ON tournament_finances(transaction_type);
CREATE INDEX IF NOT EXISTS idx_tournament_statistics_tournament ON tournament_statistics(tournament_id);

-- Resource Management Indexes
CREATE INDEX IF NOT EXISTS idx_tournament_resources_tournament ON tournament_resources(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_resources_type ON tournament_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_tournament_officials_tournament ON tournament_officials(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_officials_user ON tournament_officials(user_id);

-- =====================================================
-- SECTION 6: SEQUENCES AND FUNCTIONS
-- =====================================================

-- Create sequence for certificate numbers
CREATE SEQUENCE IF NOT EXISTS certificate_number_seq START 100000;

-- Function to generate verification codes
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS VARCHAR(50) AS $$
BEGIN
    RETURN 'VER' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10));
END;
$$ LANGUAGE plpgsql;

-- Function to generate certificate numbers
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.certificate_number IS NULL THEN
        NEW.certificate_number := 'CERT' || EXTRACT(YEAR FROM CURRENT_DATE) || 
                                 LPAD(nextval('certificate_number_seq')::TEXT, 6, '0');
    END IF;
    
    IF NEW.verification_code IS NULL THEN
        NEW.verification_code := generate_verification_code();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update tournament statistics when events occur
CREATE OR REPLACE FUNCTION update_tournament_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update statistics whenever a match event is recorded
    INSERT INTO tournament_statistics (tournament_id, last_updated)
    VALUES (NEW.tournament_id, CURRENT_TIMESTAMP)
    ON CONFLICT (tournament_id) DO UPDATE SET
        last_updated = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 7: TRIGGERS
-- =====================================================

-- Certificate number generation trigger
CREATE TRIGGER trigger_generate_certificate_number
    BEFORE INSERT ON tournament_certificates
    FOR EACH ROW EXECUTE FUNCTION generate_certificate_number();

-- Tournament statistics update trigger
CREATE TRIGGER trigger_update_tournament_statistics
    AFTER INSERT OR UPDATE ON live_match_events
    FOR EACH ROW EXECUTE FUNCTION update_tournament_statistics();

-- Updated_at triggers for new tables
CREATE TRIGGER update_certificate_templates_updated_at 
    BEFORE UPDATE ON certificate_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournament_resources_updated_at 
    BEFORE UPDATE ON tournament_resources 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SECTION 8: INITIAL DATA SETUP
-- =====================================================

-- Insert default certificate templates
INSERT INTO certificate_templates (name, category, sport, template_design) VALUES 
('Winner Certificate - Football', 'winner', 'football', '{"template": "default_winner", "colors": {"primary": "#FFD700", "secondary": "#000000"}}'),
('Participation Certificate - General', 'participation', NULL, '{"template": "default_participation", "colors": {"primary": "#4CAF50", "secondary": "#FFFFFF"}}'),
('MVP Award Certificate', 'mvp', NULL, '{"template": "mvp_award", "colors": {"primary": "#FF6B35", "secondary": "#004E98"}}')
ON CONFLICT DO NOTHING;

-- =====================================================
-- SECTION 9: VERIFICATION QUERIES
-- =====================================================

-- Verify table creation
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_name IN (
        'certificate_templates', 
        'tournament_certificates', 
        'certificate_verifications',
        'live_match_events', 
        'match_commentary', 
        'match_media',
        'tournament_attendance', 
        'tournament_finances', 
        'tournament_statistics',
        'tournament_resources', 
        'tournament_officials'
    );
    
    IF table_count = 11 THEN
        RAISE NOTICE 'SUCCESS: All 11 new tables created successfully!';
    ELSE
        RAISE NOTICE 'WARNING: Only % out of 11 tables were created', table_count;
    END IF;
END $$;

-- Create views for common queries
CREATE OR REPLACE VIEW tournament_summary AS
SELECT 
    t.id,
    t.name,
    t.status,
    t.start_date,
    t.end_date,
    COUNT(DISTINCT tt.id) as registered_teams,
    COUNT(DISTINCT tp.id) as registered_players,
    COUNT(DISTINCT m.id) as total_matches,
    COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN m.id END) as completed_matches,
    COALESCE(ts.total_attendance, 0) as total_attendance,
    COALESCE(tf_revenue.total_revenue, 0) as total_revenue
FROM tournaments t
LEFT JOIN tournament_teams tt ON t.id = tt.tournament_id
LEFT JOIN tournament_players tp ON tt.id = tp.tournament_team_id
LEFT JOIN matches m ON t.id = m.tournament_id
LEFT JOIN tournament_statistics ts ON t.id = ts.tournament_id
LEFT JOIN (
    SELECT tournament_id, SUM(amount) as total_revenue
    FROM tournament_finances 
    WHERE transaction_type IN ('entry_fee', 'sponsorship', 'gate_receipts')
    GROUP BY tournament_id
) tf_revenue ON t.id = tf_revenue.tournament_id
GROUP BY t.id, t.name, t.status, t.start_date, t.end_date, ts.total_attendance, tf_revenue.total_revenue;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Athletiq Tournament Management Enhancement Migration Completed Successfully!';
    RAISE NOTICE 'New Features Available:';
    RAISE NOTICE '- Certificate Generation System';
    RAISE NOTICE '- Live Match Events & Commentary';
    RAISE NOTICE '- Enhanced Analytics & Financial Tracking';
    RAISE NOTICE '- Resource & Equipment Management';
    RAISE NOTICE '- Tournament Officials Management';
    RAISE NOTICE 'Database is ready for comprehensive tournament management!';
END $$;
