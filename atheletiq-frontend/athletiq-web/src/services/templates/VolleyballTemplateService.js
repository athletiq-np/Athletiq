// src/services/templates/VolleyballTemplateService.js
class VolleyballTemplateService {
  constructor() {
    this.sportName = 'Volleyball';
    this.matchFormat = 'Best of 5 sets';
    this.teamSize = 6;
    this.substitutes = 6;
    this.maxSets = 5;
  }

  // Generate volleyball-specific scoresheet
  renderVolleyballScoresheet(data, options = {}) {
    const { match, tournament, teams, branding } = data;
    const format = options.format || 'blank';
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Volleyball Match ${match.id} Scoresheet</title>
        <style>
          ${this.getVolleyballCSS(branding)}
        </style>
      </head>
      <body>
        ${this.getVolleyballHTML(data, format)}
      </body>
      </html>
    `;
  }

  getVolleyballCSS(branding) {
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
      
      .volleyball-scoresheet {
        width: 100%;
        max-width: 210mm;
        margin: 0 auto;
        border: 2px solid #000;
        background: white;
      }
      
      .header {
        background: #059669;
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
        color: #059669;
        font-weight: bold;
      }
      
      .match-info-bar {
        background: #d1fae5;
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
        min-height: 90px;
        border-bottom: 1px solid #000;
        background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
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
        color: #059669;
      }
      
      .team-code {
        font-size: 12px;
        color: #666;
        margin-bottom: 8px;
      }
      
      .score-display {
        font-size: 36px;
        font-weight: bold;
        color: #047857;
        margin: 10px 0;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
      }
      
      .sets-section {
        padding: 10px;
        border-bottom: 1px solid #000;
        background: #f9fafb;
      }
      
      .sets-title {
        font-weight: bold;
        font-size: 12px;
        margin-bottom: 8px;
        text-align: center;
        color: #059669;
      }
      
      .sets-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 10px;
      }
      
      .sets-table th,
      .sets-table td {
        border: 1px solid #000;
        padding: 6px 8px;
        text-align: center;
        font-size: 11px;
      }
      
      .sets-table th {
        background: #059669;
        color: white;
        font-weight: bold;
      }
      
      .set-cell {
        width: 60px;
        font-weight: bold;
      }
      
      .won-sets-cell {
        background: #d1fae5;
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
        background: #059669;
        color: white;
        border-radius: 4px;
      }
      
      .rotation-display {
        margin-bottom: 15px;
        padding: 8px;
        background: #ecfdf5;
        border: 1px solid #10b981;
        border-radius: 4px;
        text-align: center;
      }
      
      .rotation-title {
        font-weight: bold;
        font-size: 10px;
        margin-bottom: 5px;
        color: #059669;
      }
      
      .rotation-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(2, 1fr);
        gap: 5px;
        max-width: 120px;
        margin: 0 auto;
      }
      
      .rotation-position {
        width: 35px;
        height: 25px;
        border: 1px solid #059669;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
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
        background: #d1fae5;
        font-weight: bold;
        text-align: center;
      }
      
      .player-number {
        text-align: center;
        font-weight: bold;
        width: 30px;
        background: #ecfdf5;
      }
      
      .player-name {
        width: 120px;
      }
      
      .player-position {
        width: 35px;
        text-align: center;
        font-weight: bold;
        color: #059669;
      }
      
      .player-stats {
        text-align: center;
        width: 25px;
      }
      
      .substitutes-section {
        margin-top: 15px;
        border-top: 2px solid #10b981;
        padding-top: 10px;
      }
      
      .substitutes-header {
        font-weight: bold;
        font-size: 11px;
        margin-bottom: 8px;
        text-align: center;
        background: #a7f3d0;
        padding: 4px;
        border: 1px solid #059669;
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
        color: #059669;
      }
      
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
      }
      
      .stat-category {
        border: 1px solid #a7f3d0;
        border-radius: 4px;
        padding: 8px;
        background: white;
      }
      
      .stat-category-title {
        font-weight: bold;
        font-size: 11px;
        margin-bottom: 8px;
        color: #059669;
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
        background: #d1fae5;
      }
      
      .officials-title {
        font-weight: bold;
        font-size: 12px;
        margin-bottom: 10px;
        text-align: center;
        color: #059669;
      }
      
      .officials-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
      }
      
      .official-block {
        text-align: center;
        padding: 8px;
        border: 1px solid #a7f3d0;
        border-radius: 4px;
        background: white;
      }
      
      .official-title {
        font-weight: bold;
        font-size: 10px;
        margin-bottom: 5px;
        color: #059669;
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
        border: 1px solid #a7f3d0;
        border-radius: 4px;
        background: #ecfdf5;
      }
      
      .signature-title {
        font-weight: bold;
        font-size: 10px;
        margin-bottom: 8px;
        color: #059669;
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
        .volleyball-scoresheet { 
          max-width: none;
          page-break-inside: avoid;
        }
      }
    `;
  }

