const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'athletiq',
  password: 'postgres',
  port: 5432,
});

async function checkGuardians() {
  try {
    console.log('🔍 Checking guardians in database...');
    
    // Check all guardians
    const allGuardians = await pool.query('SELECT id, email, first_name, last_name FROM guardians ORDER BY id');
    console.log(`📊 Total guardians in database: ${allGuardians.rowCount}`);
    
    if (allGuardians.rowCount > 0) {
      console.log('📋 Guardian list:');
      allGuardians.rows.forEach(guardian => {
        console.log(`  ID: ${guardian.id}, Email: ${guardian.email}, Name: ${guardian.first_name} ${guardian.last_name}`);
      });
    }
    
    // Check specific guardian ID 42
    const guardian42 = await pool.query('SELECT * FROM guardians WHERE id = $1', [42]);
    console.log(`\n🔍 Guardian with ID 42: ${guardian42.rowCount > 0 ? 'Found' : 'Not found'}`);
    
    if (guardian42.rowCount > 0) {
      console.log('Guardian 42 details:', guardian42.rows[0]);
    }
    
    // Check users table for role 'Guardian'
    const guardianUsers = await pool.query("SELECT id, email, role FROM users WHERE role = 'Guardian' ORDER BY id");
    console.log(`\n📊 Users with Guardian role: ${guardianUsers.rowCount}`);
    
    if (guardianUsers.rowCount > 0) {
      console.log('📋 Guardian users:');
      guardianUsers.rows.forEach(user => {
        console.log(`  ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await pool.end();
  }
}

checkGuardians();
