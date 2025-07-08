#!/usr/bin/env node
//
// 🔧 ATHLETIQ - Simple Foreign Key Migration
//
// This script adds missing foreign keys and columns one by one
//

const pool = require('./src/config/db');

async function addMissingConstraints() {
  try {
    console.log('🔧 Adding missing database constraints and columns...\n');

    const migrations = [
      // Add missing columns to matches table
      {
        name: 'Add winner_team_id to matches',
        sql: `ALTER TABLE matches ADD COLUMN IF NOT EXISTS winner_team_id INTEGER`
      },
      {
        name: 'Add home_score to matches',
        sql: `ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_score INTEGER DEFAULT 0`
      },
      {
        name: 'Add away_score to matches',
        sql: `ALTER TABLE matches ADD COLUMN IF NOT EXISTS away_score INTEGER DEFAULT 0`
      },
      {
        name: 'Add ended_at to matches',
        sql: `ALTER TABLE matches ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP`
      },
      // Add foreign key constraints
      {
        name: 'FK: tournaments.created_by → users.id',
        sql: `ALTER TABLE tournaments ADD CONSTRAINT fk_tournaments_created_by 
              FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL`
      },
      {
        name: 'FK: tournaments.organizer_id → users.id',
        sql: `ALTER TABLE tournaments ADD CONSTRAINT fk_tournaments_organizer 
              FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE SET NULL`
      },
      {
        name: 'FK: tournament_teams.tournament_id → tournaments.id',
        sql: `ALTER TABLE tournament_teams ADD CONSTRAINT fk_tournament_teams_tournament 
              FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE`
      },
      {
        name: 'FK: tournament_registrations.tournament_id → tournaments.id',
        sql: `ALTER TABLE tournament_registrations ADD CONSTRAINT fk_tournament_registrations_tournament 
              FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE`
      },
      {
        name: 'FK: tournament_audit_log.tournament_id → tournaments.id',
        sql: `ALTER TABLE tournament_audit_log ADD CONSTRAINT fk_tournament_audit_log_tournament 
              FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE`
      },
      {
        name: 'FK: tournament_audit_log.user_id → users.id',
        sql: `ALTER TABLE tournament_audit_log ADD CONSTRAINT fk_tournament_audit_log_user 
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL`
      },
      {
        name: 'FK: matches.tournament_id → tournaments.id',
        sql: `ALTER TABLE matches ADD CONSTRAINT fk_matches_tournament 
              FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE`
      },
      {
        name: 'FK: matches.winner_team_id → tournament_teams.id',
        sql: `ALTER TABLE matches ADD CONSTRAINT fk_matches_winner_team 
              FOREIGN KEY (winner_team_id) REFERENCES tournament_teams(id) ON DELETE SET NULL`
      },
      // Add check constraints
      {
        name: 'CHECK: tournament status values',
        sql: `ALTER TABLE tournaments ADD CONSTRAINT chk_tournament_status 
              CHECK (status IN ('draft', 'pending', 'published', 'registration_open', 'registration_closed', 'active', 'completed', 'cancelled', 'archived'))`
      }
    ];

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const migration of migrations) {
      try {
        console.log(`📝 ${migration.name}...`);
        await pool.query(migration.sql);
        console.log(`   ✅ Success`);
        successCount++;
      } catch (error) {
        if (error.message.includes('already exists') || 
            error.message.includes('already has') ||
            error.message.includes('duplicate key') ||
            error.message.includes('constraint') && error.message.includes('already')) {
          console.log(`   ⚠️  Skipped (already exists)`);
          skipCount++;
        } else {
          console.log(`   ❌ Error: ${error.message.split('\n')[0]}`);
          errorCount++;
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ⚠️  Skipped: ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

    // Verify the final state
    console.log('\n🔍 Verifying tournament-related foreign keys...');
    
    const fkQuery = `
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND (tc.table_name LIKE 'tournament%' OR tc.table_name = 'matches')
      ORDER BY tc.table_name, kcu.column_name
    `;
    
    const fkResult = await pool.query(fkQuery);
    console.log(`\n📋 Tournament-related foreign keys (${fkResult.rows.length}):`);
    fkResult.rows.forEach(row => {
      console.log(`   ${row.table_name}.${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`);
    });

    // Verify matches table columns
    console.log('\n🔍 Verifying matches table columns...');
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'matches'
      ORDER BY ordinal_position
    `;
    
    const columnsResult = await pool.query(columnsQuery);
    console.log(`\n📋 Matches table columns (${columnsResult.rows.length}):`);
    columnsResult.rows.forEach(row => {
      const nullable = row.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
      const defaultVal = row.column_default ? ` DEFAULT ${row.column_default}` : '';
      console.log(`   ${row.column_name}: ${row.data_type} ${nullable}${defaultVal}`);
    });

    console.log('\n🎉 Database constraints migration completed!');
    return { success: true, successCount, skipCount, errorCount };

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the migration
if (require.main === module) {
  addMissingConstraints()
    .then((result) => {
      if (result.success) {
        console.log('\n🎉 Migration completed successfully!');
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

module.exports = { addMissingConstraints };
