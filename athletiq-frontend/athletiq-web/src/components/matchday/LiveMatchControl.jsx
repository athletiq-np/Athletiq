/**
 * LiveMatchControl Component
 * Real-time match management interface for referees and organizers
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlay, FaPause, FaStop, FaPlus, FaMinus, FaClock, 
  FaUsers, FaMapMarkerAlt, FaFlag, FaEdit, FaSave,
  FaExclamationTriangle, FaCheckCircle, FaSync
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiClient from '../../../api/apiClient';

const LiveMatchControl = ({ matchId, onMatchUpdate, userRole = 'referee' }) => {
  const [match, setMatch] = useState(null);
  const [score, setScore] = useState({ team1: 0, team2: 0 });
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [eventDescription, setEventDescription] = useState('');
  const [eventType, setEventType] = useState('score_update');
  const [matchDuration, setMatchDuration] = useState(0);
  const [isLive, setIsLive] = useState(false);

  // Load match data
  const loadMatchData = useCallback(async () => {
    try {
      const response = await apiClient.get(`/matchday/matches/${matchId}/live`);
      const matchData = response.data.data;
      
      setMatch(matchData.match);
      setScore({
        team1: matchData.match.team1_score || 0,
        team2: matchData.match.team2_score || 0
      });
      setEvents(matchData.events || []);
      setIsLive(matchData.isLive);
      setMatchDuration(matchData.duration || 0);
      
    } catch (error) {
      console.error('Error loading match data:', error);
      toast.error('Failed to load match data');
    } finally {
      setIsLoading(false);
    }
  }, [matchId]);

  // Real-time updates every 30 seconds
  useEffect(() => {
    loadMatchData();
    
    const interval = setInterval(() => {
      if (isLive) {
        loadMatchData();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [loadMatchData, isLive]);

  // Update match duration every second for live matches
  useEffect(() => {
    if (!isLive) return;
    
    const timer = setInterval(() => {
      setMatchDuration(prev => prev + 1);
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, [isLive]);

  // Start match
  const handleStartMatch = async () => {
    try {
      setIsUpdating(true);
      await apiClient.post(`/matchday/matches/${matchId}/start`, {
        official_notes: 'Match started by referee'
      });
      
      setIsLive(true);
      toast.success('Match started successfully!');
      loadMatchData();
      onMatchUpdate?.();
    } catch (error) {
      console.error('Error starting match:', error);
      toast.error('Failed to start match');
    } finally {
      setIsUpdating(false);
    }
  };

  // Update score
  const handleScoreUpdate = async () => {
    if (!eventDescription.trim()) {
      toast.error('Please enter event description');
      return;
    }

    try {
      setIsUpdating(true);
      await apiClient.put(`/matchday/matches/${matchId}/score`, {
        team1_score: score.team1,
        team2_score: score.team2,
        event_description: eventDescription,
        event_type: eventType
      });
      
      setEventDescription('');
      toast.success('Score updated successfully!');
      loadMatchData();
      onMatchUpdate?.();
    } catch (error) {
      console.error('Error updating score:', error);
      toast.error('Failed to update score');
    } finally {
      setIsUpdating(false);
    }
  };

  // End match
  const handleEndMatch = async () => {
    const confirmed = window.confirm('Are you sure you want to end this match? This action cannot be undone.');
    if (!confirmed) return;

    try {
      setIsUpdating(true);
      await apiClient.post(`/matchday/matches/${matchId}/end`, {
        final_notes: 'Match completed by referee'
      });
      
      setIsLive(false);
      toast.success('Match ended successfully!');
      loadMatchData();
      onMatchUpdate?.();
    } catch (error) {
      console.error('Error ending match:', error);
      toast.error('Failed to end match');
    } finally {
      setIsUpdating(false);
    }
  };

  // Score adjustment functions
  const adjustScore = (team, delta) => {
    const newScore = Math.max(0, score[team] + delta);
    setScore(prev => ({ ...prev, [team]: newScore }));
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-8">
        <FaExclamationTriangle className="mx-auto text-gray-400 text-3xl mb-4" />
        <p className="text-gray-600">Match not found</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Match Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Live Match Control
          </h2>
          <div className="flex items-center space-x-2">
            {isLive && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-3 h-3 bg-red-500 rounded-full"
              />
            )}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              isLive ? 'bg-red-100 text-red-800' : 
              match.status === 'completed' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {isLive ? 'LIVE' : match.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Match Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <FaMapMarkerAlt className="mr-2" />
            <span>{match.venue_name || 'TBA'}</span>
          </div>
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <FaClock className="mr-2" />
            <span>
              {isLive ? `${formatDuration(matchDuration)} elapsed` : 
               new Date(match.scheduled_time).toLocaleTimeString()}
            </span>
          </div>
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <FaUsers className="mr-2" />
            <span>{match.referee_name || 'No referee assigned'}</span>
          </div>
        </div>
      </div>

      {/* Score Display */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 mb-6 text-white">
        <div className="grid grid-cols-3 gap-4 items-center">
          {/* Team 1 */}
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">{match.team1_name}</h3>
            <div className="text-4xl font-bold mb-2">{score.team1}</div>
            {userRole === 'referee' && isLive && (
              <div className="flex justify-center space-x-2">
                <button
                  onClick={() => adjustScore('team1', -1)}
                  className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                  disabled={isUpdating}
                >
                  <FaMinus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => adjustScore('team1', 1)}
                  className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                  disabled={isUpdating}
                >
                  <FaPlus className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* VS */}
          <div className="text-center">
            <div className="text-2xl font-bold">VS</div>
            {isLive && (
              <div className="text-sm mt-2">
                {formatDuration(matchDuration)}
              </div>
            )}
          </div>

          {/* Team 2 */}
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">{match.team2_name}</h3>
            <div className="text-4xl font-bold mb-2">{score.team2}</div>
            {userRole === 'referee' && isLive && (
              <div className="flex justify-center space-x-2">
                <button
                  onClick={() => adjustScore('team2', -1)}
                  className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                  disabled={isUpdating}
                >
                  <FaMinus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => adjustScore('team2', 1)}
                  className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                  disabled={isUpdating}
                >
                  <FaPlus className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Referee Controls */}
      {userRole === 'referee' && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Match Controls</h3>
          
          {!isLive && match.status === 'scheduled' && (
            <button
              onClick={handleStartMatch}
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center disabled:opacity-50"
            >
              <FaPlay className="mr-2" />
              {isUpdating ? 'Starting...' : 'Start Match'}
            </button>
          )}

          {isLive && (
            <div className="space-y-4">
              {/* Event Logging */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium mb-3">Log Event & Update Score</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800"
                  >
                    <option value="score_update">Score Update</option>
                    <option value="goal">Goal</option>
                    <option value="penalty">Penalty</option>
                    <option value="card">Card</option>
                    <option value="substitution">Substitution</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Event description..."
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800"
                  />
                </div>
                <button
                  onClick={handleScoreUpdate}
                  disabled={isUpdating || !eventDescription.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center disabled:opacity-50"
                >
                  <FaSave className="mr-2" />
                  {isUpdating ? 'Updating...' : 'Save Event & Score'}
                </button>
              </div>

              {/* End Match */}
              <button
                onClick={handleEndMatch}
                disabled={isUpdating}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium flex items-center disabled:opacity-50"
              >
                <FaStop className="mr-2" />
                {isUpdating ? 'Ending...' : 'End Match'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Match Events Timeline */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Match Events</h3>
          <button
            onClick={loadMatchData}
            className="text-blue-600 hover:text-blue-700 p-2 rounded-lg transition-colors"
            title="Refresh events"
          >
            <FaSync className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {events.length > 0 ? (
            events.map((event, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm capitalize">
                    {event.event_type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  {event.description}
                </p>
                {(event.team1_score !== null || event.team2_score !== null) && (
                  <div className="text-xs text-blue-600 mt-1">
                    Score: {event.team1_score} - {event.team2_score}
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">
              No events recorded yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveMatchControl;
