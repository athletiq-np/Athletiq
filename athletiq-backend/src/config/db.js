// db.js
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'athletiq',
  password: 'Ardnepu8',
  port: 5432, // default PostgreSQL port
});

pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL database'))
  .catch((err) => console.error('❌ Database connection error', err));

module.exports = pool;
