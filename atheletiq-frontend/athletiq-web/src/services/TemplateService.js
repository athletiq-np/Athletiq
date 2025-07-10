// src/services/TemplateService.js
import SportsTemplateFactory from './templates/SportsTemplateFactory.js';

class TemplateService {
  constructor() {
    this.templates = new Map();
    this.schoolBranding = new Map();
    this.sportsFactory = new SportsTemplateFactory();
  }

  // School branding configuration
  setSchoolBranding(schoolId, branding) {
    this.schoolBranding.set(schoolId, {
      logo: branding.logo || null,
      primaryColor: branding.primaryColor || '#1e40af',
      secondaryColor: branding.secondaryColor || '#f59e0b',
      schoolName: branding.schoolName || '',
      address: branding.address || '',
      principal: branding.principal || '',
      sportsCoordinator: branding.sportsCoordinator || '',
      watermark: branding.watermark || {
        enabled: true,
        text: 'Powered by Athletiq',
        opacity: 0.1
      },
      signatures: branding.signatures || {
        principal: true,
        coach: true,
        referee: true,
        organizer: false
      }
    });
  }

  getSchoolBranding(schoolId) {
    return this.schoolBranding.get(schoolId) || this.getDefaultBranding();
  }

  getDefaultBranding() {
    return {
      logo: null,
      primaryColor: '#1e40af',
      secondaryColor: '#f59e0b',
      schoolName: 'School Name',
      address: '',
      principal: '',
      sportsCoordinator: '',
      watermark: {
        enabled: true,
        text: 'Powered by Athletiq',
        opacity: 0.1
      },
      signatures: {
        principal: true,
        coach: true,
        referee: true,
        organizer: false
      }
    };
  }

  // Generate school logo HTML
  generateSchoolLogoHTML(schoolName, branding) {
    if (branding.logo) {
      return `<img src="${branding.logo}" alt="${schoolName}" class="school-logo" />`;
    }
    
    // Generate initials-based logo like your bracket component
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#8b5cf6', '#f59e0b', '#14b8a6'];
    const colorIndex = schoolName.charCodeAt(0) % colors.length;
    const initials = schoolName.split(' ').map(word => word[0]).join('').substring(0, 2);
    
    return `
      <div class="generated-logo" style="
        width: 50px;
        height: 50px;
        background-color: ${colors[colorIndex]};
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 18px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      ">
        ${initials}
      </div>
    `;
  }

