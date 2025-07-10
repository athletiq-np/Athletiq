const JSZip = require('jszip');
const PuppeteerService = require('./PuppeteerService');

/**
 * BatchService - Handles batch PDF generation and ZIP creation
 * Server-side service for processing multiple documents
 */
class BatchService {
  constructor() {
    this.maxConcurrentJobs = 5;
    this.processingQueue = [];
    this.isProcessing = false;
  }

  /**
   * Generate multiple PDFs and package them into a ZIP file
   * @param {Array} templates - Array of template objects with {name, html}
   * @param {Object} options - Generation options
   * @returns {Buffer} ZIP file buffer
   */
  async generateBatchPDFs(templates, options = {}) {
    try {
      console.log(`Starting batch PDF generation for ${templates.length} templates`);
      
      // Generate all PDFs concurrently (with limit)
      const pdfResults = await this.generatePDFsInBatches(templates, options);
      
      // Create ZIP file
      const zipBuffer = await this.createZipFromPDFs(pdfResults);
      
      console.log('Batch PDF generation completed successfully');
      return zipBuffer;
    } catch (error) {
      console.error('Error in batch PDF generation:', error);
      throw error;
    }
  }

  /**
   * Generate PDFs in controlled batches to avoid overwhelming the system
   * @param {Array} templates - Template objects
   * @param {Object} options - PDF options
   * @returns {Array} PDF results
   */
  async generatePDFsInBatches(templates, options = {}) {
    const results = [];
    const batchSize = this.maxConcurrentJobs;
    
    for (let i = 0; i < templates.length; i += batchSize) {
      const batch = templates.slice(i, i + batchSize);
      const htmlContents = batch.map(template => template.html);
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(templates.length / batchSize)}`);
      
      const batchResults = await PuppeteerService.generateMultiplePDFs(htmlContents, options);
      
      // Map results back to original template names
      batchResults.forEach((result, batchIndex) => {
        const originalIndex = i + batchIndex;
        results.push({
          name: templates[originalIndex].name,
          originalIndex,
          success: result.success,
          buffer: result.buffer,
          error: result.error
        });
      });
    }
    
    return results;
  }

  /**
   * Create ZIP file from PDF results
   * @param {Array} pdfResults - Results from PDF generation
   * @returns {Buffer} ZIP buffer
   */
  async createZipFromPDFs(pdfResults) {
    const zip = new JSZip();
    let successCount = 0;
    let errorCount = 0;

    // Add successful PDFs to ZIP
    pdfResults.forEach((result) => {
      if (result.success && result.buffer) {
        zip.file(`${result.name}.pdf`, result.buffer);
        successCount++;
      } else {
        errorCount++;
        console.warn(`Failed to generate PDF for ${result.name}:`, result.error);
      }
    });

    // Add summary file
    const summary = this.createBatchSummary(pdfResults, successCount, errorCount);
    zip.file('generation_summary.txt', summary);

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    console.log(`ZIP created: ${successCount} successful, ${errorCount} failed PDFs`);
    return zipBuffer;
  }

  /**
   * Create a summary text file for the batch operation
   * @param {Array} results - PDF generation results
   * @param {number} successCount - Number of successful generations
   * @param {number} errorCount - Number of failed generations
   * @returns {string} Summary text
   */
  createBatchSummary(results, successCount, errorCount) {
    const timestamp = new Date().toISOString();
    let summary = `Athletiq PDF Generation Summary\n`;
    summary += `Generated: ${timestamp}\n`;
    summary += `Total Templates: ${results.length}\n`;
    summary += `Successful: ${successCount}\n`;
    summary += `Failed: ${errorCount}\n\n`;

    if (errorCount > 0) {
      summary += `Failed Documents:\n`;
      results.forEach((result) => {
        if (!result.success) {
          summary += `- ${result.name}: ${result.error}\n`;
        }
      });
      summary += `\n`;
    }

    summary += `Successful Documents:\n`;
    results.forEach((result) => {
      if (result.success) {
        summary += `- ${result.name}.pdf\n`;
      }
    });

    return summary;
  }

  /**
   * Generate a single scoresheet PDF
   * @param {string} templateName - Name of the template
   * @param {string} htmlContent - HTML content
   * @param {Object} options - PDF options
   * @returns {Buffer} PDF buffer
   */
  async generateSinglePDF(templateName, htmlContent, options = {}) {
    try {
      console.log(`Generating single PDF: ${templateName}`);
      const pdfBuffer = await PuppeteerService.generatePDF(htmlContent, options);
      console.log(`Single PDF generated successfully: ${templateName}`);
      return pdfBuffer;
    } catch (error) {
      console.error(`Error generating single PDF ${templateName}:`, error);
      throw error;
    }
  }

  /**
   * Set maximum concurrent jobs
   * @param {number} max - Maximum concurrent jobs
   */
  setMaxConcurrentJobs(max) {
    this.maxConcurrentJobs = Math.max(1, Math.min(max, 10)); // Between 1 and 10
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      maxConcurrentJobs: this.maxConcurrentJobs,
      queueLength: this.processingQueue.length,
      isProcessing: this.isProcessing,
      puppeteerStatus: PuppeteerService.getStatus()
    };
  }
}

// Export singleton instance
module.exports = new BatchService();
