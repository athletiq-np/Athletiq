const pool = require('./src/config/database');

(async () => {
  try {
    const result = await pool.query('SELECT id, email, first_name, last_name, account_status FROM guardians WHERE email = $1', ['guardian@demo.com']);
    console.log('Current guardian account status:', result.rows[0]);
    
    // Force update
    await pool.query('UPDATE guardians SET account_status = $1 WHERE email = $2', ['active', 'guardian@demo.com']);
    console.log('Account status updated to active');
    
    const updated = await pool.query('SELECT id, email, first_name, last_name, account_status FROM guardians WHERE email = $1', ['guardian@demo.com']);
    console.log('Updated guardian account status:', updated.rows[0]);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
})();
