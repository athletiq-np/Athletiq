/**
 * Database Migration: Matchday Operations Support
 * Creates tables and structures for live tournament execution
 */

require('dotenv').config();
const { Pool } = require('pg');

// Create database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'athletiq',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Ardnepu8',
});

const createMatchdayTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🚀 Creating matchday operations tables...');

    // 1. Match Scores table for real-time scoring
    await client.query(`
      CREATE TABLE IF NOT EXISTS match_scores (
        id SERIAL PRIMARY KEY,
        match_id INTEGER REFERENCES tournament_matches(id) ON DELETE CASCADE,
        team1_score INTEGER DEFAULT 0 NOT NULL,
        team2_score INTEGER DEFAULT 0 NOT NULL,
        status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'paused', 'completed')),
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        winner_team_id INTEGER REFERENCES teams(id),
        last_updated TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(match_id)
      );
    `);

    // 2. Match Events table for real-time event logging
    await client.query(`
      CREATE TABLE IF NOT EXISTS match_events (
        id SERIAL PRIMARY KEY,
        match_id INTEGER REFERENCES tournament_matches(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL,
        description TEXT,
        timestamp TIMESTAMP DEFAULT NOW(),
        team1_score INTEGER,
        team2_score INTEGER,
        player_id INTEGER REFERENCES players(id),
        team_id INTEGER REFERENCES teams(id),
        created_by INTEGER REFERENCES users(id),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 3. Match Participants table for tracking athlete participation
    await client.query(`
      CREATE TABLE IF NOT EXISTS match_participants (
        id SERIAL PRIMARY KEY,
        match_id INTEGER REFERENCES tournament_matches(id) ON DELETE CASCADE,
        player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
        team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
        position VARCHAR(50),
        is_starter BOOLEAN DEFAULT true,
        substituted_at TIMESTAMP,
        substituted_by INTEGER REFERENCES players(id),
        performance_data JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(match_id, player_id)
      );
    `);

    // 4. Live Tournament Status table for real-time tournament monitoring
    await client.query(`
      CREATE TABLE IF NOT EXISTS live_tournament_status (
        tournament_id INTEGER PRIMARY KEY REFERENCES tournaments(id) ON DELETE CASCADE,
        current_round INTEGER DEFAULT 1,
        active_matches INTEGER DEFAULT 0,
        completed_matches INTEGER DEFAULT 0,
        total_matches INTEGER DEFAULT 0,
        live_spectators INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'preparation' CHECK (status IN ('preparation', 'active', 'paused', 'completed')),
        started_at TIMESTAMP,
        last_activity TIMESTAMP DEFAULT NOW(),
        metadata JSONB DEFAULT '{}',
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 5. Referee Assignments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS referee_assignments (
        id SERIAL PRIMARY KEY,
        match_id INTEGER REFERENCES tournament_matches(id) ON DELETE CASCADE,
        referee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(30) DEFAULT 'main_referee' CHECK (role IN ('main_referee', 'assistant_referee', 'fourth_official')),
        assigned_at TIMESTAMP DEFAULT NOW(),
        accepted_at TIMESTAMP,
        status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'declined', 'completed')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(match_id, referee_id)
      );
    `);

    // 6. Add missing columns to existing tables
    await client.query(`
      ALTER TABLE tournament_matches 
      ADD COLUMN IF NOT EXISTS actual_start_time TIMESTAMP,
      ADD COLUMN IF NOT EXISTS actual_end_time TIMESTAMP,
      ADD COLUMN IF NOT EXISTS referee_id INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS match_duration INTEGER, -- in minutes
      ADD COLUMN IF NOT EXISTS live_spectators INTEGER DEFAULT 0;
    `);

    // 7. Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_match_scores_match_id ON match_scores(match_id);
      CREATE INDEX IF NOT EXISTS idx_match_events_match_id ON match_events(match_id);
      CREATE INDEX IF NOT EXISTS idx_match_events_timestamp ON match_events(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_match_participants_match_id ON match_participants(match_id);
      CREATE INDEX IF NOT EXISTS idx_match_participants_player_id ON match_participants(player_id);
      CREATE INDEX IF NOT EXISTS idx_live_tournament_status_tournament_id ON live_tournament_status(tournament_id);
      CREATE INDEX IF NOT EXISTS idx_referee_assignments_match_id ON referee_assignments(match_id);
      CREATE INDEX IF NOT EXISTS idx_tournament_matches_status ON tournament_matches(match_status);
      CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament_id ON tournament_matches(tournament_id);
    `);

    // 8. Create views for common queries
    await client.query(`
      CREATE OR REPLACE VIEW live_matches_overview AS
      SELECT 
        m.id as match_id,
        m.tournament_id,
        m.round_number as round,
        m.scheduled_at as scheduled_time,
        m.match_status as status,
        t1.team_name as team1_name,
        t2.team_name as team2_name,
        m.home_score as team1_score,
        m.away_score as team2_score,
        m.venue as venue_name,
        CASE 
          WHEN m.match_status = 'in_progress' 
          THEN EXTRACT(EPOCH FROM (NOW() - m.created_at))/60 
          ELSE NULL 
        END as match_duration_minutes
      FROM tournament_matches m
      LEFT JOIN teams t1 ON m.home_team_id = t1.id
      LEFT JOIN teams t2 ON m.away_team_id = t2.id;
    `);

    await client.query(`
      CREATE OR REPLACE VIEW tournament_live_stats AS
      SELECT 
        t.id as tournament_id,
        t.name as tournament_name,
        t.status as tournament_status,
        COUNT(m.id) as total_matches,
        COUNT(CASE WHEN m.match_status = 'completed' THEN 1 END) as completed_matches,
        COUNT(CASE WHEN m.match_status = 'in_progress' THEN 1 END) as active_matches,
        COUNT(CASE WHEN m.match_status = 'scheduled' THEN 1 END) as scheduled_matches,
        CASE 
          WHEN COUNT(m.id) > 0 
          THEN ROUND((COUNT(CASE WHEN m.match_status = 'completed' THEN 1 END)::decimal / COUNT(m.id)) * 100, 2)
          ELSE 0 
        END as completion_percentage
      FROM tournaments t
      LEFT JOIN tournament_matches m ON t.id = m.tournament_id
      GROUP BY t.id, t.name, t.status;
    `);

    // 9. Create triggers for automatic updates
    await client.query(`
      CREATE OR REPLACE FUNCTION update_live_tournament_status()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Update live tournament status when match status changes
        INSERT INTO live_tournament_status (
          tournament_id, 
          active_matches, 
          completed_matches, 
          total_matches,
          last_activity
        )
        SELECT 
          NEW.tournament_id,
          COUNT(CASE WHEN match_status = 'in_progress' THEN 1 END),
          COUNT(CASE WHEN match_status = 'completed' THEN 1 END),
          COUNT(*),
          NOW()
        FROM tournament_matches 
        WHERE tournament_id = NEW.tournament_id
        ON CONFLICT (tournament_id) DO UPDATE SET
          active_matches = EXCLUDED.active_matches,
          completed_matches = EXCLUDED.completed_matches,
          total_matches = EXCLUDED.total_matches,
          last_activity = EXCLUDED.last_activity,
          updated_at = NOW();
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_live_tournament_status ON tournament_matches;
      CREATE TRIGGER trigger_update_live_tournament_status
        AFTER INSERT OR UPDATE OF match_status ON tournament_matches
        FOR EACH ROW
        EXECUTE FUNCTION update_live_tournament_status();
    `);

    await client.query('COMMIT');
    console.log('✅ Matchday operations tables created successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating matchday tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Export for use in migration scripts
module.exports = { createMatchdayTables };

// Run if called directly
if (require.main === module) {
  createMatchdayTables()
    .then(() => {
      console.log('🎯 Matchday operations database setup complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}
