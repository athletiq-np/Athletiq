const pool = require('./src/config/db');

async function addMissingColumns() {
  try {
    console.log('Adding missing columns to tournaments table...');
    
    await pool.query('ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS max_teams INTEGER DEFAULT 16;');
    console.log('✓ Added max_teams column');
    
    await pool.query('ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS min_teams INTEGER DEFAULT 2;');
    console.log('✓ Added min_teams column');
    
    await pool.query('ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT \'public\';');
    console.log('✓ Added visibility column');
    
    await pool.query('ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;');
    console.log('✓ Added is_featured column');
    
    await pool.query('ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;');
    console.log('✓ Added is_active column');
    
    console.log('✓ All missing columns added successfully!');
    
  } catch (error) {
    console.error('Error adding columns:', error.message);
  } finally {
    process.exit(0);
  }
}

addMissingColumns();
