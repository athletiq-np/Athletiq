// src/utils/scoresheetGenerator.js
import jsPDF from 'jspdf';

export const generateScoresheet = (matchData, tournamentData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Tournament Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(tournamentData?.name || 'FOOTBALL TOURNAMENT', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('MATCH SUMMARY', pageWidth / 2, 25, { align: 'center' });
  
  // Match Information Header Box
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.rect(15, 35, pageWidth - 30, 25);
  
  // Match Info Headers
  doc.text('Match', 20, 45);
  doc.text('Date and Time', 50, 45);
  doc.text('Duration', 90, 45);
  doc.text('Stadium', 115, 45);
  doc.text('Weather', 145, 45);
  doc.text('Temp', 170, 45);
  doc.text('Attendance', 185, 45);
  
  // Match Info Values
  doc.setFont('helvetica', 'normal');
  doc.text(`${matchData?.id || 'TBD'}`, 20, 55);
  doc.text(`${matchData?.date || new Date().toLocaleDateString()}`, 50, 55);
  doc.text('90\'', 90, 55);
  doc.text(`${tournamentData?.venue || 'Stadium TBD'}`, 115, 55);
  doc.text('Clear', 145, 55);
  doc.text('22°C', 170, 55);
  doc.text('TBD', 185, 55);
  
  // Teams and Score Section
  const teamAName = matchData?.teams?.[0]?.name || 'TEAM A';
  const teamBName = matchData?.teams?.[1]?.name || 'TEAM B';
  const teamAScore = matchData?.teams?.[0]?.score || 0;
  const teamBScore = matchData?.teams?.[1]?.score || 0;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(teamAName, 30, 80);
  doc.text(teamBName, 150, 80);
  
  // Score boxes
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.rect(70, 70, 20, 20);
  doc.rect(120, 70, 20, 20);
  doc.text(`${teamAScore}`, 80, 85, { align: 'center' });
  doc.text(`${teamBScore}`, 130, 85, { align: 'center' });
  
  // Players Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${teamAName} PLAYERS`, 20, 105);
  doc.text(`${teamBName} PLAYERS`, 110, 105);
  
  // Player table headers
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  
  // Team A Player Headers
  doc.text('No.', 20, 115);
  doc.text('Player Name', 30, 115);
  doc.text('G', 80, 115);
  doc.text('Y', 85, 115);
  doc.text('R', 90, 115);
  doc.text('S', 95, 115);
  
  // Team B Player Headers
  doc.text('No.', 110, 115);
  doc.text('Player Name', 120, 115);
  doc.text('G', 170, 115);
  doc.text('Y', 175, 115);
  doc.text('R', 180, 115);
  doc.text('S', 185, 115);
  
  // Draw player rows
  doc.setFont('helvetica', 'normal');
  for (let i = 1; i <= 22; i++) {
    const yPos = 115 + (i * 8);
    if (yPos > 220) break; // Don't exceed page
    
    // Team A players
    doc.text(`${i}`, 20, yPos);
    doc.text('_________________', 30, yPos);
    doc.text('___', 80, yPos);
    doc.text('___', 85, yPos);
    doc.text('___', 90, yPos);
    doc.text('___', 95, yPos);
    
    // Team B players
    doc.text(`${i}`, 110, yPos);
    doc.text('_________________', 120, yPos);
    doc.text('___', 170, yPos);
    doc.text('___', 175, yPos);
    doc.text('___', 180, yPos);
    doc.text('___', 185, yPos);
  }
  
  // Substitutes Section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Substitutes', 20, 230);
  doc.text('Substitutes', 110, 230);
  
  doc.setFont('helvetica', 'normal');
  for (let i = 1; i <= 7; i++) {
    const yPos = 230 + (i * 8);
    if (yPos > 270) break;
    
    doc.text(`${i}`, 20, yPos);
    doc.text('_________________', 30, yPos);
    doc.text(`${i}`, 110, yPos);
    doc.text('_________________', 120, yPos);
  }
  
  // Create second page for match details
  doc.addPage();
  
  // Match Events Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('MATCH EVENTS', pageWidth / 2, 20, { align: 'center' });
  
  // Goals Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('GOALS', 20, 35);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Time', 20, 45);
  doc.text('Player', 40, 45);
  doc.text('Team', 80, 45);
  doc.text('Assist', 100, 45);
  doc.text('Type', 130, 45);
  
  // Goal rows
  for (let i = 1; i <= 10; i++) {
    const yPos = 45 + (i * 10);
    doc.text('____', 20, yPos);
    doc.text('____________________', 40, yPos);
    doc.text('__________', 80, yPos);
    doc.text('__________', 100, yPos);
    doc.text('__________', 130, yPos);
  }
  
  // Cards Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('CARDS', 20, 165);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Time', 20, 175);
  doc.text('Player', 40, 175);
  doc.text('Team', 80, 175);
  doc.text('Card Type', 100, 175);
  doc.text('Reason', 130, 175);
  
  // Card rows
  for (let i = 1; i <= 8; i++) {
    const yPos = 175 + (i * 10);
    doc.text('____', 20, yPos);
    doc.text('____________________', 40, yPos);
    doc.text('__________', 80, yPos);
    doc.text('Y / R', 100, yPos);
    doc.text('__________', 130, yPos);
  }
  
  // Substitutions Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SUBSTITUTIONS', 20, 265);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Time', 20, 275);
  doc.text('Player Out', 40, 275);
  doc.text('Player In', 80, 275);
  doc.text('Team', 120, 275);
  doc.text('Reason', 140, 275);
  
  // Substitution rows
  for (let i = 1; i <= 6; i++) {
    const yPos = 275 + (i * 8);
    if (yPos > 310) break;
    
    doc.text('____', 20, yPos);
    doc.text('______________', 40, yPos);
    doc.text('______________', 80, yPos);
    doc.text('__________', 120, yPos);
    doc.text('__________', 140, yPos);
  }
  
  // Create third page for officials and final details
  doc.addPage();
  
  // Match Officials Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('MATCH OFFICIALS', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Referee: _________________________________', 20, 35);
  doc.text('Assistant Referee 1: _____________________', 20, 50);
  doc.text('Assistant Referee 2: _____________________', 20, 65);
  doc.text('Fourth Official: __________________________', 20, 80);
  doc.text('Match Commissioner: ______________________', 20, 95);
  
  // Time Details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('MATCH TIME DETAILS', 20, 120);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Kick-off Time: _______________', 20, 135);
  doc.text('Half-time: _______________', 20, 150);
  doc.text('Second Half: _______________', 20, 165);
  doc.text('Full Time: _______________', 20, 180);
  doc.text('Extra Time 1st Half: _______________', 20, 195);
  doc.text('Extra Time 2nd Half: _______________', 20, 210);
  doc.text('Penalty Shootout: _______________', 20, 225);
  
  // Weather and Conditions
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('WEATHER & CONDITIONS', 20, 250);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Weather: _______________', 20, 265);
  doc.text('Temperature: _______________', 20, 280);
  doc.text('Wind: _______________', 20, 295);
  doc.text('Pitch Condition: _______________', 20, 310);
  
  // Final Result
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FINAL RESULT', pageWidth / 2, 340, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text(`${teamAName}: _____`, 30, 360);
  doc.text(`${teamBName}: _____`, 130, 360);
  
  doc.setFontSize(12);
  doc.text('Winner: ________________________', pageWidth / 2, 380, { align: 'center' });
  
  // Signatures
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Referee Signature: _________________', 20, 420);
  doc.text('Date: ___________', 140, 420);
  doc.text('Team A Captain: ___________________', 20, 440);
  doc.text('Team B Captain: ___________________', 20, 460);
  
  return doc;
};

export const downloadScoresheet = (matchData, tournamentData) => {
  const doc = generateScoresheet(matchData, tournamentData);
  const fileName = `scoresheet_${matchData?.id || 'match'}_${tournamentData?.name || 'tournament'}.pdf`.replace(/\s+/g, '_');
  doc.save(fileName);
};

export const previewScoresheet = (matchData, tournamentData) => {
  const doc = generateScoresheet(matchData, tournamentData);
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  window.open(url, '_blank');
};
