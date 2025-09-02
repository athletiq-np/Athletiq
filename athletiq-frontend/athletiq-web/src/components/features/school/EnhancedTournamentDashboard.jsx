// src/components/features/school/EnhancedTournamentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTrophy, FaCalendarAlt, FaUsers, FaChartLine, FaPlay, FaPause,
  FaSitemap as FaBrackets, FaMedal, FaFlag, FaEye, FaEdit, FaCog, FaDownload,
  FaShare, FaPlus, FaSearch, FaFilter, FaSort, FaBell, FaExclamationTriangle
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiClient from '@api/apiClient';

// Import workflow components
import TournamentWorkflow from './TournamentWorkflow';
import TournamentCreation from '../../tournament/management/TournamentCreation';
import BracketManager from '../../tournament/bracket/BracketManager';
import ParticipantManagement from '../../tournament/ParticipantManagement';
import LiveScoring from '../../tournament/LiveScoring';
import AnalyticsDashboard from '../../tournament/AnalyticsDashboard';

/**
 * 🏆 Enhanced Tournament Dashboard for Schools
 * 
 * Complete tournament management system that integrates:
 * - Tournament creation and setup
 * - Team registration and management
 * - Bracket generation and visualization
 * - Live match management and scoring
 * - Analytics and reporting
 * - Document and communication management
 * 
 * This replaces the basic TournamentManagement component with a full workflow system
 */
