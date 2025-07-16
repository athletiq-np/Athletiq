/**
 * Check Database Schema for Phase 1 Requirements
 */

const { pool } = require('./athletiq-backend/src/config/db');

async function checkSchema() {
    try {
        console.log('🔍 Checking database schema for Phase 1 requirements...\n');
        
        // Check if claim_code column exists in players table
        const schemaQuery = `
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'players' 
            AND column_name IN ('claim_code', 'verification_status', 'profile_status', 'profile_completion')
            ORDER BY column_name;
        `;
        
        const result = await pool.query(schemaQuery);
        
        console.log('📊 Current Phase 1 related columns in players table:');
        if (result.rows.length > 0) {
            result.rows.forEach(row => {
                console.log(`  ✅ ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
            });
        } else {
            console.log('  ❌ No Phase 1 columns found');
        }
        
        // Check all columns in players table
        const allColumnsQuery = `
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'players'
            ORDER BY ordinal_position;
        `;
        
        const allColumns = await pool.query(allColumnsQuery);
        console.log('\n📋 All columns in players table:');
        allColumns.rows.forEach(row => {
            console.log(`  - ${row.column_name} (${row.data_type})`);
        });
        
    } catch (error) {
        console.error('❌ Error checking schema:', error.message);
    }
    
    process.exit(0);
}

checkSchema();
