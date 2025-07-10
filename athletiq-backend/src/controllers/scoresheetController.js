const FootballTemplateService = require('../services/pdfGeneration/templates/FootballTemplateService');
const ScoreSheetDataService = require('../services/pdfGeneration/ScoreSheetDataService');
const { ApiResponse } = require('../utils/apiResponse');

/**
 * Scoresheet Controller
 * Handles generation of printable football scoresheets
 */
class ScoresheetController {
  
  /**
   * Generate a single football scoresheet
   * @route POST /api/scoresheets/football/generate
   */
  static async generateFootballScoresheet(req, res) {
    try {
      const {
        useRealData = true,
        format = 'blank',
        schoolLimit = 8,
        useAdminFilter = false,
        adminEmail = 'admin@test.com',
        matchInfo = null
      } = req.body;

      const templateService = new FootballTemplateService();
      let htmlContent;

      if (useRealData) {
        htmlContent = await templateService.generateWithRealData({
          schoolLimit,
          useAdminFilter,
          adminEmail,
          format,
          matchInfo
        });
      } else {
        htmlContent = templateService.generateWithSampleData(format);
      }

      ApiResponse.success(res, {
        html: htmlContent,
        format,
        generated_at: new Date().toISOString(),
        data_source: useRealData ? 'database' : 'sample'
      }, 'Football scoresheet generated successfully');

    } catch (error) {
      console.error('Error generating football scoresheet:', error);
      ApiResponse.error(res, 'Failed to generate football scoresheet', 500);
    }
  }

  /**
   * Generate multiple football scoresheets
   * @route POST /api/scoresheets/football/batch
   */
  static async batchGenerateFootballScoresheets(req, res) {
    try {
      const { matchList = [], defaultOptions = {} } = req.body;

      if (!Array.isArray(matchList) || matchList.length === 0) {
        return ApiResponse.error(res, 'Match list is required and must be a non-empty array', 400);
      }

      const templateService = new FootballTemplateService();
      
      // Merge default options with each match config
      const processedMatchList = matchList.map(match => ({
        ...defaultOptions,
        ...match
      }));

      const results = await templateService.batchGenerate(processedMatchList);

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      ApiResponse.success(res, {
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: failureCount
        },
        generated_at: new Date().toISOString()
      }, `Batch generation completed: ${successCount}/${results.length} successful`);

    } catch (error) {
      console.error('Error in batch scoresheet generation:', error);
      ApiResponse.error(res, 'Failed to generate batch scoresheets', 500);
    }
  }

  /**
   * Get available schools for scoresheet generation
   * @route GET /api/scoresheets/schools
   */
  static async getAvailableSchools(req, res) {
    try {
      const { limit = 20, adminEmail } = req.query;

      let schools;
      if (adminEmail) {
        schools = await ScoreSheetDataService.getSchoolsByAdmin(adminEmail, parseInt(limit));
      } else {
        schools = await ScoreSheetDataService.getSchoolsWithFootballTeams(parseInt(limit));
      }

      ApiResponse.success(res, {
        schools: schools.map(school => ({
          school_id: school.school_id,
          school_name: school.school_name,
          school_code: school.school_code,
          city: school.city,
          teams_count: school.teams?.length || 0,
          players_count: school.players?.length || 0
        })),
        total: schools.length
      }, 'Schools retrieved successfully');

    } catch (error) {
      console.error('Error fetching schools:', error);
      ApiResponse.error(res, 'Failed to fetch schools', 500);
    }
  }

  /**
   * Get team details for a specific school
   * @route GET /api/scoresheets/schools/:schoolId/teams
   */
  static async getSchoolTeams(req, res) {
    try {
      const { schoolId } = req.params;

      // Get school teams with football focus
      const schools = await ScoreSheetDataService.getSchoolsWithFootballTeams(1);
      const school = schools.find(s => s.school_id == schoolId);

      if (!school) {
        return ApiResponse.error(res, 'School not found', 404);
      }

      ApiResponse.success(res, {
        school: {
          school_id: school.school_id,
          school_name: school.school_name,
          school_code: school.school_code
        },
        teams: school.teams || [],
        players: school.players || []
      }, 'School teams retrieved successfully');

    } catch (error) {
      console.error('Error fetching school teams:', error);
      ApiResponse.error(res, 'Failed to fetch school teams', 500);
    }
  }

  /**
   * Generate scoresheet for specific teams
   * @route POST /api/scoresheets/teams/match
   */
  static async generateTeamMatch(req, res) {
    try {
      const {
        homeTeamId,
        awayTeamId,
        matchDate,
        venue = 'Athletiq Sports Complex',
        format = 'blank'
      } = req.body;

      if (!homeTeamId || !awayTeamId) {
        return ApiResponse.error(res, 'Both home and away team IDs are required', 400);
      }

      const matchInfo = {
        homeTeamId: parseInt(homeTeamId),
        awayTeamId: parseInt(awayTeamId),
        matchDate: matchDate || new Date().toISOString().split('T')[0],
        venue
      };

      const templateService = new FootballTemplateService();
      const htmlContent = await templateService.generateWithRealData({
        format,
        matchInfo
      });

      ApiResponse.success(res, {
        html: htmlContent,
        match_info: matchInfo,
        format,
        generated_at: new Date().toISOString()
      }, 'Team match scoresheet generated successfully');

    } catch (error) {
      console.error('Error generating team match scoresheet:', error);
      ApiResponse.error(res, 'Failed to generate team match scoresheet', 500);
    }
  }

  /**
   * Get template information
   * @route GET /api/scoresheets/football/template-info
   */
  static async getTemplateInfo(req, res) {
    try {
      const templateService = new FootballTemplateService();

      ApiResponse.success(res, {
        name: templateService.name,
        description: templateService.description,
        sport: templateService.sportName,
        team_size: templateService.teamSize,
        substitutes: templateService.substitutes,
        match_duration: templateService.matchDuration,
        supported_formats: ['blank', 'pre-filled'],
        features: [
          'AFC Champions League style design',
          'Print-optimized layout',
          'Team rosters with player details',
          'Score tracking sections',
          'Officials signatures',
          'Match event logging',
          'Professional branding support'
        ]
      }, 'Template information retrieved successfully');

    } catch (error) {
      console.error('Error fetching template info:', error);
      ApiResponse.error(res, 'Failed to fetch template information', 500);
    }
  }

  /**
   * Preview scoresheet with sample data
   * @route GET /api/scoresheets/football/preview
   */
  static async previewScoresheet(req, res) {
    try {
      const { format = 'blank' } = req.query;

      const templateService = new FootballTemplateService();
      const htmlContent = templateService.generateWithSampleData(format);

      ApiResponse.success(res, {
        html: htmlContent,
        format,
        data_source: 'sample',
        generated_at: new Date().toISOString()
      }, 'Preview scoresheet generated successfully');

    } catch (error) {
      console.error('Error generating preview:', error);
      ApiResponse.error(res, 'Failed to generate preview', 500);
    }
  }
}

module.exports = ScoresheetController;
