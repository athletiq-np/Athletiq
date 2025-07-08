# 🏆 ATHLETIQ DATABASE SCHEMA ANALYSIS

Generated on: 2025-07-08T02:10:20.196Z
Database: athletiq
PostgreSQL Version: PostgreSQL 17.5

## 📊 TABLES SUMMARY

Total tables: 25

### 📋 AI_PROCESSING_QUEUE
- **Columns:** 16
- **Primary Key:** id
- **Foreign Keys:** 0
- **Unique Constraints:** 1
- **Indexes:** 3
- **Row Count:** 1

**Columns:**
- `id`: integer (NOT NULL) DEFAULT nextval('ai_processing_queue_id_seq'::regclass)
- `job_id`: uuid (nullable) DEFAULT uuid_generate_v4()
- `job_type`: character varying(50) (NOT NULL)
- `entity_type`: character varying(50) (NOT NULL)
- `entity_id`: integer (NOT NULL)
- `priority`: integer (nullable) DEFAULT 5
- `payload`: jsonb (NOT NULL)
- `status`: character varying(20) (nullable) DEFAULT 'pending'::character varying
- `attempts`: integer (nullable) DEFAULT 0
- `max_attempts`: integer (nullable) DEFAULT 3
- `result`: jsonb (nullable)
- `error_message`: text (nullable)
- `processing_started_at`: timestamp without time zone (nullable)
- `processing_completed_at`: timestamp without time zone (nullable)
- `created_at`: timestamp without time zone (nullable) DEFAULT CURRENT_TIMESTAMP
- `updated_at`: timestamp without time zone (nullable) DEFAULT CURRENT_TIMESTAMP

**Sample Data:**
```json
[
  {
    "id": 1,
    "job_id": "2da8ae0e-a422-47c6-9014-b619be8b95d4",
    "job_type": "test_processing",
    "entity_type": "player",
    "entity_id": 1,
    "priority": 5,
    "payload": {
      "test": true,
      "timestamp": "2025-07-05T02:15:07.989Z"
    },
    "status": "pending",
    "attempts": 0,
    "max_attempts": 3,
    "result": null,
    "error_message": null,
    "processing_started_at": null,
    "processing_completed_at": null,
    "created_at": "2025-07-05T02:15:07.996Z",
    "updated_at": "2025-07-05T02:15:07.996Z"
  }
]
```

---

### 📋 ANALYTICS_EVENTS
- **Columns:** 13
- **Primary Key:** id
- **Foreign Keys:** 0
- **Unique Constraints:** 1
- **Indexes:** 3
- **Row Count:** 0

**Columns:**
- `id`: integer (NOT NULL) DEFAULT nextval('analytics_events_id_seq'::regclass)
- `event_id`: uuid (nullable) DEFAULT uuid_generate_v4()
- `user_id`: integer (nullable)
- `organization_id`: integer (nullable)
- `session_id`: character varying(100) (nullable)
- `event_type`: character varying(50) (NOT NULL)
- `event_name`: character varying(100) (NOT NULL)
- `properties`: jsonb (nullable)
- `timestamp`: timestamp without time zone (nullable) DEFAULT CURRENT_TIMESTAMP
- `ip_address`: inet (nullable)
- `user_agent`: text (nullable)
- `platform`: character varying(20) (nullable)
- `version`: character varying(20) (nullable)

---

### 📋 AUDIT_LOGS
- **Columns:** 13
- **Primary Key:** id
- **Foreign Keys:** 1
- **Unique Constraints:** 1
- **Indexes:** 3
- **Row Count:** 0

**Columns:**
- `id`: integer (NOT NULL) DEFAULT nextval('audit_logs_id_seq'::regclass)
- `log_id`: uuid (nullable) DEFAULT uuid_generate_v4()
- `user_id`: integer (nullable)
- `organization_id`: integer (nullable)
- `action`: character varying(100) (NOT NULL)
- `entity_type`: character varying(50) (NOT NULL)
- `entity_id`: integer (nullable)
- `old_values`: jsonb (nullable)
- `new_values`: jsonb (nullable)
- `ip_address`: inet (nullable)
- `user_agent`: text (nullable)
- `session_id`: character varying(100) (nullable)
- `created_at`: timestamp without time zone (nullable) DEFAULT CURRENT_TIMESTAMP

**Foreign Keys:**
- `user_id` → `users.id` (fk_audit_logs_user)

---

### 📋 DOCUMENT_UPLOADS
- **Columns:** 20
- **Primary Key:** id
- **Foreign Keys:** 1
- **Unique Constraints:** 1
- **Indexes:** 3
- **Row Count:** 0

**Columns:**
- `id`: integer (NOT NULL) DEFAULT nextval('document_uploads_id_seq'::regclass)
- `document_id`: uuid (nullable) DEFAULT uuid_generate_v4()
- `entity_type`: character varying(50) (NOT NULL)
- `entity_id`: integer (NOT NULL)
- `document_type`: character varying(50) (NOT NULL)
- `original_filename`: character varying(255) (NOT NULL)
- `file_path`: character varying(500) (NOT NULL)
- `file_size`: integer (nullable)
- `mime_type`: character varying(100) (nullable)
- `processing_status`: character varying(20) (nullable) DEFAULT 'pending'::character varying
- `ocr_text`: text (nullable)
- `extracted_data`: jsonb (nullable)
- `ai_analysis`: jsonb (nullable)
- `verification_status`: character varying(20) (nullable) DEFAULT 'pending'::character varying
- `verified_by`: integer (nullable)
- `verified_at`: timestamp without time zone (nullable)
- `rejection_reason`: text (nullable)
- `uploaded_by`: integer (NOT NULL)
- `created_at`: timestamp without time zone (nullable) DEFAULT CURRENT_TIMESTAMP
- `updated_at`: timestamp without time zone (nullable) DEFAULT CURRENT_TIMESTAMP

**Foreign Keys:**
- `uploaded_by` → `users.id` (fk_document_uploads_user)

---

### 📋 MATCHES
- **Columns:** 18
- **Primary Key:** id
- **Foreign Keys:** 5
- **Unique Constraints:** 1
- **Indexes:** 3
- **Row Count:** 0

