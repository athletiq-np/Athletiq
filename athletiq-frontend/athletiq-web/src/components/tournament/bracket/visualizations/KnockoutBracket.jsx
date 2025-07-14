// src/components/tournament/bracket/visualizations/KnockoutBracket.jsx
import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaEdit, FaEye, FaDownload, FaFileAlt, FaClock, FaCheckCircle, FaUniversity, FaUsers } from 'react-icons/fa';
import { generatePlaceholderBracket } from '../../../../utils/bracketGenerator';
import { 
  generateEnhancedScoresheet, 
  previewEnhancedScoresheet,
  downloadRoundScoresheets,
  downloadTournamentScoresheets 
} from '../../../../utils/enhancedScoresheetGenerator';

const KnockoutBracket = ({ 
  bracket, 
  isLocked, 
  onTeamUpdate, 
  onScoreUpdate, 
  className = '',
  tournament = null,
  onBracketSizeChange = null
}) => {
  // Memoize bracket to prevent flickering - this is the key fix
  const displayBracket = useMemo(() => {
    // Return existing bracket if it has valid data
    if (bracket && bracket.matches && bracket.matches.length > 0) {
      return bracket;
    }
    // Generate placeholder only if no valid bracket exists
    const size = tournament?.maxParticipants || 8;
    return generatePlaceholderBracket(size, 'knockout');
  }, [bracket?.matches?.length, tournament?.maxParticipants]); // More stable dependency
  
  if (!displayBracket) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-500">
          <FaTrophy className="mx-auto mb-2 text-2xl" />
          <p>Unable to generate bracket</p>
        </div>
      </div>
    );
  }

  // Extract values from memoized bracket
  const { matches, rounds, champion } = displayBracket;

  // Memoize matches by round to prevent recalculation
  const matchesByRound = useMemo(() => {
    return matches.reduce((acc, match) => {
      const round = match.round || 1;
      if (!acc[round]) acc[round] = [];
      acc[round].push(match);
      return acc;
    }, {});
  }, [matches]);

  // Memoize calculated values
  const { totalRounds, currentSize, bracketSizes } = useMemo(() => {
    const total = rounds?.length || Object.keys(matchesByRound).length;
    const sizes = [4, 8, 16, 32, 64];
    const current = displayBracket.size || 8;
    
    return {
      totalRounds: total,
      currentSize: current,
      bracketSizes: sizes
    };
  }, [rounds, matchesByRound, displayBracket.size]);

  // Memoize round name function
  const getRoundName = useMemo(() => {
    return (roundIndex, totalRounds) => {
      const roundsFromEnd = totalRounds - roundIndex;
      switch (roundsFromEnd) {
        case 1: return 'Final';
        case 2: return 'Semi-Final';
        case 3: return 'Quarter-Final';
        case 4: return 'Round of 16';
        case 5: return 'Round of 32';
        default: return `Round ${roundIndex + 1}`;
      }
    };
  }, []);

  // Memoize sorted rounds for rendering
  const sortedRounds = useMemo(() => {
    return Object.entries(matchesByRound).sort(([a], [b]) => parseInt(a) - parseInt(b));
  }, [matchesByRound]);

  // Enhanced scoresheet download functions
  const downloadAllRoundScoresheets = async () => {
    try {
      // Get current round matches (first round by default)
      const currentRound = 1;
      const roundMatches = matchesByRound[currentRound] || [];
      
      if (roundMatches.length === 0) {
        alert('No matches found for current round');
        return;
      }

      await downloadRoundScoresheets(roundMatches, tournament, {
        format: 'blank',
        schoolBranding: null // Use default branding for now
      });
    } catch (error) {
      console.error('Failed to download round scoresheets:', error);
      alert('Failed to download scoresheets. Please try again.');
    }
  };

  const downloadAllTournamentScoresheets = async () => {
    try {
      if (matches.length === 0) {
        alert('No matches found in tournament');
        return;
      }

      await downloadTournamentScoresheets(matches, tournament, {
        format: 'blank',
        schoolBranding: null // Use default branding for now
      });
    } catch (error) {
      console.error('Failed to download tournament scoresheets:', error);
      alert('Failed to download scoresheets. Please try again.');
    }
  };

  // --- Modern Premium Bracket Layout ---
  return (
    <div 
      key={`bracket-${currentSize}`}
      className={`knockout-bracket-container bg-gradient-to-br from-slate-50 to-gray-100 px-4 py-8 ${className}`}
    >
      {/* Premium Tournament Header */}
      <div className="tournament-header bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 mb-8 border border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-3 rounded-2xl shadow-lg">
                <FaTrophy className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-800 tracking-tight">
                  {tournament?.name || 'Tournament Bracket'}
                </h1>
                <p className="text-gray-500 font-medium mt-1">
                  {currentSize} Teams • Single Elimination
                </p>
              </div>
            </div>
          </div>
          {!isLocked && onBracketSizeChange && (
            <div className="flex items-center gap-3">
              <label className="text-lg font-bold text-gray-700">Teams:</label>
              <select
                value={currentSize}
                onChange={(e) => onBracketSizeChange(parseInt(e.target.value))}
                className="px-6 py-3 border-2 border-gray-200 rounded-xl text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
              >
                {bracketSizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          )}
          
          {/* Bulk Download Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadAllRoundScoresheets()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              title="Download all scoresheets for current round"
            >
              <FaDownload className="text-sm" />
              <span className="font-medium">Round Scoresheets</span>
            </button>
            <button
              onClick={() => downloadAllTournamentScoresheets()}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
              title="Download all tournament scoresheets"
            >
              <FaFileAlt className="text-sm" />
              <span className="font-medium">All Scoresheets</span>
            </button>
          </div>
        </div>
      </div>

      {/* Champion Display */}
      {champion && (
        <motion.div
          className="champion-display mb-8 text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="inline-flex items-center gap-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white px-12 py-6 rounded-2xl shadow-2xl">
            <FaTrophy className="text-4xl" />
            <div className="text-left">
              <div className="text-sm font-semibold opacity-90 uppercase tracking-wide">Champion</div>
              <div className="text-2xl font-black">{champion.name}</div>
              <div className="text-sm opacity-80">{champion.school}</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Modern Bracket Container */}
      <div className="bracket-container bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 overflow-x-auto border border-white/30">
        {/* Compact Round Headers */}
        <div className="round-headers flex justify-center gap-2 mb-4">
          {rounds && rounds.length > 0 ? rounds.map((round, idx) => (
            <div key={idx} className="flex flex-col items-center" style={{ width: '160px' }}>
              <div className={`
                px-4 py-2 rounded-lg font-bold text-sm shadow-md border transition-all
                ${idx === rounds.length - 1 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-purple-500' 
                  : 'bg-white text-gray-800 border-gray-200 hover:border-gray-300'
                }
              `}>
                {round.name}
              </div>
              {round.date && (
                <div className={`text-xs mt-1 font-medium ${
                  idx === rounds.length - 1 ? 'text-purple-600' : 'text-gray-500'
                }`}>
                  {round.date}
                </div>
              )}
            </div>
          )) : (
            sortedRounds.map(([roundNum, matches], idx) => (
              <div key={roundNum} className="flex flex-col items-center" style={{ width: '160px' }}>
                <div className={`
                  px-4 py-2 rounded-lg font-bold text-sm shadow-md border transition-all
                  ${idx === sortedRounds.length - 1 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-purple-500' 
                    : 'bg-white text-gray-800 border-gray-200 hover:border-gray-300'
                  }
                `}>
                  {getRoundName(idx, sortedRounds.length)}
                </div>
                <div className={`text-xs mt-1 font-medium ${
                  idx === sortedRounds.length - 1 ? 'text-purple-600' : 'text-gray-500'
                }`}>
                  {matches.length} {matches.length === 1 ? 'Match' : 'Matches'}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Compact Bracket Grid */}
        <div className="bracket-grid-container relative">
          <div className="bracket-grid flex justify-center items-center gap-4" style={{ minHeight: '320px' }}>
            {sortedRounds.map(([roundNum, roundMatches], roundIndex) => (
              <div 
                key={roundNum} 
                className="bracket-round flex flex-col justify-center items-center"
                style={{ 
                  width: '160px',
                  gap: `${Math.max(16, 80 / Math.pow(2, roundIndex))}px`
                }}
              >
                {roundMatches.map((match, matchIndex) => (
                  <CompactBracketMatch
                    key={`match-${match.id}-${match.round}`}
                    match={match}
                    isLocked={isLocked}
                    onTeamUpdate={onTeamUpdate}
                    onScoreUpdate={onScoreUpdate}
                    tournament={tournament}
                    roundIndex={roundIndex}
                    totalRounds={totalRounds}
                    matchIndex={matchIndex}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Tournament Statistics */}
      <TournamentStatistics matches={matches} totalRounds={totalRounds} />
    </div>
  );
}

// Compact Bracket Match Component - Smaller and tightly packed
const CompactBracketMatch = React.memo(({ 
  match, 
  isLocked, 
  onTeamUpdate, 
  onScoreUpdate, 
  tournament,
  roundIndex,
  totalRounds,
  matchIndex
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [newTeamName, setNewTeamName] = useState('');

  // Memoize winner calculation to prevent recalculation
  const winnerIndex = useMemo(() => {
    if (match.status !== 'completed' || !match.teams || match.teams.length < 2) {
      return null;
    }
    
    const team1Score = match.teams[0]?.score || 0;
    const team2Score = match.teams[1]?.score || 0;
    
    if (team1Score > team2Score) return 0;
    if (team2Score > team1Score) return 1;
    return null;
  }, [match.status, match.teams]);

  // Memoize derived values
  const isFinalMatch = useMemo(() => {
    return roundIndex === totalRounds - 1;
  }, [roundIndex, totalRounds]);

  // Memoize school logo generation
  const generateSchoolLogo = useMemo(() => {
    return (schoolName) => {
      if (!schoolName || schoolName === 'TBD') return null;
      const colors = ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500'];
      const colorIndex = schoolName.charCodeAt(0) % colors.length;
      const initials = schoolName.split(' ').map(word => word[0]).join('').substring(0, 2);
      
      return (
        <div className={`w-6 h-6 rounded-lg ${colors[colorIndex]} flex items-center justify-center text-white font-bold text-xs shadow-sm`}>
          {initials}
        </div>
      );
    };
  }, []);

  // Event handlers
  const handleTeamEdit = (teamIndex) => {
    if (isLocked) return;
    setEditingTeam(teamIndex);
    setNewTeamName(match.teams[teamIndex]?.name || '');
    setIsEditing(true);
  };

  const handleSaveTeam = () => {
    if (onTeamUpdate && editingTeam !== null) {
      onTeamUpdate(match.id, editingTeam, newTeamName);
    }
    setIsEditing(false);
    setEditingTeam(null);
    setNewTeamName('');
  };

  const handleScoreChange = (teamIndex, newScore) => {
    if (isLocked || !onScoreUpdate) return;
    onScoreUpdate(match.id, teamIndex, newScore);
  };

  const handlePreviewScoresheet = async () => {
    try {
      await previewEnhancedScoresheet(match, tournament);
    } catch (error) {
      console.error('Failed to preview scoresheet:', error);
    }
  };

  const handleDownloadScoresheet = async () => {
    try {
      await generateEnhancedScoresheet(match, tournament);
    } catch (error) {
      console.error('Failed to download scoresheet:', error);
    }
  };

  return (
    <motion.div 
      className="compact-bracket-match relative"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* Compact Match Container */}
      <div className={`
        match-container relative bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border transition-all duration-200 overflow-hidden
        ${match.status === 'completed' ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50' : 'border-gray-200'}
        ${isFinalMatch ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50' : ''}
        ${match.status === 'in_progress' ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-cyan-50' : ''}
        hover:shadow-xl hover:border-gray-300
      `} style={{
        width: '150px',
        minHeight: '100px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
      }}>
        
        {/* Compact Match Header */}
        <div className={`
          match-header px-2 py-1 text-center relative
          ${match.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-gray-500 to-gray-600'}
          ${isFinalMatch ? 'bg-gradient-to-r from-yellow-500 to-orange-600' : ''}
          ${match.status === 'in_progress' ? 'bg-gradient-to-r from-blue-500 to-cyan-600' : ''}
        `}>
          <div className="text-white font-bold text-xs">
            Match {match.id}
          </div>
          
          {/* Status Badge */}
          <div className="absolute top-0.5 right-1">
            {match.status === 'completed' && <FaCheckCircle className="text-white text-xs" />}
            {match.status === 'in_progress' && <FaClock className="text-white text-xs animate-pulse" />}
          </div>
        </div>

        {/* Compact Teams */}
        <div className="teams-container p-2 space-y-1">
          {match.teams.map((team, index) => (
            <div
              key={`team-${match.id}-${index}`}
              className={`
                team-card flex items-center justify-between p-2 rounded-md border transition-all duration-200 cursor-pointer
                ${winnerIndex === index ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-300' : 'bg-white/80 border-gray-200'}
                ${winnerIndex !== null && winnerIndex !== index ? 'opacity-60' : ''}
                hover:bg-gray-50 hover:border-gray-300
              `}
              onClick={() => !isLocked && handleTeamEdit(index)}
            >
              {/* Compact Team Info */}
              <div className="team-info flex items-center gap-2 flex-1 min-w-0">
                {/* School Logo */}
                {generateSchoolLogo(team.school)}
                
                <div className="team-details flex-1 min-w-0">
                  {isEditing && editingTeam === index ? (
                    <input
                      type="text"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      onBlur={handleSaveTeam}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveTeam()}
                      className="w-full px-1 py-0.5 border border-blue-400 rounded text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                  ) : (
                    <>
                      <div className="team-name font-bold text-gray-900 text-xs truncate">
                        {team.name || 'TBD'}
                      </div>
                      <div className="team-school text-xs text-gray-500 truncate">
                        {team.school || 'School TBD'}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Compact Score */}
              <div className="team-score flex items-center gap-1">
                <div className={`
                  score-display w-7 h-7 rounded-md flex items-center justify-center font-bold text-sm shadow-sm border
                  ${winnerIndex === index ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-yellow-300' : 'bg-gray-100 text-gray-700 border-gray-300'}
                `}>
                  {match.status === 'completed' ? (
                    team.score || 0
                  ) : (
                    <input
                      type="number"
                      value={team.score || 0}
                      onChange={(e) => handleScoreChange(index, parseInt(e.target.value) || 0)}
                      className="w-full h-full bg-transparent text-center font-bold text-sm focus:outline-none"
                      min="0"
                      disabled={isLocked}
                    />
                  )}
                </div>
                
                {/* Winner Trophy */}
                {winnerIndex === index && (
                  <FaTrophy className="text-yellow-500 text-sm" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Compact Match Actions */}
        <div className="match-actions px-2 py-1 bg-gray-50/80 backdrop-blur-sm border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="match-status">
              {match.status === 'completed' && (
                <div className="flex items-center gap-1 text-green-600 font-bold">
                  <FaCheckCircle className="text-xs" />
                  <span className="text-xs">Done</span>
                </div>
              )}
              {match.status === 'in_progress' && (
                <div className="flex items-center gap-1 text-blue-600 font-bold">
                  <FaClock className="text-xs" />
                  <span className="text-xs">Live</span>
                </div>
              )}
              {match.status === 'upcoming' && (
                <div className="flex items-center gap-1 text-gray-500">
                  <FaUsers className="text-xs" />
                  <span className="text-xs">TBD</span>
                </div>
              )}
            </div>

            <div className="action-buttons flex items-center gap-1">
              <button
                onClick={handlePreviewScoresheet}
                className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                title="Preview Scoresheet"
              >
                <FaEye className="text-xs" />
              </button>
              <button
                onClick={handleDownloadScoresheet}
                className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                title="Download Scoresheet"
              >
                <FaDownload className="text-xs" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Connection Lines */}
      {roundIndex < totalRounds - 1 && (
        <div className="absolute top-1/2 -right-2 w-4 h-0.5 bg-gradient-to-r from-gray-300 to-blue-400 rounded-full transform -translate-y-1/2" />
      )}
    </motion.div>
  );
});

// Premium Bracket Match Component - Memoized to prevent flickering
const PremiumBracketMatch = React.memo(({ 
  match, 
  isLocked, 
  onTeamUpdate, 
  onScoreUpdate, 
  tournament,
  roundIndex,
  totalRounds,
  matchIndex
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [newTeamName, setNewTeamName] = useState('');

  // Memoize winner calculation to prevent recalculation
  const winnerIndex = useMemo(() => {
    if (match.status !== 'completed' || !match.teams || match.teams.length < 2) {
      return null;
    }
    
    const team1Score = match.teams[0]?.score || 0;
    const team2Score = match.teams[1]?.score || 0;
    
    if (team1Score > team2Score) return 0;
    if (team2Score > team1Score) return 1;
    return null;
  }, [match.status, match.teams]);

  // Memoize derived values
  const { isLastRound, isFinalMatch } = useMemo(() => {
    const isLast = roundIndex === totalRounds - 1;
    return {
      isLastRound: isLast,
      isFinalMatch: isLast
    };
  }, [roundIndex, totalRounds]);

  // Memoize school logo generation
  const generateSchoolLogo = useMemo(() => {
    return (schoolName) => {
      if (!schoolName) return null;
      const colors = ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500'];
      const colorIndex = schoolName.charCodeAt(0) % colors.length;
      const initials = schoolName.split(' ').map(word => word[0]).join('').substring(0, 2);
      
      return (
        <div className={`w-10 h-10 rounded-xl ${colors[colorIndex]} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
          {initials}
        </div>
      );
    };
  }, []);

  // Event handlers
  const handleTeamEdit = (teamIndex) => {
    if (isLocked) return;
    setEditingTeam(teamIndex);
    setNewTeamName(match.teams[teamIndex]?.name || '');
    setIsEditing(true);
  };

  const handleSaveTeam = () => {
    if (onTeamUpdate && editingTeam !== null) {
      onTeamUpdate(match.id, editingTeam, newTeamName);
    }
    setIsEditing(false);
    setEditingTeam(null);
    setNewTeamName('');
  };

  const handleScoreChange = (teamIndex, newScore) => {
    if (isLocked || !onScoreUpdate) return;
    onScoreUpdate(match.id, teamIndex, newScore);
  };

  const handlePreviewScoresheet = async () => {
    try {
      await previewEnhancedScoresheet(match, tournament);
    } catch (error) {
      console.error('Failed to preview scoresheet:', error);
    }
  };

  const handleDownloadScoresheet = async () => {
    try {
      await generateEnhancedScoresheet(match, tournament);
    } catch (error) {
      console.error('Failed to download scoresheet:', error);
    }
  };

  return (
    <motion.div 
      className="premium-bracket-match relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.3 }}
    >
      {/* Match Container */}
      <div className={`
        match-container relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border-2 transition-all duration-300 overflow-hidden
        ${match.status === 'completed' ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50' : 'border-gray-200'}
        ${isFinalMatch ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50' : ''}
        ${match.status === 'in_progress' ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-cyan-50' : ''}
        hover:shadow-2xl hover:border-gray-300
      `} style={{
        width: '280px',
        minHeight: '160px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        
        {/* Match Header */}
        <div className={`
          match-header px-4 py-3 text-center relative
          ${match.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-gray-500 to-gray-600'}
          ${isFinalMatch ? 'bg-gradient-to-r from-yellow-500 to-orange-600' : ''}
          ${match.status === 'in_progress' ? 'bg-gradient-to-r from-blue-500 to-cyan-600' : ''}
        `}>
          <div className="text-white font-bold text-sm uppercase tracking-wide">
            Match {match.id}
          </div>
          <div className="text-white/80 text-xs mt-1">
            {match.date ? new Date(match.date).toLocaleDateString() : 'TBD'} • {match.time || 'TBD'}
          </div>
          
          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            {match.status === 'completed' && <FaCheckCircle className="text-white text-lg" />}
            {match.status === 'in_progress' && <FaClock className="text-white text-lg animate-pulse" />}
          </div>
        </div>

        {/* Teams */}
        <div className="teams-container p-4 space-y-3">
          {match.teams.map((team, index) => (
            <div
              key={`team-${match.id}-${index}`}
              className={`
                team-card flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer
                ${winnerIndex === index ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-300' : 'bg-white/80 border-gray-200'}
                ${winnerIndex !== null && winnerIndex !== index ? 'opacity-60' : ''}
                hover:bg-gray-50 hover:border-gray-300
              `}
              onClick={() => !isLocked && handleTeamEdit(index)}
            >
              {/* Team Info */}
              <div className="team-info flex items-center gap-3 flex-1">
                {/* School Logo */}
                {generateSchoolLogo(team.school)}
                
                <div className="team-details flex-1">
                  {isEditing && editingTeam === index ? (
                    <input
                      type="text"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      onBlur={handleSaveTeam}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveTeam()}
                      className="w-full px-3 py-2 border-2 border-blue-400 rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  ) : (
                    <>
                      <div className="team-name font-bold text-gray-900 text-lg">
                        {team.name || 'Team TBD'}
                      </div>
                      <div className="team-school text-sm text-gray-600 flex items-center gap-1">
                        <FaUniversity className="text-xs" />
                        {team.school || 'School TBD'}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Score */}
              <div className="team-score flex items-center gap-2">
                <div className={`
                  score-display w-16 h-16 rounded-xl flex items-center justify-center font-black text-2xl shadow-lg border-2
                  ${winnerIndex === index ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-yellow-300' : 'bg-gray-100 text-gray-700 border-gray-300'}
                `}>
                  {match.status === 'completed' ? (
                    team.score || 0
                  ) : (
                    <input
                      type="number"
                      value={team.score || 0}
                      onChange={(e) => handleScoreChange(index, parseInt(e.target.value) || 0)}
                      className="w-full h-full bg-transparent text-center font-black text-2xl focus:outline-none"
                      min="0"
                      disabled={isLocked}
                    />
                  )}
                </div>
                
                {/* Winner Trophy */}
                {winnerIndex === index && (
                  <FaTrophy className="text-yellow-500 text-xl animate-bounce" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Match Actions */}
        <div className="match-actions p-4 bg-gray-50/80 backdrop-blur-sm border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="match-status">
              {match.status === 'completed' && (
                <div className="flex items-center gap-2 text-green-600 font-bold">
                  <FaCheckCircle />
                  <span className="text-sm">Completed</span>
                </div>
              )}
              {match.status === 'in_progress' && (
                <div className="flex items-center gap-2 text-blue-600 font-bold">
                  <FaClock />
                  <span className="text-sm">Live</span>
                </div>
              )}
              {match.status === 'upcoming' && (
                <div className="flex items-center gap-2 text-gray-500">
                  <FaUsers />
                  <span className="text-sm">Upcoming</span>
                </div>
              )}
            </div>

            <div className="action-buttons flex items-center gap-2">
              <button
                onClick={handlePreviewScoresheet}
                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                title="Preview Scoresheet"
              >
                <FaEye className="text-sm" />
              </button>
              <button
                onClick={handleDownloadScoresheet}
                className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                title="Download Scoresheet"
              >
                <FaDownload className="text-sm" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Lines */}
      {roundIndex < totalRounds - 1 && (
        <div className="absolute top-1/2 -right-8 w-16 h-1 bg-gradient-to-r from-gray-300 to-blue-400 rounded-full transform -translate-y-1/2" />
      )}
    </motion.div>
  );
});

// Professional Bracket Match Component
const ProfessionalBracketMatch = ({ 
  match, 
  isLocked, 
  onTeamUpdate, 
  onScoreUpdate, 
  tournament,
  roundIndex,
  totalRounds,
  matchIndex,
  totalMatchesInRound
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [newTeamName, setNewTeamName] = useState('');

  const handleTeamEdit = (teamIndex) => {
    if (isLocked) return;
    setEditingTeam(teamIndex);
    setNewTeamName(match.teams[teamIndex]?.name || '');
    setIsEditing(true);
  };

  const handleSaveTeam = () => {
    if (onTeamUpdate && editingTeam !== null) {
      onTeamUpdate(match.id, editingTeam, newTeamName);
    }
    setIsEditing(false);
    setEditingTeam(null);
    setNewTeamName('');
  };

  const handleScoreChange = (teamIndex, newScore) => {
    if (isLocked || !onScoreUpdate) return;
    onScoreUpdate(match.id, teamIndex, newScore);
  };

  const handleDownloadScoresheet = async () => {
    try {
      await generateEnhancedScoresheet(match, tournament);
    } catch (error) {
      console.error('Failed to download scoresheet:', error);
    }
  };

  const getWinnerIndex = () => {
    if (match.status !== 'completed' || !match.teams || match.teams.length < 2) {
      return null;
    }
    
    const team1Score = match.teams[0]?.score || 0;
    const team2Score = match.teams[1]?.score || 0;
    
    if (team1Score > team2Score) return 0;
    if (team2Score > team1Score) return 1;
    return null;
  };

  const winnerIndex = getWinnerIndex();
  const isLastRound = roundIndex === totalRounds - 1;

  return (
    <motion.div 
      className="professional-bracket-match"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* Match Container with improved positioning */}
      <div className={`
        match-container relative bg-white border-2 rounded-2xl shadow-xl overflow-hidden transition-all duration-200
        ${match.status === 'completed' ? 'border-[#ffb547] bg-gradient-to-br from-[#fffbe6] to-[#fff6e0]' : 'border-gray-200'}
        ${isLastRound ? 'border-[#7b61ff] bg-gradient-to-br from-[#ede7ff] to-[#f6f7fb]' : ''}
        ${match.status === 'in_progress' ? 'border-[#7b61ff] bg-gradient-to-br from-[#e6eaff] to-[#f6f7fb]' : ''}
      `} style={{
        width: '240px',
        margin: '0 auto',
        boxShadow: '0 4px 24px 0 rgba(123,97,255,0.08)',
        zIndex: 10
      }}>
        {/* Match Header */}
        <div className={`
          match-header px-6 py-2 text-xs font-bold text-center tracking-wide uppercase
          ${match.status === 'completed' ? 'bg-[#ffb547] text-white' : 'bg-gray-50 text-gray-600'}
          ${isLastRound ? 'bg-[#7b61ff] text-white' : ''}
          ${match.status === 'in_progress' ? 'bg-[#7b61ff] text-white' : ''}
        `}>
          {match.date ? new Date(match.date).toLocaleDateString() : 'Match'} • {match.time || 'TBD'}
        </div>

        {/* Teams */}
        <div className="teams-container">
          {match.teams.map((team, index) => (
            <div
              key={index}
              className={`
                team-row flex items-center justify-between px-6 py-3 border-b last:border-b-0
                ${winnerIndex === index ? 'bg-[#fffbe6] border-[#ffb547]' : 'bg-white'}
                ${winnerIndex !== null && winnerIndex !== index ? 'opacity-60' : ''}
                hover:bg-[#f6f7fb] transition-colors cursor-pointer
              `}
              onClick={() => !isLocked && handleTeamEdit(index)}
            >
              {/* Team Info */}
              <div className="team-info flex items-center gap-3 flex-1">
                <div className={`
                  team-seed w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shadow-sm
                  ${winnerIndex === index ? 'bg-[#ffb547] text-white' : 'bg-gray-200 text-gray-600'}
                `}>
                  {team.seed || index + 1}
                </div>
                <div className="team-details flex-1">
                  {isEditing && editingTeam === index ? (
                    <input
                      type="text"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      onBlur={handleSaveTeam}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveTeam()}
                      className="w-full px-2 py-1 border border-[#7b61ff] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#7b61ff]"
                      autoFocus
                    />
                  ) : (
                    <>
                      <div className="team-name font-bold text-gray-800 text-base">
                        {team.name || 'Team TBD'}
                      </div>
                      {team.school && (
                        <div className="team-school text-xs text-gray-400">
                          {team.school}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Score */}
              <div className="team-score">
                {match.status === 'completed' ? (
                  <div className={`
                    score-display w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-lg shadow-md
                    ${winnerIndex === index ? 'bg-[#ffb547] text-white' : 'bg-gray-200 text-gray-600'}
                  `}>
                    {team.score || 0}
                  </div>
                ) : (
                  <div className="score-input">
                    <input
                      type="number"
                      value={team.score || 0}
                      onChange={(e) => handleScoreChange(index, parseInt(e.target.value) || 0)}
                      className="w-11 h-11 border border-[#7b61ff] rounded-xl text-center text-base focus:ring-2 focus:ring-[#7b61ff] focus:border-[#7b61ff]"
                      min="0"
                      disabled={isLocked}
                    />
                  </div>
                )}
              </div>

              {/* Winner Icon */}
              {winnerIndex === index && (
                <div className="winner-icon ml-2">
                  <FaTrophy className="text-[#ffb547] text-base drop-shadow" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Match Actions */}
        <div className="match-actions px-6 py-2 bg-[#f6f7fb] flex items-center justify-between border-t border-gray-100">
          <div className="match-status flex items-center gap-2">
            {match.status === 'completed' && (
              <div className="flex items-center gap-1 text-[#ffb547] font-bold">
                <FaCheckCircle className="text-xs" />
                <span className="text-xs">Completed</span>
              </div>
            )}
            {match.status === 'in_progress' && (
              <div className="flex items-center gap-1 text-[#7b61ff] font-bold">
                <FaClock className="text-xs" />
                <span className="text-xs">In Progress</span>
              </div>
            )}
            {match.status === 'upcoming' && (
              <div className="flex items-center gap-1 text-gray-400">
                <span className="text-xs">Upcoming</span>
              </div>
            )}
          </div>

          <div className="action-buttons flex items-center gap-2">
            <button
              onClick={handleDownloadScoresheet}
              className="p-1 text-[#7b61ff] hover:bg-[#ede7ff] rounded transition-colors"
              title="Download Scoresheet"
            >
              <FaDownload className="text-xs" />
            </button>
            {!isLocked && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                title="Edit Match"
              >
                <FaEdit className="text-xs" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bracket Stats */}
      <div className="bracket-stats mt-2 text-center">
        <div className="text-xs text-gray-400">
          {match.venue && `${match.venue} • `}
          Match #{match.id}
        </div>
      </div>
    </motion.div>
  );
};

// Add bracket progression utilities
const getMatchWinner = (match) => {
  if (match.status !== 'completed' || !match.teams || match.teams.length < 2) {
    return null;
  }
  
  const team1Score = match.teams[0]?.score || 0;
  const team2Score = match.teams[1]?.score || 0;
  
  if (team1Score > team2Score) return { ...match.teams[0], winnerOf: match.id };
  if (team2Score > team1Score) return { ...match.teams[1], winnerOf: match.id };
  return null;
};

const progressBracket = (matches) => {
  const sortedMatches = [...matches].sort((a, b) => a.round - b.round);
  const completedMatches = sortedMatches.filter(m => m.status === 'completed');
  
  // Progress winners to next round
  completedMatches.forEach(match => {
    const winner = getMatchWinner(match);
    if (winner) {
      const nextRoundMatch = findNextRoundMatch(match, sortedMatches);
      if (nextRoundMatch) {
        const teamSlot = getTeamSlot(match, nextRoundMatch);
        if (teamSlot !== -1) {
          nextRoundMatch.teams[teamSlot] = winner;
        }
      }
    }
  });
  
  return sortedMatches;
};

const findNextRoundMatch = (currentMatch, allMatches) => {
  const nextRound = currentMatch.round + 1;
  const nextRoundMatches = allMatches.filter(m => m.round === nextRound);
  
  if (nextRoundMatches.length === 0) return null;
  
  // Simple bracket progression - match 1,2 -> match 1 of next round, match 3,4 -> match 2, etc.
  const nextMatchIndex = Math.floor((currentMatch.id - 1) / 2);
  return nextRoundMatches[nextMatchIndex] || nextRoundMatches[0];
};

const getTeamSlot = (sourceMatch, targetMatch) => {
  // Determine which team slot the winner should go to
  const sourceMatchesInRound = Math.pow(2, sourceMatch.round - 1);
  const sourcePosition = ((sourceMatch.id - 1) % sourceMatchesInRound);
  return sourcePosition % 2;
};

// Tournament Statistics Component - Memoized to prevent flickering
const TournamentStatistics = React.memo(({ matches, totalRounds }) => {
  // Memoize calculations to prevent recalculation
  const stats = useMemo(() => {
    const completedMatches = matches.filter(m => m.status === 'completed').length;
    const inProgressMatches = matches.filter(m => m.status === 'in_progress').length;
    const upcomingMatches = matches.filter(m => m.status === 'upcoming').length;
    const totalMatches = matches.length;
    const completionPercentage = Math.round((completedMatches / totalMatches) * 100);
    
    return {
      completedMatches,
      inProgressMatches,
      upcomingMatches,
      totalMatches,
      completionPercentage,
      statItems: [
        { label: 'Completed', value: completedMatches, color: 'from-green-500 to-emerald-600', icon: FaCheckCircle },
        { label: 'Live', value: inProgressMatches, color: 'from-blue-500 to-cyan-600', icon: FaClock },
        { label: 'Upcoming', value: upcomingMatches, color: 'from-gray-500 to-gray-600', icon: FaUsers },
      ]
    };
  }, [matches]);

  return (
    <div className="tournament-statistics mt-8 bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/30">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-gray-800">Tournament Progress</h2>
        <div className="text-lg font-bold text-gray-600">{stats.completionPercentage}% Complete</div>
      </div>
      
      <div className="progress-bar bg-gray-200 rounded-full h-3 mb-8 overflow-hidden">
        <div 
          className="progress-fill bg-gradient-to-r from-blue-500 to-green-500 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${stats.completionPercentage}%` }}
        />
      </div>
      
      <div className="stats-grid grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.statItems.map((stat, index) => (
          <div key={index} className="stat-card bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/40">
            <div className="flex items-center justify-between mb-3">
              <div className={`bg-gradient-to-r ${stat.color} p-3 rounded-xl`}>
                <stat.icon className="text-white text-xl" />
              </div>
              <div className="text-3xl font-black text-gray-800">{stat.value}</div>
            </div>
            <div className="text-gray-600 font-semibold">{stat.label} Matches</div>
          </div>
        ))}
      </div>
      
      <div className="tournament-info mt-6 grid grid-cols-2 gap-4 text-center">
        <div className="info-item bg-blue-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-600">{totalRounds}</div>
          <div className="text-sm text-blue-500 font-semibold">Total Rounds</div>
        </div>
        <div className="info-item bg-purple-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-purple-600">{stats.totalMatches}</div>
          <div className="text-sm text-purple-500 font-semibold">Total Matches</div>
        </div>
      </div>
    </div>
  );
});

export default KnockoutBracket;
