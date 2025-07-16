-- Update guardian_claims table to support approval workflow
ALTER TABLE guardian_claims 
ADD COLUMN IF NOT EXISTS requires_school_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Update status enum to include new states
ALTER TABLE guardian_claims 
ALTER COLUMN status TYPE VARCHAR(50);

-- Create guardian_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS guardian_profiles (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    auth_provider VARCHAR(20) DEFAULT 'local',
    google_id VARCHAR(255),
    profile_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_guardian_claims_status ON guardian_claims(status);
CREATE INDEX IF NOT EXISTS idx_guardian_claims_approval ON guardian_claims(requires_school_approval);
CREATE INDEX IF NOT EXISTS idx_guardian_profiles_email ON guardian_profiles(email);
CREATE INDEX IF NOT EXISTS idx_guardian_profiles_google_id ON guardian_profiles(google_id);
