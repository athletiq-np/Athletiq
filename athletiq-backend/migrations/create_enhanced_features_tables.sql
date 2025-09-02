-- Create notifications table for enhanced notification system
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'system', -- system, match, tournament, social, etc.
    category TEXT DEFAULT 'system', -- matches, tournaments, social, system
    image_url TEXT,
    actions TEXT, -- JSON array of action objects
    data TEXT, -- JSON data for additional context
    read INTEGER DEFAULT 0,
    read_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Create user preferences table for notification settings
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    push_enabled INTEGER DEFAULT 1,
    email_enabled INTEGER DEFAULT 0,
    sms_enabled INTEGER DEFAULT 0,
    sound_enabled INTEGER DEFAULT 1,
    vibration_enabled INTEGER DEFAULT 1,
    categories TEXT DEFAULT '{"matches":true,"tournaments":true,"social":true,"system":true}', -- JSON object
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create search analytics table for tracking search behavior
CREATE TABLE IF NOT EXISTS search_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    query TEXT NOT NULL,
    filter_type TEXT,
    result_count INTEGER DEFAULT 0,
    clicked_result_id TEXT,
    clicked_result_type TEXT,
    session_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for search analytics
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_user_id ON search_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at ON search_analytics(created_at);

-- Insert sample notifications for testing
INSERT OR IGNORE INTO notifications (user_id, title, message, type, category, data) VALUES
(1, 'Welcome to Athletiq!', 'Thanks for joining our sports management platform. Explore tournaments and connect with athletes.', 'welcome', 'system', '{"welcome_step": 1}'),
(1, 'New Tournament Available', 'The Summer Basketball Championship is now open for registration. Join before spots fill up!', 'tournament', 'tournaments', '{"tournament_id": 1, "registration_deadline": "2024-02-15"}'),
(1, 'Match Starting Soon', 'Your followed match between Lakers vs Warriors starts in 30 minutes. Get ready for live updates!', 'match', 'matches', '{"match_id": 1, "start_time": "2024-01-20T19:00:00Z"}'),
(1, 'Player Achievement', 'John Smith just scored a career-high 35 points! Check out the highlights.', 'achievement', 'social', '{"player_id": 1, "achievement_type": "career_high", "stat": "points", "value": 35}');

-- Insert default notification preferences for existing users
INSERT OR IGNORE INTO user_notification_preferences (user_id) 
SELECT id FROM users WHERE id NOT IN (SELECT user_id FROM user_notification_preferences);

-- Create PWA installation tracking table
CREATE TABLE IF NOT EXISTS pwa_installs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    platform TEXT NOT NULL, -- ios, android, desktop
    browser TEXT,
    version TEXT,
    install_source TEXT, -- banner, menu, etc.
    session_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    installed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create offline actions queue table for PWA sync
CREATE TABLE IF NOT EXISTS offline_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action_type TEXT NOT NULL, -- create, update, delete
    resource_type TEXT NOT NULL, -- match, tournament, etc.
    resource_id TEXT,
    action_data TEXT, -- JSON data
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    status TEXT DEFAULT 'pending', -- pending, synced, failed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    synced_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create AI model performance tracking table
CREATE TABLE IF NOT EXISTS ai_model_performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_name TEXT NOT NULL,
    model_version TEXT,
    prediction_type TEXT, -- match_outcome, player_performance, etc.
    actual_outcome TEXT,
    predicted_outcome TEXT,
    confidence_score REAL,
    accuracy REAL,
    prediction_date DATETIME,
    outcome_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create user engagement analytics table
CREATE TABLE IF NOT EXISTS user_engagement (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    session_id TEXT,
    page_path TEXT,
    action_type TEXT, -- view, click, scroll, etc.
    element_id TEXT,
    duration_seconds INTEGER,
    device_type TEXT, -- mobile, tablet, desktop
    is_pwa INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_engagement_user_id ON user_engagement(user_id);
CREATE INDEX IF NOT EXISTS idx_user_engagement_session_id ON user_engagement(session_id);
CREATE INDEX IF NOT EXISTS idx_user_engagement_created_at ON user_engagement(created_at);

-- Update existing tables with new PWA and mobile optimization columns
ALTER TABLE users ADD COLUMN pwa_installed INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_pwa_prompt DATETIME;
ALTER TABLE users ADD COLUMN push_subscription TEXT; -- JSON for push notification subscription

-- Create performance monitoring table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    metric_unit TEXT,
    category TEXT, -- api, database, frontend, etc.
    resource_path TEXT,
    user_id INTEGER,
    session_id TEXT,
    device_info TEXT, -- JSON with device details
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create real-time features status table
CREATE TABLE IF NOT EXISTS realtime_features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feature_name TEXT NOT NULL UNIQUE,
    is_enabled INTEGER DEFAULT 1,
    max_connections INTEGER DEFAULT 1000,
    current_connections INTEGER DEFAULT 0,
    last_health_check DATETIME DEFAULT CURRENT_TIMESTAMP,
    configuration TEXT, -- JSON configuration
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default real-time features
INSERT OR IGNORE INTO realtime_features (feature_name, is_enabled, max_connections) VALUES
('live_matches', 1, 500),
('notifications', 1, 1000),
('chat', 1, 200),
('live_updates', 1, 800);

-- Create system health monitoring table
CREATE TABLE IF NOT EXISTS system_health (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    component TEXT NOT NULL, -- database, websocket, api, etc.
    status TEXT NOT NULL, -- healthy, warning, critical
    response_time_ms INTEGER,
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    metadata TEXT, -- JSON with additional health data
    checked_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial system health entries
INSERT OR IGNORE INTO system_health (component, status, response_time_ms) VALUES
('database', 'healthy', 25),
('websocket', 'healthy', 15),
('api', 'healthy', 45),
('live_matches', 'healthy', 30),
('notifications', 'healthy', 20);
