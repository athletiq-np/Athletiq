// src/components/tournament/bracket/visualizations/GroupKnockoutBracket.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BracketMatch from '../components/BracketMatch';
import { FaTrophy, FaUsers, FaSort, FaMedal, FaChevronDown, FaChevronUp, FaArrowRight } from 'react-icons/fa';

const GroupKnockoutBracket = ({ bracket, isLocked, onTeamUpdate, onScoreUpdate, className = '' }) => {
  const [activeView, setActiveView] = useState('groups'); // 'groups' or 'knockout'
  const [activeGroup, setActiveGroup] = useState(null);

  if (!bracket || !bracket.groups || !bracket.knockoutStage) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-500">
          <FaUsers className="mx-auto mb-2 text-2xl" />
          <p>No bracket data available</p>
        </div>
      </div>
    );
  }

  const { groups, knockoutStage, champion } = bracket;

  // Group matches by round for knockout stage
  const knockoutMatchesByRound = knockoutStage.matches.reduce((acc, match) => {
    const round = match.round || 1;
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {});

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

  const GroupStandings = ({ group }) => {
    const sortedTeams = [...group.standings].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

    return (
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b">
          <h4 className="font-semibold text-gray-800">{group.name}</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pos</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">P</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">W</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">D</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">L</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedTeams.map((team, index) => (
                <tr 
                  key={team.id} 
                  className={`
                    ${index < 2 ? 'bg-green-50' : ''}
                    ${index === 2 ? 'bg-yellow-50' : ''}
                    hover:bg-gray-50
                  `}
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    {getPositionIcon(index + 1)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">
                    {team.name}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-900">{team.played}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-green-600">{team.won}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-yellow-600">{team.drawn}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-red-600">{team.lost}</td>
                  <td className="px-3 py-2 whitespace-nowrap font-bold text-blue-600">{team.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Group Matches */}
        <div className="p-4 border-t bg-gray-50">
          <div className="grid grid-cols-1 gap-2">
            {group.matches.map((match) => (
              <BracketMatch
                key={match.id}
                match={match}
                isLocked={isLocked}
                onTeamUpdate={onTeamUpdate}
                onScoreUpdate={onScoreUpdate}
                showScore={true}
                size="sm"
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`group-knockout-bracket-container ${className}`}>
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
            onClick={() => setActiveView('groups')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeView === 'groups' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <FaUsers className="inline mr-2" />
            Group Stage
          </button>
          <button
            onClick={() => setActiveView('knockout')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeView === 'knockout' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <FaTrophy className="inline mr-2" />
            Knockout Stage
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'groups' ? (
          <motion.div
            key="groups"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="groups-view"
          >
            <div className="groups-header mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-800">Group Stage</h2>
              <p className="text-gray-600">Top 2 teams from each group advance to knockout stage</p>
            </div>

            <div className="groups-grid grid grid-cols-1 lg:grid-cols-2 gap-6">
              {groups.map((group, index) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GroupStandings group={group} />
                </motion.div>
              ))}
            </div>

            {/* Qualification Legend */}
            <div className="qualification-legend mt-8 bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Qualification Legend</h3>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                  <span>Qualified for Knockout</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                  <span>Possible Qualification</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                  <span>Eliminated</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="knockout"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="knockout-view"
          >
            <div className="knockout-header mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-800">Knockout Stage</h2>
              <p className="text-gray-600">Single elimination tournament</p>
            </div>

            <div className="knockout-bracket-container overflow-x-auto">
              <div className="knockout-bracket flex items-start gap-8 p-6">
                {Object.entries(knockoutMatchesByRound)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([roundNum, roundMatches], roundIndex) => (
                    <motion.div
                      key={roundNum}
                      className="knockout-round flex flex-col justify-center"
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: roundIndex * 0.1 }}
                    >
                      <div className="round-header mb-4 text-center">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {knockoutStage.rounds && knockoutStage.rounds[roundIndex] 
                            ? knockoutStage.rounds[roundIndex].name 
                            : `Round ${roundNum}`}
                        </h3>
                        <div className="text-sm text-gray-500">
                          {roundMatches.length} {roundMatches.length === 1 ? 'Match' : 'Matches'}
                        </div>
                      </div>

                      <div className="round-matches space-y-6">
                        {roundMatches.map((match, matchIndex) => (
                          <motion.div
                            key={match.id}
                            className="match-container relative"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: (roundIndex * 0.1) + (matchIndex * 0.05) }}
                          >
                            <BracketMatch
                              match={match}
                              isLocked={isLocked}
                              onTeamUpdate={onTeamUpdate}
                              onScoreUpdate={onScoreUpdate}
                              showScore={true}
                              size="md"
                            />
                            
                            {/* Connection Lines */}
                            {roundIndex < Object.keys(knockoutMatchesByRound).length - 1 && (
                              <div className="match-connection absolute left-full top-1/2 transform -translate-y-1/2">
                                <div className="w-8 h-px bg-gray-300"></div>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tournament Progress */}
      <div className="tournament-progress mt-8 bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Tournament Progress</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`
              flex items-center gap-2 px-3 py-1 rounded-full text-sm
              ${activeView === 'groups' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}
            `}>
              <FaUsers />
              Group Stage
            </div>
            <FaArrowRight className="text-gray-400" />
            <div className={`
              flex items-center gap-2 px-3 py-1 rounded-full text-sm
              ${activeView === 'knockout' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}
            `}>
              <FaTrophy />
              Knockout Stage
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            {groups.reduce((acc, group) => acc + group.matches.filter(m => m.status === 'completed').length, 0)} / {groups.reduce((acc, group) => acc + group.matches.length, 0)} group matches completed
          </div>
        </div>
      </div>

      {/* Bracket Stats */}
      <div className="bracket-stats mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="stat-card bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-2xl font-bold text-blue-600">{groups.length}</div>
          <div className="text-sm text-gray-500">Groups</div>
        </div>
        <div className="stat-card bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-2xl font-bold text-green-600">
            {groups.reduce((acc, group) => acc + group.standings.length, 0)}
          </div>
          <div className="text-sm text-gray-500">Teams</div>
        </div>
        <div className="stat-card bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-2xl font-bold text-purple-600">
            {groups.reduce((acc, group) => acc + group.matches.length, 0) + knockoutStage.matches.length}
          </div>
          <div className="text-sm text-gray-500">Total Matches</div>
        </div>
        <div className="stat-card bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-2xl font-bold text-orange-600">
            {groups.reduce((acc, group) => acc + group.matches.filter(m => m.status === 'completed').length, 0) + 
             knockoutStage.matches.filter(m => m.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
      </div>
    </div>
  );
};

export default GroupKnockoutBracket;
