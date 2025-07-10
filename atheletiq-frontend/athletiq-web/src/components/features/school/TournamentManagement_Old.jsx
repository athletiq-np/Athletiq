// src/components/features/school/TournamentManagement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTrophy, FaPlus, FaCalendarAlt, FaEye, FaEdit, FaUsers, FaChartLine, 
  FaRegClock, FaCheckCircle, FaCalendarPlus, FaCog, FaFlag, FaFileAlt, 
  FaArrowRight, FaArrowLeft, FaTimes, FaEllipsisV, FaMapMarkerAlt, FaStar,
  FaShare, FaDownload, FaTrash, FaCopy, FaExternalLinkAlt, FaGraduationCap,
  FaMedal, FaStopwatch, FaPlayCircle, FaPauseCircle, FaChevronRight
} from 'react-icons/fa';
import TournamentRegistrationModal from './TournamentRegistrationModal';
import TournamentBracket from './TournamentBracket';
import { toast } from 'react-toastify';
import apiClient from '@api/apiClient';

// Import tournament creation step components
import TournamentInfoStep from '../tournament/TournamentInfoStep';
import TournamentSportsStep from '../tournament/TournamentSportsStep';
import TournamentConfigStep from '../tournament/TournamentConfigStep';
import TournamentReviewStep from '../tournament/TournamentReviewStep';

// Import the comprehensive tournament workspace components
import ParticipantManagement from '../../tournament/ParticipantManagement';
import TournamentScheduler from '../../tournament/TournamentScheduler';
import AnalyticsDashboard from '../../tournament/AnalyticsDashboard';
import CertificateManager from '../tournament/CertificateManager';
import TournamentSettings from '../../tournament/TournamentSettings';

