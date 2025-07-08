# 📊 ATHLETIQ DATABASE SCHEMA UNDERSTANDING

## 🎯 KEY FINDINGS FROM DATABASE ANALYSIS

### 📋 CORE TABLES AND RELATIONSHIPS

#### 1️⃣ **USERS & AUTHENTICATION**
- **users**: 16 rows - Core user table with roles (SuperAdmin, SchoolAdmin, etc.)
- **organizations**: 0 rows - Empty, designed for multi-tenancy
- **audit_logs**: 0 rows - User action tracking
- **notifications**: 0 rows - User notification system

#### 2️⃣ **SCHOOLS & INSTITUTIONAL DATA**
- **schools**: 17 rows - School information with verification system
- **Key fields**: `school_code`, `admin_email`, `verification_status`, `onboarding_status`
- **Relations**: → users (created_by, admin_user_id), → organizations

#### 3️⃣ **SPORTS & TEAMS**
- **sports**: 15 rows - Sports list (Football, Basketball, Cricket, etc.)
- **teams**: 3 rows - School teams by sport
- **Key fields**: `team_name`, `sport_id`, `school_id`, `season`
- **Relations**: teams → schools, teams → sports

#### 4️⃣ **PLAYERS & ATHLETES**
- **players**: 204 rows - Student athlete profiles
- **Key fields**: `player_code`, `registration_status`, `eligibility_status`, `school_id`
- **Relations**: players → schools, players → users (created_by)

#### 5️⃣ **TOURNAMENTS & COMPETITIONS**
- **tournaments**: 7 rows - Tournament definitions
- **tournament_teams**: 3 rows - Team registrations for tournaments
- **tournament_players**: 4 rows - Player registrations within teams
- **tournament_registrations**: 2 rows - Registration tracking
- **Key fields**: `tournament_code`, `status`, `sport`, `max_teams`, `registration_status`

#### 6️⃣ **MATCHES & RESULTS**
- **matches**: 0 rows - Match scheduling and results
- **tournament_matches**: 0 rows - Tournament-specific matches
- **player_match_stats**: 0 rows - Individual player statistics
- **tournament_standings**: 0 rows - Tournament standings/leaderboard

#### 7️⃣ **SUPPORT SYSTEMS**
- **analytics_events**: 0 rows - User behavior tracking
- **document_uploads**: 0 rows - File management with AI processing
- **ai_processing_queue**: 1 row - AI/ML processing queue
- **scorecards**: 0 rows - Match scorecards

## 🔍 CRITICAL SCHEMA INSIGHTS

### ✅ **WHAT'S WORKING**
1. **Core Data Model**: Schools, Players, Teams, Tournaments are well-defined
2. **Foreign Key Relationships**: Proper referential integrity
3. **Status Tracking**: Registration and eligibility status fields
4. **Audit Trail**: Tournament audit logging in place
5. **Flexible Sports**: Dynamic sports table with proper relationships

### ⚠️ **SCHEMA INCONSISTENCIES FOUND**
1. **Tournament Controller Issues**:
   - Uses `t.sport` but tournaments table has `sport` column (string)
   - Uses `team.name` but teams table has `team_name` column
   - Uses `verification_status` but players table has `registration_status`

2. **Missing Relationships**:
   - `tournaments` table missing foreign key to `users` (created_by)
   - `tournament_teams` missing foreign key to `tournaments`
   - `tournament_registrations` missing foreign key to `tournaments`

3. **Data Type Mismatches**:
   - Some queries expect integer IDs but use string comparisons
   - Date/timestamp handling inconsistencies

## 🚨 **IMMEDIATE FIXES NEEDED IN TOURNAMENT CONTROLLER**

### 1️⃣ **Column Name Corrections**
```sql
-- Current controller uses: t.sport
-- Should use: t.sport (this is correct)

-- Current controller uses: team.name  
-- Should use: team.team_name

-- Current controller uses: verification_status
-- Should use: registration_status
```

### 2️⃣ **Join Corrections**
```sql
-- Current: tournament_teams tt JOIN teams t ON tt.team_id = t.id
-- This is correct, but need to use t.team_name not t.name

-- Current: players with verification_status
-- Should use: registration_status or eligibility_status
```

### 3️⃣ **Status Field Corrections**
```sql
-- Players table actual status fields:
-- registration_status: 'pending', 'approved', 'rejected'
-- eligibility_status: 'pending', 'eligible', 'ineligible'

-- Tournament teams actual status field:
-- registration_status: 'registered', 'pending', 'rejected', 'withdrawn'
```

## 🎯 **TOURNAMENT CONTROLLER FIXES NEEDED**

### 🔧 **Query Corrections Required**
1. **Team Name References**: Change `t.name` to `t.team_name` in all queries
2. **Player Status**: Use `registration_status` instead of `verification_status`
3. **Tournament Relations**: Add proper foreign key constraints
4. **Match References**: Update match queries to use tournament_teams properly

### 🔧 **Function-Specific Fixes**
1. **getTournamentTeams**: Fix team_name column reference
2. **checkPlayerEligibility**: Use correct player status fields
3. **registerTeamEnhanced**: Validate against actual schema
4. **getTournamentBracket**: Fix team name joins

## 🎮 **SAMPLE DATA ANALYSIS**

### 📊 **Current Data State**
- **Active Schools**: 17 schools with test data
- **Active Players**: 204 players (test data generated)
- **Active Teams**: 3 teams across 2 schools
- **Active Tournaments**: 7 tournaments in various states
- **Active Registrations**: 2 team registrations, 4 player registrations

### 🧪 **Test Data Quality**
- Schools have proper codes and verification status
- Players have proper registration status
- Teams are properly linked to schools and sports
- Tournament registrations are functioning
- Foreign key constraints are maintained

## 🚀 **NEXT STEPS**

1. **Fix Tournament Controller**: Update all column references and status fields
2. **Add Missing Foreign Keys**: Ensure all relationships are properly constrained
3. **Validate Test Scripts**: Update test scripts to match actual schema
4. **Update Frontend**: Ensure frontend matches backend schema expectations
5. **Add Indexes**: Optimize frequently queried columns

## 📝 **SCHEMA VALIDATION CHECKLIST**

- [x] Database connection working
- [x] All tables analyzed
- [x] Foreign key relationships mapped
- [x] Sample data examined
- [x] Status field values identified
- [x] Column name discrepancies found
- [ ] Tournament controller fixes applied
- [ ] Test scripts updated
- [ ] Frontend updated
- [ ] Performance optimizations applied

---

**Generated**: 2025-07-08T02:10:20.196Z  
**Database**: athletiq (PostgreSQL 17.5)  
**Total Tables**: 25  
**Total Relationships**: 14  
**Total Data Rows**: 276
