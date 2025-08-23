const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'athletiq',
  password: process.env.DB_PASSWORD || '1234',
  port: parseInt(process.env.DB_PORT || '5432')
});

async function enableUuidExtension() {
  const client = await pool.connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ UUID extension enabled successfully');
  } catch (error) {
    console.error('❌ Error enabling UUID extension:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

enableUuidExtension();
