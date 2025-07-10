const ScoreSheetDataService = require('../ScoreSheetDataService');

// Backend Football Template Service
class FootballTemplateService {
  constructor() {
    this.sportName = 'Football';
    this.matchDuration = '90 minutes';
    this.teamSize = 11;
    this.substitutes = 7;
    this.name = 'AFC Champions League Style Football Template';
    this.description = 'Professional football scoresheet template based on AFC Champions League format';
  }

  // Generate AFC Champions League style template for football
  renderFootballScoresheet(data, options = {}) {
    const { match, tournament, teams, branding } = data;
    const format = options.format || 'blank';
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Football Match ${match.id} Scoresheet</title>
        <style>
          ${this.getFootballCSS(branding)}
        </style>
      </head>
      <body>
        ${this.getFootballHTML(data, format)}
      </body>
      </html>
    `;
  }

  getFootballCSS(branding) {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Arial', sans-serif;
        font-size: 11px;
        line-height: 1.2;
        color: #000;
        background: white;
        padding: 15px;
      }
      
      .football-scoresheet {
        width: 100%;
        max-width: 210mm;
        margin: 0 auto;
        border: 2px solid #000;
        background: white;
      }
      
      .header {
        background: #1e3a8a;
        color: white;
        padding: 8px 15px;
        text-align: center;
        font-weight: bold;
        font-size: 14px;
        position: relative;
      }
      
      .sport-logo {
        position: absolute;
        right: 15px;
        top: 50%;
        transform: translateY(-50%);
        width: 60px;
        height: 40px;
        background: white;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        color: #1e3a8a;
        font-weight: bold;
      }
      
      .match-info-bar {
        background: #f3f4f6;
        border-bottom: 1px solid #000;
        padding: 0;
        display: flex;
        align-items: center;
      }
      
      .match-info-cell {
        padding: 6px 8px;
        border-right: 1px solid #000;
        text-align: center;
        font-size: 10px;
      }
      
      .match-info-cell:last-child {
        border-right: none;
      }
      
      .score-section {
        display: flex;
        align-items: center;
        min-height: 80px;
        border-bottom: 1px solid #000;
        background: linear-gradient(135deg, #e8f5e8 0%, #f0f9ff 100%);
      }
      
      .team-block {
        flex: 1;
        padding: 15px;
        text-align: center;
        border-right: 1px solid #000;
      }
      
      .team-block:last-child {
        border-right: none;
      }
      
      .team-name {
        font-weight: bold;
        font-size: 16px;
        margin-bottom: 5px;
        color: #1e3a8a;
      }
      
      .team-code {
        font-size: 12px;
        color: #666;
        margin-bottom: 8px;
      }
      
      .score-display {
        font-size: 42px;
        font-weight: bold;
        color: #dc2626;
        margin: 10px 0;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
      }
      
      .lineups-section {
        display: flex;
        min-height: 500px;
      }
      
      .team-lineup {
        flex: 1;
        border-right: 1px solid #000;
        padding: 12px;
      }
      
      .team-lineup:last-child {
        border-right: none;
      }
      
      .lineup-header {
        font-weight: bold;
        font-size: 13px;
        margin-bottom: 10px;
        text-align: center;
        padding: 6px;
        background: #1e3a8a;
        color: white;
        border-radius: 4px;
      }
      
      .players-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 15px;
      }
      
      .players-table th,
      .players-table td {
        border: 1px solid #000;
        padding: 4px 6px;
        text-align: left;
        font-size: 10px;
      }
      
      .players-table th {
        background: #f3f4f6;
        font-weight: bold;
        text-align: center;
      }
      
      .player-number {
        text-align: center;
        font-weight: bold;
        width: 30px;
        background: #e8f5e8;
      }
      
      .player-name {
        width: 120px;
      }
      
      .player-position {
        width: 35px;
        text-align: center;
        font-weight: bold;
        color: #1e3a8a;
      }
      
      .player-stats {
        text-align: center;
        width: 25px;
      }
      
      .substitutes-section {
        margin-top: 15px;
        border-top: 2px solid #e5e7eb;
        padding-top: 10px;
      }
      
      .substitutes-header {
        font-weight: bold;
        font-size: 11px;
        margin-bottom: 8px;
        text-align: center;
        background: #fef3c7;
        padding: 4px;
        border: 1px solid #d97706;
        border-radius: 3px;
      }
      
      .formation-display {
        margin-bottom: 15px;
        padding: 8px;
        background: #f9fafb;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        text-align: center;
      }
      
      .formation-title {
        font-weight: bold;
        font-size: 10px;
        margin-bottom: 3px;
        color: #1e3a8a;
      }
      
      .formation-text {
        font-size: 12px;
        font-weight: bold;
        color: #dc2626;
      }
      
      .match-events {
        margin-top: 15px;
        padding: 12px;
        border: 1px solid #000;
        background: #fafafa;
      }
      
      .events-title {
        font-weight: bold;
        font-size: 12px;
        margin-bottom: 10px;
        text-align: center;
        color: #1e3a8a;
      }
      
      .events-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 10px;
      }
      
      .events-table th,
      .events-table td {
        border: 1px solid #000;
        padding: 4px 6px;
        text-align: center;
        font-size: 10px;
      }
      
      .events-table th {
        background: #1e3a8a;
        color: white;
        font-weight: bold;
      }
      
      .event-time {
        width: 45px;
        background: #fef3c7;
      }
      
      .event-player {
        width: 130px;
      }
      
      .event-type {
        width: 80px;
        font-weight: bold;
      }
      
      .officials-section {
        padding: 12px;
        border-top: 1px solid #000;
        background: #f0f9ff;
      }
      
      .officials-title {
        font-weight: bold;
        font-size: 12px;
        margin-bottom: 10px;
        text-align: center;
        color: #1e3a8a;
      }
      
      .officials-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
      }
      
      .official-block {
        text-align: center;
        padding: 8px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        background: white;
      }
      
      .official-title {
        font-weight: bold;
        font-size: 10px;
        margin-bottom: 5px;
        color: #1e3a8a;
      }
      
      .official-name {
        border-bottom: 1px solid #000;
        padding: 3px;
        min-height: 25px;
        font-size: 10px;
      }
      
      .signatures-section {
        margin-top: 20px;
        padding: 12px;
        border-top: 2px solid #000;
      }
      
      .signatures-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 25px;
      }
      
      .signature-block {
        text-align: center;
        padding: 8px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        background: #f9fafb;
      }
      
      .signature-title {
        font-weight: bold;
        font-size: 10px;
        margin-bottom: 8px;
        color: #1e3a8a;
      }
      
      .signature-line {
        border-bottom: 2px solid #000;
        height: 35px;
        margin-bottom: 8px;
        background: white;
      }
      
      .signature-name {
        font-size: 9px;
        color: #666;
      }
      
      .watermark {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 48px;
        color: rgba(0,0,0,0.03);
        font-weight: bold;
        z-index: 0;
        pointer-events: none;
      }
      
      .content {
        position: relative;
        z-index: 1;
      }
      
      @media print {
        body { 
          margin: 0;
          padding: 10px;
        }
        .football-scoresheet { 
          max-width: none;
          page-break-inside: avoid;
        }
      }
    `;
  }

