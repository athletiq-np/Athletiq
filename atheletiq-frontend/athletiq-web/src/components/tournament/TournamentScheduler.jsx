import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Filter,
  Search,
  Download,
  Upload,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Zap,
  Trophy,
  Star
} from 'lucide-react';

const TournamentScheduler = ({ tournamentId, tournament }) => {
  const [activeView, setActiveView] = useState('schedule'); // schedule, venues, officials
  const [viewMode, setViewMode] = useState('grid'); // grid, list, calendar
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [matches, setMatches] = useState([]);
  const [venues, setVenues] = useState([]);
  const [officials, setOfficials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock data
  const mockMatches = [
    {
      id: 1,
      homeTeam: 'Eagles FC',
      awayTeam: 'Thunder Hawks',
      date: '2024-02-15',
      time: '10:00 AM',
      venue: 'Main Field',
      status: 'scheduled',
      round: 'Quarter Final',
      group: 'Group A',
      referee: 'John Smith',
      assistants: ['Mike Johnson', 'Sarah Wilson'],
      score: null
    },
    {
      id: 2,
      homeTeam: 'Lightning Bolts',
      awayTeam: 'Storm Riders',
      date: '2024-02-15',
      time: '12:00 PM',
      venue: 'Field 2',
      status: 'ongoing',
      round: 'Quarter Final',
      group: 'Group B',
      referee: 'Emma Davis',
      assistants: ['Tom Brown', 'Lisa Garcia'],
      score: { home: 2, away: 1 }
    },
    {
      id: 3,
      homeTeam: 'Fire Dragons',
      awayTeam: 'Ice Wolves',
      date: '2024-02-15',
      time: '2:00 PM',
      venue: 'Main Field',
      status: 'completed',
      round: 'Quarter Final',
      group: 'Group A',
      referee: 'Robert Taylor',
      assistants: ['Anna White', 'David Lee'],
      score: { home: 3, away: 2 }
    },
    {
      id: 4,
      homeTeam: 'Solar Eagles',
      awayTeam: 'Moon Tigers',
      date: '2024-02-16',
      time: '11:00 AM',
      venue: 'Field 3',
      status: 'scheduled',
      round: 'Semi Final',
      group: null,
      referee: 'Jennifer Moore',
      assistants: ['Chris Anderson', 'Maria Rodriguez'],
      score: null
    }
  ];

  const mockVenues = [
    {
      id: 1,
      name: 'Main Field',
      type: 'Grass',
      capacity: 500,
      facilities: ['Changing Rooms', 'First Aid', 'Spectator Stands'],
      status: 'available',
      matches: 8,
      location: 'North Campus'
    },
    {
      id: 2,
      name: 'Field 2',
      type: 'Artificial Turf',
      capacity: 300,
      facilities: ['Changing Rooms', 'Lighting'],
      status: 'occupied',
      matches: 6,
      location: 'East Campus'
    },
    {
      id: 3,
      name: 'Field 3',
      type: 'Grass',
      capacity: 200,
      facilities: ['Basic Facilities'],
      status: 'maintenance',
      matches: 4,
      location: 'South Campus'
    }
  ];

  const mockOfficials = [
    {
      id: 1,
      name: 'John Smith',
      role: 'Referee',
      experience: 5,
      certification: 'Level 2',
      matches: 12,
      rating: 4.8,
      availability: 'available',
      contact: 'john.smith@officials.org'
    },
    {
      id: 2,
      name: 'Emma Davis',
      role: 'Referee',
      experience: 3,
      certification: 'Level 1',
      matches: 8,
      rating: 4.6,
      availability: 'busy',
      contact: 'emma.davis@officials.org'
    },
    {
      id: 3,
      name: 'Mike Johnson',
      role: 'Assistant Referee',
      experience: 2,
      certification: 'Level 1',
      matches: 15,
      rating: 4.7,
      availability: 'available',
      contact: 'mike.j@officials.org'
    }
  ];

  useEffect(() => {
    loadScheduleData();
  }, [tournamentId, activeView]);

  const loadScheduleData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMatches(mockMatches);
      setVenues(mockVenues);
      setOfficials(mockOfficials);
    } catch (error) {
      console.error('Error loading schedule data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      postponed: 'bg-yellow-100 text-yellow-800',
      available: 'bg-green-100 text-green-800',
      occupied: 'bg-yellow-100 text-yellow-800',
      maintenance: 'bg-red-100 text-red-800',
      busy: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.scheduled;
  };

  const getStatusIcon = (status) => {
    const icons = {
      scheduled: Clock,
      ongoing: Play,
      completed: CheckCircle,
      cancelled: AlertCircle,
      postponed: Pause
    };
    const Icon = icons[status] || Clock;
    return <Icon className="h-4 w-4" />;
  };

  const MatchCard = ({ match }) => {
    // Handle case where match is undefined or null
    if (!match) {
      return (
        <div className="bg-gray-100 border border-gray-200 rounded-lg p-6">
          <div className="text-center text-gray-500">
            <p>Match data not available</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status || 'scheduled')}`}>
              {getStatusIcon(match.status || 'scheduled')}
              <span className="ml-1">{match.status || 'scheduled'}</span>
            </span>
            <span className="text-sm text-gray-600">{match.round || 'Round 1'}</span>
          </div>
          <button className="p-1 hover:bg-gray-100 rounded">
            <MoreVertical className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <div className="text-center mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-right">
              <h3 className="text-lg font-semibold text-gray-900">{match.homeTeam || 'Home Team'}</h3>
              <p className="text-sm text-gray-600">Home</p>
            </div>
            <div className="px-4">
              {match.score ? (
                <div className="text-2xl font-bold text-gray-900">
                  {match.score.home} - {match.score.away}
                </div>
              ) : (
                <div className="text-lg text-gray-500">VS</div>
              )}
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900">{match.awayTeam || 'Away Team'}</h3>
              <p className="text-sm text-gray-600">Away</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>{match.date ? new Date(match.date).toLocaleDateString() : 'TBD'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span>{match.time || 'TBD'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span>{match.venue || 'TBD'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-gray-500" />
            <span>{match.referee || 'TBD'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            {match.status === 'scheduled' && (
              <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                Start Match
              </button>
            )}
            {match.status === 'ongoing' && (
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Live Score
              </button>
            )}
            {match.status === 'completed' && (
              <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                View Results
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button className="text-gray-600 hover:text-gray-800 text-sm">
              Edit
            </button>
            <button className="text-red-600 hover:text-red-800 text-sm">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const VenueCard = ({ venue }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{venue.name}</h3>
          <p className="text-sm text-gray-600">{venue.location}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(venue.status)}`}>
          {venue.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Type</p>
          <p className="font-medium">{venue.type}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Capacity</p>
          <p className="font-medium">{venue.capacity} people</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Matches</p>
          <p className="font-medium">{venue.matches} scheduled</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Facilities</p>
          <p className="font-medium">{venue.facilities.length} available</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Facilities</p>
        <div className="flex flex-wrap gap-1">
          {venue.facilities.map((facility, index) => (
            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
              {facility}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          View Schedule
        </button>
        <div className="flex items-center space-x-2">
          <button className="text-green-600 hover:text-green-800 text-sm font-medium">
            Edit
          </button>
          <button className="text-red-600 hover:text-red-800 text-sm font-medium">
            Maintenance
          </button>
        </div>
      </div>
    </div>
  );

  const OfficialCard = ({ official }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{official.name}</h3>
          <p className="text-sm text-gray-600">{official.role}</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">{official.rating}</span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(official.availability)}`}>
            {official.availability}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Experience</p>
          <p className="font-medium">{official.experience} years</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Certification</p>
          <p className="font-medium">{official.certification}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Matches</p>
          <p className="font-medium">{official.matches} this season</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Contact</p>
          <p className="font-medium text-xs">{official.contact}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          View Schedule
        </button>
        <div className="flex items-center space-x-2">
          <button className="text-green-600 hover:text-green-800 text-sm font-medium">
            Assign
          </button>
          <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">
            Contact
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    const data = activeView === 'schedule' ? matches : activeView === 'venues' ? venues : officials;
    const CardComponent = activeView === 'schedule' ? MatchCard : activeView === 'venues' ? VenueCard : OfficialCard;

    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.map(item => (
          <CardComponent key={item.id} {...{[activeView.slice(0, -1)]: item}} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tournament Schedule</h2>
          <p className="text-gray-600">Manage matches, venues, and officials for {tournament?.name}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>Import Schedule</span>
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add {activeView === 'schedule' ? 'Match' : activeView === 'venues' ? 'Venue' : 'Official'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveView('schedule')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeView === 'schedule'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="h-4 w-4 inline mr-2" />
            Matches ({matches.length})
          </button>
          <button
            onClick={() => setActiveView('venues')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeView === 'venues'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <MapPin className="h-4 w-4 inline mr-2" />
            Venues ({venues.length})
          </button>
          <button
            onClick={() => setActiveView('officials')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeView === 'officials'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Zap className="h-4 w-4 inline mr-2" />
            Officials ({officials.length})
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
              placeholder={`Search ${activeView}...`}
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
            {activeView === 'schedule' && (
              <>
                <option value="scheduled">Scheduled</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </>
            )}
            {activeView === 'venues' && (
              <>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </>
            )}
            {activeView === 'officials' && (
              <>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
              </>
            )}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="h-4 w-4" />
          </button>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="h-4 w-4" />
          </button>
          <div className="flex border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {activeView === 'schedule' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Matches</p>
                <p className="text-2xl font-bold text-gray-900">{matches.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {matches.filter(m => m.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ongoing</p>
                <p className="text-2xl font-bold text-blue-600">
                  {matches.filter(m => m.status === 'ongoing').length}
                </p>
              </div>
              <Play className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {matches.filter(m => m.status === 'scheduled').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {renderContent()}
    </div>
  );
};

export default TournamentScheduler;