// src/components/tournament/bracket/components/BracketMatch.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaEdit, FaLock, FaUnlock, FaClock, FaCheckCircle, FaDownload, FaFileAlt } from 'react-icons/fa';
import { downloadScoresheet, previewScoresheet } from '../../../../utils/scoresheetGenerator';

const BracketMatch = ({ 
  match, 
  isLocked = false, 
  onTeamUpdate, 
  onScoreUpdate, 
  showScore = true,
  size = 'md',
  className = '',
  tournament = null
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

  const handlePreviewScoresheet = () => {
    previewScoresheet(match, tournament);
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1 min-w-[120px]';
      case 'lg':
        return 'text-base px-4 py-3 min-w-[200px]';
      default:
        return 'text-sm px-3 py-2 min-w-[160px]';
    }
  };

  const getStatusIcon = () => {
    if (match.status === 'completed') {
      return <FaCheckCircle className="text-green-500" />;
    }
    if (match.status === 'in_progress') {
      return <FaClock className="text-blue-500" />;
    }
    return null;
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

  return (
    <motion.div 
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 
        ${getSizeClasses()} 
        ${className}
      `}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Match Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {match.round ? `Round ${match.round}` : 'Match'}
          </span>
          {getStatusIcon()}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDownloadScoresheet}
            className="text-xs text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
            title="Download Football Scoresheet"
          >
            <FaDownload />
          </button>
          <button
            onClick={handlePreviewScoresheet}
            className="text-xs text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition-colors"
            title="Preview Scoresheet"
          >
            <FaFileAlt />
          </button>
          {isLocked ? (
            <FaLock className="text-xs text-gray-400" />
          ) : (
            <FaUnlock className="text-xs text-gray-400" />
          )}
          {!isLocked && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              <FaEdit />
            </button>
          )}
        </div>
      </div>

      {/* Teams */}
      <div className="space-y-1">
        {match.teams?.map((team, index) => (
          <div
            key={index}
            className={`
              flex items-center justify-between p-2 rounded 
              ${winnerIndex === index ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}
              ${!team && 'bg-gray-100 text-gray-400'}
            `}
          >
            <div className="flex items-center gap-2">
              {winnerIndex === index && (
                <FaTrophy className="text-yellow-500 text-xs" />
              )}
              {isEditing && editingTeam === index ? (
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  onBlur={handleSaveTeam}
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveTeam()}
                  className="text-xs bg-white border border-gray-300 rounded px-1 py-0.5 flex-1"
                  autoFocus
                />
              ) : (
                <span
                  className={`
                    cursor-pointer hover:text-blue-600 flex-1
                    ${!team?.name ? 'text-gray-400 italic' : ''}
                  `}
                  onClick={() => handleTeamEdit(index)}
                >
                  {team?.name || 'Team TBD'}
                </span>
              )}
            </div>
            
            {showScore && team && (
              <div className="flex items-center gap-1">
                {!isLocked && match.status !== 'completed' ? (
                  <input
                    type="number"
                    value={team.score || 0}
                    onChange={(e) => handleScoreChange(index, parseInt(e.target.value) || 0)}
                    className="w-12 text-xs text-center border border-gray-300 rounded px-1 py-0.5"
                    min="0"
                  />
                ) : (
                  <span className="text-sm font-medium">
                    {team.score || 0}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Match Info */}
      {match.date && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            {new Date(match.date).toLocaleDateString()}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default BracketMatch;