**Columns:**
- `id`: integer (NOT NULL) DEFAULT nextval('matches_id_seq'::regclass)
- `team1_id`: integer (nullable)
- `team2_id`: integer (nullable)
- `sport_id`: integer (nullable)
- `event_category`: character varying(100) (nullable)
- `date`: date (nullable)
- `location`: character varying(200) (nullable)
- `created_at`: timestamp without time zone (nullable) DEFAULT now()
- `tournament_id`: integer (nullable)
- `code`: character varying(50) (NOT NULL)
- `round`: character varying(64) (nullable)
- `home_team_id`: integer (NOT NULL)
- `away_team_id`: integer (NOT NULL)
- `scheduled_at`: timestamp without time zone (NOT NULL)
- `venue`: character varying(255) (nullable)
- `status`: character varying(32) (nullable) DEFAULT 'scheduled'::character varying
- `result`: jsonb (nullable)
- `updated_at`: timestamp without time zone (nullable) DEFAULT CURRENT_TIMESTAMP

**Foreign Keys:**
- `team1_id` → `teams.id` (matches_team1_id_fkey)
- `team2_id` → `teams.id` (matches_team2_id_fkey)
- `sport_id` → `sports.id` (matches_sport_id_fkey)
- `home_team_id` → `tournament_teams.id` (fk_matches_home_team_id)
- `away_team_id` → `tournament_teams.id` (fk_matches_away_team_id)

---

### 📋 NOTIFICATIONS
- **Columns:** 16
- **Primary Key:** id
- **Foreign Keys:** 1
- **Unique Constraints:** 1
- **Indexes:** 3
- **Row Count:** 0

**Columns:**
- `id`: integer (NOT NULL) DEFAULT nextval('notifications_id_seq'::regclass)
- `notification_id`: uuid (nullable) DEFAULT uuid_generate_v4()
- `user_id`: integer (NOT NULL)
- `organization_id`: integer (nullable)
- `type`: character varying(50) (NOT NULL)
- `title`: character varying(200) (NOT NULL)
- `message`: text (NOT NULL)
- `data`: jsonb (nullable)
- `is_read`: boolean (nullable) DEFAULT false
- `read_at`: timestamp without time zone (nullable)
- `priority`: character varying(20) (nullable) DEFAULT 'normal'::character varying
- `delivery_method`: character varying(20) (nullable) DEFAULT 'in_app'::character varying
- `scheduled_for`: timestamp without time zone (nullable)
- `sent_at`: timestamp without time zone (nullable)
- `expires_at`: timestamp without time zone (nullable)
- `created_at`: timestamp without time zone (nullable) DEFAULT CURRENT_TIMESTAMP

**Foreign Keys:**
- `user_id` → `users.id` (fk_notifications_user)

---

### 📋 ORGANIZATIONS
- **Columns:** 9
- **Primary Key:** id
- **Foreign Keys:** 0
- **Unique Constraints:** 0
- **Indexes:** 1
- **Row Count:** 0

**Columns:**
- `id`: integer (NOT NULL) DEFAULT nextval('organizations_id_seq'::regclass)
- `name`: character varying(150) (NOT NULL)
- `address`: text (nullable)
- `contact_person`: character varying(100) (nullable)
- `contact_no`: character varying(50) (nullable)
- `email`: character varying(100) (nullable)
- `website`: character varying(200) (nullable)
- `logo_url`: character varying(255) (nullable)
- `created_at`: timestamp without time zone (nullable) DEFAULT now()

---

### 📋 PLAYER_MATCH_STATS
- **Columns:** 6
- **Primary Key:** id
- **Foreign Keys:** 3
- **Unique Constraints:** 0
- **Indexes:** 1
- **Row Count:** 0

**Columns:**
- `id`: integer (NOT NULL) DEFAULT nextval('player_match_stats_id_seq'::regclass)
- `player_id`: integer (nullable)
- `match_id`: integer (nullable)
- `team_id`: integer (nullable)
- `stats`: jsonb (nullable)
- `created_at`: timestamp without time zone (nullable) DEFAULT now()

**Foreign Keys:**
- `player_id` → `players.id` (player_match_stats_player_id_fkey)
- `match_id` → `matches.id` (player_match_stats_match_id_fkey)
- `team_id` → `teams.id` (player_match_stats_team_id_fkey)

---

### 📋 PLAYER_SPORT_PARTICIPATION
- **Columns:** 7
- **Primary Key:** id
- **Foreign Keys:** 3
- **Unique Constraints:** 0
- **Indexes:** 1
- **Row Count:** 0

**Columns:**
- `id`: integer (NOT NULL) DEFAULT nextval('player_sport_participation_id_seq'::regclass)
- `player_id`: integer (nullable)
- `sport_id`: integer (nullable)
- `team_id`: integer (nullable)
- `event_category`: character varying(100) (nullable)
- `season`: character varying(20) (nullable)
- `joined_at`: timestamp without time zone (nullable) DEFAULT now()

**Foreign Keys:**
- `sport_id` → `sports.id` (player_sport_participation_sport_id_fkey)
- `team_id` → `teams.id` (player_sport_participation_team_id_fkey)
- `player_id` → `players.id` (player_sport_participation_player_id_fkey)

---

### 📋 PLAYERS
- **Columns:** 38
- **Primary Key:** id
- **Foreign Keys:** 3
- **Unique Constraints:** 2
- **Indexes:** 5
- **Row Count:** 204