  // Render scoresheet template
  renderScoresheetTemplate(data, options = {}) {
    const { match, tournament, teams, branding } = data;
    const format = options.format || 'blank'; // 'blank', 'filled', 'live'
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Match ${match.id} Scoresheet</title>
        <style>
          ${this.getAFCStyleCSS(branding)}
        </style>
      </head>
      <body>
        ${this.getAFCStyleHTML(data, format)}
      </body>
      </html>
    `;
  }

  getScoresheetCSS(branding) {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Arial', sans-serif;
        font-size: 12px;
        line-height: 1.4;
        color: #333;
        background: white;
      }
      
      .scoresheet {
        width: 100%;
        max-width: 210mm;
        margin: 0 auto;
        padding: 20px;
        position: relative;
      }
      
      .header {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 3px solid ${branding.primaryColor};
        padding-bottom: 20px;
      }
      
      .header-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
        margin-bottom: 15px;
      }
      
      .tournament-title {
        font-size: 24px;
        font-weight: bold;
        color: ${branding.primaryColor};
        margin-bottom: 5px;
      }
      
      .match-info {
        font-size: 14px;
        color: #666;
      }
      
      .match-details {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 20px;
        margin: 20px 0;
        padding: 15px;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        background: #f9fafb;
      }
      
      .detail-item {
        text-align: center;
      }
      
      .detail-label {
        font-weight: bold;
        color: ${branding.primaryColor};
        margin-bottom: 5px;
      }
      
      .detail-value {
        font-size: 14px;
        padding: 5px;
        border-bottom: 1px solid #ccc;
        min-height: 25px;
      }
      
      .teams-section {
        margin: 30px 0;
      }
      
      .team-card {
        border: 2px solid ${branding.primaryColor};
        border-radius: 12px;
        margin: 20px 0;
        overflow: hidden;
        background: white;
      }
      
      .team-header {
        background: ${branding.primaryColor};
        color: white;
        padding: 15px;
        display: flex;
        align-items: center;
        gap: 15px;
      }
      
      .team-info {
        flex: 1;
      }
      
      .team-name {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 5px;
      }
      
      .school-name {
        font-size: 14px;
        opacity: 0.9;
      }
      
      .score-section {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .score-box {
        width: 60px;
        height: 60px;
        border: 3px solid white;
        border-radius: 8px;
        background: rgba(255,255,255,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-weight: bold;
        color: white;
      }
      
      .team-content {
        padding: 20px;
      }
      
      .players-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
        margin-top: 15px;
      }
      
      .player-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background: #f9fafb;
      }
      
      .player-number {
        width: 30px;
        height: 30px;
        background: ${branding.secondaryColor};
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 12px;
      }
      
      .player-name {
        flex: 1;
        font-size: 13px;
        border-bottom: 1px solid #ccc;
        padding: 3px;
        min-height: 20px;
      }
      
      .match-events {
        margin: 30px 0;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        padding: 20px;
        background: #f9fafb;
      }
      
      .events-title {
        font-size: 16px;
        font-weight: bold;
        color: ${branding.primaryColor};
        margin-bottom: 15px;
        text-align: center;
      }
      
      .events-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
      }
      
      .event-category {
        border: 1px solid #d1d5db;
        border-radius: 6px;
        padding: 15px;
        background: white;
      }
      
      .category-title {
        font-weight: bold;
        margin-bottom: 10px;
        color: ${branding.primaryColor};
      }
      
      .event-lines {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .event-line {
        display: flex;
        gap: 10px;
        align-items: center;
      }
      
      .time-box, .player-box, .event-box {
        border: 1px solid #ccc;
        padding: 5px;
        font-size: 11px;
        text-align: center;
      }
      
      .time-box { width: 40px; }
      .player-box { width: 30px; }
      .event-box { flex: 1; }
      
      .signatures {
        margin-top: 40px;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 30px;
      }
      
      .signature-block {
        text-align: center;
        border-top: 2px solid #333;
        padding-top: 10px;
      }
      
      .signature-title {
        font-weight: bold;
        margin-bottom: 5px;
      }
      
      .signature-space {
        height: 60px;
        border: 1px dashed #ccc;
        margin: 10px 0;
        background: #f9fafb;
      }
      
      .watermark {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 48px;
        color: rgba(0,0,0,${branding.watermark.opacity});
        font-weight: bold;
        z-index: 0;
        pointer-events: none;
      }
      
      .content {
        position: relative;
        z-index: 1;
      }
      
      @media print {
        body { margin: 0; }
        .scoresheet { max-width: none; }
      }
    `;
  }

  // AFC Champions League style CSS
  getAFCStyleCSS(branding) {
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
      
      .match-summary {
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
        min-height: 60px;
        border-bottom: 1px solid #000;
      }
      
      .team-block {
        flex: 1;
        padding: 10px;
        text-align: center;
        border-right: 1px solid #000;
      }
      
      .team-block:last-child {
        border-right: none;
      }
      
      .team-name {
        font-weight: bold;
        font-size: 14px;
        margin-bottom: 5px;
      }
      
      .team-code {
        font-size: 10px;
        color: #666;
      }
      
      .score-display {
        font-size: 36px;
        font-weight: bold;
        color: #1e3a8a;
        margin: 10px 0;
      }
      
      .match-details {
        display: flex;
        border-bottom: 1px solid #000;
      }
      
      .lineups-section {
        display: flex;
        min-height: 400px;
      }
      
      .team-lineup {
        flex: 1;
        border-right: 1px solid #000;
        padding: 10px;
      }
      
      .team-lineup:last-child {
        border-right: none;
      }
      
      .lineup-header {
        font-weight: bold;
        font-size: 12px;
        margin-bottom: 8px;
        text-align: center;
        padding: 4px;
        background: #f3f4f6;
        border: 1px solid #000;
      }
      
      .players-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 15px;
      }
      
