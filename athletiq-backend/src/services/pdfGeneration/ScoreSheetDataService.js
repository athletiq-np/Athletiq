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
   * Get real match data from database for scoresheet generation
   * @param {number} matchId - Match ID to fetch data for
   * @returns {Promise<Object>} Real match data from database
   */
  static async getRealMatchData(matchId) {
    try {
      const matchQuery = `
        SELECT 
          m.*,
          s.name as sport_name,
          t.name as tournament_name,
          ht.name as home_team_name,
          ht.school_id as home_school_id,
          at.name as away_team_name,
          at.school_id as away_school_id,
          hs.name as home_school_name,
          hs.school_code as home_school_code,
          aws.name as away_school_name,
          aws.school_code as away_school_code
        FROM matches m
        JOIN sports s ON m.sport_id = s.id
        JOIN tournaments t ON m.tournament_id = t.id
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
        JOIN schools hs ON ht.school_id = hs.school_id
        JOIN schools aws ON at.school_id = aws.school_id
        WHERE m.id = $1
      `;
      
      const matchResult = await pool.query(matchQuery, [matchId]);
      
      if (matchResult.rows.length === 0) {
        throw new Error(`Match with ID ${matchId} not found`);
      }
      
      const match = matchResult.rows[0];
      
      // Get players for both teams
      const [homePlayers, awayPlayers] = await Promise.all([
        this.getPlayersForTeam(match.home_team_id),
        this.getPlayersForTeam(match.away_team_id)
      ]);
      
      return {
        match: {
          id: match.id,
          date: match.scheduled_at ? match.scheduled_at.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          venue: match.venue || 'TBD',
          sport: match.sport_name,
          tournament: match.tournament_name,
          homeTeam: {
            team_id: match.home_team_id,
            team_name: match.home_team_name,
            school_name: match.home_school_name,
            school_code: match.home_school_code,
            players: homePlayers
          },
          awayTeam: {
            team_id: match.away_team_id,
            team_name: match.away_team_name,
            school_name: match.away_school_name,
            school_code: match.away_school_code,
            players: awayPlayers
          }
        }
      };
    } catch (error) {
      console.error('Error fetching real match data:', error);
      throw error;
    }
  }
}

module.exports = ScoreSheetDataService;
