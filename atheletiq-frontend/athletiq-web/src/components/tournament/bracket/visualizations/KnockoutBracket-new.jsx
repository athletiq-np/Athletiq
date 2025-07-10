// src/components/tournament/bracket/visualizations/KnockoutBracket.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaEdit, FaLock, FaUnlock, FaClock, FaCheckCircle, FaDownload, FaFileAlt } from 'react-icons/fa';
import { generatePlaceholderBracket } from '../../../../utils/bracketGenerator';
import { downloadScoresheet, previewScoresheet } from '../../../../utils/scoresheetGenerator';

const KnockoutBracket = ({ 
  bracket, 
  isLocked, 
  onTeamUpdate, 
  onScoreUpdate, 
  className = '',
  tournament = null,
  onBracketSizeChange = null
}) => {
  // Generate placeholder bracket if no bracket data or if bracket is empty
  const displayBracket = bracket && bracket.matches && bracket.matches.length > 0 
    ? bracket 
    : generatePlaceholderBracket(tournament?.maxParticipants || 8, 'knockout');
  
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

  const { matches, rounds, champion } = displayBracket;
  
  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    const round = match.round || 1;
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {});

  const totalRounds = rounds?.length || Object.keys(matchesByRound).length;
  const bracketSizes = [4, 8, 16, 32, 64];
  const currentSize = displayBracket.size || 8;

  // Get round names in the proper order
  const getRoundName = (roundIndex, totalRounds) => {
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

  return (
    <div className={`knockout-bracket-container bg-gray-50 ${className}`}>
      {/* Tournament Header */}
      <div className="tournament-header bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FaTrophy className="text-yellow-500 text-xl" />
              <h2 className="text-2xl font-bold text-gray-800">
                {tournament?.name || 'Tournament Bracket'}
              </h2>
            </div>
            <div className="text-sm text-gray-500">
              {currentSize} Teams • Knockout Format
            </div>
          </div>
          
          {!isLocked && onBracketSizeChange && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Teams:</label>
              <select
                value={currentSize}
                onChange={(e) => onBracketSizeChange(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {bracketSizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          )}
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
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-8 py-4 rounded-xl shadow-lg">
            <FaTrophy className="text-3xl" />
            <div className="text-left">
              <div className="text-sm font-medium opacity-90">Tournament Champion</div>
              <div className="text-xl font-bold">{champion.name}</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Professional Bracket Layout */}
      <div className="bracket-container bg-white rounded-lg shadow-sm p-8 overflow-x-auto">
        <div className="bracket-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${totalRounds}, 1fr)`,
          gap: '48px',
          minWidth: `${totalRounds * 280}px`
        }}>
          {Object.entries(matchesByRound)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([roundNum, roundMatches], roundIndex) => (
              <div key={roundNum} className="bracket-round">
                {/* Round Header */}
                <div className="round-header mb-8 text-center">
                  <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-semibold text-blue-700">
                      {getRoundName(roundIndex, totalRounds)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {roundMatches.length} {roundMatches.length === 1 ? 'Match' : 'Matches'}
                  </div>
                </div>

                {/* Round Matches */}
                <div className="round-matches space-y-12">
                  {roundMatches.map((match, matchIndex) => (
                    <ProfessionalBracketMatch
                      key={match.id}
                      match={match}
                      isLocked={isLocked}
                      onTeamUpdate={onTeamUpdate}
                      onScoreUpdate={onScoreUpdate}
                      tournament={tournament}
                      roundIndex={roundIndex}
                      totalRounds={totalRounds}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Bracket Legend */}
      <div className="bracket-legend mt-8 flex flex-wrap gap-4 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-200 border border-green-300 rounded"></div>
          <span>Winner</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-200 border border-yellow-300 rounded"></div>
          <span>Final</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-200 border border-blue-300 rounded"></div>
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded"></div>
          <span>Upcoming</span>
        </div>
      </div>

      {/* Bracket Stats */}
      <div className="bracket-stats mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="stat-card bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-2xl font-bold text-blue-600">{matches.length}</div>
          <div className="text-sm text-gray-600">Total Matches</div>
        </div>
        <div className="stat-card bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-2xl font-bold text-green-600">
            {matches.filter(m => m.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="stat-card bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-2xl font-bold text-yellow-600">
            {matches.filter(m => m.status === 'in_progress').length}
          </div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>
        <div className="stat-card bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-2xl font-bold text-gray-600">{totalRounds}</div>
          <div className="text-sm text-gray-600">Rounds</div>
        </div>
      </div>
    </div>
  );
};

// Professional Bracket Match Component
const ProfessionalBracketMatch = ({ 
  match, 
  isLocked, 
  onTeamUpdate, 
  onScoreUpdate, 
  tournament,
  roundIndex,
  totalRounds
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

  const handleDownloadScoresheet = () => {
    downloadScoresheet(match, tournament);
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
      {/* Match Container */}
      <div className={`
        match-container relative bg-white border-2 rounded-lg shadow-md overflow-hidden
        ${match.status === 'completed' ? 'border-green-200' : 'border-gray-200'}
        ${isLastRound ? 'border-yellow-300 bg-yellow-50' : ''}
      `}>
        {/* Match Header */}
        <div className={`
          match-header px-4 py-2 text-xs font-medium text-center
          ${match.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}
          ${isLastRound ? 'bg-yellow-100 text-yellow-800' : ''}
        `}>
          {match.date ? new Date(match.date).toLocaleDateString() : 'Match'} • {match.time || 'TBD'}
        </div>

        {/* Teams */}
        <div className="teams-container">
          {match.teams.map((team, index) => (
            <div
              key={index}
              className={`
                team-row flex items-center justify-between px-4 py-3 border-b last:border-b-0
                ${winnerIndex === index ? 'bg-green-50 border-green-200' : 'bg-white'}
                ${winnerIndex !== null && winnerIndex !== index ? 'opacity-60' : ''}
                hover:bg-gray-50 transition-colors cursor-pointer
              `}
              onClick={() => !isLocked && handleTeamEdit(index)}
            >
              {/* Team Info */}
              <div className="team-info flex items-center gap-3 flex-1">
                <div className={`
                  team-seed w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${winnerIndex === index ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}
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
                      className="w-full px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  ) : (
                    <>
                      <div className="team-name font-semibold text-gray-800 text-sm">
                        {team.name || 'Team TBD'}
                      </div>
                      {team.school && (
                        <div className="team-school text-xs text-gray-500">
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
                    score-display w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg
                    ${winnerIndex === index ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}
                  `}>
                    {team.score || 0}
                  </div>
                ) : (
                  <div className="score-input">
                    <input
                      type="number"
                      value={team.score || 0}
                      onChange={(e) => handleScoreChange(index, parseInt(e.target.value) || 0)}
                      className="w-10 h-10 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      disabled={isLocked}
                    />
                  </div>
                )}
              </div>

              {/* Winner Icon */}
              {winnerIndex === index && (
                <div className="winner-icon ml-2">
                  <FaTrophy className="text-yellow-500 text-sm" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Match Actions */}
        <div className="match-actions px-4 py-2 bg-gray-50 flex items-center justify-between">
          <div className="match-status flex items-center gap-2">
            {match.status === 'completed' && (
              <div className="flex items-center gap-1 text-green-600">
                <FaCheckCircle className="text-xs" />
                <span className="text-xs">Completed</span>
              </div>
            )}
            {match.status === 'in_progress' && (
              <div className="flex items-center gap-1 text-blue-600">
                <FaClock className="text-xs" />
                <span className="text-xs">In Progress</span>
              </div>
            )}
            {match.status === 'upcoming' && (
              <div className="flex items-center gap-1 text-gray-500">
                <span className="text-xs">Upcoming</span>
              </div>
            )}
          </div>

          <div className="action-buttons flex items-center gap-2">
            <button
              onClick={handleDownloadScoresheet}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
              title="Download Scoresheet"
            >
              <FaDownload className="text-xs" />
            </button>
            {!isLocked && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Edit Match"
              >
                <FaEdit className="text-xs" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Connection Lines */}
      {roundIndex < totalRounds - 1 && (
        <div className="connection-line absolute top-1/2 -right-6 w-12 h-0.5 bg-gray-300 transform -translate-y-1/2"></div>
      )}
    </motion.div>
  );
};

export default KnockoutBracket;
