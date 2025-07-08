const { Pool } = require('pg');
require('dotenv').config();

async function checkTournamentSchema() {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    password: process.env.DB_PASSWORD || 'Ardnepu8',
    database: process.env.DB_NAME || 'athletiq',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('\n=== ALL TABLES IN DATABASE ===');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    tablesResult.rows.forEach(row => {
      console.log('Table:', row.table_name);
    });

    console.log('\n=== TOURNAMENT-RELATED TABLES ===');
    const tournamentTablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%match%' OR table_name LIKE '%bracket%' OR table_name LIKE '%schedule%' OR table_name LIKE '%venue%' OR table_name LIKE '%tournament%')
      ORDER BY table_name;
    `);
    
    tournamentTablesResult.rows.forEach(row => {
      console.log('Table:', row.table_name);
    });

    // Check matches table structure
    console.log('\n=== MATCHES TABLE STRUCTURE ===');
    const matchesResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'matches'
      ORDER BY ordinal_position;
    `);
    
    if (matchesResult.rows.length > 0) {
      matchesResult.rows.forEach(row => {
        console.log(`${row.column_name} (${row.data_type}) - ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    } else {
      console.log('No matches table found');
    }

    // Check venues table structure
    console.log('\n=== VENUES TABLE STRUCTURE ===');
    const venuesResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'venues'
      ORDER BY ordinal_position;
    `);
    
    if (venuesResult.rows.length > 0) {
      venuesResult.rows.forEach(row => {
        console.log(`${row.column_name} (${row.data_type}) - ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    } else {
      console.log('No venues table found');
    }

    // Check tournaments table structure
    console.log('\n=== TOURNAMENTS TABLE STRUCTURE ===');
    const tournamentsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'tournaments'
      ORDER BY ordinal_position;
    `);
    
    tournamentsResult.rows.forEach(row => {
      console.log(`${row.column_name} (${row.data_type}) - ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkTournamentSchema();
