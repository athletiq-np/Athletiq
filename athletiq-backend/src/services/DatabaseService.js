const pool = require('../config/db');
const { createLogger } = require('../utils/logger');

const logger = createLogger('database-service');

/**
 * Centralized Database Service
 * Ensures all data operations go through the database
 */
class DatabaseService {
  
  /**
   * Get all schools with their basic information
   */
  static async getAllSchools(limit = 50, offset = 0) {
    try {
      const query = `
        SELECT 
          school_id,
          school_code,
          name,
          address,
          city,
          province,
          district,
          phone,
          email,
          website,
          principal_name,
          onboarding_status,
          created_at
        FROM schools 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `;
      
      const result = await pool.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching schools:', error);
      throw error;
    }
  }

  /**
   * Get all players with their school information
   */
  static async getAllPlayers(limit = 50, offset = 0) {
    try {
      const query = `
        SELECT 
          p.id as player_id,
          p.full_name,
          p.date_of_birth,
          p.gender,
          p.grade,
          p.section,
          p.address,
          p.guardian_father_name,
          p.guardian_mother_name,
          p.guardian_phone,
          p.guardian_email,
          p.created_at,
          s.name as school_name,
          s.school_code
        FROM players p
        LEFT JOIN schools s ON p.school_id = s.school_id
        ORDER BY p.created_at DESC 
        LIMIT $1 OFFSET $2
      `;
      
      const result = await pool.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching players:', error);
      throw error;
    }
  }

  /**
   * Get all tournaments with their details
   */
  static async getAllTournaments(limit = 50, offset = 0) {
    try {
      const query = `
        SELECT 
          t.id as tournament_id,
          t.name,
          t.description,
          t.start_date,
          t.end_date,
          t.venue,
          t.status,
          t.registration_deadline,
          t.max_teams,
          t.created_at,
          COUNT(tt.team_id) as registered_teams
        FROM tournaments t
        LEFT JOIN tournament_teams tt ON t.id = tt.tournament_id
        GROUP BY t.id, t.name, t.description, t.start_date, t.end_date, t.venue, t.status, t.registration_deadline, t.max_teams, t.created_at
        ORDER BY t.created_at DESC 
        LIMIT $1 OFFSET $2
      `;
      
      const result = await pool.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching tournaments:', error);
      throw error;
    }
  }

  /**
   * Get all matches with team and tournament information
   */
  static async getAllMatches(limit = 50, offset = 0) {
    try {
      const query = `
        SELECT 
          m.id as match_id,
          m.scheduled_at,
          m.venue,
          m.status,
          m.home_score,
          m.away_score,
          m.created_at,
          t.name as tournament_name,
          ht.name as home_team_name,
          at.name as away_team_name,
          hs.name as home_school_name,
          aws.name as away_school_name
        FROM matches m
        LEFT JOIN tournaments t ON m.tournament_id = t.id
        LEFT JOIN teams ht ON m.home_team_id = ht.id
        LEFT JOIN teams at ON m.away_team_id = at.id
        LEFT JOIN schools hs ON ht.school_id = hs.school_id
        LEFT JOIN schools aws ON at.school_id = aws.school_id
        ORDER BY m.scheduled_at DESC NULLS LAST, m.created_at DESC
        LIMIT $1 OFFSET $2
      `;
      
      const result = await pool.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching matches:', error);
      throw error;
    }
  }

  /**
   * Get teams with their school and player information
   */
  static async getAllTeams(limit = 50, offset = 0) {
    try {
      const query = `
        SELECT 
          t.id as team_id,
          t.name as team_name,
          t.sport,
          t.created_at,
          s.name as school_name,
          s.school_code,
          COUNT(tm.player_id) as player_count
        FROM teams t
        LEFT JOIN schools s ON t.school_id = s.school_id
        LEFT JOIN team_members tm ON t.id = tm.team_id
        GROUP BY t.id, t.name, t.sport, t.created_at, s.name, s.school_code
        ORDER BY t.created_at DESC
        LIMIT $1 OFFSET $2
      `;
      
      const result = await pool.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching teams:', error);
      throw error;
    }
  }

