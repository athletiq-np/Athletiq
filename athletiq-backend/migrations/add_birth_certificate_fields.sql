-- Enhanced Athlete Profile Fields for Birth Certificate Integration
-- Run this migration to add birth certificate specific columns

-- Add birth certificate specific columns to players table
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS full_name_nepali TEXT,
ADD COLUMN IF NOT EXISTS father_name TEXT,
ADD COLUMN IF NOT EXISTS mother_name TEXT,
ADD COLUMN IF NOT EXISTS grandfather_name TEXT,
ADD COLUMN IF NOT EXISTS birth_place_province TEXT,
ADD COLUMN IF NOT EXISTS birth_place_district TEXT,
ADD COLUMN IF NOT EXISTS birth_place_municipality TEXT,
ADD COLUMN IF NOT EXISTS birth_place_ward TEXT,
ADD COLUMN IF NOT EXISTS father_citizenship_no TEXT,
ADD COLUMN IF NOT EXISTS mother_citizenship_no TEXT,
ADD COLUMN IF NOT EXISTS birth_certificate_no TEXT,
ADD COLUMN IF NOT EXISTS birth_certificate_path TEXT,
ADD COLUMN IF NOT EXISTS birth_certificate_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS document_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_notes TEXT,
ADD COLUMN IF NOT EXISTS ocr_confidence_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS requires_manual_review BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_birth_certificate_no ON players(birth_certificate_no);
CREATE INDEX IF NOT EXISTS idx_players_father_citizenship ON players(father_citizenship_no);
CREATE INDEX IF NOT EXISTS idx_players_document_verified ON players(document_verified);
CREATE INDEX IF NOT EXISTS idx_players_manual_review ON players(requires_manual_review);

-- Update athlete_documents table for enhanced verification
ALTER TABLE athlete_documents 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS verification_notes TEXT,
ADD COLUMN IF NOT EXISTS cross_check_status VARCHAR(50) DEFAULT 'pending';

-- Create a table for field verification and cross-checking
CREATE TABLE IF NOT EXISTS field_verifications (
    id SERIAL PRIMARY KEY,
    athlete_id INTEGER REFERENCES players(id),
    document_id INTEGER REFERENCES athlete_documents(id),
    field_name VARCHAR(100) NOT NULL,
    certificate_value TEXT,
    existing_value TEXT,
    verification_status VARCHAR(50) DEFAULT 'pending', -- 'verified', 'discrepancy', 'auto_populated'
    confidence_score DECIMAL(3,2),
    verified_by INTEGER REFERENCES guardians(id),
    verified_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for field verifications
CREATE INDEX IF NOT EXISTS idx_field_verifications_athlete ON field_verifications(athlete_id);
CREATE INDEX IF NOT EXISTS idx_field_verifications_status ON field_verifications(verification_status);

-- Create a table for OCR processing logs
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
);

-- Add some sample data for testing (optional)
-- This would normally be populated by the OCR system

COMMENT ON COLUMN players.full_name_nepali IS 'Full name in Nepali Devanagari script from birth certificate';
COMMENT ON COLUMN players.father_name IS 'Father full name from birth certificate';
COMMENT ON COLUMN players.mother_name IS 'Mother full name from birth certificate';
COMMENT ON COLUMN players.grandfather_name IS 'Grandfather full name from birth certificate';
COMMENT ON COLUMN players.birth_certificate_no IS 'Birth registration number from certificate';
COMMENT ON COLUMN players.father_citizenship_no IS 'Father citizenship number from birth certificate';
COMMENT ON COLUMN players.birth_certificate_verified IS 'Whether birth certificate has been verified through OCR';
COMMENT ON COLUMN players.ocr_confidence_score IS 'AI confidence score for OCR extraction (0.0 to 1.0)';
COMMENT ON COLUMN players.profile_completion_percentage IS 'Percentage of profile fields completed (0-100)';

COMMENT ON TABLE field_verifications IS 'Tracks verification status of individual fields from birth certificates';
COMMENT ON TABLE ocr_processing_logs IS 'Logs all OCR processing attempts for audit and monitoring';
