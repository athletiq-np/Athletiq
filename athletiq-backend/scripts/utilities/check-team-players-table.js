const { Pool } = require('pg');

// Load environment variables
require('dotenv').config({ path: '.env.development' });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'athletiq',
  password: process.env.DB_PASSWORD || 'Ardnepu8',
  port: process.env.DB_PORT || 5432,
});

async function checkTeamPlayersTable() {
  try {
    console.log('🔍 Checking team_players table structure...');
    
    // Check if the table exists
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'team_players'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ team_players table does not exist');
      return;
    }
    
    console.log('✅ team_players table exists');
    
    // Get all columns
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'team_players' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 team_players table columns:');
    columns.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
    });
    
    // Check for specific ID columns
    const hasPlayerId = columns.rows.some(row => row.column_name === 'player_id');
    const hasAthleteId = columns.rows.some(row => row.column_name === 'athlete_id');
    const hasId = columns.rows.some(row => row.column_name === 'id');
    
    console.log('\n🔑 ID Column Analysis:');
    console.log(`  - has player_id: ${hasPlayerId}`);
    console.log(`  - has athlete_id: ${hasAthleteId}`);
    console.log(`  - has id: ${hasId}`);
    
    // Check a few sample records
    const sampleData = await pool.query('SELECT * FROM team_players LIMIT 3');
    console.log(`\n📊 Sample data (${sampleData.rows.length} rows):`);
    if (sampleData.rows.length > 0) {
      console.log(JSON.stringify(sampleData.rows[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error.message);
  } finally {
    pool.end();
  }
}

checkTeamPlayersTable();
