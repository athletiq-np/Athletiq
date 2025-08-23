const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'athletiq',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function checkTables() {
  try {
    // Check applied migrations
    const migrationsRes = await pool.query(`
      SELECT * FROM schema_migrations 
      ORDER BY executed_at DESC
    `);
    
    console.log('\n=== Applied Migrations ===');
    console.table(migrationsRes.rows);
    
    // Check existing tables
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n=== Database Tables ===');
    console.table(tablesRes.rows);
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await pool.end();
  }
}

checkTables();
