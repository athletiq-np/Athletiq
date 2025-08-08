-- migrations/create_guardian_system.sql
-- New simplified guardian registration system

-- Create guardians table
CREATE TABLE IF NOT EXISTS guardians (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    address TEXT,
    occupation VARCHAR(255),
    relationship_type VARCHAR(50) DEFAULT 'Parent', -- Parent, Guardian, Relative
    verification_token VARCHAR(255),
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    account_status VARCHAR(50) DEFAULT 'active', -- active, suspended, inactive
    profile_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create schools table if it doesn't exist (needed for foreign key)
CREATE TABLE IF NOT EXISTS schools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create guardian_children table (children added by guardians)
CREATE TABLE IF NOT EXISTS guardian_children (
    id SERIAL PRIMARY KEY,
    guardian_id INTEGER REFERENCES guardians(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    grade VARCHAR(10),
    school_name VARCHAR(255),
    school_id INTEGER REFERENCES schools(id),
    existing_player_id INTEGER, -- Link to players table if student exists
    linked_player_id INTEGER, -- Final link when approved
    athlete_id VARCHAR(50), -- Nepal athlete ID (generated after approval)
    athlete_id_status VARCHAR(50) DEFAULT 'pending', -- pending, active, suspended
    verification_status VARCHAR(50) DEFAULT 'pending_school_approval', -- pending_school_approval, verified, rejected
    additional_info JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create pending_registrations table (for school approval workflow)
CREATE TABLE IF NOT EXISTS pending_registrations (
    id SERIAL PRIMARY KEY,
    guardian_id INTEGER REFERENCES guardians(id) ON DELETE CASCADE,
    child_id INTEGER REFERENCES guardian_children(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    grade VARCHAR(10),
    school_name VARCHAR(255),
    school_id INTEGER REFERENCES schools(id),
    status VARCHAR(50) DEFAULT 'pending_school_approval', -- pending_school_approval, approved, rejected
    school_notes TEXT,
    approved_at TIMESTAMP,
    approved_by INTEGER, -- School admin user ID
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    player_id INTEGER, -- Link to created player record after approval
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create child_documents table (for photo/document uploads)
CREATE TABLE IF NOT EXISTS child_documents (
    id SERIAL PRIMARY KEY,
    guardian_id INTEGER REFERENCES guardians(id) ON DELETE CASCADE,
    child_id INTEGER REFERENCES guardian_children(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL, -- photo, birth_certificate, school_id, medical_record, etc.
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    upload_date TIMESTAMP DEFAULT NOW(),
    verification_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected
    verified_at TIMESTAMP,
    verified_by INTEGER, -- Admin user ID
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create guardian_notifications table (for system notifications)
CREATE TABLE IF NOT EXISTS guardian_notifications (
    id SERIAL PRIMARY KEY,
    guardian_id INTEGER REFERENCES guardians(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- athlete_id_activated, registration_approved, document_verified, etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional notification data
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add guardian_id to existing players table (if not exists)
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS guardian_id INTEGER REFERENCES guardians(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_guardians_email ON guardians(email);
CREATE INDEX IF NOT EXISTS idx_guardians_phone ON guardians(phone);
CREATE INDEX IF NOT EXISTS idx_guardian_children_guardian_id ON guardian_children(guardian_id);
CREATE INDEX IF NOT EXISTS idx_guardian_children_athlete_id ON guardian_children(athlete_id);
CREATE INDEX IF NOT EXISTS idx_pending_registrations_status ON pending_registrations(status);
CREATE INDEX IF NOT EXISTS idx_child_documents_child_id ON child_documents(child_id);
CREATE INDEX IF NOT EXISTS idx_guardian_notifications_guardian_id ON guardian_notifications(guardian_id);

-- Add check constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name='guardian_children' AND constraint_name='chk_gender'
    ) THEN
        ALTER TABLE guardian_children 
        ADD CONSTRAINT chk_gender CHECK (gender IN ('Male', 'Female', 'Other'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name='guardian_children' AND constraint_name='chk_athlete_id_status'
    ) THEN
        ALTER TABLE guardian_children 
        ADD CONSTRAINT chk_athlete_id_status CHECK (athlete_id_status IN ('pending', 'active', 'suspended'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name='guardian_children' AND constraint_name='chk_verification_status'
    ) THEN
        ALTER TABLE guardian_children 
        ADD CONSTRAINT chk_verification_status CHECK (verification_status IN ('pending_school_approval', 'verified', 'rejected', 'linked_to_school'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name='pending_registrations' AND constraint_name='chk_status'
    ) THEN
        ALTER TABLE pending_registrations 
        ADD CONSTRAINT chk_status CHECK (status IN ('pending_school_approval', 'approved', 'rejected'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name='child_documents' AND constraint_name='chk_verification_status'
    ) THEN
        ALTER TABLE child_documents 
        ADD CONSTRAINT chk_verification_status CHECK (verification_status IN ('pending', 'verified', 'rejected'));
    END IF;
END $$;

-- Sample data for testing
INSERT INTO guardians (full_name, email, phone, password_hash, address, occupation) 
VALUES 
  ('Ram Bahadur Thapa', 'ram.thapa@example.com', '+977-9841234567', '$2b$10$hashedpassword', 'Kathmandu', 'Teacher'),
  ('Sita Devi Sharma', 'sita.sharma@example.com', '+977-9851234567', '$2b$10$hashedpassword', 'Pokhara', 'Business')
ON CONFLICT (email) DO NOTHING;
