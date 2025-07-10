// Backend Tennis Template Service
class TennisTemplateService {
  constructor() {
    this.sportName = 'Tennis';
    this.matchDuration = 'Best of 3/5 sets';
    this.teamSize = 1; // Singles
    this.substitutes = 0;
    this.name = 'ATP/WTA Style Tennis Template';
    this.description = 'Professional tennis scoresheet template based on ATP/WTA format';
  }

  getHTML(data, format = 'blank') {
    const { match, tournament, teams, branding } = data;
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tennis Match ${match.id} Scoresheet</title>
        <style>
          ${this.getTennisCSS()}
        </style>
      </head>
      <body>
        <div class="tennis-scoresheet">
          <!-- Header -->
          <div class="header">
            🎾 ${tournament.name || 'TENNIS TOURNAMENT'}
            ${tournament.stage ? ` (${tournament.stage.toUpperCase()})` : ''}
          </div>

          <!-- Match Info -->
          <div class="match-info">
            <div class="info-row">
              <span><strong>Match:</strong> ${match.id || 'TBD'}</span>
              <span><strong>Date:</strong> ${match.date || 'TBD'}</span>
              <span><strong>Court:</strong> ${match.court || 'TBD'}</span>
              <span><strong>Surface:</strong> ${match.surface || 'Hard'}</span>
            </div>
            <div class="info-row">
              <span><strong>Start Time:</strong> ${match.startTime || 'TBD'}</span>
              <span><strong>End Time:</strong> ${match.endTime || 'TBD'}</span>
              <span><strong>Duration:</strong> ${match.duration || 'TBD'}</span>
              <span><strong>Weather:</strong> ${match.weather || 'Clear'}</span>
            </div>
          </div>

          <!-- Players -->
          <div class="players-section">
            <div class="player-block">
              <div class="player-name">${teams[0]?.name || 'PLAYER A'}</div>
              <div class="player-info">
                <div>Ranking: ${teams[0]?.ranking || 'TBD'}</div>
                <div>Country: ${teams[0]?.country || 'TBD'}</div>
              </div>
            </div>
            <div class="vs">VS</div>
            <div class="player-block">
              <div class="player-name">${teams[1]?.name || 'PLAYER B'}</div>
              <div class="player-info">
                <div>Ranking: ${teams[1]?.ranking || 'TBD'}</div>
                <div>Country: ${teams[1]?.country || 'TBD'}</div>
              </div>
            </div>
          </div>

          <!-- Score Summary -->
          <div class="score-summary">
            <h4>MATCH SCORE</h4>
            <table class="score-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Set 1</th>
                  <th>Set 2</th>
                  <th>Set 3</th>
                  <th>Set 4</th>
                  <th>Set 5</th>
                  <th>Sets</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-weight: bold;">${teams[0]?.name || 'PLAYER A'}</td>
                  <td></td><td></td><td></td><td></td><td></td>
                  <td style="background: #4caf50; color: white; font-weight: bold;"></td>
                </tr>
                <tr>
                  <td style="font-weight: bold;">${teams[1]?.name || 'PLAYER B'}</td>
                  <td></td><td></td><td></td><td></td><td></td>
                  <td style="background: #4caf50; color: white; font-weight: bold;"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Detailed Set Scores -->
          <div class="sets-detail">
            <h4>SET DETAILS</h4>
            ${Array(5).fill(0).map((_, setIndex) => this.renderSetDetail(setIndex + 1, teams)).join('')}
          </div>

          <!-- Match Statistics -->
          <div class="statistics">
            <h4>MATCH STATISTICS</h4>
            <div class="stats-grid">
              <div class="stat-category">
                <h5>Serving</h5>
                <table class="stats-table">
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Aces</th>
                      <th>DFs</th>
                      <th>1st Serve %</th>
                      <th>1st Serve Won</th>
                      <th>2nd Serve Won</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>${teams[0]?.name || 'PLAYER A'}</td>
                      <td></td><td></td><td></td><td></td><td></td>
                    </tr>
                    <tr>
                      <td>${teams[1]?.name || 'PLAYER B'}</td>
                      <td></td><td></td><td></td><td></td><td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="stat-category">
                <h5>Returning</h5>
                <table class="stats-table">
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>1st Return Won</th>
                      <th>2nd Return Won</th>
                      <th>Break Points</th>
                      <th>Break Points Won</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>${teams[0]?.name || 'PLAYER A'}</td>
                      <td></td><td></td><td></td><td></td>
                    </tr>
                    <tr>
                      <td>${teams[1]?.name || 'PLAYER B'}</td>
                      <td></td><td></td><td></td><td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Officials -->
          <div class="officials-section">
            <h4>🎾 MATCH OFFICIALS</h4>
            <div class="officials-grid">
              <div class="official">
                <label>Umpire:</label>
                <div class="signature-line">${match.umpire || ''}</div>
              </div>
              <div class="official">
                <label>Line Judge 1:</label>
                <div class="signature-line">${match.lineJudge1 || ''}</div>
              </div>
              <div class="official">
                <label>Line Judge 2:</label>
                <div class="signature-line">${match.lineJudge2 || ''}</div>
              </div>
              <div class="official">
                <label>Ball Kids Supervisor:</label>
                <div class="signature-line">${match.ballKidsSupervisor || ''}</div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getTennisCSS() {
    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; font-size: 11px; padding: 15px; }
      .tennis-scoresheet { max-width: 800px; margin: 0 auto; border: 2px solid #000; }
      .header { background: #1b5e20; color: white; padding: 12px; text-align: center; font-size: 16px; font-weight: bold; }
      .match-info { padding: 12px; background: #e8f5e9; border-bottom: 1px solid #000; }
      .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
      .info-row:last-child { margin-bottom: 0; }
      .players-section { display: flex; align-items: center; padding: 20px; background: #fff; border-bottom: 1px solid #000; }
      .player-block { flex: 1; text-align: center; }
      .player-name { font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1b5e20; }
      .player-info div { font-size: 12px; margin-bottom: 3px; }
      .vs { margin: 0 30px; font-size: 20px; font-weight: bold; }
      .score-summary { padding: 15px; }
      .score-summary h4 { margin-bottom: 10px; color: #1b5e20; text-align: center; }
      .score-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
      .score-table th, .score-table td { border: 1px solid #000; padding: 8px; text-align: center; font-size: 12px; }
      .score-table th { background: #e8f5e9; font-weight: bold; }
      .sets-detail { padding: 15px; border-top: 1px solid #000; }
      .sets-detail h4 { margin-bottom: 15px; color: #1b5e20; text-align: center; }
      .set-block { margin-bottom: 15px; border: 1px solid #ccc; padding: 10px; }
      .set-header { font-weight: bold; margin-bottom: 8px; background: #e8f5e9; padding: 5px; text-align: center; }
      .games-table { width: 100%; border-collapse: collapse; }
      .games-table th, .games-table td { border: 1px solid #000; padding: 4px; text-align: center; font-size: 10px; }
      .games-table th { background: #f5f5f5; }
      .statistics { padding: 15px; border-top: 1px solid #000; background: #f9f9f9; }
      .statistics h4 { margin-bottom: 15px; color: #1b5e20; text-align: center; }
      .stats-grid { display: flex; flex-direction: column; gap: 15px; }
      .stat-category h5 { margin-bottom: 8px; color: #1b5e20; }
      .stats-table { width: 100%; border-collapse: collapse; }
      .stats-table th, .stats-table td { border: 1px solid #000; padding: 6px; text-align: center; font-size: 10px; }
      .stats-table th { background: #e8f5e9; }
      .officials-section { padding: 15px; border-top: 1px solid #000; }
      .officials-section h4 { margin-bottom: 15px; text-align: center; color: #1b5e20; }
      .officials-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
      .official label { font-weight: bold; display: block; margin-bottom: 5px; }
      .signature-line { border-bottom: 1px solid #000; height: 25px; padding: 3px; background: white; }
    `;
  }

  renderSetDetail(setNumber, teams) {
    return `
      <div class="set-block">
        <div class="set-header">SET ${setNumber}</div>
        <table class="games-table">
          <thead>
            <tr>
              <th>Player</th>
              ${Array(12).fill(0).map((_, i) => `<th>${i + 1}</th>`).join('')}
              <th>TB</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="font-weight: bold;">${teams[0]?.name || 'PLAYER A'}</td>
              ${Array(14).fill(0).map(() => '<td></td>').join('')}
            </tr>
            <tr>
              <td style="font-weight: bold;">${teams[1]?.name || 'PLAYER B'}</td>
              ${Array(14).fill(0).map(() => '<td></td>').join('')}
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }
}

module.exports = TennisTemplateService;
