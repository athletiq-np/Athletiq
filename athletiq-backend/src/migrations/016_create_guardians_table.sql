-- Create guardians table for authentication system
-- This table stores guardian account information for login/registration

CREATE TABLE IF NOT EXISTS guardians (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    occupation VARCHAR(100),
    education_level VARCHAR(50) CHECK (education_level IN ('primary', 'secondary', 'higher_secondary', 'bachelors', 'masters', 'phd')),
    relationship VARCHAR(50) CHECK (relationship IN ('parent', 'guardian', 'relative', 'other')),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    id_document_type VARCHAR(50) CHECK (id_document_type IN ('citizenship', 'passport', 'driving_license')),
    id_document_number VARCHAR(100),
    auth_provider VARCHAR(20) DEFAULT 'local' CHECK (auth_provider IN ('local', 'google')),
    google_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
    email_verified BOOLEAN DEFAULT false,
    profile_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_guardians_email ON guardians(email);
CREATE INDEX IF NOT EXISTS idx_guardians_google_id ON guardians(google_id);
CREATE INDEX IF NOT EXISTS idx_guardians_status ON guardians(status);
CREATE INDEX IF NOT EXISTS idx_guardians_phone ON guardians(phone);

-- Create guardian_students junction table for managing student claims
CREATE TABLE IF NOT EXISTS guardian_students (
    id SERIAL PRIMARY KEY,
    guardian_id INTEGER NOT NULL REFERENCES guardians(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES players(athlete_id) ON DELETE CASCADE,
    relationship VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(guardian_id, athlete_id)
);

-- Create indexes for guardian_students
CREATE INDEX IF NOT EXISTS idx_guardian_students_guardian_id ON guardian_students(guardian_id);
CREATE INDEX IF NOT EXISTS idx_guardian_students_athlete_id ON guardian_students(athlete_id);
CREATE INDEX IF NOT EXISTS idx_guardian_students_status ON guardian_students(status);

-- Create trigger to update guardian timestamp
CREATE OR REPLACE FUNCTION update_guardians_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_guardians_timestamp_trigger ON guardians;
CREATE TRIGGER update_guardians_timestamp_trigger
    BEFORE UPDATE ON guardians
    FOR EACH ROW
    EXECUTE FUNCTION update_guardians_timestamp();

-- Add comments
COMMENT ON TABLE guardians IS 'Guardian accounts for authentication and profile management';
COMMENT ON TABLE guardian_students IS 'Junction table linking guardians to their students/athletes';
COMMENT ON COLUMN guardians.status IS 'Account status: pending (awaiting verification), active, suspended';
COMMENT ON COLUMN guardian_students.status IS 'Student claim status: pending (awaiting approval), approved, rejected';
