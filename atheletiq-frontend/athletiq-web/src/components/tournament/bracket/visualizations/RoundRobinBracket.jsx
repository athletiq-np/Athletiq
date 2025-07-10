// src/components/tournament/bracket/visualizations/RoundRobinBracket.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BracketMatch from '../components/BracketMatch';
import { FaTrophy, FaTable, FaSort, FaMedal, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const RoundRobinBracket = ({ bracket, isLocked, onTeamUpdate, onScoreUpdate, className = '' }) => {
  const [activeView, setActiveView] = useState('standings'); // 'standings' or 'matches'
  const [sortBy, setSortBy] = useState('points');
  const [sortOrder, setSortOrder] = useState('desc');

  if (!bracket || !bracket.standings || !bracket.matches) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-500">
          <FaTable className="mx-auto mb-2 text-2xl" />
          <p>No bracket data available</p>
        </div>
      </div>
    );
  }

  const { standings, matches, champion } = bracket;

  // Sort standings
  const sortedStandings = [...standings].sort((a, b) => {
    let aVal = a[sortBy] || 0;
    let bVal = b[sortBy] || 0;
    
    if (sortBy === 'name') {
      aVal = a.name.toLowerCase();
      bVal = b.name.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    const round = match.round || 1;
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {});

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
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

  return (
    <div className={`round-robin-bracket-container ${className}`}>
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
              <div className="text-sm font-medium">Tournament Champion</div>
              <div className="text-lg font-bold">{champion.name}</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* View Toggle */}
      <div className="view-toggle mb-6 flex justify-center">
        <div className="bg-white rounded-lg p-1 shadow-sm border inline-flex">
          <button
            onClick={() => setActiveView('standings')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeView === 'standings' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <FaTable className="inline mr-2" />
            Standings
          </button>
          <button
            onClick={() => setActiveView('matches')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeView === 'matches' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <FaTrophy className="inline mr-2" />
            Matches
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'standings' ? (
          <motion.div
            key="standings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="standings-table"
          >
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {/* Table Header */}
              <div className="bg-gray-50 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-800">Tournament Standings</h3>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Position
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-2">
                          Team
                          {getSortIcon('name')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('played')}
                      >
                        <div className="flex items-center gap-2">
                          Played
                          {getSortIcon('played')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('won')}
                      >
                        <div className="flex items-center gap-2">
                          Won
                          {getSortIcon('won')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('drawn')}
                      >
                        <div className="flex items-center gap-2">
                          Drawn
                          {getSortIcon('drawn')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('lost')}
                      >
                        <div className="flex items-center gap-2">
                          Lost
                          {getSortIcon('lost')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('points')}
                      >
                        <div className="flex items-center gap-2">
                          Points
                          {getSortIcon('points')}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedStandings.map((team, index) => (
                      <motion.tr
                        key={team.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getPositionIcon(team.position)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{team.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{team.played}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-green-600 font-medium">{team.won}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-yellow-600 font-medium">{team.drawn}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-red-600 font-medium">{team.lost}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-blue-600">{team.points}</div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="matches"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="matches-view"
          >
            <div className="rounds-container space-y-8">
              {Object.entries(matchesByRound)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([roundNum, roundMatches]) => (
                  <motion.div
                    key={roundNum}
                    className="round-container"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: parseInt(roundNum) * 0.1 }}
                  >
                    <div className="round-header mb-6">
                      <h3 className="text-xl font-semibold text-gray-800">Round {roundNum}</h3>
                      <div className="text-sm text-gray-500">
                        {roundMatches.length} {roundMatches.length === 1 ? 'Match' : 'Matches'}
                      </div>
                    </div>

                    <div className="matches-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {roundMatches.map((match, index) => (
                        <motion.div
                          key={match.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: (parseInt(roundNum) * 0.1) + (index * 0.05) }}
                        >
                          <BracketMatch
                            match={match}
                            isLocked={isLocked}
                            onTeamUpdate={onTeamUpdate}
                            onScoreUpdate={onScoreUpdate}
                            showScore={true}
                            size="md"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bracket Stats */}
      <div className="bracket-stats mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="stat-card bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-2xl font-bold text-blue-600">{standings.length}</div>
          <div className="text-sm text-gray-500">Teams</div>
        </div>
        <div className="stat-card bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-2xl font-bold text-green-600">{matches.length}</div>
          <div className="text-sm text-gray-500">Total Matches</div>
        </div>
        <div className="stat-card bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-2xl font-bold text-purple-600">
            {matches.filter(m => m.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div className="stat-card bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-2xl font-bold text-orange-600">
            {Object.keys(matchesByRound).length}
          </div>
          <div className="text-sm text-gray-500">Rounds</div>
        </div>
      </div>
    </div>
  );
};

export default RoundRobinBracket;