**Columns:**
- `id`: integer (NOT NULL) DEFAULT nextval('players_id_seq'::regclass)
- `player_code`: character varying(20) (NOT NULL)
- `full_name`: character varying(100) (NOT NULL)
- `full_name_nep`: character varying(100) (nullable)
- `date_of_birth`: date (NOT NULL)
- `gender`: character varying(20) (nullable)
- `school_id`: integer (NOT NULL)
- `class`: character varying(20) (nullable)
- `section`: character varying(20) (nullable)
- `roll_no`: character varying(20) (nullable)
- `address`: text (nullable)
- `address_nep`: text (nullable)
- `province`: character varying(50) (nullable)
- `district`: character varying(50) (nullable)
- `municipality`: character varying(100) (nullable)
- `ward`: character varying(10) (nullable)
- `contact_no`: character varying(20) (nullable)
- `email`: character varying(100) (nullable)
- `father_name`: character varying(100) (nullable)
- `father_name_nep`: character varying(100) (nullable)
- `mother_name`: character varying(100) (nullable)
- `mother_name_nep`: character varying(100) (nullable)
- `guardian_name`: character varying(100) (nullable)
- `guardian_relation`: character varying(30) (nullable)
- `guardian_contact`: character varying(20) (nullable)
- `profile_photo_url`: character varying(255) (nullable)
- `birth_cert_url`: character varying(255) (nullable)
- `registration_status`: character varying(30) (nullable) DEFAULT 'pending'::character varying
- `remarks`: text (nullable)
- `created_by`: integer (nullable)
- `is_active`: boolean (NOT NULL) DEFAULT true
- `created_at`: timestamp without time zone (NOT NULL) DEFAULT now()
- `updated_at`: timestamp without time zone (NOT NULL) DEFAULT now()
- `athlete_id`: character varying(20) (nullable)
- `nationality`: character varying(100) (nullable)
- `height_cm`: integer (nullable)
- `weight_kg`: numeric (nullable)
- `eligibility_status`: character varying(20) (nullable) DEFAULT 'pending'::character varying

**Foreign Keys:**
- `school_id` → `schools.id` (players_school_id_fkey)
- `created_by` → `users.id` (players_created_by_fkey)
- `school_id` → `schools.id` (fk_players_school)

**Sample Data:**
```json
[
  {
    "id": 461,
    "player_code": "PLY17519402861421",
    "full_name": "Player Alpha 1",
    "full_name_nep": null,
    "date_of_birth": "2006-01-14T18:15:00.000Z",
    "gender": "Male",
    "school_id": 18,
    "class": null,
    "section": null,
    "roll_no": null,
    "address": null,
    "address_nep": null,
    "province": null,
    "district": null,
    "municipality": null,
    "ward": null,
    "contact_no": null,
    "email": null,
    "father_name": null,
    "father_name_nep": null,
    "mother_name": null,
    "mother_name_nep": null,
    "guardian_name": null,
    "guardian_relation": null,
    "guardian_contact": null,
    "profile_photo_url": null,
    "birth_cert_url": null,
    "registration_status": "approved",
    "remarks": null,
    "created_by": null,
    "is_active": true,
    "created_at": "2025-07-08T02:04:46.223Z",
    "updated_at": "2025-07-08T02:04:46.223Z",
    "athlete_id": null,
    "nationality": null,
    "height_cm": null,
    "weight_kg": null,
    "eligibility_status": "pending"
  },
  {
    "id": 462,
    "player_code": "PLY17519402861422",
    "full_name": "Player Alpha 2",
    "full_name_nep": null,
    "date_of_birth": "2006-03-19T18:15:00.000Z",
    "gender": "Male",
    "school_id": 18,
    "class": null,
    "section": null,
    "roll_no": null,
    "address": null,
    "address_nep": null,
    "province": null,
    "district": null,
    "municipality": null,
    "ward": null,
    "contact_no": null,
    "email": null,
    "father_name": null,
    "father_name_nep": null,
    "mother_name": null,
    "mother_name_nep": null,
    "guardian_name": null,
    "guardian_relation": null,
    "guardian_contact": null,
    "profile_photo_url": null,
    "birth_cert_url": null,
    "registration_status": "approved",
    "remarks": null,
    "created_by": null,
    "is_active": true,
    "created_at": "2025-07-08T02:04:46.223Z",
    "updated_at": "2025-07-08T02:04:46.223Z",
    "athlete_id": null,
    "nationality": null,
    "height_cm": null,
    "weight_kg": null,
    "eligibility_status": "pending"
  },
  {
    "id": 463,
    "player_code": "PLY17519402861423",
    "full_name": "Player Beta 1",
    "full_name_nep": null,
    "date_of_birth": "2006-02-09T18:15:00.000Z",
    "gender": "Female",
    "school_id": 19,
    "class": null,
    "section": null,
    "roll_no": null,
    "address": null,
    "address_nep": null,
    "province": null,
    "district": null,
    "municipality": null,
    "ward": null,
    "contact_no": null,
    "email": null,
    "father_name": null,
    "father_name_nep": null,
    "mother_name": null,
    "mother_name_nep": null,
    "guardian_name": null,
    "guardian_relation": null,
    "guardian_contact": null,
    "profile_photo_url": null,
    "birth_cert_url": null,
    "registration_status": "approved",
    "remarks": null,
    "created_by": null,
    "is_active": true,
    "created_at": "2025-07-08T02:04:46.223Z",
    "updated_at": "2025-07-08T02:04:46.223Z",
    "athlete_id": null,
    "nationality": null,
    "height_cm": null,
    "weight_kg": null,
    "eligibility_status": "pending"
  }
]
```

---

### 📋 SCHEMA_MIGRATIONS
- **Columns:** 6
- **Primary Key:** id
- **Foreign Keys:** 0
- **Unique Constraints:** 1
- **Indexes:** 2
- **Row Count:** 2

**Columns:**
- `id`: integer (NOT NULL) DEFAULT nextval('schema_migrations_id_seq'::regclass)
- `version`: character varying(20) (NOT NULL)
- `name`: character varying(255) (NOT NULL)
- `executed_at`: timestamp without time zone (nullable) DEFAULT now()
- `execution_time`: integer (nullable)
- `checksum`: character varying(64) (nullable)

**Sample Data:**
```json
[
  {
    "id": 1,
    "version": "1751680085956",
    "name": "001_create_initial_schema.sql",
    "executed_at": "2025-07-05T01:48:05.957Z",
    "execution_time": 1,
    "checksum": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    "id": 2,
    "version": "1751680295088",
    "name": "003_fix_schema_and_add_enhancements.sql",
    "executed_at": "2025-07-05T01:51:34.970Z",
    "execution_time": 125,
    "checksum": "7b75cd27a776be0edf9c05a598bf9eb098f2c1db65b4d15b334325fca41d3c69"
  }
]
```

