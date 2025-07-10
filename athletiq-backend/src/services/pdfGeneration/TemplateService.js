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
   * Get sample data for testing templates
   * @param {string} sport - Sport name
   * @returns {Object} Sample data for the sport
   */
  getSampleData(sport) {
    const baseData = {
      match: {
        id: 'MATCH_001',
        date: '2024-12-20',
        time: '15:00',
        venue: 'Athletiq Sports Complex',
        court: 'Court 1',
        weather: 'Clear',
        temperature: '22°C'
      },
      tournament: {
        name: 'Athletiq Championship 2024',
        stage: 'Final',
        season: '2024'
      },
      teams: [
        {
          name: 'Team Alpha',
          code: 'ALP',
          score: 0
        },
        {
          name: 'Team Beta', 
          code: 'BET',
          score: 0
        }
      ],
      branding: this.defaultBranding
    };

    // Sport-specific additions
    switch (sport.toLowerCase()) {
      case 'football':
        baseData.teams = baseData.teams.map(team => ({
          ...team,
          formation: '4-4-2',
          coach: 'John Smith',
          assistantCoach: 'Mike Johnson'
        }));
        break;
      
      case 'basketball':
        baseData.teams = baseData.teams.map(team => ({
          ...team,
          coach: 'Coach Johnson'
        }));
        break;
      
      case 'tennis':
      case 'badminton':
        baseData.teams = baseData.teams.map((team, index) => ({
          ...team,
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
