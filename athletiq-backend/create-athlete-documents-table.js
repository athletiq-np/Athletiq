const pool = require('./src/config/db');

async function createAthleteDocumentsTable() {
  try {
    console.log('Creating athlete_documents table...');
    
    // Create athlete_documents table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS athlete_documents (
        id SERIAL PRIMARY KEY,
        athlete_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('profile_photo', 'birth_certificate', 'medical_certificate', 'school_certificate', 'other')),
        file_path VARCHAR(500) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100),
        file_size INTEGER,
        upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        uploaded_by INTEGER REFERENCES guardians(id),
        is_verified BOOLEAN DEFAULT FALSE,
        verification_date TIMESTAMP WITH TIME ZONE,
        verification_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_athlete_documents_athlete_id 
      ON athlete_documents(athlete_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_athlete_documents_type 
      ON athlete_documents(document_type);
    `);

    // Add new columns to players table for enhanced profile
    console.log('Adding enhanced profile columns to players table...');
    
    const enhancementQueries = [
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS blood_group VARCHAR(5)`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS height DECIMAL(5,2)`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2)`, 
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(20)`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS medical_conditions TEXT`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS sports_interests JSONB DEFAULT '[]'`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS achievements TEXT`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS profile_photo VARCHAR(500)`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS birth_certificate_path VARCHAR(500)`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS documents_verified BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE players ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0`
    ];

    for (const query of enhancementQueries) {
      try {
        await pool.query(query);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.error('Error adding column:', error.message);
        }
      }
    }

    console.log('✅ Athlete documents table and enhanced profile columns created successfully!');
    
    // Verify the tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('athlete_documents', 'players')
      ORDER BY table_name;
    `);
    
    console.log('📋 Tables confirmed:', tablesResult.rows.map(row => row.table_name));
    
    // Check new columns in players table
    const columnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'players' 
      AND column_name IN ('blood_group', 'height', 'weight', 'emergency_contact', 'medical_conditions', 'sports_interests', 'achievements', 'profile_photo')
      ORDER BY column_name;
    `);
    
    console.log('📋 New columns in players table:', columnsResult.rows);
    
  } catch (error) {
    console.error('❌ Error creating athlete documents table:', error);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  createAthleteDocumentsTable()
    .then(() => {
      console.log('Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = createAthleteDocumentsTable;
