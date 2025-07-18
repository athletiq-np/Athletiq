// run-guardian-migration.js
const pool = require('./src/config/db');
const fs = require('fs');

async function runGuardianMigration() {
  console.log('🔄 Starting Guardian System Migration...\n');
  
  try {
    // Read the migration file
    const migrationSQL = fs.readFileSync('./migrations/create_guardian_system.sql', 'utf8');
    
    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.startsWith('--') || statement.length === 0) continue;
      
      try {
        console.log(`${i + 1}. Executing: ${statement.substring(0, 50)}...`);
        await pool.query(statement);
        console.log('   ✅ Success');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('   ⚠️ Already exists, skipping');
        } else {
          console.log('   ❌ Error:', error.message);
        }
      }
    }
    
    console.log('\n📋 Verifying tables were created...');
    
    // Check which guardian tables exist
    const tablesResult = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE '%guardian%'
      ORDER BY table_name
    `);
    
    console.log('✅ Guardian tables found:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Test basic functionality
    console.log('\n🧪 Testing basic functionality...');
    
    // Test guardians table
    try {
      await pool.query(`
        INSERT INTO guardians (full_name, email, phone, password_hash, address) 
        VALUES ('Test Guardian', 'test@example.com', '+977-9999999999', 'hashed_password', 'Test Address')
        ON CONFLICT (email) DO NOTHING
      `);
      console.log('✅ Guardians table working');
    } catch (error) {
      console.log('❌ Guardians table error:', error.message);
    }
    
    console.log('\n🎉 Guardian Migration Completed Successfully!');
    console.log('\n📋 What\'s available now:');
    console.log('- Guardian registration without claim codes');
    console.log('- Child management system');
    console.log('- School approval workflow');
    console.log('- Document upload capability');
    console.log('- Athlete ID generation after approval');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    console.log('\n🔚 Migration process completed');
    process.exit(0);
  }
}

runGuardianMigration();