  /**
   * Get sports information from teams (since no sports table exists)
   */
  static async getAllSports() {
    try {
      const query = `
        SELECT 
          t.sport as sport_name,
          COUNT(DISTINCT t.id) as team_count,
          COUNT(DISTINCT tt.tournament_id) as tournament_count
        FROM teams t
        LEFT JOIN tournament_teams tt ON t.id = tt.team_id
        WHERE t.sport IS NOT NULL
        GROUP BY t.sport
        ORDER BY t.sport
      `;
      
      const result = await pool.query(query);
      return result.rows.map((row, index) => ({
        sport_id: index + 1,
        sport_name: row.sport_name,
        team_count: parseInt(row.team_count) || 0,
        tournament_count: parseInt(row.tournament_count) || 0
      }));
    } catch (error) {
      logger.error('Error fetching sports:', error);
      throw error;
    }
  }

  /**
   * Get database statistics for dashboard
   */
  static async getDashboardStats() {
    try {
      const queries = [
        'SELECT COUNT(*) as total_schools FROM schools',
        'SELECT COUNT(*) as total_players FROM players',
        'SELECT COUNT(*) as total_tournaments FROM tournaments',
        'SELECT COUNT(*) as total_matches FROM matches',
        'SELECT COUNT(*) as total_teams FROM teams',
        'SELECT COUNT(*) as active_tournaments FROM tournaments WHERE status = \'active\'',
        'SELECT COUNT(*) as pending_matches FROM matches WHERE status = \'scheduled\''
      ];

      const results = await Promise.all(
        queries.map(query => pool.query(query))
      );

      return {
        total_schools: parseInt(results[0].rows[0].total_schools),
        total_players: parseInt(results[1].rows[0].total_players),
        total_tournaments: parseInt(results[2].rows[0].total_tournaments),
        total_matches: parseInt(results[3].rows[0].total_matches),
        total_teams: parseInt(results[4].rows[0].total_teams),
        active_tournaments: parseInt(results[5].rows[0].active_tournaments),
        pending_matches: parseInt(results[6].rows[0].pending_matches)
      };
    } catch (error) {
      logger.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Search across multiple entities
   */
  static async globalSearch(searchTerm, limit = 20) {
    try {
      const searchPattern = `%${searchTerm}%`;
      
      const queries = [
        {
          type: 'schools',
          query: `
            SELECT 'school' as type, school_id as id, name, school_code as code, city as location
            FROM schools 
            WHERE name ILIKE $1 OR school_code ILIKE $1 OR city ILIKE $1
            LIMIT $2
          `
        },
        {
          type: 'players',
          query: `
            SELECT 'player' as type, id, full_name as name, 
                   CONCAT(grade, '-', section) as code, 
                   (SELECT name FROM schools WHERE school_id = p.school_id) as location
            FROM players p
            WHERE full_name ILIKE $1
            LIMIT $2
          `
        },
        {
          type: 'tournaments',
          query: `
            SELECT 'tournament' as type, id, name, 
                   status as code, venue as location
            FROM tournaments 
            WHERE name ILIKE $1 OR venue ILIKE $1
            LIMIT $2
          `
        }
      ];

      const results = await Promise.all(
        queries.map(q => pool.query(q.query, [searchPattern, limit]))
      );

      return results.flatMap((result, index) => 
        result.rows.map(row => ({
          ...row,
          category: queries[index].type
        }))
      );
    } catch (error) {
      logger.error('Error performing global search:', error);
      throw error;
    }
  }

  /**
   * Validate database connection and schema
   */
  static async validateDatabase() {
    try {
      const requiredTables = [
        'schools', 'players', 'tournaments', 'matches', 
        'teams', 'users', 'tournament_teams', 'team_members'
      ];

      const results = await Promise.all(
        requiredTables.map(table => 
          pool.query(`SELECT COUNT(*) FROM ${table}`)
        )
      );

      const tableStats = {};
      requiredTables.forEach((table, index) => {
        tableStats[table] = parseInt(results[index].rows[0].count);
      });

      return {
        connected: true,
        tables: tableStats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Database validation failed:', error);
      return {
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = DatabaseService;