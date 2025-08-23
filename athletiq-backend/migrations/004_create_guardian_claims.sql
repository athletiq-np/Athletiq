-- Guardian Claims Table Migration
-- Creates table to manage guardian verification and claim codes

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'guardian_claims'
    ) THEN
        CREATE TABLE guardian_claims (
            id SERIAL PRIMARY KEY,
            athlete_id VARCHAR(8) NOT NULL REFERENCES players(athlete_id) ON DELETE CASCADE,
            guardian_phone VARCHAR(20),
            guardian_email VARCHAR(100),
            claim_code VARCHAR(8) NOT NULL UNIQUE,
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
            expires_at TIMESTAMP NOT NULL,
            reminder_sent BOOLEAN DEFAULT FALSE,
            completed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    ELSE
        -- Table exists, add missing columns safely
        ALTER TABLE guardian_claims ADD COLUMN IF NOT EXISTS guardian_phone VARCHAR(20);
        ALTER TABLE guardian_claims ADD COLUMN IF NOT EXISTS guardian_email VARCHAR(100);
        ALTER TABLE guardian_claims ADD COLUMN IF NOT EXISTS claim_code VARCHAR(8);
        ALTER TABLE guardian_claims ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
        ALTER TABLE guardian_claims ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
        ALTER TABLE guardian_claims ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;
        ALTER TABLE guardian_claims ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
        ALTER TABLE guardian_claims ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
        ALTER TABLE guardian_claims ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_guardian_claims_athlete_id ON guardian_claims(athlete_id);
CREATE INDEX IF NOT EXISTS idx_guardian_claims_claim_code ON guardian_claims(claim_code);
CREATE INDEX IF NOT EXISTS idx_guardian_claims_status ON guardian_claims(status);
CREATE INDEX IF NOT EXISTS idx_guardian_claims_expires_at ON guardian_claims(expires_at);

-- Add guardian verification column to players table if not exists
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS guardian_verified BOOLEAN DEFAULT FALSE;

-- Create trigger to update timestamp
CREATE OR REPLACE FUNCTION update_guardian_claims_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_guardian_claims_timestamp_trigger ON guardian_claims;
CREATE TRIGGER update_guardian_claims_timestamp_trigger
    BEFORE UPDATE ON guardian_claims
    FOR EACH ROW
    EXECUTE FUNCTION update_guardian_claims_timestamp();

-- Sample data for testing (optional)
-- INSERT INTO guardian_claims (athlete_id, guardian_phone, guardian_email, claim_code, expires_at) VALUES
-- ('NP123456', '+977-9841234567', 'guardian@example.com', 'ABC123XY', NOW() + INTERVAL '24 hours');

COMMENT ON TABLE guardian_claims IS 'Manages guardian verification claim codes for athlete registration';
COMMENT ON COLUMN guardian_claims.claim_code IS 'Unique 8-character claim code sent to guardians';
COMMENT ON COLUMN guardian_claims.status IS 'Claim status: pending, completed, or expired';
COMMENT ON COLUMN guardian_claims.expires_at IS 'Claim code expiration timestamp (24 hours from creation)';
COMMENT ON COLUMN guardian_claims.reminder_sent IS 'Whether a reminder has been sent for this claim';
