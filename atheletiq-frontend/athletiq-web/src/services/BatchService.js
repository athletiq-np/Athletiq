// src/services/BatchService.js
import PuppeteerService from './PuppeteerService';
import TemplateService from './TemplateService';
import JSZip from 'jszip';

class BatchService {
  constructor() {
    this.puppeteerService = PuppeteerService;
    this.templateService = TemplateService;
  }

  // Generate bulk scoresheets for a tournament round
  async generateRoundScoresheets(roundMatches, tournament, options = {}) {
    const { format = 'blank', schoolBranding = null } = options;
    
    try {
      const htmlTemplates = roundMatches.map(match => {
        const branding = schoolBranding || this.templateService.getDefaultBranding();
        
        const data = {
          match,
          tournament,
          teams: match.teams || [
            { name: `Team ${match.id}A`, school: `School A` },
            { name: `Team ${match.id}B`, school: `School B` }
          ],
          branding
        };
        
        return this.templateService.renderScoresheetTemplate(data, { format });
      });

      const pdfs = await this.puppeteerService.generateBulkPDFs(htmlTemplates);
      
      return this.createBatchDownload(pdfs, roundMatches, `Round-${roundMatches[0]?.round || 1}-Scoresheets`);
    } catch (error) {
      console.error('Failed to generate round scoresheets:', error);
      throw error;
    }
  }

  // Generate all tournament scoresheets
  async generateTournamentScoresheets(matches, tournament, options = {}) {
    const { format = 'blank', schoolBranding = null } = options;
    
    try {
      // Group matches by round
      const matchesByRound = matches.reduce((acc, match) => {
        const round = match.round || 1;
        if (!acc[round]) acc[round] = [];
        acc[round].push(match);
        return acc;
      }, {});

      const allPdfs = [];
      const fileNames = [];

      for (const [round, roundMatches] of Object.entries(matchesByRound)) {
        const roundPdfs = await this.generateRoundScoresheets(roundMatches, tournament, options);
        
        roundMatches.forEach((match, index) => {
          if (roundPdfs.pdfs[index]) {
            allPdfs.push(roundPdfs.pdfs[index]);
            fileNames.push(`Round-${round}-Match-${match.id}.pdf`);
          }
        });
      }

      return this.createZipDownload(allPdfs, fileNames, `${tournament.name || 'Tournament'}-All-Scoresheets`);
    } catch (error) {
      console.error('Failed to generate tournament scoresheets:', error);
      throw error;
    }
  }

  // Generate team rosters (Phase 1 bonus)
  async generateTeamRosters(teams, tournament, options = {}) {
    try {
      const htmlTemplates = teams.map(team => {
        const branding = options.schoolBranding || this.templateService.getDefaultBranding();
        
        return this.templateService.renderTeamRosterTemplate({
          team,
          tournament,
          branding
        });
      });

      const pdfs = await this.puppeteerService.generateBulkPDFs(htmlTemplates);
      
      return this.createBatchDownload(pdfs, teams, `${tournament.name || 'Tournament'}-Team-Rosters`);
    } catch (error) {
      console.error('Failed to generate team rosters:', error);
      throw error;
    }
  }

  // Create batch download with zip
  async createBatchDownload(pdfs, sourceData, baseName) {
    const validPdfs = pdfs.filter(pdf => pdf !== null);
    
    if (validPdfs.length === 0) {
      throw new Error('No valid PDFs generated');
    }

    if (validPdfs.length === 1) {
      // Single PDF download
      return {
        type: 'single',
        pdf: validPdfs[0],
        filename: `${baseName}.pdf`
      };
    }

    // Multiple PDFs - create zip
    const fileNames = sourceData.map((item, index) => {
      if (item.id) {
        return `${baseName}-${item.id}.pdf`;
      }
      return `${baseName}-${index + 1}.pdf`;
    });

    const zip = await this.createZipDownload(validPdfs, fileNames, baseName);
    
    return {
      type: 'zip',
      zip: zip.blob,
      filename: `${baseName}.zip`
    };
  }

  // Create ZIP file from PDFs
  async createZipDownload(pdfs, fileNames, zipName) {
    const zip = new JSZip();
    
    pdfs.forEach((pdf, index) => {
      if (pdf) {
        const fileName = fileNames[index] || `document-${index + 1}.pdf`;
        zip.file(fileName, pdf);
      }
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    
    return {
      blob,
      filename: `${zipName}.zip`
    };
  }

  // Email functionality (for future implementation)
  async emailScoresheets(pdfs, recipients, subject, options = {}) {
    // TODO: Implement email service integration
    console.log('Email functionality - to be implemented');
    return { success: false, message: 'Email service not implemented yet' };
  }

  // Cloud storage upload (for future implementation)
  async uploadToCloud(files, cloudProvider, options = {}) {
    // TODO: Implement cloud storage integration
    console.log('Cloud storage functionality - to be implemented');
    return { success: false, message: 'Cloud storage not implemented yet' };
  }
}

export default new BatchService();