---

### 📋 SCHOOLS
- **Columns:** 43
- **Primary Key:** id
- **Foreign Keys:** 3
- **Unique Constraints:** 1
- **Indexes:** 3
- **Row Count:** 17

**Columns:**
- `id`: integer (NOT NULL) DEFAULT nextval('schools_id_seq'::regclass)
- `school_code`: character varying(20) (NOT NULL)
- `name`: character varying(150) (NOT NULL)
- `name_en`: character varying(150) (nullable)
- `name_ne`: character varying(150) (nullable)
- `address`: text (NOT NULL)
- `country`: character varying(100) (nullable)
- `province`: character varying(100) (nullable)
- `district`: character varying(100) (nullable)
- `state`: character varying(100) (nullable)
- `city`: character varying(100) (nullable)
- `postal_code`: character varying(20) (nullable)
- `ward`: character varying(20) (nullable)
- `phone`: character varying(50) (nullable)
- `mobile`: character varying(50) (nullable)
- `landline`: character varying(50) (nullable)
- `email`: character varying(100) (nullable)
- `website`: character varying(200) (nullable)
- `facebook_url`: character varying(200) (nullable)
- `type`: character varying(50) (nullable)
- `registration_no`: character varying(100) (nullable)
- `pan_number`: character varying(100) (nullable)
- `estd_year`: integer (nullable)
- `association`: character varying(100) (nullable)
- `principal_name`: character varying(100) (nullable)
- `principal_phone`: character varying(50) (nullable)
- `principal_email`: character varying(100) (nullable)
- `admin_email`: character varying(100) (NOT NULL)
- `logo_url`: character varying(255) (nullable)
- `registration_doc_url`: character varying(255) (nullable)
- `location_lat`: numeric (nullable)
- `location_lng`: numeric (nullable)
- `place_id`: character varying(255) (nullable)
- `created_by`: integer (nullable)
- `onboarding_status`: character varying(50) (nullable) DEFAULT 'pending'::character varying
- `is_active`: boolean (nullable) DEFAULT true
- `created_at`: timestamp without time zone (NOT NULL) DEFAULT now()
- `updated_at`: timestamp without time zone (NOT NULL) DEFAULT now()
- `admin_user_id`: integer (nullable)
- `organization_id`: integer (nullable)
- `latitude`: numeric (nullable)
- `longitude`: numeric (nullable)
- `verification_status`: character varying(20) (nullable) DEFAULT 'pending'::character varying

**Foreign Keys:**
- `created_by` → `users.id` (schools_created_by_fkey)
- `admin_user_id` → `users.id` (schools_admin_user_id_fkey)
- `organization_id` → `organizations.id` (fk_schools_organization)

**Sample Data:**
```json
[
  {
    "id": 1,
    "school_code": "EDUOUOL5K",
    "name": "Shree Himalaya Vidyalaya",
    "name_en": null,
    "name_ne": null,
    "address": "Chabahil",
    "country": " Nepal",
    "province": "Nepal",
    "district": "Bagmati",
    "state": null,
    "city": "Kathmandu",
    "postal_code": null,
    "ward": null,
    "phone": "014423344",
    "mobile": null,
    "landline": null,
    "email": "info@himalayavidyalaya.edu.np",
    "website": null,
    "facebook_url": null,
    "type": "private",
    "registration_no": "REG-2024-001",
    "pan_number": null,
    "estd_year": null,
    "association": null,
    "principal_name": "Sitaram Poudel",
    "principal_phone": "9841234567",
    "principal_email": null,
    "admin_email": "admin.himalaya@athletiq.com",
    "logo_url": null,
    "registration_doc_url": null,
    "location_lat": null,
    "location_lng": null,
    "place_id": null,
    "created_by": 2,
    "onboarding_status": "pending",
    "is_active": true,
    "created_at": "2025-06-26T20:00:50.966Z",
    "updated_at": "2025-06-26T20:00:50.966Z",
    "admin_user_id": null,
    "organization_id": null,
    "latitude": null,
    "longitude": null,
    "verification_status": "pending"
  },
  {
    "id": 2,
    "school_code": "EDUJ3CA9A",
    "name": "Pashupati Vidya Mandir",
    "name_en": null,
    "name_ne": null,
    "address": "Gaushala",
    "country": " Nepal",
    "province": "Nepal",
    "district": "Bagmati",
    "state": null,
    "city": "Kathmandu",
    "postal_code": null,
    "ward": null,
    "phone": "014470123",
    "mobile": null,
    "landline": null,
    "email": "info@pashupativm.edu.np",
    "website": null,
    "facebook_url": null,
    "type": "private",
    "registration_no": "REG-2024-002",
    "pan_number": null,
    "estd_year": null,
    "association": null,
    "principal_name": "Ramesh Shrestha",
    "principal_phone": "9841000001",
    "principal_email": null,
    "admin_email": "admin.pashupati@athletiq.com",
    "logo_url": null,
    "registration_doc_url": null,
    "location_lat": null,
    "location_lng": null,
    "place_id": null,
    "created_by": 3,
    "onboarding_status": "pending",
    "is_active": true,
    "created_at": "2025-06-26T20:00:51.076Z",
    "updated_at": "2025-06-26T20:00:51.076Z",
    "admin_user_id": null,
    "organization_id": null,
    "latitude": null,
    "longitude": null,
    "verification_status": "pending"
  },
  {
    "id": 3,
    "school_code": "EDUQ5Q296",
    "name": "Buddha Academy",
    "name_en": null,
    "name_ne": null,
    "address": "New Baneshwor",
    "country": " Nepal",
    "province": "Nepal",
    "district": "Bagmati",
    "state": null,
    "city": "Kathmandu",
    "postal_code": null,
    "ward": null,
    "phone": "014478234",
    "mobile": null,
    "landline": null,
    "email": "info@buddhaacademy.edu.np",
    "website": null,
    "facebook_url": null,
    "type": "private",
    "registration_no": "REG-2024-003",
    "pan_number": null,
    "estd_year": null,
    "association": null,
    "principal_name": "Buddha Tamang",
    "principal_phone": "9841000002",
    "principal_email": null,
    "admin_email": "admin.buddha@athletiq.com",
    "logo_url": null,
    "registration_doc_url": null,
    "location_lat": null,
    "location_lng": null,
    "place_id": null,
    "created_by": 4,
    "onboarding_status": "pending",
    "is_active": true,
    "created_at": "2025-06-26T20:00:51.183Z",
    "updated_at": "2025-06-26T20:00:51.183Z",
    "admin_user_id": null,
    "organization_id": null,
    "latitude": null,
    "longitude": null,
    "verification_status": "pending"
  }
]
```

