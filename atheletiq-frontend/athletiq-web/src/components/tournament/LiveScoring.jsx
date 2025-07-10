// src/components/tournament/LiveScoring.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaPlay, FaPause, FaStop, FaEdit, FaSave, FaUndo, FaRedo,
  FaUsers, FaTrophy, FaFlag, FaClock, FaChartLine, FaBell,
  FaGamepad, FaPlus, FaMinus, FaCheck, FaTimes
} from 'react-icons/fa';

const LiveScoring = ({ tournament, onUpdate }) => {
  const [activeMatch, setActiveMatch] = useState(null);
  const [matches, setMatches] = useState([]);
  const [scores, setScores] = useState({});
  const [timer, setTimer] = useState({ minutes: 0, seconds: 0, isRunning: false });
  const [events, setEvents] = useState([]);

  // Mock matches data
  const mockMatches = [
    {
      id: 1,
      teams: ['Eagles FC', 'Thunder Hawks'],
      status: 'live',
      score: [2, 1],
      time: '78:32',
      venue: 'Main Field'
    },
    {
      id: 2,
      teams: ['Lightning Bolts', 'Fire Dragons'],
      status: 'upcoming',
      score: [0, 0],
      time: '00:00',
      venue: 'Field 2'
    },
    {
      id: 3,
      teams: ['Storm Riders', 'Wind Warriors'],
      status: 'completed',
      score: [3, 2],
      time: '90:00',
      venue: 'Field 3'
    }
  ];

  useEffect(() => {
    setMatches(mockMatches);
    if (mockMatches.length > 0) {
      setActiveMatch(mockMatches[0]);
    }
  }, []);

  const handleScoreChange = (teamIndex, change) => {
    if (!activeMatch) return;
    
    const newScore = [...activeMatch.score];
    newScore[teamIndex] = Math.max(0, newScore[teamIndex] + change);
    
    setActiveMatch({
      ...activeMatch,
      score: newScore
    });
  };

  const addEvent = (type, team, description) => {
    const newEvent = {
      id: events.length + 1,
      type,
      team,
      description,
      time: `${timer.minutes}:${timer.seconds.toString().padStart(2, '0')}`,
      timestamp: new Date()
    };
    
    setEvents([newEvent, ...events]);
  };

  const toggleTimer = () => {
    setTimer(prev => ({
      ...prev,
      isRunning: !prev.isRunning
    }));
  };

  const MatchCard = ({ match, isActive, onClick }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        isActive 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
      onClick={() => onClick(match)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          match.status === 'live' ? 'bg-red-100 text-red-800' :
          match.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
          'bg-green-100 text-green-800'
        }`}>
          {match.status.toUpperCase()}
        </span>
        <span className="text-sm text-gray-500">{match.venue}</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">{match.teams[0]}</span>
          <span className="text-xl font-bold">{match.score[0]}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">{match.teams[1]}</span>
          <span className="text-xl font-bold">{match.score[1]}</span>
        </div>
      </div>
      
      <div className="mt-2 text-center">
        <span className="text-sm text-gray-600">{match.time}</span>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Live Scoring</h2>
          <p className="text-gray-600">Real-time match scoring and updates</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
            <FaPlay className="w-4 h-4" />
            <span>Start Match</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Match List */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Matches</h3>
          <div className="space-y-3">
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                isActive={activeMatch?.id === match.id}
                onClick={setActiveMatch}
              />
            ))}
          </div>
        </div>

        {/* Active Match Scoring */}
        <div className="lg:col-span-2">
          {activeMatch ? (
            <div className="space-y-6">
              {/* Match Header */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">
                    {activeMatch.teams[0]} vs {activeMatch.teams[1]}
                  </h3>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl font-bold">
                      {Math.floor(timer.minutes)}:{timer.seconds.toString().padStart(2, '0')}
                    </span>
                    <button
                      onClick={toggleTimer}
                      className={`p-2 rounded-lg ${
                        timer.isRunning 
                          ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                          : 'bg-green-100 text-green-600 hover:bg-green-200'
                      }`}
                    >
                      {timer.isRunning ? <FaPause className="w-4 h-4" /> : <FaPlay className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Score Interface */}
                <div className="grid grid-cols-2 gap-6">
                  {activeMatch.teams.map((team, index) => (
                    <div key={index} className="text-center">
                      <h4 className="text-lg font-semibold mb-4">{team}</h4>
                      <div className="flex items-center justify-center space-x-4">
                        <button
                          onClick={() => handleScoreChange(index, -1)}
                          className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200"
                        >
                          <FaMinus className="w-4 h-4" />
                        </button>
                        <span className="text-4xl font-bold w-16">
                          {activeMatch.score[index]}
                        </span>
                        <button
                          onClick={() => handleScoreChange(index, 1)}
                          className="bg-green-100 text-green-600 p-2 rounded-lg hover:bg-green-200"
                        >
                          <FaPlus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => addEvent('goal', activeMatch.teams[0], 'Goal scored')}
                    className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 text-sm"
                  >
                    ⚽ Goal Team 1
                  </button>
                  <button
                    onClick={() => addEvent('goal', activeMatch.teams[1], 'Goal scored')}
                    className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 text-sm"
                  >
                    ⚽ Goal Team 2
                  </button>
                  <button
                    onClick={() => addEvent('card', 'referee', 'Yellow card')}
                    className="bg-yellow-100 text-yellow-700 px-3 py-2 rounded-lg hover:bg-yellow-200 text-sm"
                  >
                    🟨 Yellow Card
                  </button>
                  <button
                    onClick={() => addEvent('card', 'referee', 'Red card')}
                    className="bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 text-sm"
                  >
                    🟥 Red Card
                  </button>
                </div>
              </div>

              {/* Match Events */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="text-lg font-semibold mb-4">Match Events</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {events.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No events recorded yet</p>
                  ) : (
                    events.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium">{event.description}</span>
                          {event.team !== 'referee' && (
                            <span className="text-gray-500 ml-2">- {event.team}</span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">{event.time}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
              <FaGamepad className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Match Selected</h3>
              <p className="text-gray-600">Select a match from the list to start scoring</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveScoring;
