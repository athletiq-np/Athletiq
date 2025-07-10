const { pool } = require('../../config/db');

/**
 * Football Scoresheet Data Service
 * Fetches schools, teams, and players for scoresheet generation
 */
class ScoreSheetDataService {
  /**
   * Get 8 schools with their football teams and players
   * @param {number} limit - Number of schools to fetch (default: 8)
   * @returns {Promise<Array>} Array of schools with teams and players
   */
  static async getSchoolsWithFootballTeams(limit = 8) {
    try {
      // First, get the sport_id for football
      const footballSportQuery = `
        SELECT id FROM sports 
        WHERE LOWER(name) IN ('football', 'soccer') 
        LIMIT 1
      `;
      const footballSportResult = await pool.query(footballSportQuery);
      
      if (footballSportResult.rows.length === 0) {
        throw new Error('Football sport not found in database');
      }
      
      const footballSportId = footballSportResult.rows[0].id;
      
      // Get schools with football teams and their players
      const query = `
        SELECT 
          s.id as school_id,
          s.name as school_name,
          s.school_code,
          s.address,
          s.city,
          s.province,
          s.district,
          s.phone,
          s.email,
          s.principal_name,
          s.admin_email,
          json_agg(
            DISTINCT jsonb_build_object(
              'team_id', t.id,
              'team_name', t.team_name,
              'season', t.season,
              'created_at', t.created_at
            )
          ) FILTER (WHERE t.id IS NOT NULL) as teams,
          json_agg(
            DISTINCT jsonb_build_object(
              'player_id', p.id,
              'player_code', p.player_code,
              'full_name', p.full_name,
              'date_of_birth', p.date_of_birth,
              'gender', p.gender,
              'class', p.class,
              'section', p.section,
              'registration_status', p.registration_status,
              'is_active', p.is_active
            )
          ) FILTER (WHERE p.id IS NOT NULL) as players
        FROM schools s
        LEFT JOIN teams t ON s.id = t.school_id AND t.sport_id = $1
        LEFT JOIN players p ON s.id = p.school_id AND p.is_active = true
        WHERE s.is_active = true
        GROUP BY s.id, s.name, s.school_code, s.address, s.city, s.province, s.district, s.phone, s.email, s.principal_name, s.admin_email
        HAVING COUNT(DISTINCT t.id) > 0 OR COUNT(DISTINCT p.id) > 0
        ORDER BY s.name
        LIMIT $2
      `;
      
      const result = await pool.query(query, [footballSportId, limit]);
      
      return result.rows.map(school => ({
        ...school,
        teams: school.teams || [],
        players: school.players || []
      }));
      
    } catch (error) {
      console.error('Error fetching schools with football teams:', error);
      throw error;
    }
  }

  /**
   * Get schools managed by a specific admin (admin@test.com)
   * @param {string} adminEmail - Admin email to filter by
   * @param {number} limit - Number of schools to fetch
   * @returns {Promise<Array>} Array of schools with teams and players
   */
  static async getSchoolsByAdmin(adminEmail = 'admin@test.com', limit = 8) {
    try {
      // First, get the sport_id for football
      const footballSportQuery = `
        SELECT id FROM sports 
        WHERE LOWER(name) IN ('football', 'soccer') 
        LIMIT 1
      `;
      const footballSportResult = await pool.query(footballSportQuery);
      
      if (footballSportResult.rows.length === 0) {
        throw new Error('Football sport not found in database');
      }
      
      const footballSportId = footballSportResult.rows[0].id;
      
      // Get schools with football teams managed by specific admin
      const query = `
        SELECT 
          s.id as school_id,
          s.name as school_name,
          s.school_code,
          s.address,
          s.city,
          s.province,
          s.district,
          s.phone,
          s.email,
          s.principal_name,
          s.admin_email,
          json_agg(
            DISTINCT jsonb_build_object(
              'team_id', t.id,
              'team_name', t.team_name,
              'season', t.season,
              'created_at', t.created_at
            )
          ) FILTER (WHERE t.id IS NOT NULL) as teams,
          json_agg(
            DISTINCT jsonb_build_object(
              'player_id', p.id,
              'player_code', p.player_code,
              'full_name', p.full_name,
              'date_of_birth', p.date_of_birth,
              'gender', p.gender,
              'class', p.class,
              'section', p.section,
              'registration_status', p.registration_status,
              'is_active', p.is_active
            )
          ) FILTER (WHERE p.id IS NOT NULL) as players
        FROM schools s
        LEFT JOIN teams t ON s.id = t.school_id AND t.sport_id = $1
        LEFT JOIN players p ON s.id = p.school_id AND p.is_active = true
        WHERE s.is_active = true AND s.admin_email = $2
        GROUP BY s.id, s.name, s.school_code, s.address, s.city, s.province, s.district, s.phone, s.email, s.principal_name, s.admin_email
        ORDER BY s.name
        LIMIT $3
      `;
      
      const result = await pool.query(query, [footballSportId, adminEmail, limit]);
      
      return result.rows.map(school => ({
        ...school,
        teams: school.teams || [],
        players: school.players || []
      }));
      
    } catch (error) {
      console.error('Error fetching schools by admin:', error);
      throw error;
    }
  }