      .players-table th,
      .players-table td {
        border: 1px solid #000;
        padding: 3px 5px;
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
        width: 25px;
      }
      
      .player-name {
        width: 140px;
      }
      
      .player-stats {
        text-align: center;
        width: 25px;
      }
      
      .substitutes-section {
        margin-top: 15px;
      }
      
      .substitutes-header {
        font-weight: bold;
        font-size: 11px;
        margin-bottom: 5px;
        text-align: center;
        background: #e5e7eb;
        padding: 3px;
        border: 1px solid #000;
      }
      
      .officials-section {
        padding: 10px;
        border-top: 1px solid #000;
        background: #f9fafb;
      }
      
      .officials-title {
        font-weight: bold;
        font-size: 11px;
        margin-bottom: 8px;
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
        margin-bottom: 3px;
      }
      
      .official-name {
        border-bottom: 1px solid #000;
        padding: 2px;
        min-height: 20px;
        font-size: 10px;
      }
      
      .match-events {
        margin-top: 15px;
        padding: 10px;
        border: 1px solid #000;
        background: #f9fafb;
      }
      
      .events-title {
        font-weight: bold;
        font-size: 11px;
        margin-bottom: 8px;
        text-align: center;
      }
      
      .events-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 10px;
      }
      
      .events-table th,
      .events-table td {
        border: 1px solid #000;
        padding: 3px 5px;
        text-align: center;
        font-size: 10px;
      }
      
      .events-table th {
        background: #e5e7eb;
        font-weight: bold;
      }
      
      .event-time {
        width: 40px;
      }
      
      .event-player {
        width: 120px;
      }
      
      .event-type {
        width: 80px;
      }
      
      .signatures-section {
        margin-top: 20px;
        padding: 10px;
        border-top: 1px solid #000;
      }
      
      .signatures-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
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
        height: 30px;
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
      }
    `;
  }

  // AFC Champions League style HTML
  getAFCStyleHTML(data, format) {
    const { match, tournament, teams, branding } = data;
    
    return `
      <div class="match-summary">
        ${branding.watermark?.enabled ? `<div class="watermark">${branding.watermark.text}</div>` : ''}
        
        <div class="content">
          <!-- Header -->
          <div class="header">
            ${tournament.name || 'FOOTBALL TOURNAMENT'}
            ${tournament.stage ? ` (${tournament.stage.toUpperCase()})` : ''}
            <div class="tournament-logo">
              ${branding.logo ? `<img src="${branding.logo}" alt="Logo" style="max-width: 50px; max-height: 35px;">` : 'LOGO'}
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
              <div style="font-weight: bold;">Temp</div>
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
            ${teams.map((team, index) => this.renderAFCTeamLineup(team, index, format)).join('')}
          </div>

          <!-- Match Events -->
          <div class="match-events">
            <div class="events-title">MATCH EVENTS</div>
            <table class="events-table">
              <thead>
                <tr>
                  <th class="event-time">TIME</th>
                  <th class="event-player">PLAYER</th>
                  <th class="event-type">EVENT</th>
                  <th class="event-player">PLAYER</th>
                  <th class="event-time">TIME</th>
                </tr>
              </thead>
              <tbody>
                ${Array(8).fill(0).map(() => `
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
            <div class="officials-title">MATCH OFFICIALS</div>
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
          ${this.renderAFCSignatures(branding)}
        </div>
      </div>
    `;
  }

  // Render AFC-style team lineup
  renderAFCTeamLineup(team, index, format) {
    const teamName = team?.name || `TEAM ${index === 0 ? 'A' : 'B'}`;
    const teamCode = team?.code || (index === 0 ? 'TMA' : 'TMB');
    
    return `
      <div class="team-lineup">
        <div class="lineup-header">${teamName} (${teamCode})</div>
        
        <!-- Starting XI -->
        <table class="players-table">
          <thead>
            <tr>
              <th class="player-number">No.</th>
              <th class="player-name">Pos/Name</th>
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
                <td class="player-name">${team?.players?.[i]?.position || 'GK'} ${team?.players?.[i]?.name || ''}</td>
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
          <div class="substitutes-header">Substitutes</div>
          <table class="players-table">
            <tbody>
              ${Array(7).fill(0).map((_, i) => `
                <tr>
                  <td class="player-number">${i + 12}</td>
                  <td class="player-name">${team?.substitutes?.[i]?.position || 'SUB'} ${team?.substitutes?.[i]?.name || ''}</td>
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
        <div style="margin-top: 10px; font-size: 10px;">
          <div style="margin-bottom: 5px;"><strong>Head Coach:</strong> ${team?.coach || '________________________'}</div>
          <div><strong>Team Manager:</strong> ${team?.manager || '________________________'}</div>
        </div>
      </div>
    `;
  }

  // Render AFC-style signatures
  renderAFCSignatures(branding) {
    return `
      <div class="signatures-section">
        <div class="signatures-grid">
          <div class="signature-block">
            <div class="signature-title">REFEREE</div>
            <div class="signature-line"></div>
            <div class="signature-name">Signature</div>
          </div>
          <div class="signature-block">
            <div class="signature-title">TEAM A CAPTAIN</div>
            <div class="signature-line"></div>
            <div class="signature-name">Signature</div>
          </div>
          <div class="signature-block">
            <div class="signature-title">TEAM B CAPTAIN</div>
            <div class="signature-line"></div>
            <div class="signature-name">Signature</div>
          </div>
        </div>
      </div>
    `;
  }

  // Render scoresheet HTML
  getScoresheetHTML(data, format) {
    const { match, tournament, teams, branding } = data;
    
    return `
      <div class="scoresheet">
        ${branding.watermark.enabled ? `<div class="watermark">${branding.watermark.text}</div>` : ''}
        
        <div class="content">
          <div class="header">
            <div class="header-content">
              ${this.generateSchoolLogoHTML(tournament.organizerSchool || 'Tournament', branding)}
              <div>
                <div class="tournament-title">${tournament.name || 'Football Tournament'}</div>
                <div class="match-info">Match #${match.id} - ${this.getRoundName(match.round)} - ${match.date || 'TBD'}</div>
              </div>
            </div>
          </div>

          <div class="match-details">
            <div class="detail-item">
              <div class="detail-label">Date</div>
              <div class="detail-value">${match.date || ''}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Time</div>
              <div class="detail-value">${match.time || ''}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Venue</div>
              <div class="detail-value">${match.venue || ''}</div>
            </div>
          </div>

          <div class="teams-section">
            ${teams.map((team, index) => this.renderTeamCard(team, index, format, branding)).join('')}
          </div>

          <div class="match-events">
            <div class="events-title">Match Events & Statistics</div>
            <div class="events-grid">
              <div class="event-category">
                <div class="category-title">Goals</div>
                <div class="event-lines">
                  ${Array(6).fill(0).map(() => `
                    <div class="event-line">
                      <div class="time-box"></div>
                      <div class="player-box"></div>
                      <div class="event-box"></div>
                    </div>
                  `).join('')}
                </div>
              </div>
              
              <div class="event-category">
                <div class="category-title">Cards</div>
                <div class="event-lines">
                  ${Array(6).fill(0).map(() => `
                    <div class="event-line">
                      <div class="time-box"></div>
                      <div class="player-box"></div>
                      <div class="event-box"></div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>

          ${this.renderSignatures(branding)}
        </div>
      </div>
    `;
  }

  renderTeamCard(team, index, format, branding) {
    const score = format === 'filled' || format === 'live' ? (team.score || 0) : '';
    
    return `
      <div class="team-card">
        <div class="team-header">
          ${this.generateSchoolLogoHTML(team.school || `School ${index + 1}`, branding)}
          <div class="team-info">
            <div class="team-name">${team.name || `Team ${index + 1}`}</div>
            <div class="school-name">${team.school || `School ${index + 1}`}</div>
          </div>
          <div class="score-section">
            <div class="score-box">${score}</div>
          </div>
        </div>
        
        <div class="team-content">
          <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
            <div><strong>Coach:</strong> ${team.coach || '________________________'}</div>
            <div><strong>Captain:</strong> ${team.captain || '________________________'}</div>
          </div>
          
          <div><strong>Starting XI:</strong></div>
          <div class="players-grid">
            ${Array(11).fill(0).map((_, i) => `
              <div class="player-row">
                <div class="player-number">${i + 1}</div>
                <div class="player-name">${team.players?.[i]?.name || ''}</div>
              </div>
            `).join('')}
          </div>
          
          <div style="margin-top: 15px;"><strong>Substitutes:</strong></div>
          <div class="players-grid">
            ${Array(7).fill(0).map((_, i) => `
              <div class="player-row">
                <div class="player-number">${i + 12}</div>
                <div class="player-name">${team.substitutes?.[i]?.name || ''}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  renderSignatures(branding) {
    const signatures = [];
    
    if (branding.signatures.referee) {
      signatures.push(`
        <div class="signature-block">
          <div class="signature-title">Referee</div>
          <div class="signature-space"></div>
          <div>Name: ________________________</div>
          <div>License: ________________________</div>
        </div>
      `);
    }
    
    if (branding.signatures.coach) {
      signatures.push(`
        <div class="signature-block">
          <div class="signature-title">Coach Signatures</div>
          <div class="signature-space"></div>
          <div>Team A Coach</div>
          <div style="margin-top: 20px;">
            <div class="signature-space"></div>
            <div>Team B Coach</div>
          </div>
        </div>
      `);
    }
    
    if (branding.signatures.organizer) {
      signatures.push(`
        <div class="signature-block">
          <div class="signature-title">Match Commissioner</div>
          <div class="signature-space"></div>
          <div>Name: ________________________</div>
          <div>Signature: ________________________</div>
        </div>
      `);
    }
    
    return `<div class="signatures">${signatures.join('')}</div>`;
  }

  getRoundName(round) {
    const roundNames = {
      1: 'Round of 32',
      2: 'Round of 16', 
      3: 'Quarter-Final',
      4: 'Semi-Final',
      5: 'Final'
    };
    return roundNames[round] || `Round ${round}`;
  }

  // Generate sport-specific scoresheet using SportsTemplateFactory
  generateSportSpecificScoresheet(data, options = {}) {
    const { match, tournament, teams, branding } = data;
    const sport = tournament.sport || 'football'; // default to football
    const format = options.format || 'blank';
    
    try {
      // Use the sports factory to generate the template
      const template = this.sportsFactory.generateSportScoresheet(sport, data, { format });
      return template;
    } catch (error) {
      console.error('Error generating sport-specific template:', error);
      // Fallback to default template
      return this.renderScoresheetTemplate(data, options);
    }
  }

  // Get available sports from factory
  getAvailableSports() {
    return this.sportsFactory.getAvailableSports();
  }

  // Get sport-specific information
  getSportInfo(sportName) {
    return this.sportsFactory.getSportInfo(sportName);
  }

  // Generate preview for sport
  generateSportPreview(sportName, schoolId = null) {
    const branding = this.getSchoolBranding(schoolId);
    const mockData = this.sportsFactory.generateMockData(sportName, branding);
    
    return this.generateSportSpecificScoresheet(mockData, { format: 'preview' });
  }
}

export default new TemplateService();
