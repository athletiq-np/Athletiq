// src/services/templates/BasketballTemplateService.js
class BasketballTemplateService {
  constructor() {
    this.sportName = 'Basketball';
    this.matchDuration = '4 × 12 minutes';
    this.teamSize = 5;
    this.substitutes = 7;
    this.quarters = 4;
  }

  // Generate basketball-specific scoresheet
  renderBasketballScoresheet(data, options = {}) {
    const { match, tournament, teams, branding } = data;
    const format = options.format || 'blank';
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Basketball Match ${match.id} Scoresheet</title>
        <style>
          ${this.getBasketballCSS(branding)}
        </style>
      </head>
      <body>
        ${this.getBasketballHTML(data, format)}
      </body>
      </html>
    `;
  }

  getBasketballCSS(branding) {
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
      
      .basketball-scoresheet {
        width: 100%;
        max-width: 210mm;
        margin: 0 auto;
        border: 2px solid #000;
        background: white;
      }
      
      .header {
        background: #dc2626;
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
        font-size: 20px;
        color: #dc2626;
        font-weight: bold;
      }
      
      .match-info-bar {
        background: #fef3c7;
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
        min-height: 100px;
        border-bottom: 1px solid #000;
        background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
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
        font-size: 18px;
        margin-bottom: 5px;
        color: #dc2626;
      }
      
      .team-code {
        font-size: 12px;
        color: #666;
        margin-bottom: 8px;
      }
      
      .score-display {
        font-size: 48px;
        font-weight: bold;
        color: #b91c1c;
        margin: 10px 0;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
      }
      
      .quarters-section {
        padding: 10px;
        border-bottom: 1px solid #000;
        background: #f9fafb;
      }
      
      .quarters-title {
        font-weight: bold;
        font-size: 12px;
        margin-bottom: 8px;
        text-align: center;
        color: #dc2626;
      }
      
      .quarters-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 10px;
      }
      
      .quarters-table th,
      .quarters-table td {
        border: 1px solid #000;
        padding: 6px 8px;
        text-align: center;
        font-size: 11px;
      }
      
      .quarters-table th {
        background: #dc2626;
        color: white;
        font-weight: bold;
      }
      
      .quarter-cell {
        width: 80px;
        font-weight: bold;
      }
      
      .total-cell {
        background: #fef3c7;
        font-weight: bold;
        font-size: 14px;
      }
      
      .lineups-section {
        display: flex;
        min-height: 400px;
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
        background: #dc2626;
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
        background: #fef3c7;
        font-weight: bold;
        text-align: center;
      }
      
      .player-number {
        text-align: center;
        font-weight: bold;
        width: 30px;
        background: #fef3c7;
      }
      
      .player-name {
        width: 120px;
      }
      
      .player-position {
        width: 35px;
        text-align: center;
        font-weight: bold;
        color: #dc2626;
      }
      
      .player-stats {
        text-align: center;
        width: 25px;
      }
      
      .substitutes-section {
        margin-top: 15px;
        border-top: 2px solid #fed7aa;
        padding-top: 10px;
      }
      
      .substitutes-header {
        font-weight: bold;
        font-size: 11px;
        margin-bottom: 8px;
        text-align: center;
        background: #fed7aa;
        padding: 4px;
        border: 1px solid #dc2626;
        border-radius: 3px;
      }
      
      .stats-section {
        margin-top: 15px;
        padding: 12px;
        border: 1px solid #000;
        background: #fafafa;
      }
      
      .stats-title {
        font-weight: bold;
        font-size: 12px;
        margin-bottom: 10px;
        text-align: center;
        color: #dc2626;
      }
      
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
      }
      
      .stat-category {
        border: 1px solid #fed7aa;
        border-radius: 4px;
        padding: 8px;
        background: white;
      }
      
      .stat-category-title {
        font-weight: bold;
        font-size: 11px;
        margin-bottom: 8px;
        color: #dc2626;
        text-align: center;
      }
      
      .stat-lines {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      
      .stat-line {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      
      .stat-box {
        border: 1px solid #ccc;
        padding: 3px;
        font-size: 10px;
        text-align: center;
        width: 30px;
        height: 20px;
      }
      
      .stat-label {
        flex: 1;
        font-size: 10px;
      }
      
      .officials-section {
        padding: 12px;
        border-top: 1px solid #000;
        background: #fef3c7;
      }
      
      .officials-title {
        font-weight: bold;
        font-size: 12px;
        margin-bottom: 10px;
        text-align: center;
        color: #dc2626;
      }
      
      .officials-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
      }
      
      .official-block {
        text-align: center;
        padding: 8px;
        border: 1px solid #fed7aa;
        border-radius: 4px;
        background: white;
      }
      
      .official-title {
        font-weight: bold;
        font-size: 10px;
        margin-bottom: 5px;
        color: #dc2626;
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
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
      }
      
      .signature-block {
        text-align: center;
        padding: 8px;
        border: 1px solid #fed7aa;
        border-radius: 4px;
        background: #fef3c7;
      }
      
      .signature-title {
        font-weight: bold;
        font-size: 10px;
        margin-bottom: 8px;
        color: #dc2626;
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
        .basketball-scoresheet { 
          max-width: none;
          page-break-inside: avoid;
        }
      }
    `;
  }