---

### 📋 SCORECARDS
- **Columns:** 6
- **Primary Key:** id
- **Foreign Keys:** 2
- **Unique Constraints:** 0
- **Indexes:** 2
- **Row Count:** 0

**Columns:**
- `id`: integer (NOT NULL) DEFAULT nextval('scorecards_id_seq'::regclass)
- `match_id`: integer (NOT NULL)
- `data`: jsonb (nullable)
- `uploaded_by`: integer (nullable)
- `file_url`: character varying(255) (nullable)
- `created_at`: timestamp without time zone (nullable) DEFAULT CURRENT_TIMESTAMP

**Foreign Keys:**
- `match_id` → `matches.id` (scorecards_match_id_fkey)
- `uploaded_by` → `users.id` (scorecards_uploaded_by_fkey)

---

### 📋 SPORTS
- **Columns:** 2
- **Primary Key:** id
- **Foreign Keys:** 0
- **Unique Constraints:** 1
- **Indexes:** 2
- **Row Count:** 15

**Columns:**
- `id`: integer (NOT NULL) DEFAULT nextval('sports_id_seq'::regclass)
- `name`: character varying(50) (NOT NULL)

**Sample Data:**
```json
[
  {
    "id": 1,
    "name": "Football"
  },
  {
    "id": 2,
    "name": "Basketball"
  },
  {
    "id": 3,
    "name": "Cricket"
  }
]
```

---

### 📋 TEAMS
- **Columns:** 6
- **Primary Key:** id
- **Foreign Keys:** 3
- **Unique Constraints:** 0
- **Indexes:** 1
- **Row Count:** 3

**Columns:**
- `id`: integer (NOT NULL) DEFAULT nextval('teams_id_seq'::regclass)
- `school_id`: integer (nullable)
- `sport_id`: integer (nullable)
- `team_name`: character varying(100) (nullable)
- `season`: character varying(20) (nullable)
- `created_at`: timestamp without time zone (nullable) DEFAULT now()

**Foreign Keys:**
- `school_id` → `schools.id` (teams_school_id_fkey)
- `sport_id` → `sports.id` (teams_sport_id_fkey)
- `school_id` → `schools.id` (fk_teams_school)

**Sample Data:**
```json
[
  {
    "id": 3,
    "school_id": 18,
    "sport_id": 1,
    "team_name": "Alpha Football Team 1751940286142",
    "season": "2024-25",
    "created_at": "2025-07-08T02:04:46.218Z"
  },
  {
    "id": 4,
    "school_id": 19,
    "sport_id": 1,
    "team_name": "Beta Football Team 1751940286142",
    "season": "2024-25",
    "created_at": "2025-07-08T02:04:46.218Z"
  },
  {
    "id": 5,
    "school_id": 18,
    "sport_id": 1,
    "team_name": "Gamma Football Team 1751940286142",
    "season": "2024-25",
    "created_at": "2025-07-08T02:04:46.274Z"
  }
]
```

---

### 📋 TOURNAMENT_AUDIT_LOG
- **Columns:** 8
- **Primary Key:** id
- **Foreign Keys:** 0
- **Unique Constraints:** 0
- **Indexes:** 1
- **Row Count:** 1

**Columns:**
- `id`: integer (NOT NULL) DEFAULT nextval('tournament_audit_log_id_seq'::regclass)
- `tournament_id`: integer (NOT NULL)
- `user_id`: integer (NOT NULL)
- `action`: character varying(100) (NOT NULL)
- `old_values`: jsonb (nullable)
- `new_values`: jsonb (nullable)
- `notes`: text (nullable)
- `created_at`: timestamp without time zone (nullable) DEFAULT CURRENT_TIMESTAMP

**Sample Data:**
```json
[
  {
    "id": 1,
    "tournament_id": 4,
    "user_id": 1,
    "action": "test_action",
    "old_values": null,
    "new_values": {
      "test": "data"
    },
    "notes": "System test audit entry",
    "created_at": "2025-07-08T01:28:30.713Z"
  }
]
```

---

### 📋 TOURNAMENT_CATEGORIES
- **Columns:** 6
- **Primary Key:** id
- **Foreign Keys:** 0
- **Unique Constraints:** 0
- **Indexes:** 1
- **Row Count:** 0

**Columns:**
- `id`: integer (NOT NULL) DEFAULT nextval('tournament_categories_id_seq'::regclass)
- `tournament_id`: integer (NOT NULL)
- `category_name`: character varying(100) (NOT NULL)
- `category_type`: character varying(20) (NOT NULL)
- `is_active`: boolean (nullable) DEFAULT true
- `created_at`: timestamp without time zone (nullable) DEFAULT CURRENT_TIMESTAMP

---

### 📋 TOURNAMENT_MATCHES
- **Columns:** 13
- **Primary Key:** id
- **Foreign Keys:** 0
- **Unique Constraints:** 0
- **Indexes:** 2
- **Row Count:** 0

**Columns:**
- `id`: integer (NOT NULL) DEFAULT nextval('tournament_matches_id_seq'::regclass)
- `tournament_id`: integer (NOT NULL)
- `match_number`: integer (NOT NULL)
- `round_number`: integer (NOT NULL)
- `home_team_id`: integer (NOT NULL)
- `away_team_id`: integer (NOT NULL)
- `venue`: character varying(300) (nullable)
- `scheduled_at`: timestamp without time zone (NOT NULL)
- `match_status`: character varying(20) (nullable) DEFAULT 'scheduled'::character varying
- `home_score`: integer (nullable) DEFAULT 0
- `away_score`: integer (nullable) DEFAULT 0
- `winner_team_id`: integer (nullable)
- `created_at`: timestamp without time zone (nullable) DEFAULT CURRENT_TIMESTAMP

