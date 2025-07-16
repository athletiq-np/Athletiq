require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'athletiq',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Ardnepu8',
});

async function checkTournaments() {
  try {
    const result = await pool.query(`
      SELECT id, tournament_code, name, status, start_date, end_date 
      FROM tournaments 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log('📋 Available Tournaments:');
    console.table(result.rows);
    
    if (result.rows.length > 0) {
      const sampleId = result.rows[0].id;
      console.log(`\n🧪 Test with tournament ID: ${sampleId}`);
      console.log(`📊 Dashboard URL: http://localhost:5000/api/matchday/tournaments/${sampleId}/dashboard`);
    } else {
      console.log('\n⚠️  No tournaments found in database');
    }
    
  } catch (error) {
    console.error('Error checking tournaments:', error.message);
  } finally {
    await pool.end();
  }
}

checkTournaments();
