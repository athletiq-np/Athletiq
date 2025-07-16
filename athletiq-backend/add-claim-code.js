/**
 * Add claim_code column to players table for Phase 1
 */

const { pool } = require('./src/config/db');

async function addClaimCodeColumn() {
    try {
        console.log('🔄 Adding claim_code column to players table...');
        
        const result = await pool.query(`
            ALTER TABLE players 
            ADD COLUMN IF NOT EXISTS claim_code VARCHAR(8) UNIQUE
        `);
        
        console.log('✅ Successfully added claim_code column');
        
        // Add some additional columns that might be needed
        await pool.query(`
            ALTER TABLE players 
            ADD COLUMN IF NOT EXISTS registration_status VARCHAR(20) DEFAULT 'pending'
        `);
        
        console.log('✅ Successfully added registration_status column');
        
        // Verify the columns were added
        const columns = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'players' 
            AND column_name IN ('claim_code', 'registration_status')
            ORDER BY column_name
        `);
        
        console.log('✅ Verification - New columns found:', columns.rows.map(r => r.column_name));
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error adding columns:', error.message);
        process.exit(1);
    }
}

addClaimCodeColumn();
