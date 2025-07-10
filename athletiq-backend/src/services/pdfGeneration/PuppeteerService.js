const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

/**
 * PuppeteerService - Server-side PDF generation using Puppeteer
 * Handles browser automation for converting HTML templates to PDF
 */
class PuppeteerService {
  constructor() {
    this.browser = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the browser instance
   */
  async initialize() {
    if (this.isInitialized && this.browser) {
      return;
    }

    try {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      this.isInitialized = true;
      console.log('PuppeteerService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PuppeteerService:', error);
      throw error;
    }
  }

  /**
   * Generate PDF from HTML content
   * @param {string} htmlContent - The HTML content to convert
   * @param {Object} options - PDF generation options
   * @returns {Buffer} PDF buffer
   */
  async generatePDF(htmlContent, options = {}) {
    await this.initialize();

    const page = await this.browser.newPage();
    
    try {
      // Set viewport for consistent rendering
      await page.setViewport({ width: 1200, height: 800 });

      // Set content with proper encoding
      await page.setContent(htmlContent, {
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 30000
      });

      // Default PDF options
      const pdfOptions = {
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        printBackground: true,
        preferCSSPageSize: true,
        ...options
      };

      // Generate PDF
      const pdfBuffer = await page.pdf(pdfOptions);
      
      return pdfBuffer;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * Generate multiple PDFs concurrently
   * @param {Array} htmlContents - Array of HTML content strings
   * @param {Object} options - PDF generation options
   * @returns {Array} Array of PDF buffers
   */
  async generateMultiplePDFs(htmlContents, options = {}) {
    await this.initialize();

    const pdfPromises = htmlContents.map(async (htmlContent, index) => {
      try {
        const pdfBuffer = await this.generatePDF(htmlContent, options);
        return {
          index,
          success: true,
          buffer: pdfBuffer,
          error: null
        };
      } catch (error) {
        console.error(`Error generating PDF ${index}:`, error);
        return {
          index,
          success: false,
          buffer: null,
          error: error.message
        };
      }
    });

    return await Promise.all(pdfPromises);
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.isInitialized = false;
      console.log('PuppeteerService cleaned up');
    }
  }

  /**
   * Get browser status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasBrowser: !!this.browser,
      isConnected: this.browser ? this.browser.isConnected() : false
    };
  }
}

// Export singleton instance
module.exports = new PuppeteerService();