---

### 📋 TOURNAMENT_PLAYERS
- **Columns:** 5
- **Primary Key:** id
- **Foreign Keys:** 2
- **Unique Constraints:** 0
- **Indexes:** 2
- **Row Count:** 4

**Columns:**
- `id`: integer (NOT NULL) DEFAULT nextval('tournament_players_id_seq'::regclass)
- `tournament_team_id`: integer (NOT NULL)
- `player_id`: integer (NOT NULL)
- `jersey_number`: integer (nullable)
- `position`: character varying(64) (nullable)

**Foreign Keys:**
- `tournament_team_id` → `tournament_teams.id` (tournament_players_tournament_team_id_fkey)
- `player_id` → `players.id` (tournament_players_player_id_fkey)

**Sample Data:**
```json
[
  {
    "id": 1,
    "tournament_team_id": 3,
    "player_id": 461,
    "jersey_number": 1,
    "position": null
  },
  {
    "id": 2,
    "tournament_team_id": 3,
    "player_id": 462,
    "jersey_number": 2,
    "position": null
  },
  {
    "id": 3,
    "tournament_team_id": 4,
    "player_id": 463,
    "jersey_number": 1,
    "position": null
  }
]
```

---

### 📋 TOURNAMENT_REGISTRATIONS
- **Columns:** 6
- **Primary Key:** id
- **Foreign Keys:** 2
- **Unique Constraints:** 0
- **Indexes:** 1
- **Row Count:** 2

**Columns:**
- `id`: integer (NOT NULL) DEFAULT nextval('tournament_registrations_id_seq'::regclass)
- `tournament_id`: integer (nullable)
- `team_id`: integer (nullable)
- `player_id`: integer (nullable)
- `registration_date`: timestamp without time zone (nullable) DEFAULT now()
- `status`: character varying(30) (nullable) DEFAULT 'pending'::character varying

**Foreign Keys:**
- `team_id` → `teams.id` (tournament_registrations_team_id_fkey)
- `player_id` → `players.id` (tournament_registrations_player_id_fkey)

**Sample Data:**
```json
[
  {
    "id": 1,
    "tournament_id": 8,
    "team_id": 3,
    "player_id": null,
    "registration_date": "2025-07-08T02:04:46.255Z",
    "status": "registered"
  },
  {
    "id": 2,
    "tournament_id": 8,
    "team_id": 4,
    "player_id": null,
    "registration_date": "2025-07-08T02:04:46.267Z",
    "status": "registered"
  }
]
```

---

### 📋 TOURNAMENT_SPORTS
- **Columns:** 9
- **Primary Key:** id
- **Foreign Keys:** 0
- **Unique Constraints:** 0
- **Indexes:** 1
- **Row Count:** 1

**Columns:**
- `id`: integer (NOT NULL) DEFAULT nextval('tournament_sports_id_seq'::regclass)
- `tournament_id`: integer (nullable)
- `sport_name`: character varying(64) (NOT NULL)
- `team_size`: integer (nullable)
- `max_teams`: integer (nullable)
- `rules_url`: text (nullable)
- `config`: jsonb (nullable)
- `created_at`: timestamp without time zone (nullable) DEFAULT now()
- `updated_at`: timestamp without time zone (nullable) DEFAULT now()

**Sample Data:**
```json
[
  {
    "id": 1,
    "tournament_id": 10,
    "sport_name": "Football",
    "team_size": 15,
    "max_teams": 10,
    "rules_url": "",
    "config": null,
    "created_at": "2025-06-27T23:10:29.260Z",
    "updated_at": "2025-06-27T23:10:29.260Z"
  }
]
```

---

### 📋 TOURNAMENT_STANDINGS
- **Columns:** 13
- **Primary Key:** id
- **Foreign Keys:** 0
- **Unique Constraints:** 1
- **Indexes:** 3
- **Row Count:** 0

**Columns:**
- `id`: integer (NOT NULL) DEFAULT nextval('tournament_standings_id_seq'::regclass)
- `tournament_id`: integer (NOT NULL)
- `team_id`: integer (NOT NULL)
- `position`: integer (NOT NULL)
- `points`: integer (nullable) DEFAULT 0
- `matches_played`: integer (nullable) DEFAULT 0
- `wins`: integer (nullable) DEFAULT 0
- `draws`: integer (nullable) DEFAULT 0
- `losses`: integer (nullable) DEFAULT 0
- `goals_for`: integer (nullable) DEFAULT 0
- `goals_against`: integer (nullable) DEFAULT 0
- `goal_difference`: integer (nullable) DEFAULT 0
- `last_updated`: timestamp without time zone (nullable) DEFAULT CURRENT_TIMESTAMP

---

### 📋 TOURNAMENT_TEAMS
- **Columns:** 5
- **Primary Key:** id
- **Foreign Keys:** 1
- **Unique Constraints:** 0
- **Indexes:** 2
- **Row Count:** 3

**Columns:**
- `id`: integer (NOT NULL) DEFAULT nextval('tournament_teams_id_seq'::regclass)
- `tournament_id`: integer (NOT NULL)
- `team_id`: integer (NOT NULL)
- `seed_order`: integer (nullable)
- `registration_status`: character varying(20) (nullable) DEFAULT 'registered'::character varying

**Foreign Keys:**
- `team_id` → `teams.id` (tournament_teams_team_id_fkey)

**Sample Data:**
```json
[
  {
    "id": 3,
    "tournament_id": 8,
    "team_id": 3,
    "seed_order": 1,
    "registration_status": "registered"
  },
  {
    "id": 4,
    "tournament_id": 8,
    "team_id": 4,
    "seed_order": null,
    "registration_status": "registered"
  },
  {
    "id": 5,
    "tournament_id": 8,
    "team_id": 5,
    "seed_order": 3,
    "registration_status": "registered"
  }
]
```

---

### 📋 TOURNAMENTS
- **Columns:** 39
- **Primary Key:** id
- **Foreign Keys:** 0
- **Unique Constraints:** 1
- **Indexes:** 2
- **Row Count:** 7

