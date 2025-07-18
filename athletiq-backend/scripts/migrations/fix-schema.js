// Fix athlete_id schema to support Nepal format
const { query } = require('./src/config/db');

async function fixSchema() {
  try {
    console.log('🔧 Starting schema migration for Nepal athlete ID format...');
    
    // Step 1: Add a backup column first
    console.log('Step 1: Creating backup column...');
    await query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS athlete_id_old UUID`);
    await query(`UPDATE players SET athlete_id_old = athlete_id WHERE athlete_id_old IS NULL`);
    console.log('✅ Backup created');
    
    // Step 2: Drop foreign key constraints that might prevent the change
    console.log('Step 2: Dropping foreign key constraints...');
    try {
      await query(`ALTER TABLE guardian_students DROP CONSTRAINT IF EXISTS guardian_students_athlete_id_fkey`);
      console.log('✅ Dropped guardian_students constraint');
    } catch (error) {
      console.log('⚠️ Guardian_students constraint not found or already dropped');
    }
    
    // Step 3: Drop the unique constraint on athlete_id
    console.log('Step 3: Dropping unique constraint...');
    try {
      await query(`ALTER TABLE players DROP CONSTRAINT IF EXISTS players_athlete_id_key`);
      console.log('✅ Dropped unique constraint');
    } catch (error) {
      console.log('⚠️ Unique constraint not found or already dropped');
    }
    
    // Step 4: Change the column type
    console.log('Step 4: Changing column type...');
    await query(`ALTER TABLE players ALTER COLUMN athlete_id TYPE VARCHAR(50) USING athlete_id::text`);
    console.log('✅ Changed athlete_id to VARCHAR(50)');
    
    // Step 5: Add unique constraint back
    console.log('Step 5: Adding unique constraint back...');
    await query(`ALTER TABLE players ADD CONSTRAINT players_athlete_id_key UNIQUE(athlete_id)`);
    console.log('✅ Added unique constraint back');
    
    // Step 6: Verify the change
    console.log('Step 6: Verifying changes...');
    const result = await query(`SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'athlete_id'`);
    console.log('Updated field info:', result.rows[0]);
    
    // Step 7: Show sample data
    const sample = await query(`SELECT id, athlete_id, athlete_id_old FROM players LIMIT 3`);
    console.log('Sample data after migration:', sample.rows);
    
    console.log('🎉 Schema migration completed successfully!');
    console.log('✅ athlete_id field now supports Nepal format (NP + 6 alphanumeric)');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Error details:', error);
  }
  
  process.exit(0);
}

fixSchema();
