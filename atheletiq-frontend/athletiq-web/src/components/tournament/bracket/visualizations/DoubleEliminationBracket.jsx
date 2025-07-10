// src/components/tournament/bracket/visualizations/DoubleEliminationBracket.jsx
import React from 'react';
import { motion } from 'framer-motion';
import BracketMatch from '../components/BracketMatch';
import { FaTrophy, FaShieldAlt, FaArrowDown } from 'react-icons/fa';

const DoubleEliminationBracket = ({ bracket, isLocked, onTeamUpdate, onScoreUpdate, className = '' }) => {
  if (!bracket || !bracket.winnersBracket || !bracket.losersBracket) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-500">
          <FaTrophy className="mx-auto mb-2 text-2xl" />
          <p>No bracket data available</p>
        </div>
      </div>
    );
  }

  const { winnersBracket, losersBracket, grandFinal, champion } = bracket;

  // Group matches by bracket and round
  const groupMatchesByRound = (matches) => {
    return matches.reduce((acc, match) => {
      const round = match.round || 1;
      if (!acc[round]) acc[round] = [];
      acc[round].push(match);
      return acc;
    }, {});
  };

  const winnersByRound = groupMatchesByRound(winnersBracket);
  const losersByRound = groupMatchesByRound(losersBracket);

  return (
    <div className={`double-elimination-bracket-container ${className}`}>
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

      <div className="bracket-container flex flex-col gap-8">
        {/* Winners Bracket */}
        <motion.div
          className="winners-bracket"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bracket-header mb-6 text-center">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg">
              <FaShieldAlt />
              <span className="font-semibold">Winners Bracket</span>
            </div>
          </div>
          
          <div className="bracket-rounds-container overflow-x-auto">
            <div className="bracket-rounds flex items-start gap-8 p-6">
              {Object.entries(winnersByRound)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([roundNum, roundMatches], roundIndex) => (
                  <motion.div
                    key={`winners-${roundNum}`}
                    className="bracket-round flex flex-col justify-center"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: roundIndex * 0.1 }}
                  >
                    <div className="round-header mb-4 text-center">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Winners Round {roundNum}
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
                          {roundIndex < Object.keys(winnersByRound).length - 1 && (
                            <div className="match-connection absolute left-full top-1/2 transform -translate-y-1/2">
                              <div className="w-8 h-px bg-green-300"></div>
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

        {/* Losers Bracket */}
        <motion.div
          className="losers-bracket"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bracket-header mb-6 text-center">
            <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-lg">
              <FaArrowDown />
              <span className="font-semibold">Losers Bracket</span>
            </div>
          </div>
          
          <div className="bracket-rounds-container overflow-x-auto">
            <div className="bracket-rounds flex items-start gap-8 p-6">
              {Object.entries(losersByRound)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([roundNum, roundMatches], roundIndex) => (
                  <motion.div
                    key={`losers-${roundNum}`}
                    className="bracket-round flex flex-col justify-center"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + (roundIndex * 0.1) }}
                  >
                    <div className="round-header mb-4 text-center">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Losers Round {roundNum}
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
                          transition={{ delay: 0.2 + (roundIndex * 0.1) + (matchIndex * 0.05) }}
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
                          {roundIndex < Object.keys(losersByRound).length - 1 && (
                            <div className="match-connection absolute left-full top-1/2 transform -translate-y-1/2">
                              <div className="w-8 h-px bg-red-300"></div>
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

        {/* Grand Final */}
        {grandFinal && (
          <motion.div
            className="grand-final mt-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="bracket-header mb-6 text-center">
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-lg">
                <FaTrophy />
                <span className="font-semibold">Grand Final</span>
              </div>
            </div>
            
            <div className="flex justify-center">
              <BracketMatch
                match={grandFinal}
                isLocked={isLocked}
                onTeamUpdate={onTeamUpdate}
                onScoreUpdate={onScoreUpdate}
                showScore={true}
                size="lg"
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Bracket Legend */}
      <div className="bracket-legend mt-8 flex flex-wrap gap-4 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-200 border border-green-300 rounded"></div>
          <span>Winners Bracket</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-200 border border-red-300 rounded"></div>
          <span>Losers Bracket</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-200 border border-yellow-300 rounded"></div>
          <span>Winner</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-200 border border-purple-300 rounded"></div>
          <span>Grand Final</span>
        </div>
      </div>

      {/* Bracket Stats */}
      <div className="bracket-stats mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="stat-card bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-2xl font-bold text-blue-600">
            {winnersBracket.length + losersBracket.length + (grandFinal ? 1 : 0)}
          </div>
          <div className="text-sm text-gray-500">Total Matches</div>
        </div>
        <div className="stat-card bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-2xl font-bold text-green-600">{winnersBracket.length}</div>
          <div className="text-sm text-gray-500">Winners Matches</div>
        </div>
        <div className="stat-card bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-2xl font-bold text-red-600">{losersBracket.length}</div>
          <div className="text-sm text-gray-500">Losers Matches</div>
        </div>
        <div className="stat-card bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-2xl font-bold text-purple-600">
            {[...winnersBracket, ...losersBracket].filter(m => m.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
      </div>
    </div>
  );
};

export default DoubleEliminationBracket;
