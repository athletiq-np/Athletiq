// src/components/features/school/TournamentWorkflow.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlus, FaEye, FaEdit, FaTrophy, FaUsers, FaCalendarAlt, 
  FaChartLine, FaPlay, FaPause, FaCheck, FaFlag, FaClipboardList,
  FaSitemap as FaBrackets, FaUserTie, FaMedal, FaDownload, FaShare, FaCog
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiClient from '@api/apiClient';

// Import existing components
import TournamentCreation from '../../tournament/management/TournamentCreation';
import TournamentDetails from '../../tournament/management/TournamentDetails';
import BracketManager from '../../tournament/bracket/BracketManager';
import ParticipantManagement from '../../tournament/ParticipantManagement';
import LiveScoring from '../../tournament/LiveScoring';
import AnalyticsDashboard from '../../tournament/AnalyticsDashboard';

/**
 * 🏆 Complete Tournament Workflow Manager
 * 
 * Integrates the entire tournament lifecycle:
 * 1. Tournament Creation
 * 2. Team Registration & Management  
 * 3. Bracket Generation & Setup
 * 4. Live Tournament Execution
 * 5. Results & Analytics
 * 
 * This is the master orchestrator for the tournament experience
 */
export default function TournamentWorkflow({ school, onRefresh }) {
  const [tournaments, setTournaments] = useState([]);
  const [activeWorkflow, setActiveWorkflow] = useState('overview'); // overview | create | manage | execute
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [workflowStep, setWorkflowStep] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  // Workflow states
  const [creationMode, setCreationMode] = useState(false);
  const [managementMode, setManagementMode] = useState(false);
  const [executionMode, setExecutionMode] = useState(false);

  useEffect(() => {
    fetchTournamentData();
  }, []);

  const fetchTournamentData = async () => {
    try {
      setLoading(true);
      const [tournamentsRes, statsRes] = await Promise.all([
        apiClient.get('/schools/me/tournaments'),
        apiClient.get('/schools/me/tournament-stats')
      ]);

      const tournamentsData = tournamentsRes.data.data?.registered_tournaments || [];
      setTournaments(tournamentsData);
      setStats(statsRes.data.data || {});
    } catch (error) {
      console.error('Error fetching tournament data:', error);
      toast.error('Failed to load tournament data');
    } finally {
      setLoading(false);
    }
  };

  // Tournament Workflow Steps
  const workflowSteps = [
    {
      id: 'create',
      title: 'Create Tournament',
      description: 'Set up tournament structure, rules, and settings',
      icon: FaPlus,
      status: 'available',
      color: 'blue'
    },
    {
      id: 'register',
      title: 'Team Registration',
      description: 'Register teams and manage participants',
      icon: FaUsers,
      status: 'locked',
      color: 'green'
    },
    {
      id: 'bracket',
      title: 'Generate Bracket',
      description: 'Create tournament bracket and schedule matches',
      icon: FaBrackets,
      status: 'locked',
      color: 'purple'
    },
    {
      id: 'execute',
      title: 'Live Tournament',
      description: 'Manage live matches and scoring',
      icon: FaPlay,
      status: 'locked',
      color: 'orange'
    },
    {
      id: 'results',
      title: 'Results & Analytics',
      description: 'View results, statistics, and generate reports',
      icon: FaMedal,
      status: 'locked',
      color: 'yellow'
    }
  ];

  const getStepStatus = (step, tournament) => {
    if (!tournament) return 'locked';
    
    switch (step) {
      case 'create':
        return 'completed';
      case 'register':
        return tournament.status === 'draft' ? 'available' : 'completed';
      case 'bracket':
        return tournament.teams_count >= 2 ? 'available' : 'locked';
      case 'execute':
        return tournament.bracket_generated ? 'available' : 'locked';
      case 'results':
        return tournament.status === 'completed' ? 'available' : 'locked';
      default:
        return 'locked';
    }
  };

  // Tournament Status Cards
  const TournamentStatusCard = ({ tournament }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'draft': return 'bg-gray-500';
        case 'open': return 'bg-blue-500';
        case 'active': return 'bg-green-500';
        case 'completed': return 'bg-purple-500';
        case 'cancelled': return 'bg-red-500';
        default: return 'bg-gray-500';
      }
    };

    const getNextAction = (tournament) => {
      switch (tournament.status) {
        case 'draft':
          return { text: 'Open Registration', action: () => openRegistration(tournament) };
        case 'open':
          return { text: 'Generate Bracket', action: () => generateBracket(tournament) };
        case 'active':
          return { text: 'Manage Live', action: () => manageLive(tournament) };
        case 'completed':
          return { text: 'View Results', action: () => viewResults(tournament) };
        default:
          return { text: 'Manage', action: () => manageTournament(tournament) };
      }
    };

    const nextAction = getNextAction(tournament);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <FaTrophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{tournament.name}</h3>
              <p className="text-sm text-gray-600">{tournament.sport} • {tournament.format}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(tournament.status)}`}>
            {tournament.status.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{tournament.teams_count || 0}</div>
            <div className="text-xs text-gray-500">Teams</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{tournament.matches_count || 0}</div>
            <div className="text-xs text-gray-500">Matches</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{tournament.participants || 0}</div>
            <div className="text-xs text-gray-500">Players</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <FaCalendarAlt className="inline w-4 h-4 mr-1" />
            {new Date(tournament.start_date).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedTournament(tournament)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaEye className="w-4 h-4" />
            </button>
            <button
              onClick={nextAction.action}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {nextAction.text}
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  // Workflow Actions
  const openRegistration = async (tournament) => {
    try {
      await apiClient.patch(`/tournaments/${tournament.id}/status`, { status: 'open' });
      toast.success('Tournament registration opened!');
      fetchTournamentData();
    } catch (error) {
      toast.error('Failed to open registration');
    }
  };

  const generateBracket = async (tournament) => {
    try {
      await apiClient.post(`/tournaments/${tournament.id}/generate-bracket`);
      toast.success('Tournament bracket generated!');
      fetchTournamentData();
    } catch (error) {
      toast.error('Failed to generate bracket');
    }
  };

  const manageLive = (tournament) => {
    setSelectedTournament(tournament);
    setExecutionMode(true);
  };

  const viewResults = (tournament) => {
    setSelectedTournament(tournament);
    setActiveWorkflow('results');
  };

  const manageTournament = (tournament) => {
    setSelectedTournament(tournament);
    setManagementMode(true);
  };

  // Main Workflow Views
  const WorkflowOverview = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tournament Workflow</h1>
            <p className="text-gray-600">Manage your complete tournament lifecycle</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCreationMode(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
          >
            <FaPlus className="w-4 h-4" />
            Create Tournament
          </motion.button>
        </div>

        {/* Workflow Steps */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {workflowSteps.map((step, index) => (
            <div key={step.id} className="relative">
              <div className={`p-4 rounded-lg border-2 ${
                step.status === 'completed' ? 'border-green-200 bg-green-50' :
                step.status === 'available' ? 'border-blue-200 bg-blue-50' :
                'border-gray-200 bg-gray-50'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                  step.status === 'completed' ? 'bg-green-500' :
                  step.status === 'available' ? 'bg-blue-500' :
                  'bg-gray-400'
                }`}>
                  <step.icon className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-medium text-gray-900 text-sm">{step.title}</h3>
                <p className="text-xs text-gray-600 mt-1">{step.description}</p>
              </div>
              {index < workflowSteps.length - 1 && (
                <div className="absolute top-6 -right-2 w-4 h-0.5 bg-gray-300 hidden md:block" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tournament Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tournaments</p>
              <p className="text-2xl font-bold text-gray-900">{tournaments.length}</p>
            </div>
            <FaTrophy className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Tournaments</p>
              <p className="text-2xl font-bold text-green-600">
                {tournaments.filter(t => t.status === 'active').length}
              </p>
            </div>
            <FaPlay className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Matches</p>
              <p className="text-2xl font-bold text-purple-600">{stats.total_matches_played || 0}</p>
            </div>
            <FaChartLine className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Win Rate</p>
              <p className="text-2xl font-bold text-orange-600">{stats.win_rate || 0}%</p>
            </div>
            <FaMedal className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Tournament List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Your Tournaments</h2>
        {tournaments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FaTrophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tournaments yet</h3>
            <p className="text-gray-600 mb-6">Create your first tournament to get started</p>
            <button
              onClick={() => setCreationMode(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
            >
              Create Your First Tournament
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <TournamentStatusCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tournament workflow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AnimatePresence mode="wait">
        {/* Creation Mode */}
        {creationMode && (
          <TournamentCreation
            onClose={() => setCreationMode(false)}
            onSuccess={(newTournament) => {
              setCreationMode(false);
              fetchTournamentData();
              toast.success('Tournament created successfully!');
            }}
          />
        )}

        {/* Management Mode */}
        {managementMode && selectedTournament && (
          <TournamentDetails
            tournament={selectedTournament}
            onBack={() => {
              setManagementMode(false);
              setSelectedTournament(null);
            }}
            onUpdate={(updatedTournament) => {
              setSelectedTournament(updatedTournament);
              fetchTournamentData();
            }}
          />
        )}

        {/* Execution Mode */}
        {executionMode && selectedTournament && (
          <LiveScoring
            tournament={selectedTournament}
            onBack={() => {
              setExecutionMode(false);
              setSelectedTournament(null);
            }}
          />
        )}

        {/* Main Overview */}
        {!creationMode && !managementMode && !executionMode && (
          <WorkflowOverview />
        )}
      </AnimatePresence>
    </div>
  );
}