  /**
   * Get players for a specific team
   * @param {number} teamId - Team ID
   * @returns {Promise<Array>} Array of players in the team
   */
  static async getPlayersForTeam(teamId) {
    try {
      const query = `
        SELECT 
          p.id as player_id,
          p.player_code,
          p.full_name,
          p.date_of_birth,
          p.gender,
          p.class,
          p.section,
          p.registration_status,
          p.is_active,
          psp.event_category as position,
          psp.joined_at
        FROM players p
        JOIN player_sport_participation psp ON p.id = psp.player_id
        WHERE psp.team_id = $1 AND p.is_active = true
        ORDER BY p.full_name
      `;
      
      const result = await pool.query(query, [teamId]);
      return result.rows;
      
    } catch (error) {
      console.error('Error fetching players for team:', error);
      throw error;
    }
  }

  /**
   * Get match data for scoresheet generation
   * @param {Object} matchInfo - Match information
   * @returns {Promise<Object>} Match data with teams and players
   */
  static async getMatchData(matchInfo) {
    try {
      const { homeTeamId, awayTeamId, matchDate, venue } = matchInfo;
      
      // Get team details with school information
      const teamsQuery = `
        SELECT 
          t.id as team_id,
          t.team_name,
          t.season,
          s.id as school_id,
          s.name as school_name,
          s.school_code,
          s.address,
          s.city,
          s.province
        FROM teams t
        JOIN schools s ON t.school_id = s.id
        WHERE t.id IN ($1, $2)
      `;
      
      const teamsResult = await pool.query(teamsQuery, [homeTeamId, awayTeamId]);
      
      if (teamsResult.rows.length !== 2) {
        throw new Error('Both teams must exist in the database');
      }
      
      // Get players for both teams
      const homeTeam = teamsResult.rows.find(t => t.team_id === homeTeamId);
      const awayTeam = teamsResult.rows.find(t => t.team_id === awayTeamId);
      
      const [homePlayers, awayPlayers] = await Promise.all([
        this.getPlayersForTeam(homeTeamId),
        this.getPlayersForTeam(awayTeamId)
      ]);
      
      return {
        match: {
          date: matchDate,
          venue: venue,
          homeTeam: {
            ...homeTeam,
            players: homePlayers
          },
          awayTeam: {
            ...awayTeam,
            players: awayPlayers
          }
        }
      };
      
    } catch (error) {
      console.error('Error fetching match data:', error);
      throw error;
    }
  }

  /**
   * Get available sports from the database
   * @returns {Promise<Array>} Array of sports
   */
  static async getSports() {
    try {
      const query = 'SELECT id, name FROM sports ORDER BY name';
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error fetching sports:', error);
      throw error;
    }
  }

  /**
   * Create sample data for testing scoresheet generation
   * @returns {Object} Sample match data
   */
  static createSampleMatchData() {
    return {
      match: {
        date: new Date().toISOString().split('T')[0],
        venue: 'Athletiq Sports Complex',
        homeTeam: {
          team_id: 1,
          team_name: 'Eagles FC',
          school_name: 'Kathmandu Model School',
          school_code: 'KMS001',
          players: [
            { player_id: 1, full_name: 'Ram Bahadur Thapa', position: 'Goalkeeper' },
            { player_id: 2, full_name: 'Sita Kumari Sharma', position: 'Defender' },
            { player_id: 3, full_name: 'Arjun Singh Khadka', position: 'Midfielder' },
            { player_id: 4, full_name: 'Maya Gurung', position: 'Forward' },
            { player_id: 5, full_name: 'Bikash Tamang', position: 'Defender' },
            { player_id: 6, full_name: 'Anita Rai', position: 'Midfielder' },
            { player_id: 7, full_name: 'Suresh Malla', position: 'Forward' },
            { player_id: 8, full_name: 'Kamala Shrestha', position: 'Defender' },
            { player_id: 9, full_name: 'Ravi Karki', position: 'Midfielder' },
            { player_id: 10, full_name: 'Sunita Poudel', position: 'Forward' },
            { player_id: 11, full_name: 'Deepak Oli', position: 'Defender' }
          ]
        },
        awayTeam: {
          team_id: 2,
          team_name: 'Lions United',
          school_name: 'Lalitpur Academy',
          school_code: 'LA002',
          players: [
            { player_id: 12, full_name: 'Hari Bahadur Lama', position: 'Goalkeeper' },
            { player_id: 13, full_name: 'Gita Adhikari', position: 'Defender' },
            { player_id: 14, full_name: 'Prakash Neupane', position: 'Midfielder' },
            { player_id: 15, full_name: 'Laxmi Bhandari', position: 'Forward' },
            { player_id: 16, full_name: 'Nabin Shrestha', position: 'Defender' },
            { player_id: 17, full_name: 'Sabita Pun', position: 'Midfielder' },
            { player_id: 18, full_name: 'Ganesh Thapa', position: 'Forward' },
            { player_id: 19, full_name: 'Nirmala Gautam', position: 'Defender' },
            { player_id: 20, full_name: 'Rajesh Yadav', position: 'Midfielder' },
            { player_id: 21, full_name: 'Sarita Maharjan', position: 'Forward' },
            { player_id: 22, full_name: 'Amit Basnet', position: 'Defender' }
          ]
        }
      }
    };
  }
}

module.exports = ScoreSheetDataService;
