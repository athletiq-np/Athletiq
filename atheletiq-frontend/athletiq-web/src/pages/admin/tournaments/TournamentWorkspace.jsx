import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Trophy,
  Users,
  Calendar,
  Settings,
  BarChart3,
  Award,
  FileText,
  ArrowLeft,
  Eye,
  Edit,
  Play,
  Pause,
  CheckCircle,
  Clock,
  User
} from 'lucide-react';
import CertificateManager from '../../../components/features/tournament/CertificateManager';
import ParticipantManagement from '../../../components/tournament/ParticipantManagement';
import TournamentScheduler from '../../../components/tournament/TournamentScheduler';
import AnalyticsDashboard from '../../../components/tournament/AnalyticsDashboard';
import TournamentSettings from '../../../components/tournament/TournamentSettings';
import { getTournamentById, getTournamentStats, updateTournamentStatus } from '../../../api/tournamentApi';

const TournamentWorkspace = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  
  const [tournament, setTournament] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Load tournament data
  useEffect(() => {
    if (tournamentId) {
      loadTournamentData();
    }
  }, [tournamentId]);

  const loadTournamentData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [tournamentRes, statsRes] = await Promise.all([
        getTournamentById(tournamentId),
        getTournamentStats(tournamentId).catch(() => ({ data: null })) // Optional stats
      ]);
      
      setTournament(tournamentRes.data.tournament);
      setStats(statsRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load tournament data');
      console.error('Error loading tournament:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await updateTournamentStatus(tournamentId, newStatus);
      setTournament(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      setError(err.message || 'Failed to update tournament status');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'teams', label: 'Teams & Players', icon: Users },
    { id: 'schedule', label: 'Schedule & Matches', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'certificates', label: 'Certificates', icon: Award },
    { id: 'settings', label: 'Settings', icon: Settings }
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

  const getStatusIcon = (status) => {
    const icons = {
      draft: FileText,
      published: Eye,
      ongoing: Play,
      completed: CheckCircle,
      cancelled: Pause
    };
    const Icon = icons[status] || Clock;
    return <Icon className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading tournament...</span>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tournament not found</h3>
          <p className="text-gray-600 mb-4">{error || 'The tournament you\'re looking for doesn\'t exist.'}</p>
          <button
            onClick={() => navigate('/admin/tournaments')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center mx-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tournaments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
              <button
                onClick={() => navigate('/admin/tournaments')}
                className="hover:text-gray-900 flex items-center"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Tournaments
              </button>
              <span>/</span>
              <span className="text-gray-900">{tournament.name}</span>
            </div>

            {/* Tournament Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{tournament.name}</h1>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tournament.status)}`}>
                    {getStatusIcon(tournament.status)}
                    <span className="ml-1 capitalize">{tournament.status}</span>
                  </span>
                </div>
                
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Trophy className="mr-1 h-4 w-4" />
                    <span className="capitalize">{tournament.sport}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    <span>
                      {tournament.start_date 
                        ? new Date(tournament.start_date).toLocaleDateString()
                        : 'Date TBD'
                      }
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Users className="mr-1 h-4 w-4" />
                    <span>{stats?.registered_teams || 0} teams registered</span>
                  </div>
                </div>

                {tournament.description && (
                  <p className="mt-2 text-gray-600 max-w-2xl">{tournament.description}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                {tournament.status === 'draft' && (
                  <button
                    onClick={() => handleStatusUpdate('published')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Publish
                  </button>
                )}
                
                {tournament.status === 'published' && (
                  <button
                    onClick={() => handleStatusUpdate('ongoing')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Tournament
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('settings')}
                  className="text-gray-600 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 mt-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg flex items-center ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="mr-2 h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <TournamentOverview tournament={tournament} stats={stats} />
        )}

        {activeTab === 'teams' && (
          <TeamsAndPlayers tournamentId={tournamentId} />
        )}

        {activeTab === 'schedule' && (
          <ScheduleAndMatches tournamentId={tournamentId} />
        )}

        {activeTab === 'teams' && (
          <ParticipantManagement 
            tournamentId={tournamentId} 
            tournament={tournament}
          />
        )}

        {activeTab === 'schedule' && (
          <TournamentScheduler 
            tournamentId={tournamentId} 
            tournament={tournament}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard 
            tournamentId={tournamentId} 
            tournament={tournament}
          />
        )}

        {activeTab === 'certificates' && (
          <CertificateManager 
            tournamentId={tournamentId} 
            tournamentName={tournament.name}
          />
        )}

        {activeTab === 'settings' && (
          <TournamentSettings tournament={tournament} onUpdate={loadTournamentData} />
        )}
      </div>
    </div>
  );
};

// Tournament Overview Component
const TournamentOverview = ({ tournament, stats }) => {
  const statCards = [
    {
      title: 'Registered Teams',
      value: stats?.registered_teams || 0,
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Total Players',
      value: stats?.total_players || 0,
      icon: User,
      color: 'green'
    },
    {
      title: 'Matches Played',
      value: stats?.completed_matches || 0,
      icon: Trophy,
      color: 'purple'
    },
    {
      title: 'Certificates Issued',
      value: stats?.total_certificates || 0,
      icon: Award,
      color: 'yellow'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-${stat.color}-50 text-${stat.color}-600`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tournament Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Format:</span>
              <span className="font-medium capitalize">{tournament.format}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium capitalize">{tournament.tournament_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Max Teams:</span>
              <span className="font-medium">{tournament.max_teams}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Entry Fee:</span>
              <span className="font-medium">${tournament.entry_fee}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Prize Pool:</span>
              <span className="font-medium">${tournament.prize_pool}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              Tournament activity will be displayed here as it becomes available.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Placeholder components for other tabs
const TeamsAndPlayers = ({ tournamentId }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Teams & Players Management</h3>
    <p className="text-gray-600">Team and player management interface will be implemented here.</p>
  </div>
);

const ScheduleAndMatches = ({ tournamentId }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule & Matches</h3>
    <p className="text-gray-600">Tournament scheduling and match management interface will be implemented here.</p>
  </div>
);

const TournamentSettings = ({ tournament, onUpdate }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Settings</h3>
    <p className="text-gray-600">Tournament configuration and settings will be implemented here.</p>
  </div>
);

export default TournamentWorkspace;
