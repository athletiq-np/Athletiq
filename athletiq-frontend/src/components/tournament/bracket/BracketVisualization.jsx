// src/components/tournament/bracket/BracketVisualization.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTrophy, FaMedal, FaEye, FaEdit, FaLock, FaUnlock, 
  FaExpand, FaCompress, FaPrint, FaDownload, FaCog,
  FaUsers, FaCalendarAlt, FaMapMarkerAlt, FaFlag
} from 'react-icons/fa';
import { BRACKET_TYPES } from './BracketTypes';
import KnockoutBracket from './visualizations/KnockoutBracket';
import DoubleEliminationBracket from './visualizations/DoubleEliminationBracket';
import RoundRobinBracket from './visualizations/RoundRobinBracket';
import GroupKnockoutBracket from './visualizations/GroupKnockoutBracket';
import CustomHeatsBracket from './visualizations/CustomHeatsBracket';
import BracketMatch from './components/BracketMatch';

export default function BracketVisualization({ 
  bracket, 
  tournament, 
  sport,
  isLocked = false, 
  onBracketUpdate, 
  onMatchUpdate,
  onTeamUpdate,
  className = ''
}) {
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle match update
  const handleMatchUpdate = (matchId, teamIndex, newScore) => {
    if (onMatchUpdate) {
      onMatchUpdate(matchId, teamIndex, newScore);
    }
  };

  // Handle zoom
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleZoomReset = () => setZoom(1);

  // Handle fullscreen
  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle export
  const handleExport = () => {
    // Implementation for exporting bracket as PDF/PNG
    console.log('Exporting bracket...');
  };

  // Render appropriate bracket type
  const renderBracket = () => {
    const bracketProps = {
      bracket,
      isLocked,
      onTeamUpdate,
      onScoreUpdate: handleMatchUpdate,
      className: 'bracket-visualization-content'
    };

    switch (bracket?.type) {
      case BRACKET_TYPES.KNOCKOUT:
        return <KnockoutBracket {...bracketProps} />;
      case BRACKET_TYPES.DOUBLE_ELIMINATION:
        return <DoubleEliminationBracket {...bracketProps} />;
      case BRACKET_TYPES.ROUND_ROBIN:
        return <RoundRobinBracket {...bracketProps} />;
      case BRACKET_TYPES.GROUP_KNOCKOUT:
        return <GroupKnockoutBracket {...bracketProps} />;
      case BRACKET_TYPES.CUSTOM_HEATS:
        return <CustomHeatsBracket {...bracketProps} />;
      default:
        return (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaTrophy className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bracket Available</h3>
            <p className="text-gray-600">
              Please generate a bracket to view the tournament structure.
            </p>
          </div>
        );
    }
  };

  return (
    <div className={`bracket-visualization ${className}`}>
      {/* Bracket Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <FaTrophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {sport?.name || 'Tournament'} Bracket
              </h2>
              <p className="text-gray-600">
                {bracket?.metadata?.formatDescription || 'Tournament bracket'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Bracket Status */}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              isLocked 
                ? 'bg-red-100 text-red-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {isLocked ? (
                <div className="flex items-center gap-1">
                  <FaLock className="w-3 h-3" />
                  Locked
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <FaUnlock className="w-3 h-3" />
                  Unlocked
                </div>
              )}
            </span>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={handleZoomOut}
                className="px-2 py-1 hover:bg-gray-100 transition-colors"
                title="Zoom Out"
              >
                -
              </button>
              <button
                onClick={handleZoomReset}
                className="px-2 py-1 hover:bg-gray-100 transition-colors text-sm"
                title="Reset Zoom"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                onClick={handleZoomIn}
                className="px-2 py-1 hover:bg-gray-100 transition-colors"
                title="Zoom In"
              >
                +
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <FaCompress className="w-4 h-4" /> : <FaExpand className="w-4 h-4" />}
            </button>
            
            <button
              onClick={handlePrint}
              className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Print"
            >
              <FaPrint className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleExport}
              className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Export"
            >
              <FaDownload className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bracket Stats */}
        {bracket?.metadata && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <FaUsers className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {bracket.teams?.length || 0} Teams
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FaTrophy className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {bracket.metadata.totalMatches} Matches
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {bracket.metadata.estimatedDuration}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FaMapMarkerAlt className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {bracket.metadata.minVenues} Venues
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bracket Content */}
      <div 
        className={`bracket-content ${isFullscreen ? 'fullscreen' : ''}`}
        style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
      >
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {bracket ? renderBracket() : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTrophy className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bracket Generated</h3>
              <p className="text-gray-600">
                Generate a bracket to view the tournament structure and matches.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
