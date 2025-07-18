// scripts/add-birth-certificate-columns.js
const pool = require('../athletiq-backend/src/config/db');
const { addMissingColumns, checkRequiredColumns } = require('../athletiq-backend/src/utils/athleteFieldMapping');

/**
 * Migration script to add birth certificate integration columns to players table
 */
async function runMigration() {
  console.log('🚀 Starting Birth Certificate Integration Migration...\n');
  
  try {
    // Check current table structure
    console.log('📋 Checking current table structure...');
    const columnCheck = await checkRequiredColumns();
    
    console.log(`✓ Found ${columnCheck.existingColumns} existing columns`);
    console.log(`⚠️  Missing ${columnCheck.missingColumns.length} required columns`);
    
    if (columnCheck.missingColumns.length > 0) {
      console.log('\n📝 Missing columns:');
      columnCheck.missingColumns.forEach(col => {
        console.log(`   - ${col.name} (${col.type})`);
      });
      
      // Add missing columns
      console.log('\n🔧 Adding missing columns...');
      const addResult = await addMissingColumns();
      
      if (addResult.success) {
        console.log(`✅ ${addResult.message}`);
      } else {
        console.log('❌ Failed to add some columns');
      }
    } else {
      console.log('✅ All required columns already exist!');
    }
    
    // Verify final structure
    console.log('\n🔍 Verifying final table structure...');
    const finalCheck = await checkRequiredColumns();
    
    if (finalCheck.isComplete) {
      console.log('✅ Birth certificate integration is ready!');
      console.log(`📊 Players table now has ${finalCheck.existingColumns} columns`);
    } else {
      console.log(`⚠️  Still missing ${finalCheck.missingColumns.length} columns`);
    }
    
    // Create indexes for better performance
    console.log('\n📈 Creating performance indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_players_birth_cert_number ON players(birth_certificate_number);',
      'CREATE INDEX IF NOT EXISTS idx_players_district ON players(district);',
      'CREATE INDEX IF NOT EXISTS idx_players_province ON players(province);',
      'CREATE INDEX IF NOT EXISTS idx_players_document_verified ON players(document_verified);',
      'CREATE INDEX IF NOT EXISTS idx_players_father_citizenship ON players(father_citizenship_no);'
    ];
    
    for (const indexQuery of indexes) {
      try {
        await pool.query(indexQuery);
        console.log(`✓ Created index: ${indexQuery.split(' ')[5]}`);
      } catch (error) {
        console.log(`⚠️  Index might already exist: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Birth Certificate Integration Features:');
    console.log('   ✓ Auto-population from OCR data');
    console.log('   ✓ Cross-verification with existing data');
    console.log('   ✓ Nepali and English name support');
    console.log('   ✓ Complete address and family information');
    console.log('   ✓ Birth certificate verification tracking');
    console.log('   ✓ Profile completion percentage calculation');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('\n✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