**Columns:**
- `id`: integer (NOT NULL) DEFAULT nextval('tournaments_id_seq'::regclass)
- `tournament_code`: character varying(20) (NOT NULL)
- `name`: character varying(200) (NOT NULL)
- `description`: text (nullable)
- `sport`: character varying(50) (nullable) DEFAULT 'general'::character varying
- `tournament_type`: character varying(50) (nullable) DEFAULT 'school'::character varying
- `format`: character varying(50) (nullable) DEFAULT 'knockout'::character varying
- `location`: character varying(200) (nullable)
- `start_date`: date (nullable)
- `end_date`: date (nullable)
- `status`: character varying(20) (nullable) DEFAULT 'draft'::character varying
- `organizer_id`: integer (nullable)
- `created_by`: integer (NOT NULL)
- `created_at`: timestamp without time zone (nullable) DEFAULT CURRENT_TIMESTAMP
- `updated_at`: timestamp without time zone (nullable) DEFAULT CURRENT_TIMESTAMP
- `max_teams`: integer (nullable) DEFAULT 16
- `min_teams`: integer (nullable) DEFAULT 2
- `visibility`: character varying(20) (nullable) DEFAULT 'public'::character varying
- `is_featured`: boolean (nullable) DEFAULT false
- `is_active`: boolean (nullable) DEFAULT true
- `entry_fee`: numeric (nullable) DEFAULT 0.00
- `prize_pool`: numeric (nullable) DEFAULT 0.00
- `age_group`: character varying(20) (nullable)
- `gender`: character varying(10) (nullable)
- `category`: character varying(50) (nullable) DEFAULT 'general'::character varying
- `logo_url`: character varying(500) (nullable)
- `banner_url`: character varying(500) (nullable)
- `registration_start_date`: date (nullable)
- `registration_end_date`: date (nullable)
- `eligibility_criteria`: jsonb (nullable)
- `rules_and_regulations`: text (nullable)
- `contact_info`: jsonb (nullable)
- `social_media`: jsonb (nullable)
- `live_streaming_url`: character varying(500) (nullable)
- `metadata`: jsonb (nullable)
- `approved_by`: integer (nullable)
- `approved_at`: timestamp without time zone (nullable)
- `published_at`: timestamp without time zone (nullable)
- `tournament_id`: uuid (nullable) DEFAULT uuid_generate_v4()

**Sample Data:**
```json
[
  {
    "id": 1,
    "tournament_code": "TRN001TEST",
    "name": "Test Enhanced Tournament",
    "description": "A test tournament with enhanced features",
    "sport": "football",
    "tournament_type": "school",
    "format": "knockout",
    "location": null,
    "start_date": null,
    "end_date": null,
    "status": "published",
    "organizer_id": null,
    "created_by": 1,
    "created_at": "2025-07-08T01:10:38.404Z",
    "updated_at": "2025-07-08T01:10:38.426Z",
    "max_teams": 16,
    "min_teams": 4,
    "visibility": "public",
    "is_featured": false,
    "is_active": true,
    "entry_fee": "0.00",
    "prize_pool": "0.00",
    "age_group": null,
    "gender": null,
    "category": "general",
    "logo_url": null,
    "banner_url": null,
    "registration_start_date": null,
    "registration_end_date": null,
    "eligibility_criteria": null,
    "rules_and_regulations": null,
    "contact_info": null,
    "social_media": null,
    "live_streaming_url": null,
    "metadata": null,
    "approved_by": null,
    "approved_at": null,
    "published_at": null,
    "tournament_id": "49c88371-07e7-40b7-9bd0-e5022ca0ad54"
  },
  {
    "id": 3,
    "tournament_code": "TRN1751937443615",
    "name": "Test Enhanced Tournament 1751937443615",
    "description": "A test tournament with enhanced features",
    "sport": "football",
    "tournament_type": "school",
    "format": "knockout",
    "location": null,
    "start_date": null,
    "end_date": null,
    "status": "published",
    "organizer_id": null,
    "created_by": 1,
    "created_at": "2025-07-08T01:17:23.672Z",
    "updated_at": "2025-07-08T01:17:23.680Z",
    "max_teams": 16,
    "min_teams": 4,
    "visibility": "public",
    "is_featured": false,
    "is_active": true,
    "entry_fee": "0.00",
    "prize_pool": "0.00",
    "age_group": null,
    "gender": null,
    "category": "general",
    "logo_url": null,
    "banner_url": null,
    "registration_start_date": null,
    "registration_end_date": null,
    "eligibility_criteria": null,
    "rules_and_regulations": null,
    "contact_info": null,
    "social_media": null,
    "live_streaming_url": null,
    "metadata": null,
    "approved_by": null,
    "approved_at": null,
    "published_at": null,
    "tournament_id": "0013ddb7-9cef-4906-9614-87994bbfe6a8"
  },
  {
    "id": 4,
    "tournament_code": "TRN1751938110628",
    "name": "Test Enhanced Tournament 1751938110628",
    "description": "A test tournament with enhanced features",
    "sport": "football",
    "tournament_type": "school",
    "format": "knockout",
    "location": null,
    "start_date": null,
    "end_date": null,
    "status": "published",
    "organizer_id": null,
    "created_by": 1,
    "created_at": "2025-07-08T01:28:30.677Z",
    "updated_at": "2025-07-08T01:28:30.689Z",
    "max_teams": 16,
    "min_teams": 4,
    "visibility": "public",
    "is_featured": false,
    "is_active": true,
    "entry_fee": "0.00",
    "prize_pool": "0.00",
    "age_group": null,
    "gender": null,
    "category": "general",
    "logo_url": null,
    "banner_url": null,
    "registration_start_date": null,
    "registration_end_date": null,
    "eligibility_criteria": null,
    "rules_and_regulations": null,
    "contact_info": null,
    "social_media": null,
    "live_streaming_url": null,
    "metadata": null,
    "approved_by": null,
    "approved_at": null,
    "published_at": null,
    "tournament_id": "b91af094-8b2b-4331-8111-4b6aea40060d"
  }
]
```

---

