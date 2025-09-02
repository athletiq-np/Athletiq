-- PostgreSQL Enhanced Features Migration
-- Create notifications table for enhanced notification system
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'system', -- system, match, tournament, social, etc.
    category VARCHAR(50) DEFAULT 'system', -- matches, tournaments, social, system
    image_url TEXT,
    actions JSONB, -- JSON array of action objects
    data JSONB, -- JSON data for additional context
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Create user preferences table for notification settings
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    email_enabled BOOLEAN DEFAULT FALSE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    sound_enabled BOOLEAN DEFAULT TRUE,
    vibration_enabled BOOLEAN DEFAULT TRUE,
    categories JSONB DEFAULT '{"matches":true,"tournaments":true,"social":true,"system":true}',
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create search analytics table for tracking search behavior
CREATE TABLE IF NOT EXISTS search_analytics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    query TEXT NOT NULL,
    filter_type VARCHAR(50),
    result_count INTEGER DEFAULT 0,
    clicked_result_id TEXT,
    clicked_result_type VARCHAR(50),
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for search analytics
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_user_id ON search_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at ON search_analytics(created_at);

-- Create PWA installation tracking table
CREATE TABLE IF NOT EXISTS pwa_installs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    platform VARCHAR(50) NOT NULL, -- ios, android, desktop
    browser VARCHAR(100),
    version VARCHAR(50),
    install_source VARCHAR(50), -- banner, menu, etc.
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create offline actions queue table for PWA sync
CREATE TABLE IF NOT EXISTS offline_actions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action_type VARCHAR(50) NOT NULL, -- create, update, delete
    resource_type VARCHAR(50) NOT NULL, -- match, tournament, etc.
    resource_id TEXT,
    action_data JSONB, -- JSON data
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    status VARCHAR(20) DEFAULT 'pending', -- pending, synced, failed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP
);

-- Create AI model performance tracking table
CREATE TABLE IF NOT EXISTS ai_model_performance (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50),
    prediction_type VARCHAR(50), -- match_outcome, player_performance, etc.
    actual_outcome TEXT,
    predicted_outcome TEXT,
    confidence_score DECIMAL(5,4),
    accuracy DECIMAL(5,4),
    prediction_date TIMESTAMP,
    outcome_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user engagement analytics table
CREATE TABLE IF NOT EXISTS user_engagement (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    session_id TEXT,
    page_path TEXT,
    action_type VARCHAR(50), -- view, click, scroll, etc.
    element_id TEXT,
    duration_seconds INTEGER,
    device_type VARCHAR(20), -- mobile, tablet, desktop
    is_pwa BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_engagement_user_id ON user_engagement(user_id);
CREATE INDEX IF NOT EXISTS idx_user_engagement_session_id ON user_engagement(session_id);
CREATE INDEX IF NOT EXISTS idx_user_engagement_created_at ON user_engagement(created_at);

-- Create performance monitoring table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,4) NOT NULL,
    metric_unit VARCHAR(20),
    category VARCHAR(50), -- api, database, frontend, etc.
    resource_path TEXT,
    user_id INTEGER,
    session_id TEXT,
    device_info JSONB, -- JSON with device details
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create real-time features status table
CREATE TABLE IF NOT EXISTS realtime_features (
    id SERIAL PRIMARY KEY,
    feature_name VARCHAR(100) NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT TRUE,
    max_connections INTEGER DEFAULT 1000,
    current_connections INTEGER DEFAULT 0,
    last_health_check TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    configuration JSONB, -- JSON configuration
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create system health monitoring table
CREATE TABLE IF NOT EXISTS system_health (
    id SERIAL PRIMARY KEY,
    component VARCHAR(50) NOT NULL, -- database, websocket, api, etc.
    status VARCHAR(20) NOT NULL, -- healthy, warning, critical
    response_time_ms INTEGER,
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    metadata JSONB, -- JSON with additional health data
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample notifications for testing
INSERT INTO notifications (user_id, title, message, type, category, data) VALUES
(1, 'Welcome to Athletiq!', 'Thanks for joining our sports management platform. Explore tournaments and connect with athletes.', 'welcome', 'system', '{"welcome_step": 1}'),
(1, 'New Tournament Available', 'The Summer Basketball Championship is now open for registration. Join before spots fill up!', 'tournament', 'tournaments', '{"tournament_id": 1, "registration_deadline": "2024-02-15"}'),
(1, 'Match Starting Soon', 'Your followed match between Lakers vs Warriors starts in 30 minutes. Get ready for live updates!', 'match', 'matches', '{"match_id": 1, "start_time": "2024-01-20T19:00:00Z"}'),
(1, 'Player Achievement', 'John Smith just scored a career-high 35 points! Check out the highlights.', 'achievement', 'social', '{"player_id": 1, "achievement_type": "career_high", "stat": "points", "value": 35}')
ON CONFLICT DO NOTHING;

-- Insert default real-time features
INSERT INTO realtime_features (feature_name, is_enabled, max_connections) VALUES
('live_matches', TRUE, 500),
('notifications', TRUE, 1000),
('chat', TRUE, 200),
('live_updates', TRUE, 800)
ON CONFLICT (feature_name) DO NOTHING;

-- Insert initial system health entries
INSERT INTO system_health (component, status, response_time_ms) VALUES
('database', 'healthy', 25),
('websocket', 'healthy', 15),
('api', 'healthy', 45),
('live_matches', 'healthy', 30),
('notifications', 'healthy', 20)
ON CONFLICT DO NOTHING;
