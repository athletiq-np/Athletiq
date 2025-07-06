// src/components/features/school/TournamentManagement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaTrophy, FaPlus, FaCalendarAlt, FaEye, FaEdit, FaUsers, FaChartLine, FaRegClock, FaCheckCircle, FaCalendarPlus } from 'react-icons/fa';
import TournamentCreationModal from './TournamentCreationModal';
import TournamentRegistrationModal from './TournamentRegistrationModal';
import TournamentBracket from './TournamentBracket';
import { toast } from 'react-toastify';

export default function TournamentManagement({ tournaments, school, onRefresh }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [tournamentData, setTournamentData] = useState({
    registered: [],
    available: [],
    stats: {},
    teams: [],
    players: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournamentData();
  }, []);

  const fetchTournamentData = async () => {
    try {
      setLoading(true);
      
      // Fetch tournament data
      const [tournamentsRes, statsRes, teamsRes, playersRes] = await Promise.all([
        fetch('/api/schools/me/tournaments', { credentials: 'include' }),
        fetch('/api/schools/me/tournament-stats', { credentials: 'include' }),
        fetch('/api/schools/me/teams', { credentials: 'include' }),
        fetch('/api/schools/me/players', { credentials: 'include' })
      ]);

      const tournamentsData = await tournamentsRes.json();
      const statsData = await statsRes.json();
      const teamsData = await teamsRes.json();
      const playersData = await playersRes.json();

      setTournamentData({
        registered: tournamentsData.success ? tournamentsData.data.registered_tournaments : [],
        available: tournamentsData.success ? tournamentsData.data.available_tournaments : [],
        stats: statsData.success ? statsData.data : {},
        teams: teamsData.success ? teamsData.data : [],
        players: playersData.success ? playersData.data : []
      });
    } catch (error) {
      console.error('Error fetching tournament data:', error);
      toast.error('Failed to load tournament data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTournament = async (formData) => {
    try {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Tournament created successfully!');
        setShowCreateModal(false);
        fetchTournamentData();
      } else {
        toast.error(data.message || 'Failed to create tournament');
      }
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast.error('Failed to create tournament');
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
          {/* Modern Create Tournament Button */}
          <motion.button 
            onClick={() => navigate('/school/tournaments/create')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 
                     rounded-xl hover:shadow-xl transition-all duration-200 flex items-center gap-2 font-semibold"
          >
            <FaCalendarPlus className="h-4 w-4" />
            <span>Create Tournament</span>
          </motion.button>
          
          {/* Legacy Create Button (Alternative) */}
          <motion.button 
            onClick={() => setShowCreateModal(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gray-100 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-200 
                     transition-all duration-200 flex items-center gap-2 border border-gray-200"
          >
            <FaPlus className="h-4 w-4" />
            <span>Quick Create</span>
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
            active={activeTab === 'registered'} 
            onClick={() => setActiveTab('registered')}
          >
            My Tournaments ({tournamentData.registered.length})
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
        
        {activeTab === 'registered' && (
          <TournamentList 
            tournaments={tournamentData.registered} 
            type="registered"
            onRegister={openRegistrationModal}
          />
        )}
        
        {activeTab === 'available' && (
          <TournamentList 
            tournaments={tournamentData.available} 
            type="available"
            onRegister={openRegistrationModal}
          />
        )}
        
        {activeTab === 'bracket' && (
          <BracketView tournaments={tournamentData.registered} />
        )}
      </div>

      {/* Modals */}
      <TournamentCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTournament}
      />

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
