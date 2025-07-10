// Check users table structure
const { getPool } = require('./src/config/database');

async function checkUsersTable() {
  try {
    console.log('🔍 Checking users table structure...');
    
    const pool = getPool();
    
    // Get table structure
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Users table columns:');
    result.rows.forEach(row => {
      console.log(`   ${row.column_name} (${row.data_type}) - ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Also check current users
    const usersResult = await pool.query('SELECT * FROM users LIMIT 5');
    console.log('\n👤 Current users:');
    usersResult.rows.forEach(user => {
      console.log(`   ${user.email} - Role: ${user.role} - ID: ${user.id}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking users table:', error);
    throw error;
  }
}

// Run the check
checkUsersTable()
  .then(() => {
    console.log('\n✅ Table check complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to check table:', error);
    process.exit(1);
  });
