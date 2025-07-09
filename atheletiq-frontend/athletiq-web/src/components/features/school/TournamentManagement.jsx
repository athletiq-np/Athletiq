// src/components/features/school/TournamentManagement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaTrophy, FaPlus, FaCalendarAlt, FaEye, FaEdit, FaUsers, FaChartLine, FaRegClock, FaCheckCircle, FaCalendarPlus, FaCog, FaFlag, FaFileAlt } from 'react-icons/fa';
import TournamentRegistrationModal from './TournamentRegistrationModal';
import TournamentBracket from './TournamentBracket';
import { toast } from 'react-toastify';
import apiClient from '@api/apiClient';

// Import tournament creation step components
import TournamentInfoStep from '../tournament/TournamentInfoStep';
import TournamentSportsStep from '../tournament/TournamentSportsStep';
import TournamentConfigStep from '../tournament/TournamentConfigStep';
import TournamentReviewStep from '../tournament/TournamentReviewStep';

export default function TournamentManagement({ tournaments, school, onRefresh }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [tournamentData, setTournamentData] = useState({
    registered: [],
    available: [],
    managed: [], // New: tournaments this school manages/organizes
    stats: {},
    teams: [],
    players: []
  });
  const [loading, setLoading] = useState(true);

  // Tournament creation state
  const [createStep, setCreateStep] = useState(0);
  const [tournamentForm, setTournamentForm] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    level: '',
    hosted_by: '',
    code: '',
    sports_config: []
  });

  // Tournament creation steps
  const CREATE_STEPS = [
    { id: 'info', title: 'Tournament Info', description: 'Basic tournament information' },
    { id: 'sports', title: 'Sports & Format', description: 'Select sports and formats' },
    { id: 'config', title: 'Configure & Fixtures', description: 'Configure tournament settings' },
    { id: 'review', title: 'Review & Create', description: 'Review and submit tournament' }
  ];

  useEffect(() => {
    fetchTournamentData();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await apiClient.get('/auth/me');
      if (response.data.success) {
        setCurrentUser(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchTournamentData = async () => {
    try {
      setLoading(true);
      
      // Fetch enhanced tournament data using apiClient
      const [tournamentsRes, statsRes, teamsRes, playersRes] = await Promise.all([
        apiClient.get('/schools/me/tournaments').catch(() => ({ data: { success: false, data: { registered_tournaments: [], available_tournaments: [] } } })),
        apiClient.get('/schools/me/tournament-stats').catch(() => ({ data: { success: false, data: {} } })),
        apiClient.get('/schools/me/teams').catch(() => ({ data: { success: false, data: [] } })),
        apiClient.get('/schools/me/players').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      setTournamentData({
        registered: tournamentsRes.data?.data?.registered_tournaments || [],
        available: tournamentsRes.data?.data?.available_tournaments || [],
        managed: tournamentsRes.data?.data?.registered_tournaments?.filter(t => t.relationship_type === 'organized') || [], // Tournaments organized by school
        stats: statsRes.data?.data || {},
        teams: teamsRes.data?.data || [],
        players: playersRes.data?.data || []
      });
    } catch (error) {
      console.error('Error fetching tournament data:', error);
      toast.error('Failed to load tournament data');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterForTournament = async (registrationData) => {
    try {
      const response = await fetch(`/api/tournaments/${selectedTournament.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(registrationData)
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Team registered successfully!');
        setShowRegistrationModal(false);
        setSelectedTournament(null);
        fetchTournamentData();
      } else {
        toast.error(data.message || 'Failed to register team');
      }
    } catch (error) {
      console.error('Error registering team:', error);
      toast.error('Failed to register team');
    }
  };

  const openRegistrationModal = (tournament) => {
    setSelectedTournament(tournament);
    setShowRegistrationModal(true);
  };

  // Enhanced tournament status update function
  const updateTournamentStatus = async (tournamentId, newStatus) => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Tournament status updated to ${newStatus}`);
        fetchTournamentData(); // Refresh data
      } else {
        throw new Error(data.message || 'Failed to update tournament status');
      }
    } catch (error) {
      toast.error('Error updating tournament status: ' + error.message);
    }
  };

  // Get tournament dashboard data
  const getTournamentDashboard = async (tournamentId) => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/dashboard`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to fetch tournament dashboard');
      }
    } catch (error) {
      toast.error('Error fetching tournament dashboard: ' + error.message);
      return null;
    }
  };

  // Enhanced status badge component
  const StatusBadge = ({ status }) => {
    const statusStyles = {
      draft: 'bg-gray-200 text-gray-800',
      pending: 'bg-yellow-200 text-yellow-800',
      published: 'bg-green-200 text-green-800',
      registration_open: 'bg-blue-200 text-blue-800',
      registration_closed: 'bg-orange-200 text-orange-800',
      active: 'bg-purple-200 text-purple-800',
      completed: 'bg-green-300 text-green-900',
      cancelled: 'bg-red-200 text-red-800',
      archived: 'bg-gray-300 text-gray-700'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-200 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  // Enhanced tournament card component
  const TournamentCard = ({ tournament, type = 'available' }) => {
    const [showDashboard, setShowDashboard] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);

    const handleViewDashboard = async () => {
      const data = await getTournamentDashboard(tournament.id);
      if (data) {
        setDashboardData(data);
        setShowDashboard(true);
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{tournament.name}</h3>
              <p className="text-sm text-gray-600">{tournament.tournament_code}</p>
            </div>
            <StatusBadge status={tournament.status} />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Sport</p>
              <p className="font-medium">{tournament.sport}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <p className="font-medium">{tournament.tournament_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Format</p>
              <p className="font-medium">{tournament.format}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Teams</p>
              <p className="font-medium">{tournament.registered_teams || 0}/{tournament.max_teams}</p>
            </div>
          </div>

          {tournament.start_date && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">Start Date</p>
              <p className="font-medium">{new Date(tournament.start_date).toLocaleDateString()}</p>
            </div>
          )}

          <div className="flex gap-2">
            {type === 'managed' && (
              <>
                <button
                  onClick={handleViewDashboard}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <FaChartLine className="w-4 h-4" />
                  Dashboard
                </button>
                
                <select
                  value={tournament.status}
                  onChange={(e) => updateTournamentStatus(tournament.id, e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="published">Published</option>
                  <option value="registration_open">Registration Open</option>
                  <option value="registration_closed">Registration Closed</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </>
            )}
            
            {type === 'available' && (
              <button
                onClick={() => {
                  setSelectedTournament(tournament);
                  setShowRegistrationModal(true);
                }}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <FaUsers className="w-4 h-4" />
                Register Team
              </button>
            )}
            
            <button
              onClick={() => navigate(`/tournaments/${tournament.id}`)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <FaEye className="w-4 h-4" />
              View
            </button>
          </div>
        </div>

        {/* Tournament Dashboard Modal */}
        {showDashboard && dashboardData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Tournament Dashboard</h2>
                <button
                  onClick={() => setShowDashboard(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900">Registered Teams</h3>
                  <p className="text-2xl font-bold text-blue-600">{dashboardData.statistics.registered_teams}</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900">Registration Progress</h3>
                  <p className="text-2xl font-bold text-green-600">{dashboardData.statistics.registration_progress.percentage}%</p>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Tournament Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>Code:</strong> {dashboardData.tournament.tournament_code}</p>
                  <p><strong>Status:</strong> <StatusBadge status={dashboardData.tournament.status} /></p>
                  <p><strong>Type:</strong> {dashboardData.tournament.tournament_type}</p>
                  <p><strong>Format:</strong> {dashboardData.tournament.format}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-athletiq-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaTrophy className="text-yellow-500" />
            Tournament Management
          </h2>
          <p className="text-gray-600">Organize and participate in tournaments</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Create Tournament Button - now switches to create tab */}
          <motion.button 
            onClick={() => setActiveTab('create')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 
                     rounded-xl hover:shadow-xl transition-all duration-200 flex items-center gap-2 font-semibold"
          >
            <FaCalendarPlus className="h-4 w-4" />
            <span>Create Tournament</span>
          </motion.button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          icon={FaTrophy} 
          title="Total Tournaments" 
          value={tournamentData.stats.total_tournaments || 0}
          color="yellow"
        />
        <StatCard 
          icon={FaRegClock} 
          title="Active Tournaments" 
          value={tournamentData.stats.active_tournaments || 0}
          color="green"
        />
        <StatCard 
          icon={FaCheckCircle} 
          title="Win Rate" 
          value={`${tournamentData.stats.win_rate || 0}%`}
          color="blue"
        />
        <StatCard 
          icon={FaUsers} 
          title="Teams Registered" 
          value={tournamentData.stats.total_teams_registered || 0}
          color="purple"
        />
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <TabButton 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </TabButton>
          <TabButton 
            active={activeTab === 'create'} 
            onClick={() => setActiveTab('create')}
          >
            <FaCalendarPlus className="inline mr-2" />
            Create Tournament
          </TabButton>
          <TabButton 
            active={activeTab === 'registered'} 
            onClick={() => setActiveTab('registered')}
          >
            My Tournaments ({tournamentData.registered.length})
          </TabButton>
          <TabButton 
            active={activeTab === 'managed'} 
            onClick={() => setActiveTab('managed')}
          >
            <FaCog className="inline mr-2" />
            Managed ({tournamentData.managed.length})
          </TabButton>
          <TabButton 
            active={activeTab === 'available'} 
            onClick={() => setActiveTab('available')}
          >
            Available ({tournamentData.available.length})
          </TabButton>
          <TabButton 
            active={activeTab === 'bracket'} 
            onClick={() => setActiveTab('bracket')}
          >
            Bracket View
          </TabButton>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <TournamentOverview 
            registered={tournamentData.registered} 
            available={tournamentData.available}
            stats={tournamentData.stats}
            onRegister={openRegistrationModal}
          />
        )}

        {activeTab === 'create' && (
          <TournamentCreateTab 
            step={createStep}
            form={tournamentForm}
            steps={CREATE_STEPS}
            currentUser={currentUser}
            onNext={() => setCreateStep(prev => Math.min(prev + 1, CREATE_STEPS.length - 1))}
            onBack={() => setCreateStep(prev => Math.max(prev - 1, 0))}
            onFormUpdate={setTournamentForm}
            onComplete={(tournament) => {
              // Reset form and go back to overview
              setTournamentForm({
                name: '',
                description: '',
                start_date: '',
                end_date: '',
                location: '',
                level: '',
                hosted_by: '',
                code: '',
                sports_config: []
              });
              setCreateStep(0);
              setActiveTab('managed');
              fetchTournamentData();
              toast.success(`Tournament "${tournament.name}" created successfully!`);
            }}
          />
        )}
        
        {activeTab === 'registered' && (
          <TournamentList 
            tournaments={tournamentData.registered} 
            type="registered"
            onRefresh={fetchTournamentData}
          />
        )}
        
        {activeTab === 'managed' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Managed Tournaments</h3>
              <button
                onClick={() => setActiveTab('create')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <FaPlus className="w-4 h-4" />
                Create Tournament
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournamentData.managed.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} type="managed" />
              ))}
            </div>
            
            {tournamentData.managed.length === 0 && (
              <div className="text-center py-8">
                <FaTrophy className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No managed tournaments</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first tournament.</p>
                <div className="mt-6">
                  <button
                    onClick={() => setActiveTab('create')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <FaPlus className="w-4 h-4 mr-2" />
                    Create Tournament
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'available' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournamentData.available.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} type="available" />
              ))}
            </div>
            
            {tournamentData.available.length === 0 && (
              <div className="text-center py-8">
                <FaCalendarAlt className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No available tournaments</h3>
                <p className="mt-1 text-sm text-gray-500">Check back later for new tournament opportunities.</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'bracket' && (
          <BracketView tournaments={tournamentData.registered} />
        )}
      </div>

      {/* Registration Modal */}
      <TournamentRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        onSubmit={handleRegisterForTournament}
        tournament={selectedTournament}
        availableTeams={tournamentData.teams}
        availablePlayers={tournamentData.players}
      />
    </div>
  );
}

function StatCard({ icon: Icon, title, value, color }) {
  const colorClasses = {
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`w-10 h-10 ${colorClasses[color]} rounded-full flex items-center justify-center`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
        active
          ? 'border-athletiq-blue text-athletiq-blue'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

function TournamentOverview({ registered, available, stats, onRegister }) {
  const upcomingTournaments = [...registered, ...available]
    .filter(t => new Date(t.start_date) > new Date())
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Tournaments</h3>
          <div className="space-y-4">
            {upcomingTournaments.map(tournament => (
              <TournamentCard 
                key={tournament.id} 
                tournament={tournament} 
                type="upcoming"
                onRegister={onRegister}
              />
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Matches</span>
                <span className="font-medium">{stats.total_matches_played || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Matches Won</span>
                <span className="font-medium">{stats.matches_won || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Players</span>
                <span className="font-medium">{stats.total_players || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TournamentList({ tournaments, type, onRegister }) {
  if (tournaments.length === 0) {
    return (
      <div className="text-center py-12">
        <FaTrophy className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No {type} tournaments
        </h3>
        <p className="text-gray-500">
          {type === 'registered' 
            ? 'You haven\'t registered for any tournaments yet.' 
            : 'No tournaments available for registration at the moment.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tournaments.map(tournament => (
        <TournamentCard 
          key={tournament.id} 
          tournament={tournament} 
          type={type}
          onRegister={onRegister}
        />
      ))}
    </div>
  );
}

function TournamentCard({ tournament, type, onRegister }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
              <FaTrophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{tournament.name}</h3>
              <p className="text-sm text-gray-500">{tournament.tournament_type}</p>
            </div>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(tournament.status)}`}>
            {tournament.status}
          </span>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Format:</span>
            <span className="font-medium">{tournament.format}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Teams:</span>
            <span className="font-medium">{tournament.current_teams || tournament.registered_teams || 0}/{tournament.max_teams}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Start Date:</span>
            <span className="font-medium">{tournament.start_date}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {type === 'available' && (
            <button 
              onClick={() => onRegister(tournament)}
              className="flex-1 bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600 transition-colors"
            >
              <FaPlus className="h-4 w-4 inline mr-1" />
              Register
            </button>
          )}
          <button className="flex-1 bg-athletiq-blue text-white px-3 py-2 rounded text-sm hover:bg-athletiq-navy transition-colors">
            <FaEye className="h-4 w-4 inline mr-1" />
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

function BracketView({ tournaments }) {
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadBracket = async (tournamentId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tournaments/${tournamentId}/bracket`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setBracket(data.data);
      } else {
        toast.error('Failed to load bracket');
      }
    } catch (error) {
      console.error('Error loading bracket:', error);
      toast.error('Failed to load bracket');
    } finally {
      setLoading(false);
    }
  };

  const handleTournamentSelect = (tournament) => {
    setSelectedTournament(tournament);
    loadBracket(tournament.id);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Tournament
        </label>
        <select
          value={selectedTournament?.id || ''}
          onChange={(e) => {
            const tournament = tournaments.find(t => t.id === parseInt(e.target.value));
            if (tournament) handleTournamentSelect(tournament);
          }}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-athletiq-blue"
        >
          <option value="">Select a tournament</option>
          {tournaments.map(tournament => (
            <option key={tournament.id} value={tournament.id}>
              {tournament.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-athletiq-blue"></div>
        </div>
      ) : bracket ? (
        <TournamentBracket tournament={bracket} matches={bracket.matches} />
      ) : selectedTournament ? (
        <div className="text-center py-12">
          <FaTrophy className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Bracket Available</h3>
          <p className="text-gray-500">Tournament bracket has not been generated yet.</p>
        </div>
      ) : null}
    </div>
  );
}

// Tournament Create Tab Component
function TournamentCreateTab({ step, form, steps, currentUser, onNext, onBack, onFormUpdate, onComplete }) {
  // Step navigation handlers
  const handleNext = () => {
    if (step < steps.length - 1) {
      onNext();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      onBack();
    }
  };

  const handleFormChange = (updates) => {
    onFormUpdate(prev => ({
      ...prev,
      ...updates
    }));
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Create New Tournament</h3>
          <span className="text-sm text-gray-500">
            Step {step + 1} of {steps.length}
          </span>
        </div>
        
        {/* Step Progress Bar */}
        <div className="flex items-center space-x-4 mb-6">
          {steps.map((stepInfo, index) => (
            <div key={stepInfo.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index < step ? 'bg-green-500 text-white' :
                index === step ? 'bg-blue-500 text-white' :
                'bg-gray-200 text-gray-500'
              }`}>
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-1 mx-2 ${
                  index < step ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <h4 className="font-medium text-gray-900">{steps[step].title}</h4>
          <p className="text-sm text-gray-600">{steps[step].description}</p>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {step === 0 && (
          <TournamentInfoStep
            form={form}
            updateForm={handleFormChange}
            nextStep={handleNext}
            currentUser={currentUser}
          />
        )}
        
        {step === 1 && (
          <TournamentSportsStep
            form={form}
            updateForm={handleFormChange}
            nextStep={handleNext}
            prevStep={handleBack}
          />
        )}
        
        {step === 2 && (
          <TournamentConfigStep
            form={form}
            updateForm={handleFormChange}
            nextStep={handleNext}
            prevStep={handleBack}
          />
        )}
        
        {step === 3 && (
          <TournamentReviewStep
            form={form}
            prevStep={handleBack}
            onComplete={onComplete}
            currentUser={currentUser}
          />
        )}
      </div>
    </div>
  );
}
