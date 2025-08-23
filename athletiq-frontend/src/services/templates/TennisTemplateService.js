// src/services/templates/TennisTemplateService.js
class TennisTemplateService {
  constructor() {
    this.sport = 'tennis';
    this.matchFormat = 'Best of 3 sets';
    this.teamSize = 1; // Singles
    this.scoringSystem = 'sets';
  }

  // Generate HTML template for tennis
  getHTML(data, format) {
    const { match, tournament, teams, branding } = data;
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tennis Match ${match.id} Scoresheet</title>
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
              ${tournament.name || 'TENNIS TOURNAMENT'}
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
            </div>

            <!-- Players Section -->
            <div class="players-section">
              <div class="player-block">
                <div class="player-name">${teams[0]?.name || 'Player 1'}</div>
                <div class="player-school">${teams[0]?.school || 'School A'}</div>
              </div>
              <div class="vs-divider">VS</div>
              <div class="player-block">
                <div class="player-name">${teams[1]?.name || 'Player 2'}</div>
                <div class="player-school">${teams[1]?.school || 'School B'}</div>
              </div>
            </div>

            <!-- Score Card -->
            <div class="score-card">
              <table class="score-table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Set 1</th>
                    <th>Set 2</th>
                    <th>Set 3</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="player-name-cell">${teams[0]?.name || 'Player 1'}</td>
                    <td class="set-score"></td>
                    <td class="set-score"></td>
                    <td class="set-score"></td>
                    <td class="total-score"></td>
                  </tr>
                  <tr>
                    <td class="player-name-cell">${teams[1]?.name || 'Player 2'}</td>
                    <td class="set-score"></td>
                    <td class="set-score"></td>
                    <td class="set-score"></td>
                    <td class="total-score"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Match Details -->
            <div class="match-details">
              <div class="detail-section">
                <div class="section-title">Match Information</div>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="label">Duration:</span>
                    <span class="value">_____________</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Winner:</span>
                    <span class="value">_____________</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">Score:</span>
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
                  <div class="official-title">LINE JUDGE</div>
                  <div class="official-name">${match.lineJudge || ''}</div>
                </div>
                <div class="official-block">
                  <div class="official-title">SCORER</div>
                  <div class="official-name">${match.scorer || ''}</div>
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

  // Generate CSS for tennis template
  getCSS(branding) {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Arial', sans-serif;
        font-size: 12px;
        line-height: 1.3;
        color: #000;
        background: white;
        padding: 20px;
      }
      
      .match-summary {
        width: 100%;
        max-width: 210mm;
        margin: 0 auto;
        border: 2px solid #000;
        background: white;
      }
      
      .header {
        background: #059669;
        color: white;
        padding: 10px 15px;
        text-align: center;
        font-weight: bold;
        font-size: 16px;
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
        color: #059669;
        font-weight: bold;
      }
      
      .match-info-bar {
        display: flex;
        background: #f3f4f6;
        border-bottom: 1px solid #000;
      }
      
      .match-info-cell {
        flex: 1;
        padding: 10px;
        text-align: center;
        border-right: 1px solid #000;
        font-size: 11px;
      }
      
      .match-info-cell:last-child {
        border-right: none;
      }
      
      .players-section {
        display: flex;
        align-items: center;
        min-height: 80px;
        border-bottom: 1px solid #000;
      }
      
      .player-block {
        flex: 1;
        padding: 20px;
        text-align: center;
      }
      
      .player-name {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 8px;
        color: #059669;
      }
      
      .player-school {
        font-size: 14px;
        color: #666;
      }
      
      .vs-divider {
        padding: 20px;
        font-size: 24px;
        font-weight: bold;
        color: #059669;
      }
      
      .score-card {
        padding: 20px;
        border-bottom: 1px solid #000;
      }
      
      .score-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      
      .score-table th,
      .score-table td {
        border: 1px solid #000;
        padding: 12px;
        text-align: center;
        font-size: 14px;
      }
      
      .score-table th {
        background: #f3f4f6;
        font-weight: bold;
      }
      
      .player-name-cell {
        text-align: left;
        font-weight: bold;
        background: #f9f9f9;
      }
      
      .set-score {
        width: 80px;
        font-size: 16px;
        font-weight: bold;
      }
      
      .total-score {
        width: 80px;
        font-size: 18px;
        font-weight: bold;
        background: #e5f3ff;
      }
      
      .match-details {
        padding: 20px;
        border-bottom: 1px solid #000;
      }
      
      .section-title {
        font-weight: bold;
        font-size: 14px;
        margin-bottom: 15px;
        color: #059669;
      }
      
      .detail-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
      }
      
      .detail-item {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .label {
        font-weight: bold;
        min-width: 80px;
      }
      
      .value {
        border-bottom: 1px solid #000;
        flex: 1;
        padding: 5px;
        min-height: 25px;
      }
      
      .officials-section {
        padding: 15px;
        background: #f9fafb;
        border-bottom: 1px solid #000;
      }
      
      .officials-title {
        font-weight: bold;
        font-size: 12px;
        margin-bottom: 10px;
        text-align: center;
      }
      
      .officials-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
      }
      
      .official-block {
        text-align: center;
      }
      
      .official-title {
        font-weight: bold;
        font-size: 11px;
        margin-bottom: 5px;
      }
      
      .official-name {
        border-bottom: 1px solid #000;
        padding: 5px;
        min-height: 25px;
        font-size: 11px;
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
        font-size: 11px;
        margin-bottom: 5px;
      }
      
      .signature-line {
        border-bottom: 1px solid #000;
        height: 40px;
        margin-bottom: 5px;
      }
      
      .signature-name {
        font-size: 10px;
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

export default TennisTemplateService;
