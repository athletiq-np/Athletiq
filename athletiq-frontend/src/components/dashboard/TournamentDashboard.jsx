// src/components/dashboard/TournamentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTrophy, FaUsers, FaChartLine, FaCalendarAlt, 
  FaMapMarkerAlt, FaFlag, FaAward, FaCrown,
  FaPlay, FaPause, FaStop, FaEdit, FaEye
} from 'react-icons/fa';
import TournamentTeamIntegration from '../tournament/TournamentTeamIntegration';
import AdvancedTeamBuilder from '../AdvancedTeamBuilder';
import BracketVisualization from '../tournament/bracket/BracketVisualization';
import apiClient from '@/api/apiClient';
import { toast } from 'react-toastify';

/**
 * 🏆 Unified Tournament Dashboard
 * Combines Enhanced Team Management + Tournament Bracket System
 * 
 * Features:
 * - Live tournament overview
 * - Enhanced team management integration
 * - Real-time bracket visualization
 * - Tournament analytics
 * - Unified workflow management
 */
export default function TournamentDashboard() {
  // State Management
  const [activeView, setActiveView] = useState('overview');
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [activeTournament, setActiveTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load all dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [tournamentsRes, teamsRes, statsRes] = await Promise.all([
        apiClient.get('/tournaments/'),
        apiClient.get('/schools/me/teams/'),
        apiClient.get('/tournaments/analytics/')
      ]);
      
      setTournaments(tournamentsRes.data.data || []);
      setTeams(teamsRes.data.data || []);
      setStats(statsRes.data || {});
      
      // Set active tournament (most recent active one)
      const active = tournamentsRes.data.data?.find(t => t.status === 'active');
      if (active) setActiveTournament(active);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Navigation tabs
  const tabs = [
    { id: 'overview', label: 'Overview', icon: FaChartLine },
    { id: 'tournaments', label: 'Tournaments', icon: FaTrophy },
    { id: 'teams', label: 'Team Builder', icon: FaUsers },
    { id: 'brackets', label: 'Live Brackets', icon: FaFlag },
    { id: 'analytics', label: 'Analytics', icon: FaAward }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-lg p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">🏆 Tournament Hub</h1>
            <p className="text-blue-100">Unified Tournament & Team Management System</p>
          </div>
          
          {activeTournament && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-sm text-blue-100 mb-1">Live Tournament</div>
              <div className="font-semibold">{activeTournament.name}</div>
              <div className="text-sm text-blue-200">{activeTournament.sport}</div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{tournaments.length}</div>
            <div className="text-sm text-blue-100">Tournaments</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{teams.length}</div>
            <div className="text-sm text-blue-100">Teams</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">
              {teams.reduce((sum, team) => sum + (team.players?.length || 0), 0)}
            </div>
            <div className="text-sm text-blue-100">Players</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">
              {tournaments.filter(t => t.status === 'active').length}
            </div>
            <div className="text-sm text-blue-100">Active</div>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeView === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeView === 'overview' && (
              <OverviewTab 
                key="overview"
                tournaments={tournaments}
                teams={teams}
                stats={stats}
                activeTournament={activeTournament}
              />
            )}
            
            {activeView === 'tournaments' && (
              <motion.div
                key="tournaments"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <TournamentTeamIntegration />
              </motion.div>
            )}
            
            {activeView === 'teams' && (
              <motion.div
                key="teams"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <AdvancedTeamBuilder />
              </motion.div>
            )}
            
            {activeView === 'brackets' && (
              <BracketsTab 
                key="brackets"
                tournaments={tournaments}
                teams={teams}
                activeTournament={activeTournament}
              />
            )}
            
            {activeView === 'analytics' && (
              <AnalyticsTab 
                key="analytics"
                tournaments={tournaments}
                teams={teams}
                stats={stats}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Overview Tab Component
const OverviewTab = ({ tournaments, teams, stats, activeTournament }) => {
  const upcomingTournaments = tournaments.filter(t => t.status === 'upcoming').slice(0, 3);
  const recentMatches = []; // This would come from match data
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Tournament */}
        {activeTournament ? (
          <div className="lg:col-span-2 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-900 flex items-center">
                <FaPlay className="mr-2 text-green-600" />
                Live Tournament
              </h3>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {activeTournament.status}
              </span>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-xl font-bold text-green-900">{activeTournament.name}</h4>
              <div className="flex items-center text-green-700 text-sm">
                <FaCalendarAlt className="mr-2" />
                {new Date(activeTournament.start_date).toLocaleDateString()}
                {activeTournament.location && (
                  <>
                    <FaMapMarkerAlt className="ml-4 mr-2" />
                    {activeTournament.location}
                  </>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-green-600">
                  <span className="font-semibold">{activeTournament.registered_teams || 0}</span> teams registered
                </div>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm">
                  View Bracket
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <FaTrophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Tournaments</h3>
            <p className="text-gray-600">Create a new tournament to get started</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-3">Quick Actions</h4>
            <div className="space-y-2">
              <button className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                Create Tournament
              </button>
              <button className="w-full bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm">
                Build Team
              </button>
              <button className="w-full bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm">
                View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Tournaments & Team Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tournaments */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaCalendarAlt className="mr-2 text-blue-500" />
            Upcoming Tournaments
          </h3>
          
          {upcomingTournaments.length > 0 ? (
            <div className="space-y-3">
              {upcomingTournaments.map((tournament) => (
                <div key={tournament.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{tournament.name}</div>
                    <div className="text-sm text-gray-600">{tournament.sport}</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(tournament.start_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No upcoming tournaments
            </div>
          )}
        </div>

        {/* Team Status */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaUsers className="mr-2 text-green-500" />
            Team Overview
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Teams:</span>
              <span className="font-semibold">{teams.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tournament Ready:</span>
              <span className="font-semibold text-green-600">
                {teams.filter(t => t.players?.length >= 7).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Players:</span>
              <span className="font-semibold text-blue-600">
                {teams.reduce((sum, team) => sum + (team.players?.length || 0), 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Sports Covered:</span>
              <span className="font-semibold text-purple-600">
                {new Set(teams.map(t => t.sport)).size}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Brackets Tab Component
const BracketsTab = ({ tournaments, teams, activeTournament }) => {
  const [selectedTournament, setSelectedTournament] = useState(activeTournament);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Tournament Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Live Tournament Brackets</h2>
        <select
          value={selectedTournament?.id || ''}
          onChange={(e) => {
            const tournament = tournaments.find(t => t.id === parseInt(e.target.value));
            setSelectedTournament(tournament);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Tournament</option>
          {tournaments.map((tournament) => (
            <option key={tournament.id} value={tournament.id}>
              {tournament.name} ({tournament.status})
            </option>
          ))}
        </select>
      </div>

      {/* Bracket Display */}
      {selectedTournament ? (
        <BracketVisualization
          tournament={selectedTournament}
          sport={selectedTournament.sport}
          teams={teams.filter(team => 
            team.tournament_registrations?.some(reg => 
              reg.tournament_id === selectedTournament.id
            )
          )}
          bracket={selectedTournament.bracket}
          onMatchUpdate={(matchId, teamIndex, score) => {
            console.log('Match score updated:', matchId, teamIndex, score);
          }}
        />
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FaTrophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Tournament Selected</h3>
          <p className="text-gray-600">Select a tournament to view its bracket</p>
        </div>
      )}
    </motion.div>
  );
};

// Analytics Tab Component
const AnalyticsTab = ({ tournaments, teams, stats }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h2 className="text-xl font-semibold text-gray-900">Tournament Analytics</h2>
      
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <FaTrophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{tournaments.length}</div>
          <div className="text-sm text-gray-600">Total Tournaments</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <FaUsers className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{teams.length}</div>
          <div className="text-sm text-gray-600">Total Teams</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <FaFlag className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {tournaments.filter(t => t.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <FaCrown className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {Math.round((tournaments.filter(t => t.status === 'completed').length / tournaments.length) * 100) || 0}%
          </div>
          <div className="text-sm text-gray-600">Success Rate</div>
        </div>
      </div>

      {/* Charts Placeholder */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
        <div className="text-center py-12 text-gray-500">
          📊 Advanced analytics charts will be displayed here
          <br />
          <small>Tournament participation, team performance, win rates, etc.</small>
        </div>
      </div>
    </motion.div>
  );
};
