// migrate-players-backup.js
// Script to migrate data from players_backup_20250714 to players table

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
    
    // Count records in backup table
    const backupCount = await client.query('SELECT COUNT(*) as count FROM players_backup_20250714');
    console.log(`📊 Found ${backupCount.rows[0].count} records in backup table`);
    
    if (backupCount.rows[0].count === 0) {
      console.log('⚠️ No records to migrate');
      return;
    }
    
    // Count current records in players table
    const currentCount = await client.query('SELECT COUNT(*) as count FROM players');
    console.log(`👥 Current players table has ${currentCount.rows[0].count} records`);
    
    // Get column names from both tables to ensure compatibility
    const backupColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'players_backup_20250714' 
      ORDER BY ordinal_position;
    `);
    
    const playersColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'players' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Backup table columns:', backupColumns.rows.map(r => r.column_name).join(', '));
    console.log('📋 Players table columns:', playersColumns.rows.map(r => r.column_name).join(', '));
    
    // Find common columns (excluding id to avoid conflicts)
    const backupColNames = backupColumns.rows.map(r => r.column_name).filter(col => col !== 'id');
    const playersColNames = playersColumns.rows.map(r => r.column_name).filter(col => col !== 'id');
    const commonColumns = backupColNames.filter(col => playersColNames.includes(col));
    
    console.log('🔗 Common columns for migration:', commonColumns.join(', '));
    
    if (commonColumns.length === 0) {
      console.log('❌ No compatible columns found for migration');
      return;
    }
    
    // Check for potential ID conflicts
    const maxPlayerId = await client.query('SELECT COALESCE(MAX(id), 0) as max_id FROM players');
    const maxBackupId = await client.query('SELECT COALESCE(MAX(id), 0) as max_id FROM players_backup_20250714');
    
    console.log(`🔢 Max player ID: ${maxPlayerId.rows[0].max_id}, Max backup ID: ${maxBackupId.rows[0].max_id}`);
    
    // Option 1: If current players table is empty, we can preserve IDs
    if (currentCount.rows[0].count === 0) {
      console.log('📥 Migrating with original IDs (players table is empty)...');
      
      const columnsWithId = ['id', ...commonColumns];
      const insertQuery = `
        INSERT INTO players (${columnsWithId.join(', ')})
        SELECT ${columnsWithId.join(', ')}
        FROM players_backup_20250714
        ORDER BY id;
      `;
      
      const result = await client.query(insertQuery);
      console.log(`✅ Migrated ${result.rowCount} records with original IDs`);
      
    } else {
      // Option 2: Insert without IDs, let auto-increment handle it
      console.log('📥 Migrating with new auto-generated IDs...');
      
      // Create a column mapping that handles type conversions
      const columnMapping = commonColumns.map(col => {
        if (col === 'athlete_id') {
          // Generate new UUID for all records since backup has non-UUID format
          return `gen_random_uuid() as athlete_id`;
        }
        return col;
      }).join(', ');
      
      const insertQuery = `
        INSERT INTO players (${commonColumns.join(', ')})
        SELECT ${columnMapping}
        FROM players_backup_20250714
        WHERE NOT EXISTS (
          SELECT 1 FROM players 
          WHERE players.full_name = players_backup_20250714.full_name 
          AND players.school_id = players_backup_20250714.school_id
        )
        ORDER BY id;
      `;
      
      const result = await client.query(insertQuery);
      console.log(`✅ Migrated ${result.rowCount} new records (duplicates skipped)`);
    }
    
    // Update sequence if we preserved IDs
    if (currentCount.rows[0].count === 0) {
      const newMaxId = await client.query('SELECT MAX(id) as max_id FROM players');
      if (newMaxId.rows[0].max_id) {
        await client.query(`SELECT setval('players_id_seq', ${newMaxId.rows[0].max_id});`);
        console.log(`🔧 Updated players_id_seq to ${newMaxId.rows[0].max_id}`);
      }
    }
    
    // Final count
    const finalCount = await client.query('SELECT COUNT(*) as count FROM players');
    console.log(`📊 Final players table count: ${finalCount.rows[0].count}`);
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('✅ Migration completed successfully!');
    
    // Optional: Rename backup table to mark as processed
    await client.query('ALTER TABLE players_backup_20250714 RENAME TO players_backup_20250714_migrated;');
    console.log('📝 Backup table renamed to players_backup_20250714_migrated');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    client.release();
    process.exit(0);
  }
}

// Run migration
migratePlayersBackup().catch(console.error);
