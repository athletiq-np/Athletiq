-- Guardian Portal v2 Database Schema Migration
-- Creates all required tables for the comprehensive guardian portal system

-- 1. Guardians Table (Enhanced)
CREATE TABLE IF NOT EXISTS guardians (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255), -- Nullable for OAuth users
    auth_provider VARCHAR(50) DEFAULT 'email', -- 'email', 'google', 'phone'
    google_id VARCHAR(255) UNIQUE,
    is_verified BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    profile_image_url TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(100),
    preferred_language VARCHAR(10) DEFAULT 'en', -- 'en', 'np'
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- 2. Schools Table (Enhanced for verification)
CREATE TABLE IF NOT EXISTS schools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_nepali VARCHAR(255),
    address TEXT NOT NULL,
    address_nepali TEXT,
    district VARCHAR(100) NOT NULL,
    district_nepali VARCHAR(100),
    municipality VARCHAR(100),
    municipality_nepali VARCHAR(100),
    ward_number INTEGER,
    phone VARCHAR(20),
    email VARCHAR(255),
    school_code VARCHAR(50) UNIQUE,
    level VARCHAR(50), -- 'primary', 'secondary', 'higher_secondary'
    type VARCHAR(50), -- 'public', 'private', 'community'
    is_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP,
    google_place_id VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    website_url TEXT,
    principal_name VARCHAR(255),
    established_year INTEGER,
    total_students INTEGER,
    facilities JSONB, -- Array of facilities like sports, labs, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Athletes Table (Enhanced for comprehensive tracking)
CREATE TABLE IF NOT EXISTS athletes (
    id SERIAL PRIMARY KEY,
    guardian_id INTEGER REFERENCES guardians(id) ON DELETE CASCADE,
    school_id INTEGER REFERENCES schools(id),
    full_name VARCHAR(255) NOT NULL,
    full_name_nepali VARCHAR(255),
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    grade_level VARCHAR(20),
    section VARCHAR(20),
    roll_number VARCHAR(50),
    birth_certificate_number VARCHAR(100),
    birth_certificate_issued_district VARCHAR(100),
    citizenship_number VARCHAR(50),
    citizenship_issued_district VARCHAR(100),
    blood_group VARCHAR(10),
    height_cm INTEGER,
    weight_kg DECIMAL(5,2),
    medical_conditions TEXT,
    allergies TEXT,
    emergency_medical_info TEXT,
    profile_image_url TEXT,
    sports_interests JSONB, -- Array of sports
    achievements JSONB, -- Array of achievements
    registration_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by INTEGER REFERENCES guardians(id),
    approved_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Documents Table (Enhanced for OCR processing)
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    guardian_id INTEGER REFERENCES guardians(id) ON DELETE CASCADE,
    athlete_id INTEGER REFERENCES athletes(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL, -- 'birth_certificate', 'citizenship', 'school_id', 'photo'
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    ocr_text TEXT,
    ocr_confidence DECIMAL(5,2),
    extracted_data JSONB, -- Structured data extracted from OCR
    processing_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    verification_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    verified_by INTEGER REFERENCES guardians(id),
    verified_at TIMESTAMP,
    rejection_reason TEXT,
    upload_ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    guardian_id INTEGER REFERENCES guardians(id) ON DELETE CASCADE,
    athlete_id INTEGER REFERENCES athletes(id) ON DELETE SET NULL,
    type VARCHAR(100) NOT NULL, -- 'registration', 'verification', 'tournament', 'system'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    title_nepali VARCHAR(255),
    message_nepali TEXT,
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    action_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. OTP Verifications Table
CREATE TABLE IF NOT EXISTS otp_verifications (
    id SERIAL PRIMARY KEY,
    contact VARCHAR(255) NOT NULL, -- email or phone
    contact_type VARCHAR(10) NOT NULL, -- 'email' or 'phone'
    otp_code VARCHAR(10) NOT NULL,
    purpose VARCHAR(50) NOT NULL, -- 'signup', 'login', 'reset_password'
    attempts INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Guardian Sessions Table (for secure session management)
CREATE TABLE IF NOT EXISTS guardian_sessions (
    id SERIAL PRIMARY KEY,
    guardian_id INTEGER REFERENCES guardians(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Athlete Registration Timeline Table
CREATE TABLE IF NOT EXISTS athlete_registration_timeline (
    id SERIAL PRIMARY KEY,
    athlete_id INTEGER REFERENCES athletes(id) ON DELETE CASCADE,
    guardian_id INTEGER REFERENCES guardians(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL, -- 'created', 'document_uploaded', 'verified', 'approved', 'rejected'
    description TEXT NOT NULL,
    metadata JSONB,
    performed_by INTEGER REFERENCES guardians(id),
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_guardians_email ON guardians(email);
CREATE INDEX IF NOT EXISTS idx_guardians_phone ON guardians(phone);
CREATE INDEX IF NOT EXISTS idx_guardians_google_id ON guardians(google_id);
CREATE INDEX IF NOT EXISTS idx_athletes_guardian_id ON athletes(guardian_id);
CREATE INDEX IF NOT EXISTS idx_athletes_school_id ON athletes(school_id);
CREATE INDEX IF NOT EXISTS idx_athletes_registration_status ON athletes(registration_status);
CREATE INDEX IF NOT EXISTS idx_documents_guardian_id ON documents(guardian_id);
CREATE INDEX IF NOT EXISTS idx_documents_athlete_id ON documents(athlete_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_notifications_guardian_id ON notifications(guardian_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_otp_contact ON otp_verifications(contact);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_guardian_id ON guardian_sessions(guardian_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON guardian_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_timeline_athlete_id ON athlete_registration_timeline(athlete_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_guardians_updated_at BEFORE UPDATE ON guardians FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_athletes_updated_at BEFORE UPDATE ON athletes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample verified schools for testing
INSERT INTO schools (name, name_nepali, address, district, district_nepali, is_verified, verification_date, type, level) VALUES
('Kathmandu Model School', 'काठमाडौं मोडल स्कूल', 'Bagbazar, Kathmandu', 'Kathmandu', 'काठमाडौं', true, CURRENT_TIMESTAMP, 'private', 'secondary'),
('Patan Secondary School', 'पाटन माध्यमिक विद्यालय', 'Lagankhel, Lalitpur', 'Lalitpur', 'ललितपुर', true, CURRENT_TIMESTAMP, 'public', 'secondary'),
('Bhaktapur English School', 'भक्तपुर अंग्रेजी स्कूल', 'Durbar Square, Bhaktapur', 'Bhaktapur', 'भक्तपुर', true, CURRENT_TIMESTAMP, 'private', 'primary')
ON CONFLICT DO NOTHING;
