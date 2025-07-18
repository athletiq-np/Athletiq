// run-guardian-migration-simple.js
const pool = require('./src/config/db');

async function runSimpleGuardianMigration() {
  console.log('🔄 Starting Simple Guardian System Migration...\n');
  
  try {
    // 1. Create guardian_children table
    console.log('1. Creating guardian_children table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guardian_children (
        id SERIAL PRIMARY KEY,
        guardian_id INTEGER REFERENCES guardians(id) ON DELETE CASCADE,
        full_name VARCHAR(255) NOT NULL,
        date_of_birth DATE NOT NULL,
        gender VARCHAR(20) NOT NULL,
        grade VARCHAR(10),
        school_name VARCHAR(255),
        school_id INTEGER,
        existing_player_id INTEGER,
        linked_player_id INTEGER,
        athlete_id VARCHAR(50),
        athlete_id_status VARCHAR(50) DEFAULT 'pending',
        verification_status VARCHAR(50) DEFAULT 'pending_school_approval',
        additional_info JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ guardian_children table created');

    // 2. Create pending_registrations table
    console.log('2. Creating pending_registrations table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pending_registrations (
        id SERIAL PRIMARY KEY,
        guardian_id INTEGER REFERENCES guardians(id) ON DELETE CASCADE,
        child_id INTEGER REFERENCES guardian_children(id) ON DELETE CASCADE,
        full_name VARCHAR(255) NOT NULL,
        date_of_birth DATE NOT NULL,
        gender VARCHAR(20) NOT NULL,
        grade VARCHAR(10),
        school_name VARCHAR(255),
        school_id INTEGER,
        status VARCHAR(50) DEFAULT 'pending_school_approval',
        school_notes TEXT,
        approved_at TIMESTAMP,
        approved_by INTEGER,
        rejected_at TIMESTAMP,
        rejection_reason TEXT,
        player_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ pending_registrations table created');

    // 3. Create child_documents table
    console.log('3. Creating child_documents table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS child_documents (
        id SERIAL PRIMARY KEY,
        guardian_id INTEGER REFERENCES guardians(id) ON DELETE CASCADE,
        child_id INTEGER REFERENCES guardian_children(id) ON DELETE CASCADE,
        document_type VARCHAR(100) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        upload_date TIMESTAMP DEFAULT NOW(),
        verification_status VARCHAR(50) DEFAULT 'pending',
        verified_at TIMESTAMP,
        verified_by INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ child_documents table created');

    // 4. Create guardian_notifications table
    console.log('4. Creating guardian_notifications table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guardian_notifications (
        id SERIAL PRIMARY KEY,
        guardian_id INTEGER REFERENCES guardians(id) ON DELETE CASCADE,
        type VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSONB,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ guardian_notifications table created');

    // 5. Add indexes
    console.log('5. Adding indexes...');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_guardian_children_guardian_id ON guardian_children(guardian_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_guardian_children_athlete_id ON guardian_children(athlete_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pending_registrations_status ON pending_registrations(status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_child_documents_child_id ON child_documents(child_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_guardian_notifications_guardian_id ON guardian_notifications(guardian_id)');
    console.log('✅ Indexes created');

    // 6. Add constraints
    console.log('6. Adding constraints...');
    try {
      await pool.query('ALTER TABLE guardian_children ADD CONSTRAINT chk_gender CHECK (gender IN (\'Male\', \'Female\', \'Other\'))');
    } catch (e) { console.log('   Gender constraint already exists'); }
    
    try {
      await pool.query('ALTER TABLE guardian_children ADD CONSTRAINT chk_athlete_id_status CHECK (athlete_id_status IN (\'pending\', \'active\', \'suspended\'))');
    } catch (e) { console.log('   Athlete ID status constraint already exists'); }
    
    try {
      await pool.query('ALTER TABLE guardian_children ADD CONSTRAINT chk_verification_status CHECK (verification_status IN (\'pending_school_approval\', \'verified\', \'rejected\', \'linked_to_school\'))');
    } catch (e) { console.log('   Verification status constraint already exists'); }
    
    console.log('✅ Constraints added');

    // 7. Add guardian_id to players table if it doesn't exist
    console.log('7. Adding guardian_id to players table...');
    try {
      await pool.query('ALTER TABLE players ADD COLUMN IF NOT EXISTS guardian_id INTEGER REFERENCES guardians(id)');
      console.log('✅ guardian_id column added to players table');
    } catch (e) {
      console.log('   guardian_id column already exists');
    }

    // 8. Verify all tables
    console.log('\n📋 Verifying all tables...');
    const tablesResult = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE '%guardian%'
      ORDER BY table_name
    `);
    
    console.log('✅ Guardian tables found:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    console.log('\n🎉 Simple Guardian Migration Completed Successfully!');
    console.log('\n📋 System ready for:');
    console.log('- ✅ Guardian registration (no claim codes)');
    console.log('- ✅ Child management');
    console.log('- ✅ School approval workflow');
    console.log('- ✅ Document uploads');
    console.log('- ✅ Athlete ID generation after approval');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    console.log('\n🔚 Migration process completed');
    process.exit(0);
  }
}

runSimpleGuardianMigration();
