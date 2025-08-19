const { pool } = require('./src/config/db');

async function checkGuardiansTable() {
    try {
        console.log('🔍 Checking guardians table structure...');
        
        const result = await pool.query(
            'SELECT column_name FROM information_schema.columns WHERE table_name = $1', 
            ['guardians']
        );
        
        console.log('Guardians table columns:', result.rows.map(r => r.column_name));
        
        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkGuardiansTable();
