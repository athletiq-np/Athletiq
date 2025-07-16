/**
 * MatchdayDashboard Component
 * Central hub for live tournament operations and monitoring
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTrophy, FaPlay, FaUsers, FaClock, FaChartLine, 
  FaMapMarkerAlt, FaFlag, FaEye, FaSync, FaDownload,
  FaCheckCircle, FaExclamationTriangle, FaSpinner
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../api/apiClient';
import LiveMatchControl from './LiveMatchControl';

const MatchdayDashboard = ({ tournamentId }) => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [activeMatches, setActiveMatches] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [activeView, setActiveView] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      const [dashboardRes, leaderboardRes] = await Promise.all([
        apiClient.get(`/matchday/tournaments/${tournamentId}/dashboard`),
        apiClient.get(`/matchday/tournaments/${tournamentId}/leaderboard`)
      ]);
      
      setDashboard(dashboardRes.data.data);
      setActiveMatches(dashboardRes.data.data.activeMatches || []);
      setLeaderboard(leaderboardRes.data.data || []);
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load tournament dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId]);

  // Auto-refresh for live updates
  useEffect(() => {
    loadDashboardData();
    
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [loadDashboardData, autoRefresh]);

  const handleMatchSelect = (match) => {
    setSelectedMatch(match);
    setActiveView('match-control');
  };

  const handleMatchUpdate = () => {
    loadDashboardData();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {dashboard?.tournament?.name || 'Tournament'} - Live Operations
            </h1>
            <p className="text-blue-100">
              Real-time tournament management and monitoring
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                autoRefresh ? 'bg-white/20 text-white' : 'bg-white/10 text-blue-100'
              }`}
            >
              <FaSync className={`mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </button>
            <button
              onClick={loadDashboardData}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <FaSync className="mr-2" />
              Refresh Now
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <div className="flex items-center">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <FaTrophy className="text-blue-600 dark:text-blue-400 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Matches</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboard?.summary?.totalMatches || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <div className="flex items-center">
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
              <FaPlay className="text-green-600 dark:text-green-400 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Active Matches</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboard?.summary?.activeMatches || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <div className="flex items-center">
            <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
              <FaCheckCircle className="text-purple-600 dark:text-purple-400 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboard?.summary?.completedMatches || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <div className="flex items-center">
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
              <FaChartLine className="text-yellow-600 dark:text-yellow-400 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Progress</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboard?.summary?.completionRate || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: FaTrophy },
              { id: 'active-matches', label: 'Active Matches', icon: FaPlay },
              { id: 'leaderboard', label: 'Live Leaderboard', icon: FaFlag },
              { id: 'match-control', label: 'Match Control', icon: FaUsers, 
                disabled: !selectedMatch }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                disabled={tab.disabled}
                className={`flex items-center py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeView === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : tab.disabled
                    ? 'border-transparent text-gray-400 cursor-not-allowed'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="mr-2" />
                {tab.label}
                {tab.id === 'active-matches' && activeMatches.length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                    {activeMatches.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeView === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-semibold mb-4">Tournament Overview</h2>
                
                {/* Today's Schedule */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">Today's Schedule</h3>
                  <div className="space-y-3">
                    {activeMatches.length > 0 ? (
                      activeMatches.slice(0, 5).map((match) => (
                        <div key={match.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
                              {match.status.toUpperCase()}
                            </span>
                            <span className="font-medium">
                              {match.team1_name} vs {match.team2_name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>{formatTime(match.scheduled_time)}</span>
                            <span>{match.venue_name}</span>
                            <button
                              onClick={() => handleMatchSelect(match)}
                              className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                              <FaEye className="mr-1" />
                              View
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No matches scheduled for today</p>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Participants Today</h4>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {dashboard?.todayStats?.total_participants || 0}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Matches Today</h4>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {dashboard?.todayStats?.matches_today || 0}
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">Avg Duration</h4>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {Math.round(dashboard?.todayStats?.avg_match_duration || 0)}m
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeView === 'active-matches' && (
              <motion.div
                key="active-matches"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <h2 className="text-xl font-semibold mb-4">Active Matches</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {activeMatches.length > 0 ? (
                    activeMatches.map((match) => (
                      <div key={match.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(match.status)}`}>
                            {match.status.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatTime(match.scheduled_time)}
                          </span>
                        </div>
                        
                        <div className="text-center mb-4">
                          <h3 className="font-bold text-lg mb-2">
                            {match.team1_name} vs {match.team2_name}
                          </h3>
                          {match.team1_score !== null && (
                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                              {match.team1_score} - {match.team2_score}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                          <span>
                            <FaMapMarkerAlt className="mr-1" />
                            {match.venue_name || 'TBA'}
                          </span>
                          <span>
                            <FaUsers className="mr-1" />
                            {match.referee_name || 'No referee'}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => handleMatchSelect(match)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                        >
                          <FaEye className="mr-2" />
                          Control Match
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-8">
                      <FaExclamationTriangle className="mx-auto text-gray-400 text-3xl mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">No active matches at the moment</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeView === 'leaderboard' && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <h2 className="text-xl font-semibold mb-4">Live Leaderboard</h2>
                <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Position
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Team
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Played
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          W/D/L
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Goals
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Points
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {leaderboard.map((team, index) => (
                        <tr key={team.id} className={index < 3 ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`font-bold ${
                              index === 0 ? 'text-yellow-600' :
                              index === 1 ? 'text-gray-400' :
                              index === 2 ? 'text-orange-600' :
                              'text-gray-900 dark:text-white'
                            }`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {team.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                            {team.matches_played}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                            {team.wins}/{team.draws}/{team.losses}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                            {team.goals_for}-{team.goals_against}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              {team.points}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {leaderboard.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No standings available yet
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeView === 'match-control' && selectedMatch && (
              <motion.div
                key="match-control"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Match Control</h2>
                  <button
                    onClick={() => setActiveView('active-matches')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    ← Back to Active Matches
                  </button>
                </div>
                <LiveMatchControl 
                  matchId={selectedMatch.id} 
                  onMatchUpdate={handleMatchUpdate}
                  userRole="referee"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default MatchdayDashboard;
