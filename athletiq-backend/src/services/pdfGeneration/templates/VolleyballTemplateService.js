// Backend Volleyball Template Service
class VolleyballTemplateService {
  constructor() {
    this.sportName = 'Volleyball';
    this.matchDuration = '5 sets max';
    this.teamSize = 6;
    this.substitutes = 6;
    this.name = 'FIVB Style Volleyball Template';
    this.description = 'Professional volleyball scoresheet template based on FIVB format';
  }

  getHTML(data, format = 'blank') {
    const { match, tournament, teams, branding } = data;
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Volleyball Match ${match.id} Scoresheet</title>
        <style>
          ${this.getVolleyballCSS()}
        </style>
      </head>
      <body>
        <div class="volleyball-scoresheet">
          <!-- Header -->
          <div class="header">
            🏐 ${tournament.name || 'VOLLEYBALL TOURNAMENT'}
            ${tournament.stage ? ` (${tournament.stage.toUpperCase()})` : ''}
          </div>

          <!-- Match Info -->
          <div class="match-info">
            <div class="info-grid">
              <div><strong>Match:</strong> ${match.id || 'TBD'}</div>
              <div><strong>Date:</strong> ${match.date || 'TBD'}</div>
              <div><strong>Time:</strong> ${match.time || 'TBD'}</div>
              <div><strong>Venue:</strong> ${match.venue || 'TBD'}</div>
            </div>
          </div>

          <!-- Teams -->
          <div class="teams-section">
            <div class="team-block">
              <h3>${teams[0]?.name || 'TEAM A'}</h3>
              <div class="team-code">(${teams[0]?.code || 'TMA'})</div>
            </div>
            <div class="vs">VS</div>
            <div class="team-block">
              <h3>${teams[1]?.name || 'TEAM B'}</h3>
              <div class="team-code">(${teams[1]?.code || 'TMB'})</div>
            </div>
          </div>

          <!-- Set Scores -->
          <div class="sets-section">
            <h4>SET SCORES</h4>
            <table class="sets-table">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Set 1</th>
                  <th>Set 2</th>
                  <th>Set 3</th>
                  <th>Set 4</th>
                  <th>Set 5</th>
                  <th>Sets Won</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-weight: bold;">${teams[0]?.name || 'TEAM A'}</td>
                  <td></td><td></td><td></td><td></td><td></td>
                  <td style="background: #4caf50; color: white; font-weight: bold;"></td>
                </tr>
                <tr>
                  <td style="font-weight: bold;">${teams[1]?.name || 'TEAM B'}</td>
                  <td></td><td></td><td></td><td></td><td></td>
                  <td style="background: #4caf50; color: white; font-weight: bold;"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Players -->
          <div class="players-section">
            ${teams.map((team, index) => this.renderTeamLineup(team, index)).join('')}
          </div>

          <!-- Substitutions & Timeouts -->
          <div class="game-events">
            <div class="substitutions">
              <h4>SUBSTITUTIONS</h4>
              <table class="events-table">
                <thead>
                  <tr><th>Set</th><th>Time</th><th>Team</th><th>Out</th><th>In</th></tr>
                </thead>
                <tbody>
                  ${Array(8).fill(0).map(() => '<tr><td></td><td></td><td></td><td></td><td></td></tr>').join('')}
                </tbody>
              </table>
            </div>
            <div class="timeouts">
              <h4>TIMEOUTS</h4>
              <table class="events-table">
                <thead>
                  <tr><th>Set</th><th>Time</th><th>Team</th><th>Type</th></tr>
                </thead>
                <tbody>
                  ${Array(8).fill(0).map(() => '<tr><td></td><td></td><td></td><td></td></tr>').join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Officials -->
          <div class="officials-section">
            <h4>🏐 MATCH OFFICIALS</h4>
            <div class="officials-grid">
              <div class="official">
                <label>1st Referee:</label>
                <div class="signature-line">${match.referee1 || ''}</div>
              </div>
              <div class="official">
                <label>2nd Referee:</label>
                <div class="signature-line">${match.referee2 || ''}</div>
              </div>
              <div class="official">
                <label>Scorer:</label>
                <div class="signature-line">${match.scorer || ''}</div>
              </div>
              <div class="official">
                <label>Assistant Scorer:</label>
                <div class="signature-line">${match.assistantScorer || ''}</div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getVolleyballCSS() {
    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; font-size: 11px; padding: 15px; }
      .volleyball-scoresheet { max-width: 800px; margin: 0 auto; border: 2px solid #000; }
      .header { background: #2196f3; color: white; padding: 12px; text-align: center; font-size: 16px; font-weight: bold; }
      .match-info { padding: 10px; background: #e3f2fd; border-bottom: 1px solid #000; }
      .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
      .teams-section { display: flex; align-items: center; padding: 20px; background: #fff; border-bottom: 1px solid #000; }
      .team-block { flex: 1; text-align: center; }
      .team-block h3 { font-size: 18px; margin-bottom: 5px; color: #2196f3; }
      .team-code { font-size: 12px; color: #666; }
      .vs { margin: 0 30px; font-size: 20px; font-weight: bold; }
      .sets-section { padding: 15px; }
      .sets-section h4 { margin-bottom: 10px; color: #2196f3; text-align: center; }
      .sets-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
      .sets-table th, .sets-table td { border: 1px solid #000; padding: 8px; text-align: center; font-size: 12px; }
      .sets-table th { background: #e3f2fd; font-weight: bold; }
      .players-section { display: flex; }
      .team-lineup { flex: 1; padding: 12px; border-right: 1px solid #000; }
      .team-lineup:last-child { border-right: none; }
      .lineup-header { background: #2196f3; color: white; padding: 6px; text-align: center; font-weight: bold; margin-bottom: 8px; }
      .players-table { width: 100%; border-collapse: collapse; }
      .players-table th, .players-table td { border: 1px solid #000; padding: 4px; font-size: 10px; }
      .players-table th { background: #e3f2fd; text-align: center; font-weight: bold; }
      .game-events { display: flex; padding: 15px; gap: 20px; border-top: 1px solid #000; }
      .substitutions, .timeouts { flex: 1; }
      .game-events h4 { margin-bottom: 8px; color: #2196f3; text-align: center; }
      .events-table { width: 100%; border-collapse: collapse; }
      .events-table th, .events-table td { border: 1px solid #000; padding: 4px; text-align: center; font-size: 9px; }
      .events-table th { background: #e3f2fd; }
      .officials-section { padding: 15px; border-top: 1px solid #000; background: #f5f5f5; }
      .officials-section h4 { margin-bottom: 15px; text-align: center; color: #2196f3; }
      .officials-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
      .official label { font-weight: bold; display: block; margin-bottom: 5px; }
      .signature-line { border-bottom: 1px solid #000; height: 25px; padding: 3px; background: white; }
    `;
  }

  renderTeamLineup(team, index) {
    const teamName = team?.name || `TEAM ${index === 0 ? 'A' : 'B'}`;
    
    return `
      <div class="team-lineup">
        <div class="lineup-header">${teamName} LINEUP</div>
        <table class="players-table">
          <thead>
            <tr>
              <th style="width: 30px;">#</th>
              <th>Player Name</th>
              <th style="width: 40px;">Pos</th>
              <th style="width: 25px;">C</th>
              <th style="width: 25px;">L</th>
            </tr>
          </thead>
          <tbody>
            ${Array(12).fill(0).map((_, i) => `
              <tr>
                <td style="text-align: center; font-weight: bold;">${i + 1}</td>
                <td>${team?.players?.[i]?.name || ''}</td>
                <td style="text-align: center;">${this.getDefaultPosition(i)}</td>
                <td style="text-align: center;">${i === 0 ? 'C' : ''}</td>
                <td style="text-align: center;">${i === 1 ? 'L' : ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="margin-top: 8px; font-size: 9px;">
          <div><strong>Head Coach:</strong> ${team?.coach || '_____________________'}</div>
          <div style="margin-top: 3px;"><strong>Assistant:</strong> ${team?.assistantCoach || '_____________________'}</div>
        </div>
      </div>
    `;
  }

  getDefaultPosition(index) {
    const positions = ['OH', 'S', 'MB', 'OP', 'L', 'OH', 'MB', 'OH', 'S', 'MB', 'OP', 'L'];
    return positions[index] || 'OH';
  }
}

module.exports = VolleyballTemplateService;
