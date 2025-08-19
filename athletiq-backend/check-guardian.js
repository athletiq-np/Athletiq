const { pool } = require('./src/config/db');

async function checkGuardianAccount() {
    try {
        console.log('🔍 Checking guardian account...');
        
        const result = await pool.query(
            'SELECT id, email, password_hash, role FROM users WHERE email = $1', 
            ['guardian@demo.com']
        );
        
        if (result.rows.length > 0) {
            const user = result.rows[0];
            console.log('✅ Guardian found:');
            console.log('ID:', user.id);
            console.log('Email:', user.email);
            console.log('Role:', user.role);
            console.log('Has password hash:', !!user.password_hash);
        } else {
            console.log('❌ Guardian account NOT FOUND');
            
            // Check if any users exist
            const allUsers = await pool.query('SELECT email, role FROM users LIMIT 5');
            console.log('Available users:', allUsers.rows);
        }
        
        await pool.end();
    } catch (error) {
        console.error('❌ Database error:', error.message);
    }
}

checkGuardianAccount();
