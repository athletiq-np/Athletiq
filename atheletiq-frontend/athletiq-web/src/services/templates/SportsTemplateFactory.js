// src/services/templates/SportsTemplateFactory.js
import FootballTemplateService from './FootballTemplateService.js';
import BasketballTemplateService from './BasketballTemplateService.js';
import VolleyballTemplateService from './VolleyballTemplateService.js';
import TennisTemplateService from './TennisTemplateService.js';
import BadmintonTemplateService from './BadmintonTemplateService.js';

class SportsTemplateFactory {
  constructor() {
    this.templates = new Map();
    this.schoolBranding = new Map();
    this.initializeTemplates();
  }

  initializeTemplates() {
    // Register all sport template services
    this.templates.set('football', new FootballTemplateService());
    this.templates.set('soccer', new FootballTemplateService()); // Alias for football
    this.templates.set('basketball', new BasketballTemplateService());
    this.templates.set('volleyball', new VolleyballTemplateService());
    this.templates.set('tennis', new TennisTemplateService());
    this.templates.set('badminton', new BadmintonTemplateService());
    
    // Add more sports as needed
    this.templates.set('cricket', this.createCricketTemplate());
  }

  // Get available sports
  getAvailableSports() {
    return [
      { 
        id: 'football', 
        name: 'Football/Soccer', 
        icon: '⚽', 
        teamSize: 11, 
        format: '90 minutes',
        description: 'Association football with 11 players per team'
      },
      { 
        id: 'basketball', 
        name: 'Basketball', 
        icon: '🏀', 
        teamSize: 5, 
        format: '4 × 12 minutes',
        description: 'Indoor basketball with 5 players per team'
      },
      { 
        id: 'volleyball', 
        name: 'Volleyball', 
        icon: '🏐', 
        teamSize: 6, 
        format: 'Best of 5 sets',
        description: 'Indoor volleyball with 6 players per team'
      },
      { 
        id: 'tennis', 
        name: 'Tennis', 
        icon: '🎾', 
        teamSize: 1, 
        format: 'Best of 3 sets',
        description: 'Singles or doubles tennis matches'
      },
      { 
        id: 'badminton', 
        name: 'Badminton', 
        icon: '🏸', 
        teamSize: 1, 
        format: 'Best of 3 games (21 points)',
        description: 'Singles or doubles badminton matches'
      },
      { 
        id: 'cricket', 
        name: 'Cricket', 
        icon: '🏏', 
        teamSize: 11, 
        format: 'T20/ODI/Test',
        description: 'Cricket matches with 11 players per team'
      }
    ];
  }

  // Generate scoresheet for specific sport
  generateSportScoresheet(sport, data, options = {}) {
    const templateService = this.templates.get(sport.toLowerCase());
    
    if (!templateService) {
      throw new Error(`Template service not found for sport: ${sport}`);
    }

    // Add sport-specific branding
    const sportBranding = this.getSportBranding(sport, data.branding);
    const enhancedData = {
      ...data,
      branding: sportBranding,
      sport: sport
    };

    // Use the template service's getHTML method
    return templateService.getHTML(enhancedData, options.format || 'blank');
  }

  // School branding management
  setSchoolBranding(schoolId, branding) {
    this.schoolBranding.set(schoolId, {
      logo: branding.logo || null,
      primaryColor: branding.primaryColor || '#1e40af',
      secondaryColor: branding.secondaryColor || '#f59e0b',
      schoolName: branding.schoolName || '',
      address: branding.address || '',
      principal: branding.principal || '',
      sportsCoordinator: branding.sportsCoordinator || '',
      watermark: branding.watermark || {
        enabled: true,
        text: 'Powered by Athletiq',
        opacity: 0.1
      },
      signatures: branding.signatures || {
        principal: true,
        coach: true,
        referee: true,
        organizer: false
      }
    });
  }

  getSchoolBranding(schoolId) {
    return this.schoolBranding.get(schoolId) || this.getDefaultBranding();
  }

