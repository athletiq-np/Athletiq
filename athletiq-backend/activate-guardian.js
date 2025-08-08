const pool = require('./src/config/database');

(async () => {
  try {
    await pool.query('UPDATE guardians SET account_status = $1 WHERE email = $2', ['active', 'guardian@demo.com']);
    const result = await pool.query('SELECT id, email, first_name, last_name, account_status FROM guardians WHERE email = $1', ['guardian@demo.com']);
    console.log('Guardian account updated:', result.rows[0]);
  } catch (error) {
    console.error('Error updating guardian:', error.message);
  } finally {
    process.exit(0);
  }
})();
