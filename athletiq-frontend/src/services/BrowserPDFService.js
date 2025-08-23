/**
 * BrowserPDFService - Frontend PDF service that communicates with backend
 * Replaces the problematic Puppeteer-based services in the browser
 */
class BrowserPDFService {
  constructor() {
    // Handle base URL that may or may not include /api
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    const cleanBaseURL = baseURL.replace(/\/api$/, ''); // Remove trailing /api if present
    this.apiEndpoint = `${cleanBaseURL}/api/pdf`;
  }

  /**
   * Get list of supported sports
   * @returns {Promise<Array>} Array of supported sports
   */
  async getSupportedSports() {
    try {
      const response = await fetch(`${this.apiEndpoint}/sports`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get sports list');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error getting supported sports:', error);
      throw error;
    }
  }

  /**
   * Generate HTML preview for a scoresheet
   * @param {string} sport - Sport name
   * @param {Object} data - Match/tournament data
   * @param {Object} options - Generation options
   * @returns {Promise<string>} HTML content
   */
  async generatePreview(sport, data, options = {}) {
    try {
      const response = await fetch(`${this.apiEndpoint}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sport, data, options })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate preview');
      }
      
      return result.data.html;
    } catch (error) {
      console.error('Error generating preview:', error);
      throw error;
    }
  }

  /**
   * Generate and download a single scoresheet PDF
   * @param {string} sport - Sport name
   * @param {Object} data - Match/tournament data
   * @param {Object} options - Generation options
   * @returns {Promise<void>} Triggers browser download
   */
  async downloadSingleScoresheet(sport, data, options = {}) {
    try {
      const response = await fetch(`${this.apiEndpoint}/single`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sport, data, options })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate PDF');
      }

      // Get the PDF blob and trigger download
      const blob = await response.blob();
      const filename = this.getFilenameFromResponse(response) || 
                     `${sport}_scoresheet_${Date.now()}.pdf`;
      
      this.triggerDownload(blob, filename);
    } catch (error) {
      console.error('Error downloading single scoresheet:', error);
      throw error;
    }
  }

  /**
   * Generate and download multiple scoresheets as ZIP
   * @param {Array} scoresheets - Array of scoresheet requests
   * @param {Object} options - Generation options
   * @returns {Promise<void>} Triggers browser download
   */
  async downloadBatchScoresheets(scoresheets, options = {}) {
    try {
      const response = await fetch(`${this.apiEndpoint}/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scoresheets, options })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate batch PDFs');
      }

      // Get the ZIP blob and trigger download
      const blob = await response.blob();
      const filename = this.getFilenameFromResponse(response) || 
                     `scoresheets_batch_${Date.now()}.zip`;
      