  getSportBranding(sport, baseBranding) {
    const sportColors = {
      football: { primary: '#1e3a8a', secondary: '#10b981' },
      basketball: { primary: '#dc2626', secondary: '#f59e0b' },
      volleyball: { primary: '#059669', secondary: '#10b981' },
      tennis: { primary: '#7c3aed', secondary: '#fbbf24' },
      badminton: { primary: '#0891b2', secondary: '#f59e0b' },
      cricket: { primary: '#16a34a', secondary: '#eab308' }
    };

    const sportColor = sportColors[sport.toLowerCase()] || sportColors.football;
    
    return {
      ...this.getDefaultBranding(),
      ...baseBranding,
      primaryColor: baseBranding?.primaryColor || sportColor.primary,
      secondaryColor: baseBranding?.secondaryColor || sportColor.secondary
    };
  }

  getDefaultBranding() {
    return {
      logo: null,
      primaryColor: '#1e40af',
      secondaryColor: '#f59e0b',
      schoolName: 'School Name',
      address: '',
      principal: '',
      sportsCoordinator: '',
      watermark: {
        enabled: true,
        text: 'Powered by Athletiq',
        opacity: 0.1
      },
      signatures: {
        principal: true,
        coach: true,
        referee: true,
        organizer: false
      }
    };
  }

  // Simple template generators for additional sports
  createTennisTemplate() {
    return {
      renderTennisScoresheet: (data, options = {}) => {
        return `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <title>Tennis Match ${data.match.id} Scoresheet</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .tennis-scoresheet { border: 2px solid #000; padding: 20px; }
              .header { background: #7c3aed; color: white; padding: 10px; text-align: center; }
              .score-section { display: flex; padding: 20px; }
              .player-block { flex: 1; text-align: center; border: 1px solid #000; padding: 15px; }
            </style>
          </head>
          <body>
            <div class="tennis-scoresheet">
              <div class="header">🎾 ${data.tournament.name || 'TENNIS TOURNAMENT'}</div>
              <div class="score-section">
                <div class="player-block">
                  <h3>${data.teams[0]?.name || 'Player A'}</h3>
                  <div style="font-size: 24px; font-weight: bold;">
                    ${options.format === 'filled' ? (data.teams[0]?.sets || '0') : ''}
                  </div>
                </div>
                <div class="player-block">
                  <h3>${data.teams[1]?.name || 'Player B'}</h3>
                  <div style="font-size: 24px; font-weight: bold;">
                    ${options.format === 'filled' ? (data.teams[1]?.sets || '0') : ''}
                  </div>
                </div>
              </div>
              <div style="margin-top: 20px;">
                <h4>Match Details:</h4>
                <p>Date: ${data.match.date || 'TBD'}</p>
                <p>Time: ${data.match.time || 'TBD'}</p>
                <p>Court: ${data.match.venue || 'TBD'}</p>
              </div>
            </div>
          </body>
          </html>
        `;
      }
    };
  }

  createBadmintonTemplate() {
    return {
      renderBadmintonScoresheet: (data, options = {}) => {
        return `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <title>Badminton Match ${data.match.id} Scoresheet</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .badminton-scoresheet { border: 2px solid #000; padding: 20px; }
              .header { background: #0891b2; color: white; padding: 10px; text-align: center; }
              .score-section { display: flex; padding: 20px; }
              .player-block { flex: 1; text-align: center; border: 1px solid #000; padding: 15px; }
            </style>
          </head>
          <body>
            <div class="badminton-scoresheet">
              <div class="header">🏸 ${data.tournament.name || 'BADMINTON TOURNAMENT'}</div>
              <div class="score-section">
                <div class="player-block">
                  <h3>${data.teams[0]?.name || 'Player A'}</h3>
                  <div style="font-size: 24px; font-weight: bold;">
                    ${options.format === 'filled' ? (data.teams[0]?.games || '0') : ''}
                  </div>
                </div>
                <div class="player-block">
                  <h3>${data.teams[1]?.name || 'Player B'}</h3>
                  <div style="font-size: 24px; font-weight: bold;">
                    ${options.format === 'filled' ? (data.teams[1]?.games || '0') : ''}
                  </div>
                </div>
              </div>
              <div style="margin-top: 20px;">
                <h4>Match Details:</h4>
                <p>Date: ${data.match.date || 'TBD'}</p>
                <p>Time: ${data.match.time || 'TBD'}</p>
                <p>Court: ${data.match.venue || 'TBD'}</p>
              </div>
            </div>
          </body>
          </html>
        `;
      }
    };
  }

