const { Pool } = require('pg');
require('dotenv').config();

const adminConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  password: process.env.DB_PASSWORD || '1234',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: 'postgres' // Connect to default postgres database
};

const dbName = process.env.DB_NAME || 'athletiq';

async function resetDatabase() {
  const pool = new Pool(adminConfig);
  const client = await pool.connect();
  
  try {
    // Terminate all connections to the database
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = '${dbName}'
      AND pid <> pg_backend_pid();
    `);
    
    // Drop the database if it exists
    await client.query(`DROP DATABASE IF EXISTS ${dbName}`);
    
    // Create a new database
    await client.query(`CREATE DATABASE ${dbName}`);
    
    console.log(`✅ Database ${dbName} has been reset successfully.`);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

resetDatabase();
