// Backend Basketball Template Service
class BasketballTemplateService {
  constructor() {
    this.sportName = 'Basketball';
    this.matchDuration = '48 minutes';
    this.teamSize = 5;
    this.substitutes = 7;
    this.name = 'NBA/FIBA Style Basketball Template';
    this.description = 'Professional basketball scoresheet template based on NBA/FIBA format';
  }

  getHTML(data, format = 'blank') {
    const { match, tournament, teams, branding } = data;
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Basketball Match ${match.id} Scoresheet</title>
        <style>
          ${this.getBasketballCSS()}
        </style>
      </head>
      <body>
        <div class="basketball-scoresheet">
          <!-- Header -->
          <div class="header">
            🏀 ${tournament.name || 'BASKETBALL TOURNAMENT'}
            ${tournament.stage ? ` (${tournament.stage.toUpperCase()})` : ''}
          </div>

          <!-- Match Info -->
          <div class="match-info">
            <div class="info-row">
              <span><strong>Match:</strong> ${match.id || 'TBD'}</span>
              <span><strong>Date:</strong> ${match.date || 'TBD'}</span>
              <span><strong>Time:</strong> ${match.time || 'TBD'}</span>
              <span><strong>Venue:</strong> ${match.venue || 'TBD'}</span>
            </div>
          </div>

          <!-- Teams and Score -->
          <div class="teams-section">
            <div class="team-block">
              <h3>${teams[0]?.name || 'TEAM A'}</h3>
              <div class="score">${format === 'filled' ? (teams[0]?.score || 0) : ''}</div>
            </div>
            <div class="vs">VS</div>
            <div class="team-block">
              <h3>${teams[1]?.name || 'TEAM B'}</h3>
              <div class="score">${format === 'filled' ? (teams[1]?.score || 0) : ''}</div>
            </div>
          </div>

          <!-- Quarter Scores -->
          <div class="quarters-section">
            <h4>QUARTER SCORES</h4>
            <table class="quarters-table">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Q1</th>
                  <th>Q2</th>
                  <th>Q3</th>
                  <th>Q4</th>
                  <th>OT</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${teams[0]?.name || 'TEAM A'}</td>
                  <td></td><td></td><td></td><td></td><td></td><td></td>
                </tr>
                <tr>
                  <td>${teams[1]?.name || 'TEAM B'}</td>
                  <td></td><td></td><td></td><td></td><td></td><td></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Players -->
          <div class="players-section">
            ${teams.map((team, index) => this.renderTeamRoster(team, index)).join('')}
          </div>

          <!-- Officials -->
          <div class="officials-section">
            <h4>🏀 GAME OFFICIALS</h4>
            <div class="officials-grid">
              <div class="official">
                <label>Referee 1:</label>
                <div class="signature-line"></div>
              </div>
              <div class="official">
                <label>Referee 2:</label>
                <div class="signature-line"></div>
              </div>
              <div class="official">
                <label>Scorer:</label>
                <div class="signature-line"></div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getBasketballCSS() {
    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
      .basketball-scoresheet { max-width: 800px; margin: 0 auto; border: 2px solid #000; }
      .header { background: #ff6600; color: white; padding: 15px; text-align: center; font-size: 18px; font-weight: bold; }
      .match-info { padding: 10px; background: #f5f5f5; border-bottom: 1px solid #000; }
      .info-row { display: flex; justify-content: space-between; }
      .teams-section { display: flex; align-items: center; padding: 20px; background: #fff; border-bottom: 1px solid #000; }
      .team-block { flex: 1; text-align: center; }
      .team-block h3 { font-size: 20px; margin-bottom: 10px; color: #ff6600; }
      .score { font-size: 48px; font-weight: bold; color: #000; }
      .vs { margin: 0 30px; font-size: 24px; font-weight: bold; }
      .quarters-section { padding: 15px; }
      .quarters-section h4 { margin-bottom: 10px; color: #ff6600; }
      .quarters-table { width: 100%; border-collapse: collapse; }
      .quarters-table th, .quarters-table td { border: 1px solid #000; padding: 8px; text-align: center; }
      .quarters-table th { background: #f5f5f5; }
      .players-section { display: flex; }
      .team-roster { flex: 1; padding: 15px; border-right: 1px solid #000; }
      .team-roster:last-child { border-right: none; }
      .roster-header { background: #ff6600; color: white; padding: 8px; text-align: center; font-weight: bold; margin-bottom: 10px; }
      .players-table { width: 100%; border-collapse: collapse; }
      .players-table th, .players-table td { border: 1px solid #000; padding: 5px; font-size: 10px; }
      .players-table th { background: #f5f5f5; text-align: center; }
      .officials-section { padding: 15px; border-top: 1px solid #000; }
      .officials-section h4 { margin-bottom: 15px; text-align: center; color: #ff6600; }
      .officials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
      .official label { font-weight: bold; display: block; margin-bottom: 5px; }
      .signature-line { border-bottom: 2px solid #000; height: 30px; }
    `;
  }

  renderTeamRoster(team, index) {
    const teamName = team?.name || `TEAM ${index === 0 ? 'A' : 'B'}`;
    
    return `
      <div class="team-roster">
        <div class="roster-header">${teamName} ROSTER</div>
        <table class="players-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Player Name</th>
              <th>Pos</th>
              <th>PTS</th>
              <th>REB</th>
              <th>AST</th>
              <th>PF</th>
            </tr>
          </thead>
          <tbody>
            ${Array(12).fill(0).map((_, i) => `
              <tr>
                <td style="text-align: center; font-weight: bold;">${i + 1}</td>
                <td>${team?.players?.[i]?.name || ''}</td>
                <td style="text-align: center;">${this.getDefaultPosition(i)}</td>
                <td style="text-align: center;"></td>
                <td style="text-align: center;"></td>
                <td style="text-align: center;"></td>
                <td style="text-align: center;"></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="margin-top: 10px; font-size: 10px;">
          <strong>Head Coach:</strong> ${team?.coach || '_______________________'}
        </div>
      </div>
    `;
  }

  getDefaultPosition(index) {
    const positions = ['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F', 'G', 'F', 'C', 'G', 'F'];
    return positions[index] || 'F';
  }
}

module.exports = BasketballTemplateService;
