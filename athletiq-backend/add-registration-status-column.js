const pool = require('./src/config/db');

async function addRegistrationStatusColumn() {
  try {
    console.log('Adding registration_status column to tournament_teams table...');
    
    await pool.query('ALTER TABLE tournament_teams ADD COLUMN IF NOT EXISTS registration_status VARCHAR(20) DEFAULT \'registered\';');
    console.log('✓ Added registration_status column');
    
    console.log('✓ Column added successfully!');
    
  } catch (error) {
    console.error('Error adding column:', error.message);
  } finally {
    process.exit(0);
  }
}

addRegistrationStatusColumn();