  getVolleyballHTML(data, format) {
    const { match, tournament, teams, branding } = data;
    
    return `
      <div class="volleyball-scoresheet">
        ${branding.watermark?.enabled ? `<div class="watermark">${branding.watermark.text}</div>` : ''}
        
        <div class="content">
          <!-- Header -->
          <div class="header">
            🏐 ${tournament.name || 'VOLLEYBALL TOURNAMENT'}
            ${tournament.stage ? ` (${tournament.stage.toUpperCase()})` : ''}
            <div class="sport-logo">
              ${branding.logo ? `<img src="${branding.logo}" alt="Logo" style="max-width: 50px; max-height: 35px;">` : '🏐'}
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
              <div style="font-weight: bold;">Format</div>
              <div>Best of 5</div>
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
              <div class="score-display">${format === 'filled' || format === 'live' ? (teams[0]?.setsWon || 0) : ''}</div>
            </div>
            <div class="team-block">
              <div class="team-name">${teams[1]?.name || 'TEAM B'}</div>
              <div class="team-code">(${teams[1]?.code || 'TMB'})</div>
              <div class="score-display">${format === 'filled' || format === 'live' ? (teams[1]?.setsWon || 0) : ''}</div>
            </div>
          </div>

          <!-- Set Scores -->
          <div class="sets-section">
            <div class="sets-title">🏐 SET SCORES</div>
            <table class="sets-table">
              <thead>
                <tr>
                  <th>TEAM</th>
                  <th class="set-cell">SET 1</th>
                  <th class="set-cell">SET 2</th>
                  <th class="set-cell">SET 3</th>
                  <th class="set-cell">SET 4</th>
                  <th class="set-cell">SET 5</th>
                  <th class="won-sets-cell">SETS WON</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-weight: bold; background: #d1fae5;">${teams[0]?.name || 'TEAM A'}</td>
                  <td class="set-cell">${format === 'filled' ? (teams[0]?.sets?.[0] || '') : ''}</td>
                  <td class="set-cell">${format === 'filled' ? (teams[0]?.sets?.[1] || '') : ''}</td>
                  <td class="set-cell">${format === 'filled' ? (teams[0]?.sets?.[2] || '') : ''}</td>
                  <td class="set-cell">${format === 'filled' ? (teams[0]?.sets?.[3] || '') : ''}</td>
                  <td class="set-cell">${format === 'filled' ? (teams[0]?.sets?.[4] || '') : ''}</td>
                  <td class="won-sets-cell">${format === 'filled' ? (teams[0]?.setsWon || 0) : ''}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold; background: #d1fae5;">${teams[1]?.name || 'TEAM B'}</td>
                  <td class="set-cell">${format === 'filled' ? (teams[1]?.sets?.[0] || '') : ''}</td>
                  <td class="set-cell">${format === 'filled' ? (teams[1]?.sets?.[1] || '') : ''}</td>
                  <td class="set-cell">${format === 'filled' ? (teams[1]?.sets?.[2] || '') : ''}</td>
                  <td class="set-cell">${format === 'filled' ? (teams[1]?.sets?.[3] || '') : ''}</td>
                  <td class="set-cell">${format === 'filled' ? (teams[1]?.sets?.[4] || '') : ''}</td>
                  <td class="won-sets-cell">${format === 'filled' ? (teams[1]?.setsWon || 0) : ''}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Team Lineups -->
          <div class="lineups-section">
            ${teams.map((team, index) => this.renderVolleyballTeamLineup(team, index, format)).join('')}
          </div>

          <!-- Match Statistics -->
          <div class="stats-section">
            <div class="stats-title">🏐 MATCH STATISTICS & EVENTS</div>
            <div class="stats-grid">
              <div class="stat-category">
                <div class="stat-category-title">SUBSTITUTIONS</div>
                <div class="stat-lines">
                  ${Array(6).fill(0).map(() => `
                    <div class="stat-line">
                      <div class="stat-box"></div>
                      <div class="stat-label">Set: ___ Out: ___ In: ___</div>
                    </div>
                  `).join('')}
                </div>
              </div>
              
              <div class="stat-category">
                <div class="stat-category-title">TIMEOUTS</div>
                <div class="stat-lines">
                  ${Array(6).fill(0).map(() => `
                    <div class="stat-line">
                      <div class="stat-box"></div>
                      <div class="stat-label">Set: ___ Team: ___ Time: ___</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>

          <!-- Match Officials -->
          <div class="officials-section">
            <div class="officials-title">🏐 MATCH OFFICIALS</div>
            <div class="officials-grid">
              <div class="official-block">
                <div class="official-title">FIRST REFEREE</div>
                <div class="official-name">${match.firstReferee || ''}</div>
              </div>
              <div class="official-block">
                <div class="official-title">SECOND REFEREE</div>
                <div class="official-name">${match.secondReferee || ''}</div>
              </div>
            </div>
          </div>

          <!-- Signatures -->
          ${this.renderVolleyballSignatures(branding)}
        </div>
      </div>
    `;
  }

  // Standard method for template generation
  getHTML(data, format = 'blank') {
    return this.renderVolleyballScoresheet(data, { format });
  }

  renderVolleyballTeamLineup(team, index, format) {
    const teamName = team?.name || `TEAM ${index === 0 ? 'A' : 'B'}`;
    const teamCode = team?.code || (index === 0 ? 'TMA' : 'TMB');
    
    return `
      <div class="team-lineup">
        <div class="lineup-header">🏐 ${teamName} (${teamCode})</div>
        
        <!-- Rotation Display -->
        <div class="rotation-display">
          <div class="rotation-title">STARTING ROTATION</div>
          <div class="rotation-grid">
            <div class="rotation-position">4</div>
            <div class="rotation-position">3</div>
            <div class="rotation-position">2</div>
            <div class="rotation-position">5</div>
            <div class="rotation-position">6</div>
            <div class="rotation-position">1</div>
          </div>
        </div>
        
        <!-- Starting Six -->
        <table class="players-table">
          <thead>
            <tr>
              <th class="player-number">No.</th>
              <th class="player-position">Pos</th>
              <th class="player-name">Player Name</th>
              <th class="player-stats">Pts</th>
              <th class="player-stats">Att</th>
              <th class="player-stats">Blk</th>
              <th class="player-stats">Dig</th>
            </tr>
          </thead>
          <tbody>
            ${Array(6).fill(0).map((_, i) => `
              <tr>
                <td class="player-number">${i + 1}</td>
                <td class="player-position">${this.getDefaultVolleyballPosition(i)}</td>
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
              ${Array(6).fill(0).map((_, i) => `
                <tr>
                  <td class="player-number">${i + 7}</td>
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
        <div style="margin-top: 12px; padding: 8px; background: #d1fae5; border: 1px solid #a7f3d0; border-radius: 4px;">
          <div style="font-size: 10px; margin-bottom: 6px;"><strong>Head Coach:</strong> ${team?.coach || '________________________'}</div>
          <div style="font-size: 10px; margin-bottom: 6px;"><strong>Assistant Coach:</strong> ${team?.assistantCoach || '________________________'}</div>
          <div style="font-size: 10px;"><strong>Team Captain:</strong> ${team?.captain || '________________________'}</div>
        </div>
      </div>
    `;
  }

  getDefaultVolleyballPosition(index) {
    const positions = ['S', 'OH', 'MB', 'OH', 'MB', 'L'];
    return positions[index] || 'P';
  }

  renderVolleyballSignatures(branding) {
    return `
      <div class="signatures-section">
        <div class="signatures-grid">
          <div class="signature-block">
            <div class="signature-title">FIRST REFEREE</div>
            <div class="signature-line"></div>
            <div class="signature-name">Name & Signature</div>
          </div>
          <div class="signature-block">
            <div class="signature-title">SECOND REFEREE</div>
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
}

export default VolleyballTemplateService;
