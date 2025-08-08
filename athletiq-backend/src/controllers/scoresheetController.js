const FootballTemplateService = require('../services/pdfGeneration/templates/FootballTemplateService');
const ScoreSheetDataService = require('../services/pdfGeneration/ScoreSheetDataService');
const { sendResponse } = require('../utils/response');

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

  return sendResponse(res, { data: {
        html: htmlContent,
        format,
        generated_at: new Date().toISOString(),
        data_source: useRealData ? 'database' : 'sample'
  }, message: 'Football scoresheet generated successfully' });

    } catch (error) {
      console.error('Error generating football scoresheet:', error);
  return sendResponse(res, { success: false, status: 500, message: 'Failed to generate football scoresheet' });
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
  return sendResponse(res, { success: false, status: 400, message: 'Match list is required and must be a non-empty array' });
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

  return sendResponse(res, { data: {
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: failureCount
        },
        generated_at: new Date().toISOString()
  }, message: `Batch generation completed: ${successCount}/${results.length} successful` });

    } catch (error) {
      console.error('Error in batch scoresheet generation:', error);
  return sendResponse(res, { success: false, status: 500, message: 'Failed to generate batch scoresheets' });
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

  return sendResponse(res, { data: {
        schools: schools.map(school => ({
          school_id: school.school_id,
          school_name: school.school_name,
          school_code: school.school_code,
          city: school.city,
          teams_count: school.teams?.length || 0,
          players_count: school.players?.length || 0
        })),
        total: schools.length
  }, message: 'Schools retrieved successfully' });

    } catch (error) {
      console.error('Error fetching schools:', error);
  return sendResponse(res, { success: false, status: 500, message: 'Failed to fetch schools' });
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
  return sendResponse(res, { success: false, status: 404, message: 'School not found' });
      }

  return sendResponse(res, { data: {
        school: {
          school_id: school.school_id,
          school_name: school.school_name,
          school_code: school.school_code
        },
        teams: school.teams || [],
        players: school.players || []
  }, message: 'School teams retrieved successfully' });

    } catch (error) {
      console.error('Error fetching school teams:', error);
  return sendResponse(res, { success: false, status: 500, message: 'Failed to fetch school teams' });
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
  return sendResponse(res, { success: false, status: 400, message: 'Both home and away team IDs are required' });
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

  return sendResponse(res, { data: {
        html: htmlContent,
        match_info: matchInfo,
        format,
        generated_at: new Date().toISOString()
  }, message: 'Team match scoresheet generated successfully' });

    } catch (error) {
      console.error('Error generating team match scoresheet:', error);
  return sendResponse(res, { success: false, status: 500, message: 'Failed to generate team match scoresheet' });
    }
  }

  /**
   * Get template information
   * @route GET /api/scoresheets/football/template-info
   */
  static async getTemplateInfo(req, res) {
    try {
      const templateService = new FootballTemplateService();

  return sendResponse(res, { data: {
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
  }, message: 'Template information retrieved successfully' });

    } catch (error) {
      console.error('Error fetching template info:', error);
  return sendResponse(res, { success: false, status: 500, message: 'Failed to fetch template information' });
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

  return sendResponse(res, { data: {
        html: htmlContent,
        format,
        data_source: 'sample',
        generated_at: new Date().toISOString()
  }, message: 'Preview scoresheet generated successfully' });

    } catch (error) {
      console.error('Error generating preview:', error);
  return sendResponse(res, { success: false, status: 500, message: 'Failed to generate preview' });
    }
  }
}

module.exports = ScoresheetController;