  createCricketTemplate() {
    return {
      renderCricketScoresheet: (data, options = {}) => {
        return `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <title>Cricket Match ${data.match.id} Scoresheet</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .cricket-scoresheet { border: 2px solid #000; padding: 20px; }
              .header { background: #16a34a; color: white; padding: 10px; text-align: center; }
              .score-section { display: flex; padding: 20px; }
              .team-block { flex: 1; text-align: center; border: 1px solid #000; padding: 15px; }
            </style>
          </head>
          <body>
            <div class="cricket-scoresheet">
              <div class="header">🏏 ${data.tournament.name || 'CRICKET TOURNAMENT'}</div>
              <div class="score-section">
                <div class="team-block">
                  <h3>${data.teams[0]?.name || 'Team A'}</h3>
                  <div style="font-size: 24px; font-weight: bold;">
                    ${options.format === 'filled' ? (data.teams[0]?.runs || '0') : ''} / 
                    ${options.format === 'filled' ? (data.teams[0]?.wickets || '0') : ''}
                  </div>
                  <div>Overs: ${options.format === 'filled' ? (data.teams[0]?.overs || '0') : ''}</div>
                </div>
                <div class="team-block">
                  <h3>${data.teams[1]?.name || 'Team B'}</h3>
                  <div style="font-size: 24px; font-weight: bold;">
                    ${options.format === 'filled' ? (data.teams[1]?.runs || '0') : ''} / 
                    ${options.format === 'filled' ? (data.teams[1]?.wickets || '0') : ''}
                  </div>
                  <div>Overs: ${options.format === 'filled' ? (data.teams[1]?.overs || '0') : ''}</div>
                </div>
              </div>
              <div style="margin-top: 20px;">
                <h4>Match Details:</h4>
                <p>Date: ${data.match.date || 'TBD'}</p>
                <p>Time: ${data.match.time || 'TBD'}</p>
                <p>Ground: ${data.match.venue || 'TBD'}</p>
                <p>Format: ${data.match.format || 'T20'}</p>
              </div>
            </div>
          </body>
          </html>
        `;
      }
    };
  }

  // Wrapper methods for simple templates
  renderTennisScoresheet(data, options) {
    return this.templates.get('tennis').renderTennisScoresheet(data, options);
  }

  renderBadmintonScoresheet(data, options) {
    return this.templates.get('badminton').renderBadmintonScoresheet(data, options);
  }

  renderCricketScoresheet(data, options) {
    return this.templates.get('cricket').renderCricketScoresheet(data, options);
  }

  // Utility method to detect sport from tournament data
  detectSport(tournament) {
    const name = tournament.name?.toLowerCase() || '';
    const sport = tournament.sport?.toLowerCase() || '';
    
    if (sport) return sport;
    
    // Detect from tournament name
    if (name.includes('football') || name.includes('soccer')) return 'football';
    if (name.includes('basketball')) return 'basketball';
    if (name.includes('volleyball')) return 'volleyball';
    if (name.includes('tennis')) return 'tennis';
    if (name.includes('badminton')) return 'badminton';
    if (name.includes('cricket')) return 'cricket';
    
    // Default to football
    return 'football';
  }

  // Generate scoresheet with auto-detection
  generateScoresheet(data, options = {}) {
    const sport = options.sport || this.detectSport(data.tournament);
    return this.generateSportScoresheet(sport, data, options);
  }
}

export default SportsTemplateFactory;
