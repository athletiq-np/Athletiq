// src/services/templates/FootballTemplateService.js
class FootballTemplateService {
  constructor() {
    this.sportName = 'Football';
    this.matchDuration = '90 minutes';
    this.teamSize = 11;
    this.substitutes = 7;
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
    
    return `
      <div class="football-scoresheet">
        ${branding.watermark?.enabled ? `<div class="watermark">${branding.watermark.text}</div>` : ''}
        
        <div class="content">
          <!-- Header -->
          <div class="header">
            ⚽ ${tournament.name || 'FOOTBALL TOURNAMENT'}
            ${tournament.stage ? ` (${tournament.stage.toUpperCase()})` : ''}
            <div class="sport-logo">
              ${branding.logo ? `<img src="${branding.logo}" alt="Logo" style="max-width: 50px; max-height: 35px;">` : '⚽'}
            </div>
          </div>

          <!-- Match Information Bar -->
          <div class="match-info-bar">
            <div class="match-info-cell" style="flex: 1;">
              <div style="font-weight: bold;">Match</div>
              <div>${match.id || 'TBD'}</div>
            </div>
            <div class="match-info-cell" style="flex: 2;">
              <div style="font-weight: bold;">Date and Time</div>
              <div>${match.date || 'TBD'} ${match.time || ''}</div>
            </div>
            <div class="match-info-cell" style="flex: 1;">
              <div style="font-weight: bold;">Duration</div>
              <div>90'</div>
            </div>
            <div class="match-info-cell" style="flex: 2;">
              <div style="font-weight: bold;">Stadium</div>
              <div>${match.venue || 'TBD'}</div>
            </div>
            <div class="match-info-cell" style="flex: 1;">
              <div style="font-weight: bold;">Weather</div>
              <div>${match.weather || 'Clear'}</div>
            </div>
            <div class="match-info-cell" style="flex: 1;">
              <div style="font-weight: bold;">Temperature</div>
              <div>${match.temperature || '22°C'}</div>
            </div>
            <div class="match-info-cell" style="flex: 1;">
              <div style="font-weight: bold;">Attendance</div>
              <div>${match.attendance || 'TBD'}</div>
            </div>
          </div>

          <!-- Score Section -->
          <div class="score-section">
            <div class="team-block">
              <div class="team-name">${teams[0]?.name || 'TEAM A'}</div>
              <div class="team-code">(${teams[0]?.code || 'TMA'})</div>
              <div class="score-display">${format === 'filled' || format === 'live' ? (teams[0]?.score || 0) : ''}</div>
            </div>
            <div class="team-block">
              <div class="team-name">${teams[1]?.name || 'TEAM B'}</div>
              <div class="team-code">(${teams[1]?.code || 'TMB'})</div>
              <div class="score-display">${format === 'filled' || format === 'live' ? (teams[1]?.score || 0) : ''}</div>
            </div>
          </div>

          <!-- Team Lineups -->
          <div class="lineups-section">
            ${teams.map((team, index) => this.renderFootballTeamLineup(team, index, format)).join('')}
          </div>

          <!-- Match Events -->
          <div class="match-events">
            <div class="events-title">⚽ MATCH EVENTS & STATISTICS</div>
            <table class="events-table">
              <thead>
                <tr>
                  <th class="event-time">TIME</th>
                  <th class="event-player">TEAM A PLAYER</th>
                  <th class="event-type">EVENT</th>
                  <th class="event-player">TEAM B PLAYER</th>
                  <th class="event-time">TIME</th>
                </tr>
              </thead>
              <tbody>
                ${Array(10).fill(0).map(() => `
                  <tr>
                    <td class="event-time"></td>
                    <td class="event-player"></td>
                    <td class="event-type"></td>
                    <td class="event-player"></td>
                    <td class="event-time"></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Match Officials -->
          <div class="officials-section">
            <div class="officials-title">⚽ MATCH OFFICIALS</div>
            <div class="officials-grid">
              <div class="official-block">
                <div class="official-title">REFEREE</div>
                <div class="official-name">${match.referee || ''}</div>
              </div>
              <div class="official-block">
                <div class="official-title">ASSISTANT REFEREE 1</div>
                <div class="official-name">${match.assistantReferee1 || ''}</div>
              </div>
              <div class="official-block">
                <div class="official-title">ASSISTANT REFEREE 2</div>
                <div class="official-name">${match.assistantReferee2 || ''}</div>
              </div>
            </div>
          </div>

          <!-- Signatures -->
          ${this.renderFootballSignatures(branding)}
        </div>
      </div>
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
}

export default FootballTemplateService;
