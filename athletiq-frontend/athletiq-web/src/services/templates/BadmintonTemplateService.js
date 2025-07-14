// src/services/templates/BadmintonTemplateService.js
class BadmintonTemplateService {
  constructor() {
    this.sport = 'badminton';
    this.matchFormat = 'Best of 3 games';
    this.teamSize = 1; // Singles (can be 2 for doubles)
    this.scoringSystem = 'games';
    this.pointsPerGame = 21;
  }

  // Generate HTML template for badminton
  getHTML(data, format) {
    const { match, tournament, teams, branding } = data;
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Badminton Match ${match.id} Scoresheet</title>
        <style>
          ${this.getCSS(branding)}
        </style>
      </head>
      <body>
        <div class="match-summary">
          ${branding.watermark?.enabled ? `<div class="watermark">${branding.watermark.text}</div>` : ''}
          
          <div class="content">
            <!-- Header -->
            <div class="header">
              ${tournament.name || 'BADMINTON TOURNAMENT'}
              ${tournament.stage ? ` (${tournament.stage.toUpperCase()})` : ''}
              <div class="tournament-logo">
                ${branding.logo ? `<img src="${branding.logo}" alt="Logo" style="max-width: 50px; max-height: 35px;">` : 'LOGO'}
              </div>
            </div>

            <!-- Match Information -->
            <div class="match-info-bar">
              <div class="match-info-cell">
                <div><strong>Match:</strong> ${match.id || 'TBD'}</div>
              </div>
              <div class="match-info-cell">
                <div><strong>Date:</strong> ${match.date || 'TBD'}</div>
              </div>
              <div class="match-info-cell">
                <div><strong>Time:</strong> ${match.time || 'TBD'}</div>
              </div>
              <div class="match-info-cell">
                <div><strong>Court:</strong> ${match.venue || 'TBD'}</div>
              </div>
              <div class="match-info-cell">
                <div><strong>Category:</strong> ${match.category || 'Singles'}</div>
              </div>
            </div>

            <!-- Players Section -->
            <div class="players-section">
              <div class="player-block">
                <div class="player-name">${teams[0]?.name || 'Player 1'}</div>
                <div class="player-school">${teams[0]?.school || 'School A'}</div>
                <div class="player-details">
                  <div>Age: ${teams[0]?.age || '_____'}</div>
                  <div>Category: ${teams[0]?.category || '_____'}</div>
                </div>
              </div>
              <div class="vs-divider">VS</div>
              <div class="player-block">
                <div class="player-name">${teams[1]?.name || 'Player 2'}</div>
                <div class="player-school">${teams[1]?.school || 'School B'}</div>
                <div class="player-details">
                  <div>Age: ${teams[1]?.age || '_____'}</div>
                  <div>Category: ${teams[1]?.category || '_____'}</div>
                </div>
              </div>
            </div>

            <!-- Score Card -->
            <div class="score-card">
              <table class="score-table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Game 1</th>
                    <th>Game 2</th>
                    <th>Game 3</th>
                    <th>Games Won</th>
                    <th>Winner</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="player-name-cell">${teams[0]?.name || 'Player 1'}</td>
                    <td class="game-score"></td>
                    <td class="game-score"></td>
                    <td class="game-score"></td>
                    <td class="games-won"></td>
                    <td class="winner-cell"></td>
                  </tr>
                  <tr>
                    <td class="player-name-cell">${teams[1]?.name || 'Player 2'}</td>
                    <td class="game-score"></td>
                    <td class="game-score"></td>
                    <td class="game-score"></td>
                    <td class="games-won"></td>
                    <td class="winner-cell"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Detailed Score Tracking -->
            <div class="detailed-scoring">
              <div class="scoring-title">Point-by-Point Scoring</div>
              <div class="games-container">
                ${Array(3).fill(0).map((_, gameIndex) => `
                  <div class="game-section">
                    <div class="game-header">Game ${gameIndex + 1}</div>
                    <div class="point-tracking">
                      <div class="score-row">
                        <div class="player-label">${teams[0]?.name || 'Player 1'}</div>
                        <div class="points-grid">
                          ${Array(25).fill(0).map((_, i) => `<div class="point-box">${i + 1}</div>`).join('')}
                        </div>
                      </div>
                      <div class="score-row">
                        <div class="player-label">${teams[1]?.name || 'Player 2'}</div>
                        <div class="points-grid">
                          ${Array(25).fill(0).map((_, i) => `<div class="point-box">${i + 1}</div>`).join('')}
                        </div>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Match Details -->
            <div class="match-details">
              <div class="detail-section">
                <div class="section-title">Match Summary</div>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="label">Start Time:</span>
                    <span class="value">_____________</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">End Time:</span>
                    <span class="value">_____________</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Duration:</span>
                    <span class="value">_____________</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Winner:</span>
                    <span class="value">_____________</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Final Score:</span>
                    <span class="value">_____________</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Remarks:</span>
                    <span class="value">_____________</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Officials -->
            <div class="officials-section">
              <div class="officials-title">MATCH OFFICIALS</div>
              <div class="officials-grid">
                <div class="official-block">
                  <div class="official-title">UMPIRE</div>
                  <div class="official-name">${match.umpire || ''}</div>
                </div>
                <div class="official-block">
                  <div class="official-title">SERVICE JUDGE</div>
                  <div class="official-name">${match.serviceJudge || ''}</div>
                </div>
                <div class="official-block">
                  <div class="official-title">LINE JUDGE</div>
                  <div class="official-name">${match.lineJudge || ''}</div>
                </div>
              </div>
            </div>

            <!-- Signatures -->
            ${this.renderSignatures(branding)}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate CSS for badminton template
  getCSS(branding) {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Arial', sans-serif;
        font-size: 11px;
        line-height: 1.3;
        color: #000;
        background: white;
        padding: 15px;
      }
      
      .match-summary {
        width: 100%;
        max-width: 210mm;
        margin: 0 auto;
        border: 2px solid #000;
        background: white;
      }
      
      .header {
        background: #7c3aed;
        color: white;
        padding: 10px 15px;
        text-align: center;
        font-weight: bold;
        font-size: 14px;
        position: relative;
      }
      
      .tournament-logo {
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
        color: #7c3aed;
        font-weight: bold;
      }
      
      .match-info-bar {
        display: flex;
        background: #f3f4f6;
        border-bottom: 1px solid #000;
      }
      
      .match-info-cell {
        flex: 1;
        padding: 8px;
        text-align: center;
        border-right: 1px solid #000;
        font-size: 10px;
      }
      
      .match-info-cell:last-child {
        border-right: none;
      }
      
      .players-section {
        display: flex;
        align-items: center;
        min-height: 100px;
        border-bottom: 1px solid #000;
      }
      
      .player-block {
        flex: 1;
        padding: 15px;
        text-align: center;
      }
      
      .player-name {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 5px;
        color: #7c3aed;
      }
      
      .player-school {
        font-size: 12px;
        color: #666;
        margin-bottom: 8px;
      }
      
      .player-details {
        font-size: 10px;
        color: #333;
      }
      
      .player-details div {
        margin-bottom: 3px;
      }
      
      .vs-divider {
        padding: 20px;
        font-size: 20px;
        font-weight: bold;
        color: #7c3aed;
      }
      
      .score-card {
        padding: 15px;
        border-bottom: 1px solid #000;
      }
      
      .score-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 15px;
      }
      
      .score-table th,
      .score-table td {
        border: 1px solid #000;
        padding: 8px;
        text-align: center;
        font-size: 12px;
      }
      
      .score-table th {
        background: #f3f4f6;
        font-weight: bold;
      }
      
      .player-name-cell {
        text-align: left;
        font-weight: bold;
        background: #f9f9f9;
        width: 150px;
      }
      
      .game-score {
        width: 60px;
        font-size: 14px;
        font-weight: bold;
      }
      
      .games-won {
        width: 80px;
        font-size: 16px;
        font-weight: bold;
        background: #e5f3ff;
      }
      
      .winner-cell {
        width: 80px;
        font-weight: bold;
        background: #d1fae5;
      }
      
      .detailed-scoring {
        padding: 15px;
        border-bottom: 1px solid #000;
        background: #f9fafb;
      }
      
      .scoring-title {
        font-weight: bold;
        font-size: 12px;
        margin-bottom: 10px;
        text-align: center;
        color: #7c3aed;
      }
      
      .games-container {
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;
      }
      
      .game-section {
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 10px;
        background: white;
      }
      
      .game-header {
        font-weight: bold;
        text-align: center;
        margin-bottom: 8px;
        color: #7c3aed;
      }
      
      .point-tracking {
        display: grid;
        grid-template-columns: 1fr;
        gap: 5px;
      }
      
      .score-row {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .player-label {
        width: 100px;
        font-size: 10px;
        font-weight: bold;
      }
      
      .points-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 2px;
      }
      
      .point-box {
        width: 20px;
        height: 20px;
        border: 1px solid #ccc;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        background: white;
      }
      
      .match-details {
        padding: 15px;
        border-bottom: 1px solid #000;
      }
      
      .section-title {
        font-weight: bold;
        font-size: 12px;
        margin-bottom: 10px;
        color: #7c3aed;
      }
      
      .detail-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
      }
      
      .detail-item {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .label {
        font-weight: bold;
        min-width: 70px;
        font-size: 10px;
      }
      
      .value {
        border-bottom: 1px solid #000;
        flex: 1;
        padding: 3px;
        min-height: 20px;
        font-size: 10px;
      }
      
      .officials-section {
        padding: 15px;
        background: #f9fafb;
        border-bottom: 1px solid #000;
      }
      
      .officials-title {
        font-weight: bold;
        font-size: 11px;
        margin-bottom: 10px;
        text-align: center;
      }
      
      .officials-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
      }
      
      .official-block {
        text-align: center;
      }
      
      .official-title {
        font-weight: bold;
        font-size: 10px;
        margin-bottom: 5px;
      }
      
      .official-name {
        border-bottom: 1px solid #000;
        padding: 3px;
        min-height: 20px;
        font-size: 10px;
      }
      
      .signatures-section {
        padding: 15px;
      }
      
      .signatures-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 30px;
      }
      
      .signature-block {
        text-align: center;
      }
      
      .signature-title {
        font-weight: bold;
        font-size: 10px;
        margin-bottom: 5px;
      }
      
      .signature-line {
        border-bottom: 1px solid #000;
        height: 35px;
        margin-bottom: 5px;
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
        color: rgba(0,0,0,${branding.watermark?.opacity || 0.05});
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
        .match-summary { 
          max-width: none;
          page-break-inside: avoid;
        }
        .detailed-scoring {
          page-break-inside: avoid;
        }
      }
    `;
  }

  // Render signatures
  renderSignatures(branding) {
    return `
      <div class="signatures-section">
        <div class="signatures-grid">
          <div class="signature-block">
            <div class="signature-title">UMPIRE</div>
            <div class="signature-line"></div>
            <div class="signature-name">Name & Signature</div>
          </div>
          <div class="signature-block">
            <div class="signature-title">MATCH REFEREE</div>
            <div class="signature-line"></div>
            <div class="signature-name">Name & Signature</div>
          </div>
        </div>
      </div>
    `;
  }
}

export default BadmintonTemplateService;
