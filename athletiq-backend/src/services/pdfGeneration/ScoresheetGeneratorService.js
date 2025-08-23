const TemplateService = require('./TemplateService');
const BatchService = require('./BatchService');
const PuppeteerService = require('./PuppeteerService');

/**
 * ScoresheetGeneratorService - Main PDF generation service
 * Handles single and batch PDF generation for tournament scoresheets
 */
class ScoresheetGeneratorService {
  constructor() {
    this.templateService = TemplateService;
    this.batchService = BatchService;
    this.puppeteerService = PuppeteerService;
  }

  /**
   * Generate a single scoresheet PDF
   * @param {string} sport - Sport name
   * @param {Object} data - Match/tournament data
   * @param {Object} options - Generation options
   * @returns {Buffer} PDF buffer
   */
  async generateSingleScoresheet(sport, data, options = {}) {
    try {
      console.log(`Generating single scoresheet for ${sport}`);
      
      // Validate input data
      const validation = this.templateService.validateTemplateData(data);
      if (!validation.isValid) {
        throw new Error(`Invalid template data: ${validation.errors.join(', ')}`);
      }

      // Generate HTML template
      const html = this.templateService.generateTemplate(sport, data, options);
      
      // Generate PDF
      const templateName = `${sport}_scoresheet_${data.match?.id || 'single'}`;
      const pdfBuffer = await this.batchService.generateSinglePDF(templateName, html, options.pdf);
      
      console.log(`Single scoresheet generated successfully: ${templateName}`);
      return pdfBuffer;
    } catch (error) {
      console.error('Error generating single scoresheet:', error);
      throw error;
    }
  }

  /**
   * Generate multiple scoresheets and return as ZIP
   * @param {Array} scoresheetRequests - Array of scoresheet requests
   * @param {Object} options - Generation options
   * @returns {Buffer} ZIP buffer containing all PDFs
   */
  async generateBatchScoresheets(scoresheetRequests, options = {}) {
    try {
      console.log(`Generating batch scoresheets: ${scoresheetRequests.length} requests`);
      
      // Generate HTML templates
      const templates = scoresheetRequests.map((request, index) => {
        try {
          const { sport, data, name } = request;
          
          // Validate data
          const validation = this.templateService.validateTemplateData(data);
          if (!validation.isValid) {
            console.warn(`Validation warnings for request ${index + 1}:`, validation.warnings);
          }

          // Generate HTML
          const html = this.templateService.generateTemplate(sport, data, request.options);
          
          return {
            name: name || `${sport}_scoresheet_${index + 1}`,
            html,
            sport,
            matchId: data.match?.id
          };
        } catch (error) {
          console.error(`Error processing request ${index + 1}:`, error);
          return {
            name: `error_${index + 1}`,
            html: this.getErrorHTML(error.message),
            sport: request.sport || 'unknown',
            matchId: 'error'
          };
        }
      });

      // Generate batch PDFs
      const zipBuffer = await this.batchService.generateBatchPDFs(templates, options.pdf);
      
      console.log(`Batch scoresheets generated successfully`);
      return zipBuffer;
    } catch (error) {
      console.error('Error generating batch scoresheets:', error);
      throw error;
    }
  }

  /**
   * Generate scoresheets for an entire tournament round
   * @param {string} sport - Sport name
   * @param {Array} matches - Array of match data
   * @param {Object} tournamentInfo - Tournament information
   * @param {Object} options - Generation options
   * @returns {Buffer} ZIP buffer containing round scoresheets
   */
  async generateRoundScoresheets(sport, matches, tournamentInfo, options = {}) {
    try {
      console.log(`Generating round scoresheets for ${sport}: ${matches.length} matches`);
      
      const scoresheetRequests = matches.map((match, index) => ({
        sport,
        data: {
          match,
          tournament: tournamentInfo,
          teams: match.teams || [
            { name: match.teamA || 'TBD', code: match.teamA_code || 'TBD' },
            { name: match.teamB || 'TBD', code: match.teamB_code || 'TBD' }
          ],
          branding: options.branding
        },
        name: `${tournamentInfo.round || 'Round'}_Match_${match.id || index + 1}`,
        options: options.template
      }));

      return await this.generateBatchScoresheets(scoresheetRequests, options);
    } catch (error) {
      console.error('Error generating round scoresheets:', error);
      throw error;
    }
  }

  /**
   * Generate preview HTML (for browser preview without PDF generation)
   * @param {string} sport - Sport name
   * @param {Object} data - Match/tournament data
   * @param {Object} options - Generation options
   * @returns {string} HTML content
   */
  generatePreview(sport, data, options = {}) {
    try {
      console.log(`Generating preview for ${sport}`);
      
      // Use provided data or get from database
      const templateData = data || await this.templateService.getTemplateData(sport);
      
      // Generate HTML template
      const html = this.templateService.generateTemplate(sport, templateData, options);
      
      console.log(`Preview generated successfully for ${sport}`);
      return html;
    } catch (error) {
      console.error('Error generating preview:', error);
      throw error;
    }
  }

  /**
   * Get error HTML template
   * @param {string} errorMessage - Error message
   * @returns {string} Error HTML
   */
  getErrorHTML(errorMessage) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
          .error { color: red; border: 2px solid red; padding: 20px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="error">
          <h2>Template Generation Error</h2>
          <p>${errorMessage}</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get supported sports
   * @returns {Array} Array of supported sports
   */
  getSupportedSports() {
    return this.templateService.getSupportedSports();
  }

  /**
   * Get service status
   * @returns {Object} Service status
   */
  async getStatus() {
    const puppeteerStatus = this.puppeteerService.getStatus();
    const batchStatus = this.batchService.getStatus();
    const templateStatus = this.templateService.getStatus();

    return {
      service: 'ScoresheetGeneratorService',
      status: 'active',
      components: {
        puppeteer: puppeteerStatus,
        batch: batchStatus,
        template: templateStatus
      },
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Initialize all services
   */
  async initialize() {
    try {
      console.log('Initializing ScoresheetGeneratorService...');
      await this.puppeteerService.initialize();
      console.log('ScoresheetGeneratorService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ScoresheetGeneratorService:', error);
      throw error;
    }
  }

  /**
   * Cleanup all services
   */
  async cleanup() {
    try {
      console.log('Cleaning up ScoresheetGeneratorService...');
      await this.puppeteerService.cleanup();
      console.log('ScoresheetGeneratorService cleaned up successfully');
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new ScoresheetGeneratorService();
