/**
 * SportsTemplateFactory - Server-side template factory
 * Manages sport-specific template services on the backend
 */
class SportsTemplateFactory {
  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }

  /**
   * Initialize all sport template services
   */
  initializeTemplates() {
    // We'll lazy-load templates to avoid circular dependencies
    this.supportedSports = [
      'football',
      'basketball', 
      'volleyball',
      'tennis',
      'badminton'
    ];
  }

  /**
   * Get template service for a specific sport
   * @param {string} sport - Sport name
   * @returns {Object} Template service instance
   */
  getTemplate(sport) {
    const normalizedSport = sport.toLowerCase();
    
    if (!this.templates.has(normalizedSport)) {
      this.loadTemplate(normalizedSport);
    }
    
    return this.templates.get(normalizedSport);
  }

  /**
   * Lazy load a template service
   * @param {string} sport - Sport name
   */
  loadTemplate(sport) {
    try {
      let TemplateClass;
      
      switch (sport) {
        case 'football':
          TemplateClass = require('./FootballTemplateService');
          break;
        case 'basketball':
          TemplateClass = require('./BasketballTemplateService');
          break;
        case 'volleyball':
          TemplateClass = require('./VolleyballTemplateService');
          break;
        case 'tennis':
          TemplateClass = require('./TennisTemplateService');
          break;
        case 'badminton':
          TemplateClass = require('./BadmintonTemplateService');
          break;
        default:
          // Fallback to football template for unknown sports
          TemplateClass = require('./FootballTemplateService');
          console.warn(`Unknown sport: ${sport}, using football template as fallback`);
      }
      
      this.templates.set(sport, new TemplateClass());
    } catch (error) {
      console.error(`Failed to load template for sport: ${sport}`, error);
      // Load football as fallback
      const FootballTemplate = require('./FootballTemplateService');
      this.templates.set(sport, new FootballTemplate());
    }
  }

  /**
   * Get list of supported sports
   * @returns {Array} Array of supported sport names
   */
  getSupportedSports() {
    return [...this.supportedSports];
  }

  /**
   * Check if a sport is supported
   * @param {string} sport - Sport name
   * @returns {boolean} True if supported
   */
  isSupported(sport) {
    return this.supportedSports.includes(sport.toLowerCase());
  }

  /**
   * Generate HTML template for a specific sport
   * @param {string} sport - Sport name
   * @param {Object} data - Template data
   * @returns {string} Generated HTML
   */
  generateHTML(sport, data) {
    const template = this.getTemplate(sport);
    if (template && typeof template.getHTML === 'function') {
      return template.getHTML(data);
    }
    
    throw new Error(`Template for sport '${sport}' does not have getHTML method`);
  }

  /**
   * Get all available templates info
   * @returns {Object} Templates information
   */
  getAllTemplatesInfo() {
    return this.supportedSports.map(sport => {
      try {
        const template = this.getTemplate(sport);
        return {
          sport,
          name: template.name || `${sport} Template`,
          description: template.description || `Professional ${sport} scoresheet template`,
          supported: true
        };
      } catch (error) {
        return {
          sport,
          name: `${sport} Template`,
          description: `Template for ${sport} (error loading)`,
          supported: false,
          error: error.message
        };
      }
    });
  }
}

// Export singleton instance
module.exports = new SportsTemplateFactory();
