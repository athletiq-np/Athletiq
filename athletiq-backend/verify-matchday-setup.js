require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'athletiq',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Ardnepu8',
});

async function verifyMatchdayTables() {
  try {
    // Check if all new tables exist
    const newTables = [
      'match_scores',
      'match_events', 
      'match_participants',
      'live_tournament_status',
      'referee_assignments'
    ];
    
    console.log('🔍 Verifying matchday tables creation...\n');
    
    for (const tableName of newTables) {
      const result = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);
      
      if (result.rows.length > 0) {
        console.log(`✅ Table '${tableName}' created successfully (${result.rows.length} columns)`);
      } else {
        console.log(`❌ Table '${tableName}' not found`);
      }
    }
    
    // Check views
    const views = ['live_matches_overview', 'tournament_live_stats'];
    console.log('\n🔍 Verifying views...\n');
    
    for (const viewName of views) {
      const result = await pool.query(`
        SELECT viewname 
        FROM pg_views 
        WHERE viewname = $1;
      `, [viewName]);
      
      if (result.rows.length > 0) {
        console.log(`✅ View '${viewName}' created successfully`);
      } else {
        console.log(`❌ View '${viewName}' not found`);
      }
    }
    
    // Test views with sample data
    console.log('\n🧪 Testing views with sample queries...\n');
    
    try {
      const liveMatchesResult = await pool.query('SELECT COUNT(*) as count FROM live_matches_overview');
      console.log(`✅ live_matches_overview query successful: ${liveMatchesResult.rows[0].count} matches`);
    } catch (error) {
      console.log(`❌ live_matches_overview query failed: ${error.message}`);
    }
    
    try {
      const tournamentStatsResult = await pool.query('SELECT COUNT(*) as count FROM tournament_live_stats');
      console.log(`✅ tournament_live_stats query successful: ${tournamentStatsResult.rows[0].count} tournaments`);
    } catch (error) {
      console.log(`❌ tournament_live_stats query failed: ${error.message}`);
    }
    
    console.log('\n🎉 Matchday operations database verification complete!');
    
  } catch (error) {
    console.error('Error verifying tables:', error);
  } finally {
    await pool.end();
  }
}

verifyMatchdayTables();
