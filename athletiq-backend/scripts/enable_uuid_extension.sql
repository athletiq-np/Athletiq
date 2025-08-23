-- Connect to the database and enable the UUID extension
\c athletiq

-- Enable the uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify the extension was created
SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';
