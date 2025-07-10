// src/components/tournament/bracket/BracketManager.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTrophy, FaPlus, FaCog, FaLock, FaUnlock, FaRandom, 
  FaSortAmountDown, FaEdit, FaTrash, FaEye, FaDownload,
  FaUsers, FaCalendarAlt, FaFlag, FaInfoCircle, FaFileAlt
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { BRACKET_TYPES, BRACKET_TYPE_CONFIG, TEAM_ASSIGNMENT_MODES, BRACKET_STATUS } from './BracketTypes';
import { BracketGenerator } from './generators/BracketGenerator';
import BracketVisualization from './BracketVisualization';
import BracketSettings from './components/BracketSettings';
import TeamAssignmentModal from './components/TeamAssignmentModal';
import { generateBracketFromType } from '../../../utils/bracketGenerator';
import { downloadScoresheet } from '../../../utils/scoresheetGenerator';

export default function BracketManager({ 
  tournament, 
  sport,
  teams = [],
  onBracketUpdate,
  onTeamUpdate,
  onMatchUpdate,
  className = ''
}) {
  const [bracket, setBracket] = useState(null);
  const [bracketType, setBracketType] = useState(BRACKET_TYPES.KNOCKOUT);
  const [teamAssignmentMode, setTeamAssignmentMode] = useState(TEAM_ASSIGNMENT_MODES.RANDOM);
  const [numTeams, setNumTeams] = useState(8);
  const [isLocked, setIsLocked] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTeamAssignment, setShowTeamAssignment] = useState(false);
  const [bracketStatus, setBracketStatus] = useState(BRACKET_STATUS.SETUP);
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  // Generate placeholder bracket when component mounts or when teams are empty
  useEffect(() => {
    if (!bracket || (teams.length === 0 && showPlaceholder)) {
      const placeholderBracket = generateBracketFromType('knockout', numTeams);
      setBracket(placeholderBracket);
    }
  }, [teams.length, showPlaceholder, numTeams]); // Removed 'bracket' to prevent infinite loop

  // Generate bracket
  const generateBracket = async () => {
    setIsGenerating(true);
    
    try {
      // Use provided teams or generate dummy teams
      const bracketTeams = teams.length > 0 ? teams : BracketGenerator.generateDummyTeams(numTeams);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const generatedBracket = BracketGenerator.generateBracket(bracketType, bracketTeams, {
        assignmentMode: teamAssignmentMode,
        simulateResults: true,
        tournament,
        sport
      });
      
      setBracket(generatedBracket);
      setBracketStatus(BRACKET_STATUS.SETUP);
      
      // Notify parent component
      if (onBracketUpdate) {
        onBracketUpdate(generatedBracket);
      }
      
      toast.success('Bracket generated successfully!');
    } catch (error) {
      console.error('Error generating bracket:', error);
      toast.error('Failed to generate bracket');
    } finally {
      setIsGenerating(false);
    }
  };

  // Lock/unlock bracket
  const toggleBracketLock = () => {
    const newLockState = !isLocked;
    setIsLocked(newLockState);
    
    if (newLockState) {
      setBracketStatus(BRACKET_STATUS.LOCKED);
      toast.success('Bracket locked - ready for competition!');
    } else {
      setBracketStatus(BRACKET_STATUS.SETUP);
      toast.success('Bracket unlocked - teams can be modified');
    }
  };

  // Handle team assignment
  const handleTeamAssignment = (mode) => {
    setTeamAssignmentMode(mode);
    if (bracket) {
      generateBracket();
    }
  };

  // Handle bracket type change
  const handleBracketTypeChange = (type) => {
    setBracketType(type);
    if (bracket) {
      generateBracket();
    }
  };

  // Handle match update
  const handleMatchUpdate = (updatedMatch) => {
    if (!bracket || isLocked) return;
    
    // Update bracket with new match data
    const updatedBracket = { ...bracket };
    
    // Find and update the match in the bracket structure
    // This is a simplified implementation - in a real app, you'd have more sophisticated state management
    if (updatedBracket.rounds) {
      updatedBracket.rounds.forEach(round => {
        const matchIndex = round.matches.findIndex(m => m.id === updatedMatch.id);
        if (matchIndex !== -1) {
          round.matches[matchIndex] = updatedMatch;
        }
      });
    }
    
    setBracket(updatedBracket);
    
    if (onMatchUpdate) {
      onMatchUpdate(updatedMatch);
    }
    
    toast.success('Match updated successfully!');
  };

  // Handle bracket reset
  const handleBracketReset = () => {
    setBracket(null);
    setIsLocked(false);
    setBracketStatus(BRACKET_STATUS.SETUP);
    toast.success('Bracket reset');
  };

  // Handle scoresheet download
  const handleDownloadScoresheet = (match) => {
    try {
      downloadScoresheet(match, tournament);
      toast.success('Scoresheet downloaded successfully!');
    } catch (error) {
      console.error('Error downloading scoresheet:', error);
      toast.error('Failed to download scoresheet');
    }
  };

  // Handle batch scoresheet download
  const handleDownloadAllScoresheets = () => {
    if (!bracket || !bracket.matches) return;
    
    try {
      bracket.matches.forEach((match, index) => {
        setTimeout(() => {
          downloadScoresheet(match, tournament);
        }, index * 500); // Stagger downloads
      });
      toast.success('All scoresheets downloaded successfully!');
    } catch (error) {
      console.error('Error downloading scoresheets:', error);
      toast.error('Failed to download all scoresheets');
    }
  };

  // Auto-generate bracket on mount
  useEffect(() => {
    if (teams.length > 0 && !bracket) {
      setNumTeams(teams.length);
      generateBracket();
    }
  }, [teams, bracket]); // Added bracket to dependencies and check to prevent infinite calls

  return (
    <div className={`bracket-manager ${className}`}>
      {/* Bracket Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">Bracket Management</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              bracketStatus === BRACKET_STATUS.LOCKED 
                ? 'bg-red-100 text-red-800'
                : bracketStatus === BRACKET_STATUS.IN_PROGRESS
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {bracketStatus.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Download All Scoresheets Button */}
            <button
              onClick={handleDownloadAllScoresheets}
              className="p-2 text-blue-600 hover:text-blue-900 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
              title="Download All Scoresheets"
              disabled={!bracket || !bracket.matches}
            >
              <FaFileAlt className="w-4 h-4" />
            </button>
            
            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Bracket Settings"
            >
              <FaCog className="w-4 h-4" />
            </button>
            
            {/* Team Assignment Button */}
            <button
              onClick={() => setShowTeamAssignment(true)}
              className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Team Assignment"
              disabled={isLocked}
            >
              <FaUsers className="w-4 h-4" />
            </button>
            
            {/* Lock/Unlock Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleBracketLock}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isLocked
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isLocked ? (
                <div className="flex items-center gap-2">
                  <FaUnlock className="w-4 h-4" />
                  Unlock
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FaLock className="w-4 h-4" />
                  Lock
                </div>
              )}
            </motion.button>
            
            {/* Generate/Regenerate Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={generateBracket}
              disabled={isGenerating || isLocked}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <FaTrophy className="w-4 h-4" />
                  {bracket ? 'Regenerate' : 'Generate'} Bracket
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Bracket Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6"
            >
              <BracketSettings
                bracketType={bracketType}
                onBracketTypeChange={handleBracketTypeChange}
                teamAssignmentMode={teamAssignmentMode}
                onTeamAssignmentModeChange={handleTeamAssignment}
                numTeams={numTeams}
                onNumTeamsChange={setNumTeams}
                isLocked={isLocked}
                teams={teams}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bracket Info */}
        {bracket && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <FaInfoCircle className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">
                {BRACKET_TYPE_CONFIG.find(t => t.value === bracket.type)?.label || 'Tournament Bracket'}
              </span>
            </div>
            <p className="text-sm text-blue-700 mb-2">
              {BRACKET_TYPE_CONFIG.find(t => t.value === bracket.type)?.description || 'Interactive tournament bracket with placeholder teams'}
            </p>
            {teams.length === 0 && (
              <div className="text-sm text-blue-600 border-t border-blue-200 pt-2">
                <p>📋 <strong>Placeholder Mode:</strong> This bracket shows the tournament structure even without registered teams.</p>
                <p>🖱️ <strong>Click any match</strong> to download a blank scoresheet with team placeholders.</p>
                <p>📝 <strong>Team Registration:</strong> Once teams register, they'll automatically populate the bracket.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bracket Visualization */}
      <BracketVisualization
        bracket={bracket}
        tournament={tournament}
        sport={sport}
        isLocked={isLocked}
        onBracketUpdate={onBracketUpdate}
        onMatchUpdate={handleMatchUpdate}
        onTeamUpdate={onTeamUpdate}
        onDownloadScoresheet={handleDownloadScoresheet}
      />

      {/* Team Assignment Modal */}
      <AnimatePresence>
        {showTeamAssignment && (
          <TeamAssignmentModal
            teams={teams}
            bracket={bracket}
            onClose={() => setShowTeamAssignment(false)}
            onSave={(updatedTeams) => {
              // Handle team assignment save
              console.log('Teams assigned:', updatedTeams);
              setShowTeamAssignment(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
