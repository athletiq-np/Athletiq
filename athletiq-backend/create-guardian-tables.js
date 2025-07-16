// create-guardian-tables.js
const { pool } = require('./src/config/db');

async function createGuardianTables() {
  const client = await pool.connect();
  
  try {
    console.log('🏗️ Creating Guardian System Tables...');
    
    // Create guardian_claims table
    await client.query(`
      CREATE TABLE IF NOT EXISTS guardian_claims (
        id SERIAL PRIMARY KEY,
        athlete_id INTEGER NOT NULL,
        guardian_phone VARCHAR(20) NOT NULL,
        guardian_email VARCHAR(255),
        claim_code VARCHAR(10) NOT NULL UNIQUE,
        status VARCHAR(20) DEFAULT 'pending',
        expires_at TIMESTAMP NOT NULL,
        claimed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (athlete_id) REFERENCES players(id) ON DELETE CASCADE,
        UNIQUE(athlete_id)
      );
    `);
    console.log('✅ Created guardian_claims table');
    
    // Create guardian_profiles table for completed registrations
    await client.query(`
      CREATE TABLE IF NOT EXISTS guardian_profiles (
        id SERIAL PRIMARY KEY,
        athlete_id INTEGER NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        address TEXT,
        occupation VARCHAR(100),
        education_level VARCHAR(50),
        relationship VARCHAR(50) NOT NULL,
        emergency_contact_name VARCHAR(255),
        emergency_contact_phone VARCHAR(20),
        id_document_type VARCHAR(50),
        id_document_number VARCHAR(100),
        id_document_url TEXT,
        photo_url TEXT,
        status VARCHAR(20) DEFAULT 'active',
        verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (athlete_id) REFERENCES players(id) ON DELETE CASCADE,
        UNIQUE(athlete_id)
      );
    `);
    console.log('✅ Created guardian_profiles table');
    
    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_guardian_claims_claim_code ON guardian_claims(claim_code);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_guardian_claims_athlete_id ON guardian_claims(athlete_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_guardian_profiles_athlete_id ON guardian_profiles(athlete_id);');
    console.log('✅ Created indexes');
    
    // Generate sample claim codes for existing players
    console.log('\n🔐 Generating claim codes for existing players...');
    
    const playersWithoutClaims = await client.query(`
      SELECT id, full_name, guardian_name, guardian_phone 
      FROM players 
      WHERE claim_code IS NULL 
      AND guardian_phone IS NOT NULL
      LIMIT 10;
    `);
    
    for (const player of playersWithoutClaims.rows) {
      const claimCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Update player with claim code
      await client.query(
        'UPDATE players SET claim_code = $1 WHERE id = $2',
        [claimCode, player.id]
      );
      
      // Create guardian claim entry
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
      
      await client.query(`
        INSERT INTO guardian_claims (athlete_id, guardian_phone, claim_code, expires_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (athlete_id) DO NOTHING;
      `, [player.id, player.guardian_phone, claimCode, expiresAt]);
      
      console.log(`✅ Generated claim code ${claimCode} for ${player.full_name}`);
    }
    
    // Check final status
    const claimCount = await client.query('SELECT COUNT(*) FROM guardian_claims;');
    const profileCount = await client.query('SELECT COUNT(*) FROM guardian_profiles;');
    const playersWithCodes = await client.query('SELECT COUNT(*) FROM players WHERE claim_code IS NOT NULL;');
    
    console.log('\n📊 Guardian System Status:');
    console.log(`✅ Guardian claims: ${claimCount.rows[0].count}`);
    console.log(`✅ Guardian profiles: ${profileCount.rows[0].count}`);
    console.log(`✅ Players with claim codes: ${playersWithCodes.rows[0].count}`);
    
    console.log('\n🎉 Guardian system setup complete!');
    
  } catch (error) {
    console.error('❌ Guardian setup failed:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    process.exit(0);
  }
}

createGuardianTables();