export default function TournamentManagement({ tournaments, school, onRefresh }) {
  const navigate = useNavigate();
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [viewMode, setViewMode] = useState('overview'); // 'overview' or 'details'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [tournamentData, setTournamentData] = useState({
    managed: [], // Only show tournaments created by this school
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
      
      // Fetch only tournaments managed by this school
      const [tournamentsRes, statsRes, teamsRes, playersRes] = await Promise.all([
        apiClient.get('/schools/me/tournaments').catch(() => ({ data: { success: false, data: { registered_tournaments: [] } } })),
        apiClient.get('/schools/me/tournament-stats').catch(() => ({ data: { success: false, data: {} } })),
        apiClient.get('/schools/me/teams').catch(() => ({ data: { success: false, data: [] } })),
        apiClient.get('/schools/me/players').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      setTournamentData({
        managed: tournamentsRes.data?.data?.registered_tournaments?.filter(t => t.relationship_type === 'organized') || [],
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

  const handleCreateTournament = () => {
    setShowCreateModal(true);
    setCreateStep(0);
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
  };

  const handleTournamentSelect = (tournament) => {
    setSelectedTournament(tournament);
    setViewMode('details');
  };

  const handleBackToOverview = () => {
    setSelectedTournament(null);
    setViewMode('overview');
  };

  // Filter and sort tournaments
  const filteredTournaments = tournamentData.managed
    .filter(tournament => {
      const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tournament.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || tournament.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'date':
        default:
          return new Date(b.start_date) - new Date(a.start_date);
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AnimatePresence mode="wait">
        {viewMode === 'overview' ? (
          <TournamentOverviewPage 
            key="overview"
            tournaments={filteredTournaments}
            onCreateTournament={handleCreateTournament}
            onSelectTournament={handleTournamentSelect}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            sortBy={sortBy}
            setSortBy={setSortBy}
            stats={tournamentData.stats}
          />
        ) : (
          <TournamentDetailsPage
            key="details"
            tournament={selectedTournament}
            onBack={handleBackToOverview}
            onUpdate={fetchTournamentData}
            currentUser={currentUser}
          />
        )}
      </AnimatePresence>

      {/* Create Tournament Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <TournamentCreateModal
            step={createStep}
            form={tournamentForm}
            steps={CREATE_STEPS}
            currentUser={currentUser}
            onNext={() => setCreateStep(prev => Math.min(prev + 1, CREATE_STEPS.length - 1))}
            onBack={() => setCreateStep(prev => Math.max(prev - 1, 0))}
            onFormUpdate={setTournamentForm}
            onClose={() => setShowCreateModal(false)}
            onComplete={async (formData) => {
              try {
                const response = await apiClient.post('/tournaments', formData);
                
                if (response.data.success) {
                  toast.success('Tournament created successfully!');
                  setShowCreateModal(false);
                  setCreateStep(0);
                  fetchTournamentData();
                } else {
                  toast.error(response.data.message || 'Failed to create tournament');
                }
              } catch (error) {
                console.error('Error creating tournament:', error);
                toast.error('Failed to create tournament');
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

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
            
            {type === 'managed' && (
              <button
                onClick={() => {
                  setSelectedWorkspaceTournament(tournament);
                  setActiveTab('workspace');
                }}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <FaCog className="w-4 h-4" />
                Manage Tournament
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
  }

  // Tournament Workspace Component
  function TournamentWorkspaceView({ tournament, onBack }) {
    const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('overview');

    const workspaceTabs = [
      { id: 'overview', label: 'Overview', icon: FaEye },
      { id: 'teams', label: 'Teams & Players', icon: FaUsers },
      { id: 'schedule', label: 'Schedule & Matches', icon: FaCalendarAlt },
      { id: 'analytics', label: 'Analytics', icon: FaChartLine },
      { id: 'certificates', label: 'Certificates', icon: FaFlag },
      { id: 'settings', label: 'Settings', icon: FaCog }
    ];

    const getStatusColor = (status) => {
      const colors = {
        draft: 'bg-gray-100 text-gray-800',
        published: 'bg-blue-100 text-blue-800',
        ongoing: 'bg-green-100 text-green-800',
        completed: 'bg-purple-100 text-purple-800',
        cancelled: 'bg-red-100 text-red-800'
      };
      return colors[status] || colors.draft;
    };

    return (
      <div className="space-y-6">
        {/* Workspace Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              >
                <FaArrowRight className="w-4 h-4 transform rotate-180" />
                Back to Managed Tournaments
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <FaTrophy className="text-yellow-500" />
                  {tournament.name}
                </h1>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tournament.status)}`}>
                    {tournament.status?.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-600">Code: {tournament.tournament_code}</span>
                  <span className="text-sm text-gray-600">Format: {tournament.format}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Publish Tournament
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                Preview
              </button>
            </div>
          </div>
        </div>

        {/* Workspace Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {workspaceTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveWorkspaceTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeWorkspaceTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Workspace Content */}
        <div className="bg-white border border-gray-200 rounded-lg">
          {activeWorkspaceTab === 'overview' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900">Registered Teams</h4>
                  <p className="text-2xl font-bold text-blue-600">{tournament.registered_teams || 0}</p>
                  <p className="text-sm text-blue-700">of {tournament.max_teams} maximum</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900">Matches Scheduled</h4>
                  <p className="text-2xl font-bold text-green-600">0</p>
                  <p className="text-sm text-green-700">Ready to generate</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900">Completion</h4>
                  <p className="text-2xl font-bold text-purple-600">25%</p>
                  <p className="text-sm text-purple-700">Setup progress</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Quick Actions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button 
                    onClick={() => setActiveWorkspaceTab('teams')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <FaUsers className="h-6 w-6 text-blue-600 mb-2" />
                    <h5 className="font-medium">Manage Teams</h5>
                    <p className="text-sm text-gray-600">Add teams and players</p>
                  </button>
                  <button 
                    onClick={() => setActiveWorkspaceTab('schedule')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <FaCalendarAlt className="h-6 w-6 text-green-600 mb-2" />
                    <h5 className="font-medium">Create Schedule</h5>
                    <p className="text-sm text-gray-600">Generate matches</p>
                  </button>
                  <button 
                    onClick={() => setActiveWorkspaceTab('certificates')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <FaFlag className="h-6 w-6 text-purple-600 mb-2" />
                    <h5 className="font-medium">Certificates</h5>
                    <p className="text-sm text-gray-600">Design awards</p>
                  </button>
                  <button 
                    onClick={() => setActiveWorkspaceTab('analytics')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <FaChartLine className="h-6 w-6 text-orange-600 mb-2" />
                    <h5 className="font-medium">Analytics</h5>
                    <p className="text-sm text-gray-600">View insights</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeWorkspaceTab === 'teams' && (
            <ParticipantManagement 
              tournamentId={tournament.id} 
              tournament={tournament}
            />
          )}

          {activeWorkspaceTab === 'schedule' && (
            <TournamentScheduler 
              tournamentId={tournament.id} 
              tournament={tournament}
            />
          )}

          {activeWorkspaceTab === 'analytics' && (
            <AnalyticsDashboard 
              tournamentId={tournament.id} 
              tournament={tournament}
            />
          )}

          {activeWorkspaceTab === 'certificates' && (
            <CertificateManager 
              tournamentId={tournament.id} 
              tournamentName={tournament.name}
            />
          )}

          {activeWorkspaceTab === 'settings' && (
            <TournamentSettings 
              tournament={tournament} 
              onUpdate={() => {
                // Refresh tournament data
                console.log('Tournament updated');
              }} 
            />
          )}
        </div>
      </div>
    );
  }

  // Main render logic for TournamentManagement
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If workspace view is active, show the workspace
  if (activeTab === 'workspace' && selectedWorkspaceTournament) {
    return (
      <TournamentWorkspaceView 
        tournament={selectedWorkspaceTournament}
        onBack={() => {
          setActiveTab('overview');
          setSelectedWorkspaceTournament(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tournament Management</h1>
          <p className="text-gray-600">Manage your school's tournament participation and organization</p>
        </div>
        <button
          onClick={() => setActiveTab('create')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <FaPlus className="w-4 h-4" />
          Create Tournament
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
            Overview
          </TabButton>
          <TabButton active={activeTab === 'registered'} onClick={() => setActiveTab('registered')}>
            Registered Tournaments
          </TabButton>
          <TabButton active={activeTab === 'available'} onClick={() => setActiveTab('available')}>
            Available Tournaments
          </TabButton>
          <TabButton active={activeTab === 'managed'} onClick={() => setActiveTab('managed')}>
            Managed Tournaments
          </TabButton>
          <TabButton active={activeTab === 'brackets'} onClick={() => setActiveTab('brackets')}>
            Brackets
          </TabButton>
          <TabButton active={activeTab === 'create'} onClick={() => setActiveTab('create')}>
            Create Tournament
          </TabButton>
        </nav>
      </div>

      {/* Content */}
      <div>
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

        {activeTab === 'managed' && (
          <TournamentList 
            tournaments={tournamentData.managed}
            type="managed"
            onRegister={openRegistrationModal}
          />
        )}

        {activeTab === 'brackets' && (
          <BracketView tournaments={[...tournamentData.registered, ...tournamentData.managed]} />
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
            onComplete={async (formData) => {
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
                  setActiveTab('managed');
                  setCreateStep(0);
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
                  fetchTournamentData();
                } else {
                  toast.error(data.message || 'Failed to create tournament');
                }
              } catch (error) {
                console.error('Error creating tournament:', error);
                toast.error('Failed to create tournament');
              }
            }}
          />
        )}
      </div>

      {/* Registration Modal */}
      {showRegistrationModal && selectedTournament && (
        <TournamentRegistrationModal
          tournament={selectedTournament}
          onClose={() => {
            setShowRegistrationModal(false);
            setSelectedTournament(null);
          }}
          onRegister={handleRegisterForTournament}
        />
      )}
    </div>
  );

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

  // Enhanced Tournament Workspace View Component
  function EnhancedTournamentWorkspaceView({ tournament, currentUser, onClose }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [isLoading, setIsLoading] = useState(false);
    const [participants, setParticipants] = useState([]);
    const [matches, setMatches] = useState([]);
    const [statistics, setStatistics] = useState({});

    useEffect(() => {
      if (tournament?.id) {
        loadTournamentData();
      }
    }, [tournament?.id]);

    const loadTournamentData = async () => {
      setIsLoading(true);
      try {
        // Load participants, matches, and statistics
        const [participantsRes, matchesRes, statsRes] = await Promise.all([
          fetch(`/api/tournaments/${tournament.id}/participants`),
          fetch(`/api/tournaments/${tournament.id}/matches`),
          fetch(`/api/tournaments/${tournament.id}/statistics`)
        ]);

        if (participantsRes.ok) {
          const participantsData = await participantsRes.json();
          setParticipants(participantsData);
        }

        if (matchesRes.ok) {
          const matchesData = await matchesRes.json();
          setMatches(matchesData);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStatistics(statsData);
        }
      } catch (error) {
        console.error('Error loading tournament data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const tabs = [
      { id: 'overview', label: 'Overview', icon: '📊' },
      { id: 'participants', label: 'Participants', icon: '👥' },
      { id: 'matches', label: 'Matches', icon: '🏆' },
      { id: 'brackets', label: 'Brackets', icon: '🏅' },
      { id: 'statistics', label: 'Statistics', icon: '📈' },
      { id: 'settings', label: 'Settings', icon: '⚙️' }
    ];

    const renderTabContent = () => {
      switch (activeTab) {
        case 'overview':
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tournament Info Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Details</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Name:</span>
                      <p className="text-gray-900">{tournament?.name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Sport:</span>
                      <p className="text-gray-900">{tournament?.sport}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Status:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        tournament?.status === 'active' ? 'bg-green-100 text-green-800' :
                        tournament?.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {tournament?.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Start Date:</span>
                      <p className="text-gray-900">{new Date(tournament?.startDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Participants:</span>
                      <span className="text-gray-900">{participants.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Total Matches:</span>
                      <span className="text-gray-900">{matches.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Completed:</span>
                      <span className="text-gray-900">{matches.filter(m => m.status === 'completed').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Upcoming:</span>
                      <span className="text-gray-900">{matches.filter(m => m.status === 'scheduled').length}</span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {matches.slice(0, 3).map((match, index) => (
                      <div key={index} className="text-sm">
                        <p className="text-gray-900">{match.team1} vs {match.team2}</p>
                        <p className="text-gray-500">{match.status}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );

        case 'participants':
          return (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Tournament Participants</h3>
              </div>
              <div className="p-6">
                {participants.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No participants registered yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Team/Player
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            School
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Registration Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {participants.map((participant, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {participant.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {participant.school}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(participant.registrationDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                participant.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {participant.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );

        case 'matches':
          return (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Tournament Matches</h3>
              </div>
              <div className="p-6">
                {matches.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No matches scheduled yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {matches.map((match, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {match.team1} vs {match.team2}
                            </h4>
                            <p className="text-sm text-gray-500">
                              Round {match.round} • {new Date(match.scheduledTime).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              match.status === 'completed' ? 'bg-green-100 text-green-800' :
                              match.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {match.status}
                            </span>
                            {match.score && (
                              <p className="text-sm text-gray-900 mt-1">{match.score}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );

        case 'brackets':
          return (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Brackets</h3>
              <div className="text-center py-8">
                <p className="text-gray-500">Bracket visualization coming soon...</p>
              </div>
            </div>
          );

        case 'statistics':
          return (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Statistics</h3>
              <div className="text-center py-8">
                <p className="text-gray-500">Statistics dashboard coming soon...</p>
              </div>
            </div>
          );

        case 'settings':
          return (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Settings</h3>
              <div className="text-center py-8">
                <p className="text-gray-500">Settings panel coming soon...</p>
              </div>
            </div>
          );

        default:
          return null;
      }
    };

    if (!tournament) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No tournament selected.</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{tournament.name}</h1>
                <p className="text-sm text-gray-500">Tournament Workspace</p>
              </div>
              <button
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="mt-6">
              <nav className="flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-500">Loading tournament data...</p>
            </div>
          ) : (
            renderTabContent()
          )}
        </div>
      </div>
    );
  }

}
