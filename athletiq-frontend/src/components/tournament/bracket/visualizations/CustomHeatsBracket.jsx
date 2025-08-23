// src/components/tournament/bracket/visualizations/CustomHeatsBracket.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BracketMatch from '../components/BracketMatch';
import { FaTrophy, FaStopwatch, FaSort, FaMedal, FaChevronDown, FaChevronUp, FaFire } from 'react-icons/fa';

const CustomHeatsBracket = ({ bracket, isLocked, onTeamUpdate, onScoreUpdate, className = '' }) => {
  const [activeView, setActiveView] = useState('heats'); // 'heats', 'results', or 'finals'
  const [selectedHeat, setSelectedHeat] = useState(null);
  const [sortBy, setSortBy] = useState('time');
  const [sortOrder, setSortOrder] = useState('asc');

  if (!bracket || !bracket.heats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-500">
          <FaStopwatch className="mx-auto mb-2 text-2xl" />
          <p>No bracket data available</p>
        </div>
      </div>
    );
  }

  const { heats, results, finals, champion } = bracket;

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder(column === 'time' ? 'asc' : 'desc');
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return <FaSort className="text-gray-400" />;
    return sortOrder === 'asc' ? 
      <FaChevronUp className="text-blue-600" /> : 
      <FaChevronDown className="text-blue-600" />;
  };

  const getPositionIcon = (position) => {
    switch (position) {
      case 1:
        return <FaTrophy className="text-yellow-500" />;
      case 2:
        return <FaMedal className="text-gray-400" />;
      case 3:
        return <FaMedal className="text-amber-600" />;
      default:
        return <span className="text-gray-500 text-sm">#{position}</span>;
    }
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    if (typeof time === 'string') return time;
    
    // Assume time is in seconds
    const minutes = Math.floor(time / 60);
    const seconds = (time % 60).toFixed(2);
    return minutes > 0 ? `${minutes}:${seconds.padStart(5, '0')}` : `${seconds}s`;
  };

  const HeatResults = ({ heat }) => {
    const sortedParticipants = [...heat.participants].sort((a, b) => {
      if (sortBy === 'time') {
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;
        return sortOrder === 'asc' ? a.time - b.time : b.time - a.time;
      }
      if (sortBy === 'position') {
        return sortOrder === 'asc' ? a.position - b.position : b.position - a.position;
      }
      if (sortBy === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      return 0;
    });

    return (
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-800">{heat.name}</h4>
            <span className="text-sm text-gray-500">{heat.status}</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('position')}
                >
                  <div className="flex items-center gap-2">
                    Position
                    {getSortIcon('position')}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Participant
                    {getSortIcon('name')}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('time')}
                >
                  <div className="flex items-center gap-2">
                    Time
                    {getSortIcon('time')}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lane
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedParticipants.map((participant, index) => (
                <tr 
                  key={participant.id}
                  className={`
                    ${participant.position <= 3 ? 'bg-yellow-50' : ''}
                    hover:bg-gray-50
                  `}
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getPositionIcon(participant.position)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{participant.name}</div>
                    <div className="text-sm text-gray-500">{participant.team}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className={`text-sm font-mono ${
                      participant.position === 1 ? 'text-green-600 font-bold' : 
                      participant.position <= 3 ? 'text-blue-600 font-semibold' : 'text-gray-900'
                    }`}>
                      {formatTime(participant.time)}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{participant.lane}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      participant.status === 'completed' ? 'bg-green-100 text-green-800' :
                      participant.status === 'disqualified' ? 'bg-red-100 text-red-800' :
                      participant.status === 'dns' ? 'bg-gray-100 text-gray-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {participant.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className={`custom-heats-bracket-container ${className}`}>
      {/* Champion Display */}
      {champion && (
        <motion.div
          className="champion-display mb-8 text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-6 py-3 rounded-lg shadow-lg">
            <FaTrophy className="text-2xl" />
            <div>
              <div className="text-sm font-medium">Event Champion</div>
              <div className="text-lg font-bold">{champion.name}</div>
              <div className="text-sm opacity-90">{formatTime(champion.time)}</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* View Toggle */}
      <div className="view-toggle mb-6 flex justify-center">
        <div className="bg-white rounded-lg p-1 shadow-sm border inline-flex">
          <button
            onClick={() => setActiveView('heats')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeView === 'heats' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <FaFire className="inline mr-2" />
            Heats
          </button>
          <button
            onClick={() => setActiveView('results')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeView === 'results' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <FaStopwatch className="inline mr-2" />
            Results
          </button>
          {finals && (
            <button
              onClick={() => setActiveView('finals')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeView === 'finals' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <FaTrophy className="inline mr-2" />
              Finals
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'heats' && (
          <motion.div
            key="heats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="heats-view"
          >
            <div className="heats-header mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-800">Heats</h2>
              <p className="text-gray-600">Qualifying rounds for the event</p>
            </div>

            <div className="heats-grid space-y-6">
              {heats.map((heat, index) => (
                <motion.div
                  key={heat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <HeatResults heat={heat} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeView === 'results' && results && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="results-view"
          >
            <div className="results-header mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-800">Overall Results</h2>
              <p className="text-gray-600">Combined results from all heats</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Participant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Heat
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((result, index) => (
                      <motion.tr
                        key={result.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`
                          ${index < 3 ? 'bg-yellow-50' : ''}
                          hover:bg-gray-50
                        `}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPositionIcon(result.position)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{result.name}</div>
                          <div className="text-sm text-gray-500">{result.team}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-mono ${
                            result.position === 1 ? 'text-green-600 font-bold' : 
                            result.position <= 3 ? 'text-blue-600 font-semibold' : 'text-gray-900'
                          }`}>
                            {formatTime(result.time)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{result.heat}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            result.qualified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {result.qualified ? 'Qualified' : 'Eliminated'}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeView === 'finals' && finals && (
          <motion.div
            key="finals"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="finals-view"
          >
            <div className="finals-header mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-800">Finals</h2>
              <p className="text-gray-600">Championship round</p>
            </div>

            <div className="finals-container">
              <HeatResults heat={finals} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Statistics */}
      <div className="event-stats mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="stat-card bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-2xl font-bold text-blue-600">{heats.length}</div>
          <div className="text-sm text-gray-500">Heats</div>
        </div>
        <div className="stat-card bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-2xl font-bold text-green-600">
            {heats.reduce((acc, heat) => acc + heat.participants.length, 0)}
          </div>
          <div className="text-sm text-gray-500">Participants</div>
        </div>
        <div className="stat-card bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-2xl font-bold text-purple-600">
            {heats.filter(heat => heat.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div className="stat-card bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-2xl font-bold text-orange-600">
            {results ? results.filter(r => r.qualified).length : 0}
          </div>
          <div className="text-sm text-gray-500">Qualified</div>
        </div>
      </div>
    </div>
  );
};

export default CustomHeatsBracket;
