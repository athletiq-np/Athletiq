// src/utils/enhancedScoresheetGenerator.js
import BrowserPDFService from '../services/BrowserPDFService.js';

// Create singleton instance
const pdfService = new BrowserPDFService();

// Enhanced scoresheet generation to replace your current implementation
export const generateEnhancedScoresheet = async (match, tournament, options = {}) => {
  const { 
    format = 'blank', // 'blank', 'filled', 'live'
    schoolBranding = null,
    downloadImmediately = true 
  } = options;

  try {
    // Prepare data for template
    const data = {
      match: {
        ...match,
        date: match.date || new Date().toLocaleDateString(),
        time: match.time || 'TBD',
        venue: match.venue || 'TBD'
      },
      tournament: {
        ...tournament,
        name: tournament?.name || 'Football Tournament',
        sport: tournament?.sport || 'football'
      },
      teams: match.teams || [
        { 
          name: 'Team A', 
          school: 'School A',
          coach: '',
          players: [],
          score: format === 'filled' ? (match.teams?.[0]?.score || 0) : undefined
        },
        { 
          name: 'Team B', 
          school: 'School B',
          coach: '',
          players: [],
          score: format === 'filled' ? (match.teams?.[1]?.score || 0) : undefined
        }
      ],
      schoolBranding,
      format
    };

    // Generate PDF using browser service
    const result = await pdfService.generateSingle(data);
    
    if (result.success && downloadImmediately) {
      downloadFile(result.data, `Match-${match.id}-Scoresheet.pdf`);
    }
    
    return {
      success: result.success,
      pdf: result.data,
      filename: `Match-${match.id}-Scoresheet.pdf`,
      error: result.error
    };
    
  } catch (error) {
    console.error('Failed to generate enhanced scoresheet:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Preview scoresheet in new tab
export const previewEnhancedScoresheet = async (match, tournament, options = {}) => {
  try {
    const data = {
      match: {
        ...match,
        date: match.date || new Date().toLocaleDateString(),
        time: match.time || 'TBD',
        venue: match.venue || 'TBD'
      },
      tournament: {
        ...tournament,
        name: tournament?.name || 'Football Tournament',
        sport: tournament?.sport || 'football'
      },
      teams: match.teams || [
        { 
          name: 'Team A', 
          school: 'School A',
          coach: '',
          players: []
        },
        { 
          name: 'Team B', 
          school: 'School B',
          coach: '',
          players: []
        }
      ],
      schoolBranding: options.schoolBranding,
      format: options.format || 'blank'
    };
    
    const result = await pdfService.preview(data);
    
    if (result.success) {
      // Open preview URL in new tab
      window.open(result.previewUrl, '_blank');
    }
    
    return result;
  } catch (error) {
    console.error('Failed to preview scoresheet:', error);
    return { success: false, error: error.message };
  }
};

// Bulk download for tournament rounds
export const downloadRoundScoresheets = async (roundMatches, tournament, options = {}) => {
  try {
    const data = {
      matches: roundMatches,
      tournament: {
        ...tournament,
        sport: tournament?.sport || 'football'
      },
      options
    };
    
    const result = await pdfService.generateRound(data);
    
    if (result.success) {
      downloadFile(result.data, result.filename);
    }
    
    return { success: result.success, error: result.error };
  } catch (error) {
    console.error('Failed to download round scoresheets:', error);
    return { success: false, error: error.message };
  }
};

// Download all tournament scoresheets
export const downloadTournamentScoresheets = async (matches, tournament, options = {}) => {
  try {
    const data = {
      matches,
      tournament: {
        ...tournament,
        sport: tournament?.sport || 'football'
      },
      options
    };
    
    const result = await pdfService.generateBatch(data);
    
    if (result.success) {
      downloadFile(result.data, result.filename);
    }
    
    return { success: result.success, error: result.error };
  } catch (error) {
    console.error('Failed to download tournament scoresheets:', error);
    return { success: false, error: error.message };
  }
};

// Utility function to trigger file download
const downloadFile = (data, filename) => {
  let blob;
  
  // Handle different data types
  if (data instanceof Blob) {
    blob = data;
  } else if (data instanceof ArrayBuffer) {
    blob = new Blob([data], { 
      type: filename.endsWith('.zip') ? 'application/zip' : 'application/pdf' 
    });
  } else if (typeof data === 'string') {
    // Assume base64 encoded data
    const binaryString = atob(data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    blob = new Blob([bytes], { 
      type: filename.endsWith('.zip') ? 'application/zip' : 'application/pdf' 
    });
  } else {
    // Fallback for other data types
    blob = new Blob([data], { 
      type: filename.endsWith('.zip') ? 'application/zip' : 'application/pdf' 
    });
  }
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// School branding configuration
export const configureSchoolBranding = async (schoolId, branding) => {
  // This could be enhanced to save branding to backend
  console.log('School branding configured for:', schoolId, branding);
  return { success: true };
};

// Get available template formats
export const getAvailableFormats = () => {
  return [
    { value: 'blank', label: 'Blank Scoresheet', description: 'Empty scoresheet for manual filling' },
    { value: 'filled', label: 'Pre-filled', description: 'Scoresheet with team names and current scores' },
    { value: 'live', label: 'Live Score', description: 'Real-time scoresheet with current match data' }
  ];
};

// Get available sports for template selection
export const getAvailableSports = async () => {
  try {
    const result = await pdfService.getSports();
    return result.success ? result.sports : [];
  } catch (error) {
    console.error('Failed to get available sports:', error);
    return ['football', 'basketball', 'volleyball', 'tennis', 'badminton']; // fallback
  }
};

// Get sport-specific information
export const getSportInfo = async (sportName) => {
  try {
    const sports = await getAvailableSports();
    const sport = sports.find(s => s.name === sportName || s === sportName);
    return sport || { name: sportName, description: `${sportName} scoresheet` };
  } catch (error) {
    console.error('Failed to get sport info:', error);
    return { name: sportName, description: `${sportName} scoresheet` };
  }
};

// Generate preview for different sports
export const generateSportPreview = async (sportName, schoolId = null, options = {}) => {
  try {
    const data = {
      sport: sportName,
      schoolId,
      ...options
    };
    
    const result = await pdfService.generateSample(data);
    
    if (result.success && options.downloadImmediately) {
      downloadFile(result.data, `${sportName}-preview.pdf`);
    }
    
    return {
      success: result.success,
      pdf: result.data,
      filename: `${sportName}-preview.pdf`,
      error: result.error
    };
    
  } catch (error) {
    console.error('Failed to generate sport preview:', error);
    return { success: false, error: error.message };
  }
};

// Generate scoresheet for specific sport
export const generateSportScoresheet = async (sportName, match, tournament, options = {}) => {
  // Ensure tournament has sport specified
  const updatedTournament = {
    ...tournament,
    sport: sportName
  };
  
  return await generateEnhancedScoresheet(match, updatedTournament, options);
};

// Backwards compatibility with your current system
export const downloadScoresheet = async (match, tournament) => {
  return await generateEnhancedScoresheet(match, tournament, { format: 'blank' });
};

export const previewScoresheet = async (match, tournament) => {
  return await previewEnhancedScoresheet(match, tournament, { format: 'blank' });
};
