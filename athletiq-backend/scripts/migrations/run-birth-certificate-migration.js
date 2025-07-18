const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const pool = new Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'athletiq',
        password: 'Ardnepu8',
        port: 5432,
    });

    try {
        console.log('🚀 Running birth certificate fields migration...');
        
        const migrationPath = path.join(__dirname, 'migrations', 'add_birth_certificate_fields.sql');
        const migration = fs.readFileSync(migrationPath, 'utf8');
        
        // Split migration into individual statements
        const statements = migration.split(';').filter(stmt => stmt.trim().length > 0);
        
        for (const statement of statements) {
            const trimmedStatement = statement.trim();
            if (trimmedStatement && !trimmedStatement.startsWith('--') && !trimmedStatement.startsWith('COMMENT')) {
                try {
                    await pool.query(trimmedStatement);
                    console.log('✅ Executed statement successfully');
                } catch (err) {
                    // Ignore "already exists" errors
                    if (err.message.includes('already exists')) {
                        console.log('⚠️  Statement already executed, skipping');
                    } else {
                        console.error('❌ Statement failed:', err.message);
                    }
                }
            }
        }
        
        console.log('\n🔍 Verifying new columns...');
        
        // Verify new columns exist
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'players' 
            AND column_name IN ('full_name_nepali', 'father_name', 'birth_certificate_no', 'ocr_confidence_score', 'profile_completion_percentage')
            ORDER BY column_name
        `);
        
        console.log('\n📋 New player columns:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name} (${row.data_type})`);
        });
        
        // Check new tables
        const tableCheck = await pool.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_name IN ('field_verifications', 'ocr_processing_logs')
            AND table_schema = 'public'
        `);
        
        console.log('\n📊 New tables created:');
        tableCheck.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });
        
        console.log('\n🎉 Migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

runMigration();