      this.triggerDownload(blob, filename);
    } catch (error) {
      console.error('Error downloading batch scoresheets:', error);
      throw error;
    }
  }

  /**
   * Generate and download scoresheets for an entire tournament round
   * @param {string} sport - Sport name
   * @param {Array} matches - Array of match data
   * @param {Object} tournament - Tournament information
   * @param {Object} options - Generation options
   * @returns {Promise<void>} Triggers browser download
   */
  async downloadRoundScoresheets(sport, matches, tournament, options = {}) {
    try {
      const response = await fetch(`${this.apiEndpoint}/round`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sport, matches, tournament, options })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate round PDFs');
      }

      // Get the ZIP blob and trigger download
      const blob = await response.blob();
      const filename = this.getFilenameFromResponse(response) || 
                     `${sport}_round_scoresheets_${Date.now()}.zip`;
      
      this.triggerDownload(blob, filename);
    } catch (error) {
      console.error('Error downloading round scoresheets:', error);
      throw error;
    }
  }

  /**
   * Generate and download a sample scoresheet
   * @param {string} sport - Sport name
   * @param {string} format - Format (blank, filled)
   * @param {Object} options - Generation options
   * @returns {Promise<void>} Triggers browser download
   */
  async downloadSampleScoresheet(sport, format = 'blank', options = {}) {
    try {
      const response = await fetch(`${this.apiEndpoint}/sample`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sport, format, options })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate sample PDF');
      }

      // Get the PDF blob and trigger download
      const blob = await response.blob();
      const filename = this.getFilenameFromResponse(response) || 
                     `${sport}_sample_scoresheet_${Date.now()}.pdf`;
      
      this.triggerDownload(blob, filename);
    } catch (error) {
      console.error('Error downloading sample scoresheet:', error);
      throw error;
    }
  }

  /**
   * Get service status
   * @returns {Promise<Object>} Service status
   */
  async getServiceStatus() {
    try {
      const response = await fetch(`${this.apiEndpoint}/status`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get service status');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error getting service status:', error);
      throw error;
    }
  }

  /**
   * Extract filename from response headers
   * @param {Response} response - Fetch response
   * @returns {string|null} Filename or null
   */
  getFilenameFromResponse(response) {
    const disposition = response.headers.get('Content-Disposition');
    if (disposition) {
      const matches = disposition.match(/filename="([^"]+)"/);
      if (matches && matches[1]) {
        return matches[1];
      }
    }
    return null;
  }

  /**
   * Trigger browser download of a blob
   * @param {Blob} blob - File blob
   * @param {string} filename - Download filename
   */
  triggerDownload(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Generate a single scoresheet PDF (method alias for compatibility)
   * @param {Object} data - Match/tournament data
   * @returns {Promise<Object>} Result with success, data, error
   */
  async generateSingle(data) {
    try {
      const response = await fetch(`${this.apiEndpoint}/single`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          sport: data.tournament?.sport || 'football', 
          data, 
          options: { format: data.format } 
        })
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || 'Failed to generate PDF' };
      }

      const blob = await response.blob();
      return { success: true, data: blob };
    } catch (error) {
      console.error('Error generating single PDF:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate preview for scoresheet (method alias for compatibility)
   * @param {Object} data - Match/tournament data
   * @returns {Promise<Object>} Result with success, previewUrl, error
   */
  async preview(data) {
    try {
      const html = await this.generatePreview(
        data.tournament?.sport || 'football', 
        data, 
        { format: data.format }
      );
      
      // Create a blob URL for preview
      const blob = new Blob([html], { type: 'text/html' });
      const previewUrl = URL.createObjectURL(blob);
      
      return { success: true, previewUrl };
    } catch (error) {
      console.error('Error generating preview:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate batch scoresheets (method alias for compatibility)
   * @param {Object} data - Batch data with matches, tournament, options
   * @returns {Promise<Object>} Result with success, data, filename, error
   */
  async generateBatch(data) {
    try {
      const scoresheets = data.matches.map((match, index) => ({
        sport: data.tournament?.sport || 'football',
        data: {
          match,
          tournament: data.tournament,
          teams: match.teams || [
            { name: `Team A${index + 1}`, code: `TA${index + 1}` },
            { name: `Team B${index + 1}`, code: `TB${index + 1}` }
          ]
        },
        name: `Match_${match.id || index + 1}`
      }));

      const response = await fetch(`${this.apiEndpoint}/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scoresheets, options: data.options })
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || 'Failed to generate batch PDFs' };
      }

      const blob = await response.blob();
      const filename = this.getFilenameFromResponse(response) || 
                     `batch_scoresheets_${Date.now()}.zip`;
      
      return { success: true, data: blob, filename };
    } catch (error) {
      console.error('Error generating batch PDFs:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate round scoresheets (method alias for compatibility)
   * @param {Object} data - Round data with matches, tournament, options
   * @returns {Promise<Object>} Result with success, data, filename, error
   */
  async generateRound(data) {
    try {
      const response = await fetch(`${this.apiEndpoint}/round`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sport: data.tournament?.sport || 'football',
          matches: data.matches,
          tournament: data.tournament,
          options: data.options
        })
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || 'Failed to generate round PDFs' };
      }

      const blob = await response.blob();
      const filename = this.getFilenameFromResponse(response) || 
                     `round_scoresheets_${Date.now()}.zip`;
      
      return { success: true, data: blob, filename };
    } catch (error) {
      console.error('Error generating round PDFs:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate sample scoresheet (method alias for compatibility)
   * @param {Object} data - Sample data with sport, options
   * @returns {Promise<Object>} Result with success, data, error
   */
  async generateSample(data) {
    try {
      const response = await fetch(`${this.apiEndpoint}/sample`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sport: data.sport || 'football',
          format: data.format || 'blank',
          options: data.options
        })
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || 'Failed to generate sample PDF' };
      }

      const blob = await response.blob();
      return { success: true, data: blob };
    } catch (error) {
      console.error('Error generating sample PDF:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get sports list (method alias for compatibility)
   * @returns {Promise<Object>} Result with success, sports, error
   */
  async getSports() {
    try {
      const sports = await this.getSupportedSports();
      return { success: true, sports };
    } catch (error) {
      return { success: false, error: error.message, sports: [] };
    }
  }

  /**
   * Check if the PDF service is available
   * @returns {Promise<boolean>} True if available
   */
  async isServiceAvailable() {
    try {
      await this.getServiceStatus();
      return true;
    } catch (error) {
      console.warn('PDF service is not available:', error.message);
      return false;
    }
  }

  /**
   * Get a fallback error message when service is unavailable
   * @returns {string} Error message
   */
  getUnavailableMessage() {
    return 'PDF generation service is currently unavailable. Please check your connection and try again later.';
  }
}

export default BrowserPDFService;
