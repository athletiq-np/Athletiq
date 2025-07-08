# 📊 ATHLETIQ DATABASE SCHEMA ANALYSIS

## 🏗️ DATABASE STRUCTURE OVERVIEW

Based on my analysis, here's the complete structure of the Athletiq database:

### 📋 CORE TABLES

#### 🏆 **TOURNAMENTS**
```sql
- id (integer, PK)
- tournament_code (varchar)
- name (varchar) 
- description (text)
- sport (varchar)
- tournament_type (varchar)
- format (varchar)
- location (varchar)
- start_date (date)
- end_date (date)
- status (varchar)
- organizer_id (integer, FK -> users.id)
- created_by (integer, FK -> users.id)
- created_at (timestamp)
- updated_at (timestamp)
- max_teams (integer)
- min_teams (integer)
- visibility (varchar)
- is_featured (boolean)
- is_active (boolean)
- entry_fee (numeric)
- prize_pool (numeric)
- age_group (varchar)
- gender (varchar)
- category (varchar)
- logo_url (varchar)
- banner_url (varchar)
- registration_start_date (date)
- registration_end_date (date)
- eligibility_criteria (jsonb)
- rules_and_regulations (text)
- contact_info (jsonb)
- social_media (jsonb)
- live_streaming_url (varchar)
- metadata (jsonb)
- approved_by (integer, FK -> users.id)
- approved_at (timestamp)
- published_at (timestamp)
- tournament_id (uuid)
```

#### 👥 **TOURNAMENT_TEAMS**
```sql
- id (integer, PK)
- tournament_id (integer, FK -> tournaments.id)
- team_id (integer, FK -> teams.id)
- seed_order (integer)
- registration_status (varchar)
```

#### 🏃 **TOURNAMENT_PLAYERS**
```sql
- id (integer, PK)
- tournament_team_id (integer, FK -> tournament_teams.id)
- player_id (integer, FK -> players.id)
- jersey_number (integer)
- position (varchar)
```

#### 📝 **TOURNAMENT_REGISTRATIONS**
```sql
- id (integer, PK)
- tournament_id (integer)
- team_id (integer) 
- player_id (integer)
- registration_date (timestamp)
- status (varchar)
```

#### 🏆 **TEAMS**
```sql
- id (integer, PK)
- school_id (integer, FK -> schools.id)
- sport_id (integer, FK -> sports.id)  ⚠️ REQUIRED FK
- team_name (varchar)
- season (varchar)
- created_at (timestamp)
```

#### 👤 **PLAYERS**
```sql
- id (integer, PK)
- player_code (varchar, NOT NULL)
- full_name (varchar, NOT NULL)
- full_name_nep (varchar)
- date_of_birth (date, NOT NULL)
- gender (varchar)
- school_id (integer, FK -> schools.id, NOT NULL)
- class (varchar)
- section (varchar)
- roll_no (varchar)
- address (varchar)
- address_nep (varchar)
- province (varchar)
- district (varchar)
- municipality (varchar)
- ward (varchar)
- contact_no (varchar)
- email (varchar)
- father_name (varchar)
- father_name_nep (varchar)
- mother_name (varchar)
- mother_name_nep (varchar)
- guardian_name (varchar)
- guardian_relation (varchar)
- guardian_contact (varchar)
- profile_photo_url (varchar)
- birth_cert_url (varchar)
- registration_status (varchar, DEFAULT 'pending')
- remarks (varchar)
- created_by (integer, FK -> users.id)
- is_active (boolean, NOT NULL, DEFAULT true)
- created_at (timestamp, NOT NULL)
- updated_at (timestamp, NOT NULL)
- athlete_id (varchar)
- nationality (varchar)
- height_cm (varchar)
- weight_kg (varchar)
- eligibility_status (varchar, DEFAULT 'pending')
```

#### 🏫 **SCHOOLS**
```sql
- id (integer, PK)
- school_code (varchar, NOT NULL)
- name (varchar, NOT NULL)
- address (text, NOT NULL)
- admin_email (varchar, NOT NULL)  ⚠️ REQUIRED
- country (varchar)
- city (varchar)
- admin_user_id (integer)
- created_at (timestamp, NOT NULL)
- updated_at (timestamp, NOT NULL)
```

#### 🏃‍♂️ **SPORTS**
```sql
- id (integer, PK)
- name (varchar)
```

### 🔗 FOREIGN KEY RELATIONSHIPS

1. **teams.sport_id** → **sports.id** (REQUIRED)
2. **teams.school_id** → **schools.id**
3. **tournament_teams.tournament_id** → **tournaments.id**
4. **tournament_teams.team_id** → **teams.id**
5. **tournament_players.tournament_team_id** → **tournament_teams.id**
6. **tournament_players.player_id** → **players.id**
7. **players.school_id** → **schools.id**

### 🚨 CRITICAL ISSUES IDENTIFIED

1. **Sports table is EMPTY** - Need to populate with sports data
2. **Teams require sport_id** - Cannot create teams without valid sport_id
3. **Schools require admin_email** - Must provide email when creating schools
4. **Player verification uses registration_status** not verification_status
5. **Tournament controller references non-existent columns** (like team.name instead of team.team_name)

### 📋 AUDIT & LOGGING TABLES

- **tournament_audit_log** - For tracking tournament changes
- **audit_logs** - General audit logging
- **analytics_events** - Event tracking

### 🎯 RECOMMENDATIONS FOR FIXING

1. **Populate sports table** with common sports
2. **Update tournament controller** to use correct column names
3. **Fix test scripts** to match actual schema
4. **Add missing database constraints** if needed
5. **Update frontend** to match backend schema

### 🔄 NEXT STEPS

1. Create sports data
2. Fix the test script with correct schema
3. Update tournament controller for schema compatibility
4. Continue with registration & team onboarding features

This analysis reveals that the database has a comprehensive structure but needs data population and schema alignment in the code.
