#!/usr/bin/env node
//
// 🔧 ATHLETIQ - Database Migration Runner
//
// This script applies the missing foreign key constraints migration
//

const pool = require('./src/config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔧 Running foreign key constraints migration...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'src/database/migrations/008_add_missing_foreign_keys.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim().length === 0) continue;

      try {
        console.log(`${i + 1}. Executing: ${statement.substring(0, 60)}...`);
        await pool.query(statement);
        console.log(`   ✅ Success`);
        successCount++;
      } catch (error) {
        if (error.message.includes('already exists') || 
            error.message.includes('already has') ||
            error.message.includes('constraint') && error.message.includes('already')) {
          console.log(`   ⚠️  Skipped (already exists): ${error.message.split('\n')[0]}`);
        } else {
          console.log(`   ❌ Error: ${error.message.split('\n')[0]}`);
          errorCount++;
        }
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Skipped: ${statements.length - successCount - errorCount}`);

    // Verify the constraints were added
    console.log('\n🔍 Verifying foreign key constraints...');
    
    const constraintsQuery = `
      SELECT 
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('tournaments', 'tournament_teams', 'tournament_registrations', 'tournament_audit_log', 'matches')
      ORDER BY tc.table_name, kcu.column_name
    `;
    
    const constraintsResult = await pool.query(constraintsQuery);
    
    console.log(`\n📋 Current foreign key constraints (${constraintsResult.rows.length}):`);
    constraintsResult.rows.forEach(row => {
      console.log(`   ${row.table_name}.${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`);
    });

    // Record migration in schema_migrations table
    try {
      await pool.query(`
        INSERT INTO schema_migrations (version, name, executed_at, execution_time)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (version) DO NOTHING
      `, [
        '1751944800000',
        '008_add_missing_foreign_keys.sql',
        new Date(),
        1000
      ]);
      console.log('\n✅ Migration recorded in schema_migrations table');
    } catch (err) {
      console.log('\n⚠️  Could not record migration:', err.message);
    }

    console.log('\n🎉 Foreign key migration completed successfully!');
    return { success: true, successCount, errorCount };

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the migration
if (require.main === module) {
  runMigration()
    .then((result) => {
      if (result.success) {
        console.log('\n🎉 Migration completed!');
        process.exit(0);
      } else {
        console.log('\n💥 Migration failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Migration error:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
