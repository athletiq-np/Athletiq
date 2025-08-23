const SportsTemplateFactory = require('./templates/SportsTemplateFactory');

/**
 * TemplateService - Server-side template management
 * Handles HTML template generation for all sports using the factory pattern
 */
class TemplateService {
  constructor() {
    this.factory = SportsTemplateFactory;
    this.defaultBranding = {
      logo: null,
      schoolName: 'Athletiq School',
      colors: {
        primary: '#1e3a8a',
        secondary: '#3b82f6',
        accent: '#10b981'
      },
      watermark: {
        enabled: true,
        text: 'ATHLETIQ'
      }
    };
  }

  /**
   * Generate HTML template for a specific sport
   * @param {string} sport - Sport name (football, basketball, etc.)
   * @param {Object} data - Template data
   * @param {Object} options - Generation options
   * @returns {string} Generated HTML template
   */
  generateTemplate(sport, data, options = {}) {
    try {
      // Merge default branding with provided data
      const templateData = {
        ...data,
        branding: {
          ...this.defaultBranding,
          ...data.branding
        }
      };

      // Generate HTML using the factory
      const html = this.factory.generateHTML(sport, templateData);
      
      console.log(`Template generated successfully for sport: ${sport}`);
      return html;
    } catch (error) {
      console.error(`Error generating template for sport ${sport}:`, error);
      throw error;
    }
  }

  /**
   * Generate multiple templates for batch processing
   * @param {Array} templateRequests - Array of {sport, data, options} objects
   * @returns {Array} Array of {name, html} objects
   */
  generateMultipleTemplates(templateRequests) {
    try {
      const results = templateRequests.map((request, index) => {
        const { sport, data, options, name } = request;
        
        try {
          const html = this.generateTemplate(sport, data, options);
          return {
            name: name || `${sport}_scoresheet_${index + 1}`,
            html,
            success: true,
            error: null
          };
        } catch (error) {
          console.error(`Error generating template ${index + 1} for sport ${sport}:`, error);
          return {
            name: name || `${sport}_scoresheet_${index + 1}`,
            html: null,
            success: false,
            error: error.message
          };
        }
      });

      const successCount = results.filter(r => r.success).length;
      console.log(`Batch template generation: ${successCount}/${templateRequests.length} successful`);
      
      return results;
    } catch (error) {
      console.error('Error in batch template generation:', error);
      throw error;
    }
  }

  /**
   * Get template data from database for preview generation
   * @param {string} sport - Sport name
   * @param {number} matchId - Optional match ID for real data
   * @returns {Promise<Object>} Template data from database
   */
  async getTemplateData(sport, matchId = null) {
    try {
      if (matchId) {
        // Use real match data if match ID provided
        const ScoreSheetDataService = require('./ScoreSheetDataService');
        return await ScoreSheetDataService.getRealMatchData(matchId);
      }
      
      // Get the most recent match for the sport for preview
      const pool = require('../../config/db');
      const recentMatchQuery = `
        SELECT 
          m.id,
          m.scheduled_at,
          m.venue,
          s.name as sport_name,
          t.name as tournament_name
        FROM matches m
        JOIN sports s ON m.sport_id = s.id
        JOIN tournaments t ON m.tournament_id = t.id
        WHERE LOWER(s.name) = LOWER($1)
        ORDER BY m.created_at DESC
        LIMIT 1
      `;
      
      const result = await pool.query(recentMatchQuery, [sport]);
      
      if (result.rows.length > 0) {
        const ScoreSheetDataService = require('./ScoreSheetDataService');
        return await ScoreSheetDataService.getRealMatchData(result.rows[0].id);
      }
      
      // If no matches found, return minimal structure for template preview
      return {
        match: {
          id: 'PREVIEW',
          date: new Date().toISOString().split('T')[0],
          venue: 'Preview Mode - No Data Available',
          sport: sport,
          tournament: 'No Tournament Data',
          homeTeam: {
            team_name: 'Team A',
            school_name: 'School A',
            school_code: 'SCH001',
            players: []
          },
          awayTeam: {
            team_name: 'Team B', 
            school_name: 'School B',
            school_code: 'SCH002',
            players: []
          }
        },
        branding: this.defaultBranding
      };
    } catch (error) {
      console.error('Error getting template data:', error);
      throw error;
    }
          name: `Player ${index === 0 ? 'A' : 'B'}`,
          ranking: index === 0 ? '15' : '22',
          country: index === 0 ? 'USA' : 'CAN'
        }));
        break;
    }

    return baseData;
  }

  /**
   * Get list of supported sports
   * @returns {Array} Array of supported sport names
   */
  getSupportedSports() {
    return this.factory.getSupportedSports();
  }

  /**
   * Check if a sport is supported
   * @param {string} sport - Sport name
   * @returns {boolean} True if supported
   */
  isSupported(sport) {
    return this.factory.isSupported(sport);
  }

  /**
   * Get information about all available templates
   * @returns {Array} Array of template information
   */
  getTemplatesInfo() {
    return this.factory.getAllTemplatesInfo();
  }

  /**
   * Validate template data
   * @param {Object} data - Template data to validate
   * @returns {Object} Validation result
   */
  validateTemplateData(data) {
    const errors = [];
    const warnings = [];

    // Required fields validation
    if (!data.match) {
      errors.push('Match information is required');
    }
    if (!data.tournament) {
      errors.push('Tournament information is required');
    }
    if (!data.teams || !Array.isArray(data.teams) || data.teams.length < 2) {
      errors.push('At least 2 teams are required');
    }

    // Optional fields warnings
    if (!data.branding) {
      warnings.push('No branding information provided, using defaults');
    }
    if (data.match && !data.match.venue) {
      warnings.push('Match venue not specified');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Update default branding
   * @param {Object} branding - New branding configuration
   */
  updateDefaultBranding(branding) {
    this.defaultBranding = {
      ...this.defaultBranding,
      ...branding
    };
  }

  /**
   * Get service status
   * @returns {Object} Service status information
   */
  getStatus() {
    return {
      supportedSports: this.getSupportedSports(),
      templatesCount: this.getSupportedSports().length,
      defaultBranding: this.defaultBranding
    };
  }
}

// Export singleton instance
module.exports = new TemplateService();
