require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'athletiq',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Ardnepu8',
});

async function checkTableStructure() {
  try {
    // List all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('Available Tables:');
    console.table(tablesResult.rows);
    
    // Check tournament_matches structure
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'tournament_matches'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nTournament Matches Table Structure:');
    console.table(result.rows);
    
    // Check teams table structure
    const teamsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'teams'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nTeams Table Structure:');
    console.table(teamsResult.rows);
    
    // Check school_teams if teams doesn't exist
    if (teamsResult.rows.length === 0) {
      const schoolTeamsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'school_teams'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nSchool Teams Table Structure:');
      console.table(schoolTeamsResult.rows);
    }
    
    // Check tournaments table structure
    const tournamentsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'tournaments'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nTournaments Table Structure:');
    console.table(tournamentsResult.rows);
    
  } catch (error) {
    console.error('Error checking table structure:', error);
  } finally {
    await pool.end();
  }
}

checkTableStructure();
