// src/components/tournament/TournamentTeamIntegration.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTrophy, FaUsers, FaChartLine, FaCog, FaPlus, 
  FaExclamationTriangle, FaCheckCircle, FaSync,
  FaCalendarAlt, FaMapMarkerAlt, FaFlag, FaEdit
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import BracketManager from './bracket/BracketManager';
import TeamAssignmentModal from './bracket/components/TeamAssignmentModal';
import apiClient from '@/api/apiClient';

/**
 * 🏆 Tournament Team Integration Component
 * Bridges Enhanced Team Management with Tournament Bracket System
 * 
 * Features:
 * - Tournament creation with team selection
 * - Integration with enhanced team management
 * - Real-time bracket generation
 * - Team eligibility verification
 * - Tournament analytics dashboard
 */
export default function TournamentTeamIntegration() {
  // State Management
  const [tournaments, setTournaments] = useState([]);
  const [schoolTeams, setSchoolTeams] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showCreateTournament, setShowCreateTournament] = useState(false);
  const [showTeamAssignment, setShowTeamAssignment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({});

  // Tournament form state
  const [tournamentForm, setTournamentForm] = useState({
    name: '',
    sport: 'football',
    format: 'knockout',
    startDate: '',
    endDate: '',
    location: '',
    maxTeams: 16,
    description: ''
  });

  useEffect(() => {
    loadTournamentData();
  }, []);

  // Load tournament and team data
  const loadTournamentData = async () => {
    try {
      setLoading(true);
      const [tournamentsRes, teamsRes] = await Promise.all([
        apiClient.get('/tournaments'),
        apiClient.get('/schools/me/teams')
      ]);
      
      setTournaments(tournamentsRes.data.data || []);
      setSchoolTeams(teamsRes.data.data || []);
      
      // Calculate analytics
      const tournamentAnalytics = calculateAnalytics(
        tournamentsRes.data.data || [],
        teamsRes.data.data || []
      );
      setAnalytics(tournamentAnalytics);
      
    } catch (error) {
      console.error('Error loading tournament data:', error);
      toast.error('Failed to load tournament data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate tournament analytics
  const calculateAnalytics = (tournaments, teams) => {
    const activeTournaments = tournaments.filter(t => t.status === 'active').length;
    const upcomingTournaments = tournaments.filter(t => t.status === 'upcoming').length;
    const registeredTeams = teams.filter(t => t.tournament_registrations?.length > 0).length;
    const eligibleTeams = teams.filter(t => t.players?.length >= 7).length;

    return {
      activeTournaments,
      upcomingTournaments,
      registeredTeams,
      eligibleTeams,
      totalTeams: teams.length,
      completionRate: tournaments.length > 0 ? 
        (tournaments.filter(t => t.status === 'completed').length / tournaments.length * 100).toFixed(1) : 0
    };
  };

  // Create new tournament
  const handleCreateTournament = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/tournaments', tournamentForm);
      const newTournament = response.data.data;
      
      setTournaments([...tournaments, newTournament]);
      setShowCreateTournament(false);
      setTournamentForm({
        name: '',
        sport: 'football',
        format: 'knockout',
        startDate: '',
        endDate: '',
        location: '',
        maxTeams: 16,
        description: ''
      });
      
      toast.success('Tournament created successfully!');
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast.error('Failed to create tournament');
    }
  };

  // Register team for tournament
  const handleTeamRegistration = async (tournamentId, teamId) => {
    try {
      await apiClient.post(`/tournaments/${tournamentId}/register`, {
        team_id: teamId
      });
      
      toast.success('Team registered successfully!');
      loadTournamentData(); // Refresh data
    } catch (error) {
      console.error('Error registering team:', error);
      toast.error('Failed to register team');
    }
  };

  // Sports configuration
  const sportsConfig = {
    football: { name: 'Football', icon: '⚽', color: 'green' },
    basketball: { name: 'Basketball', icon: '🏀', color: 'orange' },
    volleyball: { name: 'Volleyball', icon: '🏐', color: 'blue' },
    tennis: { name: 'Tennis', icon: '🎾', color: 'yellow' },
    cricket: { name: 'Cricket', icon: '🏏', color: 'red' }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Tournament Management</h1>
            <p className="text-blue-100">Manage tournaments with enhanced team integration</p>
          </div>
          <button
            onClick={() => setShowCreateTournament(true)}
            className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center"
          >
            <FaPlus className="mr-2" />
            Create Tournament
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{analytics.activeTournaments}</div>
            <div className="text-sm text-blue-100">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{analytics.upcomingTournaments}</div>
            <div className="text-sm text-blue-100">Upcoming</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{analytics.registeredTeams}</div>
            <div className="text-sm text-blue-100">Registered Teams</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{analytics.eligibleTeams}</div>
            <div className="text-sm text-blue-100">Eligible Teams</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{analytics.totalTeams}</div>
            <div className="text-sm text-blue-100">Total Teams</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{analytics.completionRate}%</div>
            <div className="text-sm text-blue-100">Success Rate</div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tournaments List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FaTrophy className="mr-2 text-yellow-500" />
                Tournaments ({tournaments.length})
              </h2>
            </div>
            
            <div className="p-6">
              {tournaments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaTrophy className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Tournaments Yet</h3>
                  <p className="text-gray-600 mb-4">Create your first tournament to get started</p>
                  <button
                    onClick={() => setShowCreateTournament(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FaPlus className="mr-2 inline" />
                    Create Tournament
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {tournaments.map((tournament) => (
                    <TournamentCard
                      key={tournament.id}
                      tournament={tournament}
                      sportsConfig={sportsConfig}
                      onSelect={setSelectedTournament}
                      onEdit={(tournament) => {
                        setSelectedTournament(tournament);
                        setShowCreateTournament(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Team Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FaUsers className="mr-2 text-blue-500" />
              Team Status
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Teams:</span>
                <span className="font-semibold">{schoolTeams.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tournament Ready:</span>
                <span className="font-semibold text-green-600">{analytics.eligibleTeams}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Registered:</span>
                <span className="font-semibold text-blue-600">{analytics.registeredTeams}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button 
                onClick={loadTournamentData}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
              >
                <FaSync className="mr-2" />
                Refresh Data
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => setShowCreateTournament(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
              >
                <FaPlus className="mr-2" />
                Create Tournament
              </button>
              
              <button
                onClick={() => setShowTeamAssignment(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
              >
                <FaUsers className="mr-2" />
                Assign Teams
              </button>
              
              <button
                onClick={() => window.location.href = '/school/teams'}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
              >
                <FaEdit className="mr-2" />
                Manage Teams
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tournament Details View */}
      <AnimatePresence>
        {selectedTournament && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedTournament.name}
                </h2>
                <button
                  onClick={() => setSelectedTournament(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <BracketManager
                tournament={selectedTournament}
                sport={selectedTournament.sport}
                teams={schoolTeams.filter(team => 
                  team.tournament_registrations?.some(reg => 
                    reg.tournament_id === selectedTournament.id
                  )
                )}
                onBracketUpdate={(bracket) => {
                  // Handle bracket updates
                  console.log('Bracket updated:', bracket);
                }}
                onTeamUpdate={(teams) => {
                  // Handle team updates
                  console.log('Teams updated:', teams);
                }}
                onMatchUpdate={(matchId, teamIndex, score) => {
                  // Handle match score updates
                  console.log('Match updated:', matchId, teamIndex, score);
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Tournament Modal */}
      <AnimatePresence>
        {showCreateTournament && (
          <CreateTournamentModal
            tournament={selectedTournament}
            form={tournamentForm}
            setForm={setTournamentForm}
            sportsConfig={sportsConfig}
            onSubmit={handleCreateTournament}
            onClose={() => {
              setShowCreateTournament(false);
              setSelectedTournament(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Team Assignment Modal */}
      <AnimatePresence>
        {showTeamAssignment && (
          <TeamAssignmentModal
            teams={schoolTeams}
            tournament={selectedTournament}
            onClose={() => setShowTeamAssignment(false)}
            onAssign={handleTeamRegistration}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Tournament Card Component
const TournamentCard = ({ tournament, sportsConfig, onSelect, onEdit }) => {
  const sport = sportsConfig[tournament.sport] || { icon: '🏆', color: 'gray' };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
      onClick={() => onSelect(tournament)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-lg bg-${sport.color}-100 flex items-center justify-center`}>
            <span className="text-2xl">{sport.icon}</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{tournament.name}</h3>
            <p className="text-sm text-gray-600">{sport.name} • {tournament.format}</p>
            <div className="flex items-center mt-1 text-sm text-gray-500">
              <FaCalendarAlt className="mr-1" />
              {new Date(tournament.start_date).toLocaleDateString()}
              {tournament.location && (
                <>
                  <FaMapMarkerAlt className="ml-3 mr-1" />
                  {tournament.location}
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tournament.status)}`}>
            {tournament.status}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(tournament);
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaEdit />
          </button>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center text-gray-600">
          <FaUsers className="mr-1" />
          {tournament.registered_teams || 0}/{tournament.max_teams} teams
        </div>
        <div className="text-blue-600 font-medium">
          View Bracket →
        </div>
      </div>
    </motion.div>
  );
};

// Create Tournament Modal Component
const CreateTournamentModal = ({ tournament, form, setForm, sportsConfig, onSubmit, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {tournament ? 'Edit Tournament' : 'Create New Tournament'}
          </h3>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tournament Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Inter-School Football Championship"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sport
            </label>
            <select
              value={form.sport}
              onChange={(e) => setForm({...form, sport: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.entries(sportsConfig).map(([key, sport]) => (
                <option key={key} value={key}>{sport.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Format
            </label>
            <select
              value={form.format}
              onChange={(e) => setForm({...form, format: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="knockout">Single Elimination</option>
              <option value="double_elimination">Double Elimination</option>
              <option value="round_robin">Round Robin</option>
              <option value="group_knockout">Group + Knockout</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({...form, startDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Teams
              </label>
              <select
                value={form.maxTeams}
                onChange={(e) => setForm({...form, maxTeams: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={8}>8 Teams</option>
                <option value={16}>16 Teams</option>
                <option value={32}>32 Teams</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({...form, location: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., School Sports Complex"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {tournament ? 'Update' : 'Create'} Tournament
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
