import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  TrendingUp,
  Download,
  Upload,
  Plus,
  School,
  User,
  Crown,
  Shield,
  Clock
} from 'lucide-react';

const ParticipantManagement = ({ tournamentId, tournament }) => {
  const [activeTab, setActiveTab] = useState('teams');
  const [participants, setParticipants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  // Mock data for demonstration - replace with API calls
  const mockTeams = [
    {
      id: 1,
      name: 'Eagles FC',
      school: 'Riverside High School',
      category: 'Senior Boys',
      coach: 'John Smith',
      players: 15,
      status: 'confirmed',
      registeredDate: '2024-01-15',
      contactEmail: 'coach@eagles.school.edu',
      phone: '+1-555-0123'
    },
    {
      id: 2,
      name: 'Lightning Bolts',
      school: 'Central Academy',
      category: 'Junior Girls',
      coach: 'Sarah Johnson',
      players: 12,
      status: 'pending',
      registeredDate: '2024-01-18',
      contactEmail: 'sarah.j@central.edu',
      phone: '+1-555-0456'
    },
    {
      id: 3,
      name: 'Thunder Hawks',
      school: 'North Valley School',
      category: 'Senior Boys',
      coach: 'Mike Wilson',
      players: 18,
      status: 'confirmed',
      registeredDate: '2024-01-12',
      contactEmail: 'mwilson@northvalley.edu',
      phone: '+1-555-0789'
    }
  ];

  const mockPlayers = [
    {
      id: 1,
      name: 'Alex Rodriguez',
      teamName: 'Eagles FC',
      position: 'Forward',
      jerseyNumber: 10,
      age: 17,
      grade: '12th',
      status: 'active',
      stats: { gamesPlayed: 8, goals: 12, assists: 5 }
    },
    {
      id: 2,
      name: 'Emma Thompson',
      teamName: 'Lightning Bolts',
      position: 'Midfielder',
      jerseyNumber: 8,
      age: 15,
      grade: '10th',
      status: 'active',
      stats: { gamesPlayed: 6, goals: 3, assists: 8 }
    },
    {
      id: 3,
      name: 'Marcus Johnson',
      teamName: 'Thunder Hawks',
      position: 'Goalkeeper',
      jerseyNumber: 1,
      age: 18,
      grade: '12th',
      status: 'active',
      stats: { gamesPlayed: 10, saves: 45, cleanSheets: 6 }
    }
  ];

  useEffect(() => {
    loadParticipants();
  }, [tournamentId, activeTab]);

  const loadParticipants = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setParticipants(activeTab === 'teams' ? mockTeams : mockPlayers);
    } catch (error) {
      console.error('Error loading participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      declined: 'bg-red-100 text-red-800',
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.pending;
  };

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (participant.school && participant.school.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === 'all' || participant.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const TeamCard = ({ team }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
            <p className="text-sm text-gray-600 flex items-center">
              <School className="h-4 w-4 mr-1" />
              {team.school}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(team.status)}`}>
            {team.status}
          </span>
          <button className="p-1 hover:bg-gray-100 rounded">
            <MoreVertical className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Category</p>
          <p className="font-medium">{team.category}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Players</p>
          <p className="font-medium">{team.players} registered</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Coach</p>
          <p className="font-medium">{team.coach}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Registered</p>
          <p className="font-medium">{new Date(team.registeredDate).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span className="flex items-center">
            <Mail className="h-4 w-4 mr-1" />
            {team.contactEmail}
          </span>
          <span className="flex items-center">
            <Phone className="h-4 w-4 mr-1" />
            {team.phone}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View Details
          </button>
          <button className="text-green-600 hover:text-green-800 text-sm font-medium">
            Edit
          </button>
        </div>
      </div>
    </div>
  );

  const PlayerCard = ({ player }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-green-100 p-2 rounded-lg">
            <User className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{player.name}</h3>
            <p className="text-sm text-gray-600">{player.teamName}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-bold">
            #{player.jerseyNumber}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(player.status)}`}>
            {player.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Position</p>
          <p className="font-medium">{player.position}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Age/Grade</p>
          <p className="font-medium">{player.age} • {player.grade}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Games Played</p>
          <p className="font-medium">{player.stats.gamesPlayed}</p>
        </div>
      </div>

      {player.stats && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Season Stats</h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            {player.stats.goals !== undefined && (
              <div>
                <span className="text-gray-600">Goals:</span>
                <span className="ml-1 font-medium">{player.stats.goals}</span>
              </div>
            )}
            {player.stats.assists !== undefined && (
              <div>
                <span className="text-gray-600">Assists:</span>
                <span className="ml-1 font-medium">{player.stats.assists}</span>
              </div>
            )}
            {player.stats.saves !== undefined && (
              <div>
                <span className="text-gray-600">Saves:</span>
                <span className="ml-1 font-medium">{player.stats.saves}</span>
              </div>
            )}
            {player.stats.cleanSheets !== undefined && (
              <div>
                <span className="text-gray-600">Clean Sheets:</span>
                <span className="ml-1 font-medium">{player.stats.cleanSheets}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          View Profile
        </button>
        <div className="flex items-center space-x-2">
          <button className="text-green-600 hover:text-green-800 text-sm font-medium">
            Edit
          </button>
          <button className="text-red-600 hover:text-red-800 text-sm font-medium">
            Remove
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Participant Management</h2>
          <p className="text-gray-600">Manage teams and players for {tournament?.name}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>Import</span>
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add {activeTab === 'teams' ? 'Team' : 'Player'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('teams')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'teams'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Teams ({mockTeams.length})
          </button>
          <button
            onClick={() => setActiveTab('players')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'players'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="h-4 w-4 inline mr-2" />
            Players ({mockPlayers.length})
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="h-4 w-4" />
          </button>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total {activeTab === 'teams' ? 'Teams' : 'Players'}</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeTab === 'teams' ? mockTeams.length : mockPlayers.length}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredParticipants.filter(p => p.status === 'confirmed' || p.status === 'active').length}
              </p>
            </div>
            <Crown className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {filteredParticipants.filter(p => p.status === 'pending').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion</p>
              <p className="text-2xl font-bold text-blue-600">85%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Participants Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredParticipants.map(participant => (
            activeTab === 'teams' ? (
              <TeamCard key={participant.id} team={participant} />
            ) : (
              <PlayerCard key={participant.id} player={participant} />
            )
          ))}
        </div>
      )}

      {filteredParticipants.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No {activeTab} found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? `No ${activeTab} match your search criteria.` : `No ${activeTab} have been added yet.`}
          </p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Add {activeTab === 'teams' ? 'Team' : 'Player'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ParticipantManagement;