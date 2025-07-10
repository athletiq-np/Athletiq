// src/services/PuppeteerService.js
import puppeteer from 'puppeteer';

class PuppeteerService {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  async createPage() {
    if (!this.browser) {
      await this.initialize();
    }
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1200, height: 800 });
    return this.page;
  }

  async generatePDF(html, options = {}) {
    const page = await this.createPage();
    
    try {
      await page.setContent(html, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      const pdfOptions = {
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        ...options
      };

      const pdf = await page.pdf(pdfOptions);
      await page.close();
      
      return pdf;
    } catch (error) {
      await page.close();
      throw error;
    }
  }

  async generateBulkPDFs(htmlArray, options = {}) {
    const pdfs = [];
    
    for (const html of htmlArray) {
      try {
        const pdf = await this.generatePDF(html, options);
        pdfs.push(pdf);
      } catch (error) {
        console.error('Failed to generate PDF:', error);
        pdfs.push(null);
      }
    }
    
    return pdfs;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

export default new PuppeteerService();
