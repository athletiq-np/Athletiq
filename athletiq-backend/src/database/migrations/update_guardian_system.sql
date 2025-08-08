-- Update guardian_claims table to support approval workflow
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='guardian_claims') THEN
        ALTER TABLE guardian_claims 
            ADD COLUMN IF NOT EXISTS requires_school_approval BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
        BEGIN
            ALTER TABLE guardian_claims ALTER COLUMN status TYPE VARCHAR(50);
        EXCEPTION WHEN others THEN
            -- ignore type alteration errors
        END;
    END IF;
END $$;

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
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='guardian_claims') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_guardian_claims_status ON guardian_claims(status)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_guardian_claims_approval ON guardian_claims(requires_school_approval)';
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_guardian_profiles_email ON guardian_profiles(email);
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name='guardian_profiles' AND column_name='google_id'
    ) THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_guardian_profiles_google_id ON guardian_profiles(google_id)';
    END IF;
END $$;
