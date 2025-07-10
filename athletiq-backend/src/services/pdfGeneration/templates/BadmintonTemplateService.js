// Backend Badminton Template Service
class BadmintonTemplateService {
  constructor() {
    this.sportName = 'Badminton';
    this.matchDuration = 'Best of 3 games';
    this.teamSize = 1; // Singles, 2 for doubles
    this.substitutes = 0;
    this.name = 'BWF Style Badminton Template';
    this.description = 'Professional badminton scoresheet template based on BWF format';
  }

  getHTML(data, format = 'blank') {
    const { match, tournament, teams, branding } = data;
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Badminton Match ${match.id} Scoresheet</title>
        <style>
          ${this.getBadmintonCSS()}
        </style>
      </head>
      <body>
        <div class="badminton-scoresheet">
          <!-- Header -->
          <div class="header">
            🏸 ${tournament.name || 'BADMINTON TOURNAMENT'}
            ${tournament.stage ? ` (${tournament.stage.toUpperCase()})` : ''}
          </div>

          <!-- Match Info -->
          <div class="match-info">
            <div class="info-grid">
              <div><strong>Match:</strong> ${match.id || 'TBD'}</div>
              <div><strong>Date:</strong> ${match.date || 'TBD'}</div>
              <div><strong>Court:</strong> ${match.court || 'TBD'}</div>
              <div><strong>Round:</strong> ${match.round || 'TBD'}</div>
            </div>
            <div class="info-grid">
              <div><strong>Start Time:</strong> ${match.startTime || 'TBD'}</div>
              <div><strong>End Time:</strong> ${match.endTime || 'TBD'}</div>
              <div><strong>Duration:</strong> ${match.duration || 'TBD'}</div>
              <div><strong>Shuttle:</strong> ${match.shuttle || 'Feather'}</div>
            </div>
          </div>

          <!-- Players/Pairs -->
          <div class="players-section">
            <div class="player-block">
              <div class="player-name">${teams[0]?.name || 'PLAYER/PAIR A'}</div>
              <div class="player-details">
                ${teams[0]?.players ? teams[0].players.map(p => `<div>${p.name} (${p.country || 'TBD'})</div>`).join('') : '<div>Player Name (Country)</div>'}
              </div>
              <div class="ranking">Ranking: ${teams[0]?.ranking || 'TBD'}</div>
            </div>
            <div class="vs">VS</div>
            <div class="player-block">
              <div class="player-name">${teams[1]?.name || 'PLAYER/PAIR B'}</div>
              <div class="player-details">
                ${teams[1]?.players ? teams[1].players.map(p => `<div>${p.name} (${p.country || 'TBD'})</div>`).join('') : '<div>Player Name (Country)</div>'}
              </div>
              <div class="ranking">Ranking: ${teams[1]?.ranking || 'TBD'}</div>
            </div>
          </div>

          <!-- Score Summary -->
          <div class="score-summary">
            <h4>MATCH SCORE</h4>
            <table class="score-table">
              <thead>
                <tr>
                  <th>Player/Pair</th>
                  <th>Game 1</th>
                  <th>Game 2</th>
                  <th>Game 3</th>
                  <th>Games Won</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-weight: bold;">${teams[0]?.name || 'PLAYER/PAIR A'}</td>
                  <td></td><td></td><td></td>
                  <td style="background: #ff9800; color: white; font-weight: bold;"></td>
                </tr>
                <tr>
                  <td style="font-weight: bold;">${teams[1]?.name || 'PLAYER/PAIR B'}</td>
                  <td></td><td></td><td></td>
                  <td style="background: #ff9800; color: white; font-weight: bold;"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Detailed Game Scores -->
          <div class="games-detail">
            <h4>GAME DETAILS</h4>
            ${Array(3).fill(0).map((_, gameIndex) => this.renderGameDetail(gameIndex + 1, teams)).join('')}
          </div>

          <!-- Service Order -->
          <div class="service-section">
            <h4>SERVICE ORDER</h4>
            <div class="service-grid">
              <div class="service-block">
                <h5>Game 1</h5>
                <div class="service-info">
                  <div>First Serve: ${teams[0]?.name || 'PLAYER/PAIR A'}</div>
                  <div>Service Court: Right</div>
                </div>
              </div>
              <div class="service-block">
                <h5>Game 2</h5>
                <div class="service-info">
                  <div>First Serve: ${teams[1]?.name || 'PLAYER/PAIR B'}</div>
                  <div>Service Court: Right</div>
                </div>
              </div>
              <div class="service-block">
                <h5>Game 3</h5>
                <div class="service-info">
                  <div>First Serve: TBD (Winner of Game 1)</div>
                  <div>Service Court: Right</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Timeouts & Intervals -->
          <div class="timeouts-section">
            <h4>TIMEOUTS & INTERVALS</h4>
            <table class="timeouts-table">
              <thead>
                <tr>
                  <th>Game</th>
                  <th>Type</th>
                  <th>Time</th>
                  <th>Score</th>
                  <th>Player/Pair</th>
                </tr>
              </thead>
              <tbody>
                ${Array(6).fill(0).map(() => '<tr><td></td><td></td><td></td><td></td><td></td></tr>').join('')}
              </tbody>
            </table>
          </div>

          <!-- Officials -->
          <div class="officials-section">
            <h4>🏸 MATCH OFFICIALS</h4>
            <div class="officials-grid">
              <div class="official">
                <label>Umpire:</label>
                <div class="signature-line">${match.umpire || ''}</div>
              </div>
              <div class="official">
                <label>Service Judge:</label>
                <div class="signature-line">${match.serviceJudge || ''}</div>
              </div>
              <div class="official">
                <label>Line Judge 1:</label>
                <div class="signature-line">${match.lineJudge1 || ''}</div>
              </div>
              <div class="official">
                <label>Line Judge 2:</label>
                <div class="signature-line">${match.lineJudge2 || ''}</div>
              </div>
            </div>
          </div>

          <!-- Signatures -->
          <div class="signatures-section">
            <div class="signatures-grid">
              <div class="signature-block">
                <div class="signature-title">UMPIRE SIGNATURE</div>
                <div class="signature-line"></div>
                <div class="signature-name">Name & Signature</div>
              </div>
              <div class="signature-block">
                <div class="signature-title">PLAYER/PAIR A</div>
                <div class="signature-line"></div>
                <div class="signature-name">Name & Signature</div>
              </div>
              <div class="signature-block">
                <div class="signature-title">PLAYER/PAIR B</div>
                <div class="signature-line"></div>
                <div class="signature-name">Name & Signature</div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getBadmintonCSS() {
    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; font-size: 11px; padding: 15px; }
      .badminton-scoresheet { max-width: 800px; margin: 0 auto; border: 2px solid #000; }
      .header { background: #ff9800; color: white; padding: 12px; text-align: center; font-size: 16px; font-weight: bold; }
      .match-info { padding: 12px; background: #fff3e0; border-bottom: 1px solid #000; }
      .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 8px; }
      .info-grid:last-child { margin-bottom: 0; }
      .players-section { display: flex; align-items: center; padding: 20px; background: #fff; border-bottom: 1px solid #000; }
      .player-block { flex: 1; text-align: center; }
      .player-name { font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #ff9800; }
      .player-details div { font-size: 12px; margin-bottom: 3px; }
      .ranking { font-size: 11px; color: #666; margin-top: 5px; }
      .vs { margin: 0 30px; font-size: 20px; font-weight: bold; }
      .score-summary { padding: 15px; }
      .score-summary h4 { margin-bottom: 10px; color: #ff9800; text-align: center; }
      .score-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
      .score-table th, .score-table td { border: 1px solid #000; padding: 8px; text-align: center; font-size: 12px; }
      .score-table th { background: #fff3e0; font-weight: bold; }
      .games-detail { padding: 15px; border-top: 1px solid #000; }
      .games-detail h4 { margin-bottom: 15px; color: #ff9800; text-align: center; }
      .game-block { margin-bottom: 15px; border: 1px solid #ccc; padding: 10px; }
      .game-header { font-weight: bold; margin-bottom: 8px; background: #fff3e0; padding: 5px; text-align: center; }
      .points-table { width: 100%; border-collapse: collapse; }
      .points-table th, .points-table td { border: 1px solid #000; padding: 3px; text-align: center; font-size: 9px; }
      .points-table th { background: #f5f5f5; }
      .service-section { padding: 15px; border-top: 1px solid #000; background: #f9f9f9; }
      .service-section h4 { margin-bottom: 15px; color: #ff9800; text-align: center; }
      .service-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
      .service-block { border: 1px solid #ccc; padding: 10px; background: white; }
      .service-block h5 { margin-bottom: 8px; color: #ff9800; text-align: center; }
      .service-info div { margin-bottom: 5px; font-size: 10px; }
      .timeouts-section { padding: 15px; border-top: 1px solid #000; }
      .timeouts-section h4 { margin-bottom: 10px; color: #ff9800; text-align: center; }
      .timeouts-table { width: 100%; border-collapse: collapse; }
      .timeouts-table th, .timeouts-table td { border: 1px solid #000; padding: 6px; text-align: center; font-size: 10px; }
      .timeouts-table th { background: #fff3e0; }
      .officials-section { padding: 15px; border-top: 1px solid #000; }
      .officials-section h4 { margin-bottom: 15px; text-align: center; color: #ff9800; }
      .officials-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 15px; }
      .official label { font-weight: bold; display: block; margin-bottom: 5px; }
      .signature-line { border-bottom: 1px solid #000; height: 25px; padding: 3px; background: white; }
      .signatures-section { margin-top: 15px; padding-top: 15px; border-top: 1px solid #000; }
      .signatures-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
      .signature-block { text-align: center; }
      .signature-title { font-weight: bold; font-size: 10px; margin-bottom: 8px; color: #ff9800; }
      .signature-name { font-size: 9px; color: #666; margin-top: 5px; }
    `;
  }

  renderGameDetail(gameNumber, teams) {
    return `
      <div class="game-block">
        <div class="game-header">GAME ${gameNumber}</div>
        <table class="points-table">
          <thead>
            <tr>
              <th>Player/Pair</th>
              ${Array(21).fill(0).map((_, i) => `<th>${i + 1}</th>`).join('')}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="font-weight: bold;">${teams[0]?.name || 'PLAYER/PAIR A'}</td>
              ${Array(22).fill(0).map(() => '<td></td>').join('')}
            </tr>
            <tr>
              <td style="font-weight: bold;">${teams[1]?.name || 'PLAYER/PAIR B'}</td>
              ${Array(22).fill(0).map(() => '<td></td>').join('')}
            </tr>
          </tbody>
        </table>
        <div style="margin-top: 8px; font-size: 10px;">
          <strong>Interval (11 points):</strong> _____ : _____ | <strong>Winner:</strong> _____________________
        </div>
      </div>
    `;
  }
}

module.exports = BadmintonTemplateService;
