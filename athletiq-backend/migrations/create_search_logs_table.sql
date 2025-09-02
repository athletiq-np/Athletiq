-- Migration: Create search_logs table
-- File: migrations/create_search_logs_table.sql

CREATE TABLE IF NOT EXISTS search_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    filters JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_search_logs_user_id ON search_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON search_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_search_logs_query ON search_logs USING gin(to_tsvector('english', query));

-- Optional: Add table comment
COMMENT ON TABLE search_logs IS 'Stores user search activity for analytics and suggestions';
COMMENT ON COLUMN search_logs.query IS 'The search term entered by the user';
COMMENT ON COLUMN search_logs.results_count IS 'Number of results returned for this search';
COMMENT ON COLUMN search_logs.filters IS 'JSON object containing applied search filters';
