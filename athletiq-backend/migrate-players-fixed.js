// migrate-players-fixed.js
// Fixed migration script with proper column mappings

const { pool } = require('./src/config/db');

async function migratePlayersBackup() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting players backup migration...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Check if backup table exists
    const backupExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'players_backup_20250714'
      );
    `);
    
    if (!backupExists.rows[0].exists) {
      console.log('❌ Backup table players_backup_20250714 does not exist');
      return;
    }
    
    // Count records
    const backupCount = await client.query('SELECT COUNT(*) as count FROM players_backup_20250714');
    const currentCount = await client.query('SELECT COUNT(*) as count FROM players');
    
    console.log(`📊 Found ${backupCount.rows[0].count} records in backup table`);
    console.log(`👥 Current players table has ${currentCount.rows[0].count} records`);
    
    // Insert records with proper column mapping
    console.log('📥 Migrating records with column mapping...');
    
    const insertQuery = `
      INSERT INTO players (
        athlete_id,
        full_name,
        full_name_nepali,
        profile_photo_url,
        gender,
        date_of_birth,
        nationality,
        grade,
        section,
        guardian_name,
        relationship_to_player,
        guardian_phone,
        address,
        province,
        district,
        municipality_or_rural_municipality,
        ward_no,
        school_id,
        created_by,
        created_at,
        updated_at
      )
      SELECT 
        gen_random_uuid() as athlete_id,
        COALESCE(full_name, 'Unknown') as full_name,
        full_name_nep as full_name_nepali,
        profile_photo_url,
        CASE 
          WHEN gender = 'M' THEN 'Male'
          WHEN gender = 'F' THEN 'Female'
          WHEN gender IN ('Male', 'Female', 'Other') THEN gender
          ELSE 'Other'
        END as gender,
        COALESCE(date_of_birth, '1990-01-01'::date) as date_of_birth,
        nationality,
        CASE 
          WHEN class IN ('1','2','3','4','5','6','7','8','9','10','11','12') THEN class
          ELSE '1'
        END as grade,
        section,
        COALESCE(guardian_name, 'Unknown Guardian') as guardian_name,
        CASE 
          WHEN guardian_relation IN ('Father', 'Mother', 'Guardian', 'Uncle', 'Aunt', 'Grandfather', 'Grandmother', 'Other') 
          THEN guardian_relation
          ELSE 'Guardian'
        END as relationship_to_player,
        COALESCE(guardian_contact, contact_no, 'N/A') as guardian_phone,
        COALESCE(address, 'Address not provided') as address,
        province,
        district,
        municipality as municipality_or_rural_municipality,
        ward as ward_no,
        COALESCE(school_id, 1) as school_id,
        created_by,
        created_at,
        updated_at
      FROM players_backup_20250714
      WHERE NOT EXISTS (
        SELECT 1 FROM players 
        WHERE players.full_name = players_backup_20250714.full_name 
        AND players.school_id = players_backup_20250714.school_id
        AND players.date_of_birth = players_backup_20250714.date_of_birth
      )
      ORDER BY id;
    `;
    
    const result = await client.query(insertQuery);
    console.log(`✅ Migrated ${result.rowCount} new records (duplicates skipped)`);
    
    // Update sequence
    const newMaxId = await client.query('SELECT MAX(id) as max_id FROM players');
    if (newMaxId.rows[0].max_id) {
      await client.query(`SELECT setval('players_id_seq', ${newMaxId.rows[0].max_id});`);
      console.log(`🔧 Updated players_id_seq to ${newMaxId.rows[0].max_id}`);
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('🎉 Migration completed successfully!');
    
    // Final count
    const finalCount = await client.query('SELECT COUNT(*) as count FROM players');
    console.log(`📊 Players table now has ${finalCount.rows[0].count} total records`);
    
  } catch (error) {
    console.log('❌ Migration failed:', error.message);
    console.log('Stack:', error.stack);
    await client.query('ROLLBACK');
  } finally {
    client.release();
    process.exit(0);
  }
}

// Run migration
migratePlayersBackup().catch(console.error);
