const { Pool } = require('pg');

async function runMigration() {
    const pool = new Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'athletiq',
        password: 'Ardnepu8',
        port: 5432,
    });

    try {
        console.log('🚀 Running remaining birth certificate fields migration...');
        
        // Add missing columns one by one
        const columnsToAdd = [
            'father_name TEXT',
            'mother_name TEXT',
            'grandfather_name TEXT',
            'birth_place_province TEXT',
            'birth_place_district TEXT',
            'birth_place_municipality TEXT',
            'birth_place_ward TEXT',
            'father_citizenship_no TEXT',
            'mother_citizenship_no TEXT',
            'birth_certificate_no TEXT',
            'birth_certificate_path TEXT',
            'birth_certificate_verified BOOLEAN DEFAULT FALSE',
            'document_verified BOOLEAN DEFAULT FALSE',
            'verification_notes TEXT',
            'ocr_confidence_score DECIMAL(3,2)',
            'requires_manual_review BOOLEAN DEFAULT FALSE'
        ];

        for (const column of columnsToAdd) {
            try {
                await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS ${column}`);
                console.log(`✅ Added column: ${column.split(' ')[0]}`);
            } catch (err) {
                if (err.message.includes('already exists')) {
                    console.log(`⚠️  Column already exists: ${column.split(' ')[0]}`);
                } else {
                    console.error(`❌ Failed to add column ${column.split(' ')[0]}:`, err.message);
                }
            }
        }
        
        // Create field_verifications table
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS field_verifications (
                    id SERIAL PRIMARY KEY,
                    athlete_id INTEGER REFERENCES players(id),
                    document_id INTEGER REFERENCES athlete_documents(id),
                    field_name VARCHAR(100) NOT NULL,
                    certificate_value TEXT,
                    existing_value TEXT,
                    verification_status VARCHAR(50) DEFAULT 'pending',
                    confidence_score DECIMAL(3,2),
                    verified_by INTEGER REFERENCES guardians(id),
                    verified_at TIMESTAMP,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Created field_verifications table');
        } catch (err) {
            console.log('⚠️  field_verifications table already exists or error:', err.message);
        }

        // Create ocr_processing_logs table
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS ocr_processing_logs (
                    id SERIAL PRIMARY KEY,
                    document_id INTEGER REFERENCES athlete_documents(id),
                    athlete_id INTEGER,
                    guardian_id INTEGER REFERENCES guardians(id),
                    ocr_confidence DECIMAL(3,2),
                    processing_time_ms INTEGER,
                    fields_extracted INTEGER,
                    fields_matched INTEGER,
                    fields_discrepancies INTEGER,
                    auto_populated BOOLEAN DEFAULT FALSE,
                    requires_manual_review BOOLEAN DEFAULT FALSE,
                    raw_response TEXT,
                    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Created ocr_processing_logs table');
        } catch (err) {
            console.log('⚠️  ocr_processing_logs table already exists or error:', err.message);
        }

        // Add indexes
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_players_birth_certificate_no ON players(birth_certificate_no)',
            'CREATE INDEX IF NOT EXISTS idx_players_father_citizenship ON players(father_citizenship_no)',
            'CREATE INDEX IF NOT EXISTS idx_players_document_verified ON players(document_verified)',
            'CREATE INDEX IF NOT EXISTS idx_players_manual_review ON players(requires_manual_review)',
            'CREATE INDEX IF NOT EXISTS idx_field_verifications_athlete ON field_verifications(athlete_id)',
            'CREATE INDEX IF NOT EXISTS idx_field_verifications_status ON field_verifications(verification_status)'
        ];

        for (const index of indexes) {
            try {
                await pool.query(index);
                console.log(`✅ Created index: ${index.split(' ')[5]}`);
            } catch (err) {
                console.log(`⚠️  Index creation warning: ${err.message}`);
            }
        }
        
        console.log('\n🔍 Verifying all columns...');
        
        // Verify all new columns exist
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'players' 
            AND column_name IN (
                'full_name_nepali', 'father_name', 'mother_name', 'grandfather_name',
                'birth_place_province', 'birth_place_district', 'birth_place_municipality',
                'birth_certificate_no', 'father_citizenship_no', 'ocr_confidence_score',
                'birth_certificate_verified', 'requires_manual_review', 'profile_completion_percentage'
            )
            ORDER BY column_name
        `);
        
        console.log('\n📋 All player columns:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name} (${row.data_type})`);
        });
        
        // Check all tables
        const tableCheck = await pool.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_name IN ('field_verifications', 'ocr_processing_logs', 'athlete_documents')
            AND table_schema = 'public'
            ORDER BY table_name
        `);
        
        console.log('\n📊 Related tables:');
        tableCheck.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });
        
        console.log('\n🎉 Migration completed successfully!');
        console.log('🔧 Ready for birth certificate field matching and auto-population!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

runMigration();
