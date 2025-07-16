require('dotenv').config();
const { Pool } = require('pg');

// Simple database configuration without complex logging
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'athletiq',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Ardnepu8',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Simple error handling
pool.on('error', (err, client) => {
  console.error('Database pool error:', err.message);
});

pool.on('connect', () => {
  console.log('Database client connected');
});

// Test connection
async function testConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection verified');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testConnection();

module.exports = pool;