### 📋 USERS
- **Columns:** 15
- **Primary Key:** id
- **Foreign Keys:** 1
- **Unique Constraints:** 3
- **Indexes:** 6
- **Row Count:** 16

**Columns:**
- `id`: integer (NOT NULL) DEFAULT nextval('users_id_seq'::regclass)
- `full_name`: character varying(100) (NOT NULL)
- `email`: character varying(100) (NOT NULL)
- `password_hash`: character varying(200) (NOT NULL)
- `role`: character varying(50) (NOT NULL)
- `school_id`: integer (nullable)
- `created_at`: timestamp without time zone (nullable) DEFAULT now()
- `updated_at`: timestamp without time zone (nullable) DEFAULT now()
- `organization_id`: integer (nullable)
- `google_id`: character varying(100) (nullable)
- `phone`: character varying(20) (nullable)
- `two_factor_enabled`: boolean (nullable) DEFAULT false
- `profile_photo_url`: character varying(500) (nullable)
- `timezone`: character varying(50) (nullable) DEFAULT 'UTC'::character varying
- `notification_preferences`: jsonb (nullable) DEFAULT '{}'::jsonb

**Foreign Keys:**
- `organization_id` → `organizations.id` (fk_users_organization)

**Sample Data:**
```json
[
  {
    "id": 12,
    "full_name": "Test Admin",
    "email": "test@athletiq.com",
    "password_hash": "$2a$10$5iUDCOFeGqRwtjdppYTd2eWLwY9gw93HCD.Yv44.b6vSTicL5GRmG",
    "role": "SuperAdmin",
    "school_id": null,
    "created_at": "2025-07-03T00:20:13.873Z",
    "updated_at": "2025-07-03T00:20:13.873Z",
    "organization_id": null,
    "google_id": null,
    "phone": null,
    "two_factor_enabled": false,
    "profile_photo_url": null,
    "timezone": "UTC",
    "notification_preferences": {}
  },
  {
    "id": 1,
    "full_name": "Super Admin",
    "email": "super@athletiq.com",
    "password_hash": "$2a$12$K9HbjDGOKQytU81eVUj9RO4oiJ5bjKjK204b7Hxt0s5bMqpp0wNhC",
    "role": "SuperAdmin",
    "school_id": null,
    "created_at": "2025-06-26T19:18:41.095Z",
    "updated_at": "2025-06-26T19:18:41.095Z",
    "organization_id": null,
    "google_id": null,
    "phone": null,
    "two_factor_enabled": false,
    "profile_photo_url": null,
    "timezone": "UTC",
    "notification_preferences": {}
  },
  {
    "id": 3,
    "full_name": "Minu Basnet",
    "email": "admin.pashupati@athletiq.com",
    "password_hash": "$2b$10$97lm0nztbsUQCZQJtjTSe.jgw58HORinPckzgZCTBsKnQCjvoJ52S",
    "role": "SchoolAdmin",
    "school_id": 2,
    "created_at": "2025-06-26T20:00:51.075Z",
    "updated_at": "2025-06-26T20:00:51.075Z",
    "organization_id": null,
    "google_id": null,
    "phone": null,
    "two_factor_enabled": false,
    "profile_photo_url": null,
    "timezone": "UTC",
    "notification_preferences": {}
  }
]
```

---

## 🔗 RELATIONSHIPS SUMMARY

### AUDIT_LOGS References:
- audit_logs.user_id → users.id (NO ACTION/NO ACTION)

### DOCUMENT_UPLOADS References:
- document_uploads.uploaded_by → users.id (NO ACTION/NO ACTION)

### MATCHES References:
- matches.team1_id → teams.id (SET NULL/NO ACTION)
- matches.team2_id → teams.id (SET NULL/NO ACTION)
- matches.sport_id → sports.id (CASCADE/NO ACTION)
- matches.home_team_id → tournament_teams.id (CASCADE/NO ACTION)
- matches.away_team_id → tournament_teams.id (CASCADE/NO ACTION)

### NOTIFICATIONS References:
- notifications.user_id → users.id (NO ACTION/NO ACTION)

### PLAYER_MATCH_STATS References:
- player_match_stats.player_id → players.id (CASCADE/NO ACTION)
- player_match_stats.match_id → matches.id (CASCADE/NO ACTION)
- player_match_stats.team_id → teams.id (SET NULL/NO ACTION)

### PLAYER_SPORT_PARTICIPATION References:
- player_sport_participation.sport_id → sports.id (CASCADE/NO ACTION)
- player_sport_participation.team_id → teams.id (SET NULL/NO ACTION)
- player_sport_participation.player_id → players.id (CASCADE/NO ACTION)

### PLAYERS References:
- players.school_id → schools.id (CASCADE/NO ACTION)
- players.created_by → users.id (SET NULL/NO ACTION)
- players.school_id → schools.id (CASCADE/NO ACTION)

### SCHOOLS References:
- schools.created_by → users.id (SET NULL/NO ACTION)
- schools.admin_user_id → users.id (NO ACTION/NO ACTION)
- schools.organization_id → organizations.id (NO ACTION/NO ACTION)

### SCORECARDS References:
- scorecards.match_id → matches.id (CASCADE/NO ACTION)
- scorecards.uploaded_by → users.id (SET NULL/NO ACTION)

### TEAMS References:
- teams.school_id → schools.id (CASCADE/NO ACTION)
- teams.sport_id → sports.id (CASCADE/NO ACTION)
- teams.school_id → schools.id (NO ACTION/NO ACTION)

### TOURNAMENT_PLAYERS References:
- tournament_players.tournament_team_id → tournament_teams.id (CASCADE/NO ACTION)
- tournament_players.player_id → players.id (CASCADE/NO ACTION)

### TOURNAMENT_REGISTRATIONS References:
- tournament_registrations.team_id → teams.id (CASCADE/NO ACTION)
- tournament_registrations.player_id → players.id (CASCADE/NO ACTION)

### TOURNAMENT_TEAMS References:
- tournament_teams.team_id → teams.id (CASCADE/NO ACTION)

### USERS References:
- users.organization_id → organizations.id (NO ACTION/NO ACTION)