  getFootballHTML(data, format) {
    const { match, tournament, teams, branding } = data;
    // Helper for safe value
    const safe = (v, d = '') => (v !== undefined && v !== null ? v : d);
    
    // Handle different data structures
    let homeTeam, awayTeam;
    if (teams && Array.isArray(teams)) {
      homeTeam = teams[0];
      awayTeam = teams[1];
    } else if (match && match.homeTeam && match.awayTeam) {
      homeTeam = { name: match.homeTeam.school_name, ...match.homeTeam };
      awayTeam = { name: match.awayTeam.school_name, ...match.awayTeam };
    } else {
      homeTeam = { name: 'Team A' };
      awayTeam = { name: 'Team B' };
    }
    
    // AFC logo (SVG or placeholder)
    const afcLogo = `<span style="font-weight:bold;font-size:22px;color:#1e3a8a;letter-spacing:2px;">AFC</span>`;
    return `
      <div class="football-scoresheet" style="font-family:Arial,sans-serif;max-width:900px;margin:0 auto;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td colspan="10" style="text-align:left;font-size:13px;font-weight:bold;padding:4px 0;">AFC Champions League 2004<br>(FINAL)</td>
            <td colspan="4" style="text-align:right;padding:4px 0;">${afcLogo}</td>
          </tr>
          <tr>
            <td colspan="14" style="text-align:center;font-size:18px;font-weight:bold;padding:2px 0;">MATCH SUMMARY</td>
          </tr>
          <tr style="font-size:11px;">
            <td style="font-weight:bold;">Match</td>
            <td>${safe(match.id, '10')}</td>
            <td style="font-weight:bold;">Date and Time</td>
            <td colspan="2">${safe(match.date, '11-MAY-2004')} ${safe(match.time, '19:00')}</td>
            <td style="font-weight:bold;">Duration</td>
            <td>${safe(match.duration, '90')}</td>
            <td style="font-weight:bold;">Stadium</td>
            <td colspan="2">${safe(match.venue, 'Tancheon Sports Complex, Seongnam')}</td>
            <td style="font-weight:bold;">Weather</td>
            <td>${safe(match.weather, 'Cloudy')}</td>
            <td style="font-weight:bold;">Temp</td>
            <td>${safe(match.temperature, '22 C')}</td>
          </tr>
          <tr style="font-size:11px;">
            <td style="font-weight:bold;">Attendance</td>
            <td>${safe(match.attendance, '2458')}</td>
            <td colspan="12"></td>
          </tr>
          <tr style="font-size:13px;font-weight:bold;">
            <td colspan="6" style="text-align:center;background:#e5e7eb;">${safe(homeTeam?.name, 'SEONGNAM FC (KOR)')}</td>
            <td colspan="2" style="text-align:center;font-size:22px;">${safe(homeTeam?.score, '15')}</td>
            <td colspan="2" style="text-align:center;font-size:22px;">${safe(awayTeam?.score, '0')}</td>
            <td colspan="6" style="text-align:center;background:#e5e7eb;">${safe(awayTeam?.name, 'PERSIK KEDIRI (IDN)')}</td>
          </tr>
          <tr style="font-size:11px;">
            <td colspan="2"></td>
            <td colspan="2" style="text-align:center;">1st Half</td>
            <td colspan="2" style="text-align:center;">2nd Half</td>
            <td colspan="2" style="text-align:center;">Ext. Time</td>
            <td colspan="2" style="text-align:center;">Penalty Kick</td>
            <td colspan="2"></td>
          </tr>
          <tr style="font-size:11px;">
            <td colspan="2"></td>
            <td colspan="2" style="text-align:center;">${safe(match.firstHalf, '7')}</td>
            <td colspan="2" style="text-align:center;">${safe(match.secondHalf, '8')}</td>
            <td colspan="2" style="text-align:center;">${safe(match.extraTime, '0')}</td>
            <td colspan="2" style="text-align:center;">${safe(match.penalty, '0')}</td>
            <td colspan="2"></td>
          </tr>
        </table>

        <!-- Player Tables -->
        <table style="width:100%;border-collapse:collapse;margin-top:10px;">
          <tr>
            <td style="width:49%;vertical-align:top;">
              ${this.renderAFCPlayerTable(homeTeam, 'Yellow')}
            </td>
            <td style="width:2%;"></td>
            <td style="width:49%;vertical-align:top;">
              ${this.renderAFCPlayerTable(awayTeam, 'Purple')}
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  // Render AFC-style player table (main + substitutes)
  renderAFCPlayerTable(team, colorLabel) {
    // Helper for safe value
    const safe = (v, d = '') => (v !== undefined && v !== null ? v : d);
    // Main players
    const players = team?.players || Array(11).fill({});
    // Substitutes
    const subs = team?.substitutes || Array(7).fill({});
    return `
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <tr>
          <td colspan="8" style="font-weight:bold;text-align:left;background:#f3f4f6;">${safe(colorLabel, '')}</td>
        </tr>
        <tr style="background:#f9fafb;">
          <th style="border:1px solid #000;width:24px;">No.</th>
          <th style="border:1px solid #000;width:28px;">Pos</th>
          <th style="border:1px solid #000;">Name</th>
          <th style="border:1px solid #000;width:18px;">G</th>
          <th style="border:1px solid #000;width:18px;">Y</th>
          <th style="border:1px solid #000;width:18px;">R</th>
          <th style="border:1px solid #000;width:18px;">S</th>
          <th style="border:1px solid #000;width:40px;"> </th>
        </tr>
        ${players.map((p, i) => `
          <tr>
            <td style="border:1px solid #000;text-align:center;">${safe(p.number, i+1)}</td>
            <td style="border:1px solid #000;text-align:center;">${safe(p.position, '')}</td>
            <td style="border:1px solid #000;">${safe(p.name, '')}</td>
            <td style="border:1px solid #000;text-align:center;">${safe(p.goals, '')}</td>
            <td style="border:1px solid #000;text-align:center;">${safe(p.yellow, '')}</td>
            <td style="border:1px solid #000;text-align:center;">${safe(p.red, '')}</td>
            <td style="border:1px solid #000;text-align:center;">${safe(p.sub, '')}</td>
            <td style="border:1px solid #000;"></td>
          </tr>
        `).join('')}
        <tr><td colspan="8" style="height:6px;"></td></tr>
        <tr>
          <td colspan="8" style="font-weight:bold;text-align:left;background:#f3f4f6;">Substitutes</td>
        </tr>
        ${subs.map((p, i) => `
          <tr>
            <td style="border:1px solid #000;text-align:center;">${safe(p.number, i+12)}</td>
            <td style="border:1px solid #000;text-align:center;">SUB</td>
            <td style="border:1px solid #000;">${safe(p.name, '')}</td>
            <td style="border:1px solid #000;text-align:center;"></td>
            <td style="border:1px solid #000;text-align:center;"></td>
            <td style="border:1px solid #000;text-align:center;"></td>
            <td style="border:1px solid #000;text-align:center;"></td>
            <td style="border:1px solid #000;"></td>
          </tr>
        `).join('')}
      </table>
    `;
  }

  renderFootballTeamLineup(team, index, format) {
    const teamName = team?.name || `TEAM ${index === 0 ? 'A' : 'B'}`;
    const teamCode = team?.code || (index === 0 ? 'TMA' : 'TMB');
    
    return `
      <div class="team-lineup">
        <div class="lineup-header">⚽ ${teamName} (${teamCode})</div>
        
        <!-- Formation Display -->
        <div class="formation-display">
          <div class="formation-title">FORMATION</div>
          <div class="formation-text">${team?.formation || '4-4-2'}</div>
        </div>
        
        <!-- Starting XI -->
        <table class="players-table">
          <thead>
            <tr>
              <th class="player-number">No.</th>
              <th class="player-position">Pos</th>
              <th class="player-name">Player Name</th>
              <th class="player-stats">G</th>
              <th class="player-stats">Y</th>
              <th class="player-stats">R</th>
              <th class="player-stats">S</th>
            </tr>
          </thead>
          <tbody>
            ${Array(11).fill(0).map((_, i) => `
              <tr>
                <td class="player-number">${i + 1}</td>
                <td class="player-position">${this.getDefaultPosition(i)}</td>
                <td class="player-name">${team?.players?.[i]?.name || ''}</td>
                <td class="player-stats"></td>
                <td class="player-stats"></td>
                <td class="player-stats"></td>
                <td class="player-stats"></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Substitutes -->
        <div class="substitutes-section">
          <div class="substitutes-header">SUBSTITUTES</div>
          <table class="players-table">
            <tbody>
              ${Array(7).fill(0).map((_, i) => `
                <tr>
                  <td class="player-number">${i + 12}</td>
                  <td class="player-position">SUB</td>
                  <td class="player-name">${team?.substitutes?.[i]?.name || ''}</td>
                  <td class="player-stats"></td>
                  <td class="player-stats"></td>
                  <td class="player-stats"></td>
                  <td class="player-stats"></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Team Officials -->
        <div style="margin-top: 12px; padding: 8px; background: #f0f9ff; border: 1px solid #d1d5db; border-radius: 4px;">
          <div style="font-size: 10px; margin-bottom: 6px;"><strong>Head Coach:</strong> ${team?.coach || '________________________'}</div>
          <div style="font-size: 10px; margin-bottom: 6px;"><strong>Assistant Coach:</strong> ${team?.assistantCoach || '________________________'}</div>
          <div style="font-size: 10px;"><strong>Team Manager:</strong> ${team?.manager || '________________________'}</div>
        </div>
      </div>
    `;
  }

  getDefaultPosition(index) {
    const positions = ['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'CM', 'CM', 'RW', 'ST', 'LW'];
    return positions[index] || 'MF';
  }

  renderFootballSignatures(branding) {
    return `
      <div class="signatures-section">
        <div class="signatures-grid">
          <div class="signature-block">
            <div class="signature-title">MATCH REFEREE</div>
            <div class="signature-line"></div>
            <div class="signature-name">Name & Signature</div>
          </div>
          <div class="signature-block">
            <div class="signature-title">TEAM A CAPTAIN</div>
            <div class="signature-line"></div>
            <div class="signature-name">Name & Signature</div>
          </div>
          <div class="signature-block">
            <div class="signature-title">TEAM B CAPTAIN</div>
            <div class="signature-line"></div>
            <div class="signature-name">Name & Signature</div>
          </div>
        </div>
      </div>
    `;
  }

  // Standard method for template generation
  getHTML(data, format = 'blank') {
    return this.renderFootballScoresheet(data, { format });
  }

  /**
   * Generate scoresheet using real school and team data from database
   * @param {Object} options - Generation options
   * @returns {Promise<string>} HTML scoresheet
   */
  async generateWithRealData(options = {}) {
    try {
      const { 
        schoolLimit = 8, 
        useAdminFilter = false, 
        adminEmail = 'admin@test.com',
        format = 'blank',
        matchInfo = null
      } = options;

      let schools;
      
      if (useAdminFilter) {
        schools = await ScoreSheetDataService.getSchoolsByAdmin(adminEmail, schoolLimit);
      } else {
        schools = await ScoreSheetDataService.getSchoolsWithFootballTeams(schoolLimit);
      }

      if (schools.length < 2) {
        // Use sample data if insufficient real data
        console.warn('Insufficient real data, using sample data');
        return this.generateWithSampleData(format);
      }

      // If specific match info provided, use it
      if (matchInfo && matchInfo.homeTeamId && matchInfo.awayTeamId) {
        const matchData = await ScoreSheetDataService.getMatchData(matchInfo);
        return this.renderFootballScoresheet(matchData, { format });
      }

      // Generate scoresheet with available schools/teams
      const data = this.formatDataForTemplate(schools);
      return this.renderFootballScoresheet(data, { format });

    } catch (error) {
      console.error('Error generating scoresheet with real data:', error);
      // Fallback to sample data
      return this.generateWithSampleData(format);
    }
  }

  /**
   * Generate scoresheet with sample data
   * @param {string} format - Template format
   * @returns {string} HTML scoresheet
   */
  generateWithSampleData(format = 'blank') {
    const sampleData = ScoreSheetDataService.createSampleMatchData();
    return this.renderFootballScoresheet(sampleData, { format });
  }

  /**
   * Format database data for template consumption
   * @param {Array} schools - Array of schools with teams and players
   * @returns {Object} Formatted data for template
   */
  formatDataForTemplate(schools) {
    // Select first two schools with teams/players
    const homeSchool = schools[0];
    const awaySchool = schools[1] || schools[0]; // Fallback to same school if only one

    const homeTeam = homeSchool.teams[0] || { team_name: `${homeSchool.school_name} FC` };
    const awayTeam = awaySchool.teams[0] || { team_name: `${awaySchool.school_name} United` };

    return {
      match: {
        date: new Date().toISOString().split('T')[0],
        venue: 'Athletiq Sports Complex',
        homeTeam: {
          ...homeTeam,
          school_name: homeSchool.school_name,
          school_code: homeSchool.school_code,
          players: homeSchool.players.slice(0, 18).map((player, index) => ({
            ...player,
            jersey_number: index + 1,
            position: this.getPositionByIndex(index)
          }))
        },
        awayTeam: {
          ...awayTeam,
          school_name: awaySchool.school_name,
          school_code: awaySchool.school_code,
          players: awaySchool.players.slice(0, 18).map((player, index) => ({
            ...player,
            jersey_number: index + 1,
            position: this.getPositionByIndex(index)
          }))
        }
      },
      tournament: {
        name: 'Athletiq Football Championship',
        season: '2024-25',
        round: 'Group Stage'
      },
      branding: {
        logoUrl: null,
        organizationName: 'Athletiq Sports Management'
      }
    };
  }

  /**
   * Get football position based on index
   * @param {number} index - Player index
   * @returns {string} Position name
   */
  getPositionByIndex(index) {
    const positions = [
      'Goalkeeper', 'Defender', 'Defender', 'Defender', 'Defender',
      'Midfielder', 'Midfielder', 'Midfielder', 'Midfielder',
      'Forward', 'Forward',
      'Substitute', 'Substitute', 'Substitute', 'Substitute',
      'Substitute', 'Substitute', 'Substitute'
    ];
    return positions[index] || 'Player';
  }

  /**
   * Batch generate scoresheets for multiple matches
   * @param {Array} matchList - Array of match configurations
   * @returns {Promise<Array>} Array of generated scoresheets
   */
  async batchGenerate(matchList) {
    const results = [];
    
    for (const matchConfig of matchList) {
      try {
        const scoresheet = await this.generateWithRealData(matchConfig);
        results.push({
          success: true,
          html: scoresheet,
          config: matchConfig
        });
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          config: matchConfig
        });
      }
    }
    
    return results;
  }

  /**
   * Get available schools for scoresheet generation
   * @returns {Promise<Array>} Array of schools
   */
  async getAvailableSchools() {
    try {
      return await ScoreSheetDataService.getSchoolsWithFootballTeams(20);
    } catch (error) {
      console.error('Error fetching available schools:', error);
      return [];
    }
  }
}

module.exports = FootballTemplateService;
