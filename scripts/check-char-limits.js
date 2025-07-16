/**
 * Check Character Limits in Players Table
 */

const { pool } = require('./athletiq-backend/src/config/db');

async function checkCharacterLimits() {
    try {
        console.log('🔍 Checking character limits in players table...\n');
        
        const schemaQuery = `
            SELECT 
                column_name, 
                data_type, 
                character_maximum_length,
                is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'players' 
            AND data_type = 'character varying'
            AND character_maximum_length IS NOT NULL
            ORDER BY character_maximum_length, column_name;
        `;
        
        const result = await pool.query(schemaQuery);
        
        console.log('📊 Character varying fields with length limits:');
        result.rows.forEach(row => {
            console.log(`  ${row.column_name}: max ${row.character_maximum_length} chars (nullable: ${row.is_nullable})`);
        });
        
        // Test our data against limits
        console.log('\n🧪 Testing our data:');
        const testName = 'Test Athlete John';
        console.log(`  full_name length: ${testName.length} chars`);
        
        // Find potential problem fields
        const shortFields = result.rows.filter(row => row.character_maximum_length <= 25);
        console.log('\n⚠️  Potentially problematic short fields:');
        shortFields.forEach(row => {
            console.log(`  ${row.column_name}: max ${row.character_maximum_length} chars`);
        });
        
    } catch (error) {
        console.error('❌ Error checking limits:', error.message);
    }
    
    process.exit(0);
}

checkCharacterLimits();