  getBasketballHTML(data, format) {
    const { match, tournament, teams, branding } = data;
    
    return `
      <div class="basketball-scoresheet">
        ${branding.watermark?.enabled ? `<div class="watermark">${branding.watermark.text}</div>` : ''}
        
        <div class="content">
          <!-- Header -->
          <div class="header">
            🏀 ${tournament.name || 'BASKETBALL TOURNAMENT'}
            ${tournament.stage ? ` (${tournament.stage.toUpperCase()})` : ''}
            <div class="sport-logo">
              ${branding.logo ? `<img src="${branding.logo}" alt="Logo" style="max-width: 50px; max-height: 35px;">` : '🏀'}
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
              <div>4×12'</div>
            </div>
            <div class="match-info-cell" style="flex: 2;">
              <div style="font-weight: bold;">Court</div>
              <div>${match.venue || 'TBD'}</div>
            </div>
            <div class="match-info-cell" style="flex: 1;">
              <div style="font-weight: bold;">Weather</div>
              <div>${match.weather || 'Indoor'}</div>
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

          <!-- Quarter Scores -->
          <div class="quarters-section">
            <div class="quarters-title">🏀 QUARTER SCORES</div>
            <table class="quarters-table">
              <thead>
                <tr>
                  <th>TEAM</th>
                  <th class="quarter-cell">Q1</th>
                  <th class="quarter-cell">Q2</th>
                  <th class="quarter-cell">Q3</th>
                  <th class="quarter-cell">Q4</th>
                  <th class="quarter-cell">OT</th>
                  <th class="total-cell">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-weight: bold; background: #fef3c7;">${teams[0]?.name || 'TEAM A'}</td>
                  <td class="quarter-cell">${format === 'filled' ? (teams[0]?.quarters?.[0] || '') : ''}</td>
                  <td class="quarter-cell">${format === 'filled' ? (teams[0]?.quarters?.[1] || '') : ''}</td>
                  <td class="quarter-cell">${format === 'filled' ? (teams[0]?.quarters?.[2] || '') : ''}</td>
                  <td class="quarter-cell">${format === 'filled' ? (teams[0]?.quarters?.[3] || '') : ''}</td>
                  <td class="quarter-cell">${format === 'filled' ? (teams[0]?.overtime || '') : ''}</td>
                  <td class="total-cell">${format === 'filled' ? (teams[0]?.score || 0) : ''}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold; background: #fef3c7;">${teams[1]?.name || 'TEAM B'}</td>
                  <td class="quarter-cell">${format === 'filled' ? (teams[1]?.quarters?.[0] || '') : ''}</td>
                  <td class="quarter-cell">${format === 'filled' ? (teams[1]?.quarters?.[1] || '') : ''}</td>
                  <td class="quarter-cell">${format === 'filled' ? (teams[1]?.quarters?.[2] || '') : ''}</td>
                  <td class="quarter-cell">${format === 'filled' ? (teams[1]?.quarters?.[3] || '') : ''}</td>
                  <td class="quarter-cell">${format === 'filled' ? (teams[1]?.overtime || '') : ''}</td>
                  <td class="total-cell">${format === 'filled' ? (teams[1]?.score || 0) : ''}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Team Lineups -->
          <div class="lineups-section">
            ${teams.map((team, index) => this.renderBasketballTeamLineup(team, index, format)).join('')}
          </div>

          <!-- Match Statistics -->
          <div class="stats-section">
            <div class="stats-title">🏀 MATCH STATISTICS & EVENTS</div>
            <div class="stats-grid">
              <div class="stat-category">
                <div class="stat-category-title">SCORING EVENTS</div>
                <div class="stat-lines">
                  ${Array(8).fill(0).map(() => `
                    <div class="stat-line">
                      <div class="stat-box"></div>
                      <div class="stat-label">Time: _____ Player: _____ Points: _____</div>
                    </div>
                  `).join('')}
                </div>
              </div>
              
              <div class="stat-category">
                <div class="stat-category-title">FOULS & VIOLATIONS</div>
                <div class="stat-lines">
                  ${Array(8).fill(0).map(() => `
                    <div class="stat-line">
                      <div class="stat-box"></div>
                      <div class="stat-label">Time: _____ Player: _____ Foul: _____</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>

          <!-- Match Officials -->
          <div class="officials-section">
            <div class="officials-title">🏀 MATCH OFFICIALS</div>
            <div class="officials-grid">
              <div class="official-block">
                <div class="official-title">HEAD REFEREE</div>
                <div class="official-name">${match.referee || ''}</div>
              </div>
              <div class="official-block">
                <div class="official-title">UMPIRE 1</div>
                <div class="official-name">${match.umpire1 || ''}</div>
              </div>
              <div class="official-block">
                <div class="official-title">UMPIRE 2</div>
                <div class="official-name">${match.umpire2 || ''}</div>
              </div>
            </div>
          </div>

          <!-- Signatures -->
          ${this.renderBasketballSignatures(branding)}
        </div>
      </div>
    `;
  }

  renderBasketballTeamLineup(team, index, format) {
    const teamName = team?.name || `TEAM ${index === 0 ? 'A' : 'B'}`;
    const teamCode = team?.code || (index === 0 ? 'TMA' : 'TMB');
    
    return `
      <div class="team-lineup">
        <div class="lineup-header">🏀 ${teamName} (${teamCode})</div>
        
        <!-- Starting Five -->
        <table class="players-table">
          <thead>
            <tr>
              <th class="player-number">No.</th>
              <th class="player-position">Pos</th>
              <th class="player-name">Player Name</th>
              <th class="player-stats">Pts</th>
              <th class="player-stats">Reb</th>
              <th class="player-stats">Ast</th>
              <th class="player-stats">Fls</th>
            </tr>
          </thead>
          <tbody>
            ${Array(5).fill(0).map((_, i) => `
              <tr>
                <td class="player-number">${i + 1}</td>
                <td class="player-position">${this.getDefaultBasketballPosition(i)}</td>
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
                  <td class="player-number">${i + 6}</td>
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
        <div style="margin-top: 12px; padding: 8px; background: #fef3c7; border: 1px solid #fed7aa; border-radius: 4px;">
          <div style="font-size: 10px; margin-bottom: 6px;"><strong>Head Coach:</strong> ${team?.coach || '________________________'}</div>
          <div style="font-size: 10px; margin-bottom: 6px;"><strong>Assistant Coach:</strong> ${team?.assistantCoach || '________________________'}</div>
          <div style="font-size: 10px;"><strong>Team Manager:</strong> ${team?.manager || '________________________'}</div>
        </div>
      </div>
    `;
  }

  getDefaultBasketballPosition(index) {
    const positions = ['PG', 'SG', 'SF', 'PF', 'C'];
    return positions[index] || 'G';
  }

  renderBasketballSignatures(branding) {
    return `
      <div class="signatures-section">
        <div class="signatures-grid">
          <div class="signature-block">
            <div class="signature-title">HEAD REFEREE</div>
            <div class="signature-line"></div>
            <div class="signature-name">Name & Signature</div>
          </div>
          <div class="signature-block">
            <div class="signature-title">SCOREKEEPER</div>
            <div class="signature-line"></div>
            <div class="signature-name">Name & Signature</div>
          </div>
          <div class="signature-block">
            <div class="signature-title">TEAM A COACH</div>
            <div class="signature-line"></div>
            <div class="signature-name">Name & Signature</div>
          </div>
          <div class="signature-block">
            <div class="signature-title">TEAM B COACH</div>
            <div class="signature-line"></div>
            <div class="signature-name">Name & Signature</div>
          </div>
        </div>
      </div>
    `;
  }

  // Standard method for template generation  
  getHTML(data, format = 'blank') {
    return this.renderBasketballScoresheet(data, { format });
  }
}

export default BasketballTemplateService;