export default function EnhancedTournamentDashboard({ school, onRefresh }) {
  const [activeTab, setActiveTab] = useState('workflow');
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [quickActions, setQuickActions] = useState([]);

  // Tab configuration
  const tabs = [
    {
      id: 'workflow',
      label: 'Tournament Workflow',
      icon: FaTrophy,
      description: 'Complete tournament lifecycle management',
      component: TournamentWorkflow
    },
    {
      id: 'active',
      label: 'Active Tournaments',
      icon: FaPlay,
      description: 'Manage live and ongoing tournaments',
      component: ActiveTournamentsView
    },
    {
      id: 'brackets',
      label: 'Brackets & Matches',
      icon: FaBrackets,
      description: 'View and manage tournament brackets',
      component: BracketManager
    },
    {
      id: 'participants',
      label: 'Teams & Players',
      icon: FaUsers,
      description: 'Manage tournament participants',
      component: ParticipantManagement
    },
    {
      id: 'analytics',
      label: 'Analytics & Reports',
      icon: FaChartLine,
      description: 'Tournament statistics and insights',
      component: AnalyticsDashboard
    },
    {
      id: 'calendar',
      label: 'Tournament Calendar',
      icon: FaCalendarAlt,
      description: 'Schedule and upcoming events',
      component: TournamentCalendarView
    }
  ];

  useEffect(() => {
    fetchDashboardData();
    // Set up real-time updates
    const interval = setInterval(fetchDashboardData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [tournamentsRes, statsRes, notificationsRes] = await Promise.all([
        apiClient.get('/schools/me/tournaments'),
        apiClient.get('/schools/me/tournament-stats'),
        apiClient.get('/schools/notifications?type=tournament&limit=10')
      ]);

      const tournamentsData = tournamentsRes.data.data?.registered_tournaments || [];
      setTournaments(tournamentsData);
      setStats(statsRes.data.data || {});
      setNotifications(notificationsRes.data.data || []);

      // Generate quick actions based on tournament states
      generateQuickActions(tournamentsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const generateQuickActions = (tournaments) => {
    const actions = [];

    // Check for tournaments needing attention
    tournaments.forEach(tournament => {
      switch (tournament.status) {
        case 'draft':
          if (!tournament.teams_count || tournament.teams_count < 2) {
            actions.push({
              id: `register-${tournament.id}`,
              type: 'warning',
              title: 'Teams Needed',
              message: `${tournament.name} needs teams registered`,
              action: () => openParticipantManagement(tournament),
              icon: FaUsers
            });
          } else {
            actions.push({
              id: `bracket-${tournament.id}`,
              type: 'info',
              title: 'Ready for Bracket',
              message: `${tournament.name} is ready for bracket generation`,
              action: () => generateBracket(tournament),
              icon: FaBrackets
            });
          }
          break;
        case 'active':
          actions.push({
            id: `live-${tournament.id}`,
            type: 'success',
            title: 'Tournament Live',
            message: `${tournament.name} has live matches`,
            action: () => openLiveScoring(tournament),
            icon: FaPlay
          });
          break;
        case 'completed':
          if (!tournament.results_published) {
            actions.push({
              id: `results-${tournament.id}`,
              type: 'info',
              title: 'Publish Results',
              message: `${tournament.name} results ready to publish`,
              action: () => publishResults(tournament),
              icon: FaMedal
            });
          }
          break;
      }
    });

    setQuickActions(actions.slice(0, 5)); // Limit to 5 actions
  };

  // Quick action handlers
  const openParticipantManagement = (tournament) => {
    setSelectedTournament(tournament);
    setActiveTab('participants');
  };

  const generateBracket = async (tournament) => {
    try {
      await apiClient.post(`/tournaments/${tournament.id}/generate-bracket`);
      toast.success('Tournament bracket generated successfully!');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to generate bracket');
    }
  };

  const openLiveScoring = (tournament) => {
    setSelectedTournament(tournament);
    setActiveTab('active');
  };

  const publishResults = async (tournament) => {
    try {
      await apiClient.patch(`/tournaments/${tournament.id}/publish-results`);
      toast.success('Tournament results published!');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to publish results');
    }
  };

  // Active Tournaments View Component
  function ActiveTournamentsView({ tournaments, selectedTournament }) {
    const activeTournaments = tournaments.filter(t => t.status === 'active');

    if (activeTournaments.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FaPlay className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No active tournaments</h3>
          <p className="text-gray-600">Active tournaments will appear here for live management</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {activeTournaments.map(tournament => (
          <div key={tournament.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <FaPlay className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{tournament.name}</h3>
                  <p className="text-sm text-gray-600">Live Tournament • {tournament.current_round || 'Round 1'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  LIVE
                </span>
                <button
                  onClick={() => openLiveScoring(tournament)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                  Manage Live
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{tournament.live_matches || 0}</div>
                <div className="text-xs text-gray-500">Live Matches</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{tournament.completed_matches || 0}</div>
                <div className="text-xs text-gray-500">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{tournament.remaining_matches || 0}</div>
                <div className="text-xs text-gray-500">Remaining</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{tournament.spectators || 0}</div>
                <div className="text-xs text-gray-500">Watching</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Tournament Calendar View Component
  function TournamentCalendarView({ tournaments }) {
    const upcomingTournaments = tournaments
      .filter(t => new Date(t.start_date) > new Date())
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Tournaments</h3>
          
          {upcomingTournaments.length === 0 ? (
            <div className="text-center py-8">
              <FaCalendarAlt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No upcoming tournaments scheduled</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingTournaments.map(tournament => (
                <div key={tournament.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <FaTrophy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{tournament.name}</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(tournament.start_date).toLocaleDateString()} - {tournament.location}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {Math.ceil((new Date(tournament.start_date) - new Date()) / (1000 * 60 * 60 * 24))} days
                    </div>
                    <div className="text-xs text-gray-500">until start</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Dashboard Header with Quick Stats
  const DashboardHeader = () => (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg p-6 text-white mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tournament Dashboard</h1>
          <p className="text-blue-100">Complete tournament management for {school?.name}</p>
        </div>
        <div className="flex items-center gap-4">
          {notifications.length > 0 && (
            <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2">
              <FaBell className="w-4 h-4" />
              <span className="text-sm">{notifications.length} alerts</span>
            </div>
          )}
          <button
            onClick={() => setActiveTab('workflow')}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <FaPlus className="w-4 h-4" />
            Create Tournament
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className="bg-white/10 rounded-lg p-4">
          <div className="text-2xl font-bold">{tournaments.length}</div>
          <div className="text-sm text-blue-100">Total Tournaments</div>
        </div>
        <div className="bg-white/10 rounded-lg p-4">
          <div className="text-2xl font-bold">{tournaments.filter(t => t.status === 'active').length}</div>
          <div className="text-sm text-blue-100">Active Now</div>
        </div>
        <div className="bg-white/10 rounded-lg p-4">
          <div className="text-2xl font-bold">{stats.total_matches_played || 0}</div>
          <div className="text-sm text-blue-100">Matches Played</div>
        </div>
        <div className="bg-white/10 rounded-lg p-4">
          <div className="text-2xl font-bold">{stats.win_rate || 0}%</div>
          <div className="text-sm text-blue-100">Win Rate</div>
        </div>
      </div>
    </div>
  );

  // Quick Actions Panel
  const QuickActionsPanel = () => (
    quickActions.length > 0 && (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="space-y-3">
          {quickActions.map(action => (
            <div key={action.id} className={`flex items-center justify-between p-3 rounded-lg border ${
              action.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
              action.type === 'success' ? 'border-green-200 bg-green-50' :
              'border-blue-200 bg-blue-50'
            }`}>
              <div className="flex items-center gap-3">
                <action.icon className={`w-5 h-5 ${
                  action.type === 'warning' ? 'text-yellow-600' :
                  action.type === 'success' ? 'text-green-600' :
                  'text-blue-600'
                }`} />
                <div>
                  <h4 className="font-medium text-gray-900">{action.title}</h4>
                  <p className="text-sm text-gray-600">{action.message}</p>
                </div>
              </div>
              <button
                onClick={action.action}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  action.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                  action.type === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                  'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Take Action
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tournament dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <QuickActionsPanel />

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {(() => {
            const activeTabConfig = tabs.find(tab => tab.id === activeTab);
            const TabComponent = activeTabConfig?.component;
            
            if (activeTab === 'workflow') {
              return <TournamentWorkflow school={school} onRefresh={fetchDashboardData} />;
            } else if (activeTab === 'active') {
              return <ActiveTournamentsView tournaments={tournaments} selectedTournament={selectedTournament} />;
            } else if (activeTab === 'calendar') {
              return <TournamentCalendarView tournaments={tournaments} />;
            } else if (TabComponent) {
              return <TabComponent tournament={selectedTournament} tournaments={tournaments} school={school} />;
            }
            return <div>Tab content not found</div>;
          })()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
