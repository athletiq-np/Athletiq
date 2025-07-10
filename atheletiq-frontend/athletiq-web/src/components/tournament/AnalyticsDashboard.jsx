import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Trophy,
  Target,
  Clock,
  MapPin,
  Star,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Eye,
  Award,
  Zap,
  Activity,
  PieChart,
  LineChart
} from 'lucide-react';

const AnalyticsDashboard = ({ tournamentId, tournament }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('7d');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock analytics data
  const mockAnalytics = {
    overview: {
      totalMatches: 24,
      completedMatches: 18,
      totalParticipants: 156,
      totalTeams: 12,
      averageMatchDuration: 95,
      totalGoals: 87,
      averageAttendance: 142,
      peakAttendance: 298
    },
    participation: {
      teamsRegistered: 12,
      playersRegistered: 156,
      attendance: [
        { date: '2024-02-10', count: 120 },
        { date: '2024-02-11', count: 145 },
        { date: '2024-02-12', count: 167 },
        { date: '2024-02-13', count: 189 },
        { date: '2024-02-14', count: 203 },
        { date: '2024-02-15', count: 298 },
        { date: '2024-02-16', count: 256 }
      ],
      demographics: {
        ageGroups: [
          { group: '13-15', count: 45, percentage: 28.8 },
          { group: '16-18', count: 111, percentage: 71.2 }
        ],
        schools: [
          { name: 'Riverside High', teams: 3, players: 42 },
          { name: 'Central Academy', teams: 2, players: 28 },
          { name: 'North Valley', teams: 3, players: 39 },
          { name: 'East Campus', teams: 2, players: 26 },
          { name: 'South Hills', teams: 2, players: 21 }
        ]
      }
    },
    performance: {
      topScorers: [
        { name: 'Alex Rodriguez', team: 'Eagles FC', goals: 8, matches: 6 },
        { name: 'Sarah Johnson', team: 'Lightning Bolts', goals: 6, matches: 5 },
        { name: 'Marcus Davis', team: 'Thunder Hawks', goals: 5, matches: 6 },
        { name: 'Emma Wilson', team: 'Storm Riders', goals: 4, matches: 4 }
      ],
      topTeams: [
        { name: 'Eagles FC', wins: 5, draws: 1, losses: 0, points: 16 },
        { name: 'Thunder Hawks', wins: 4, draws: 1, losses: 1, points: 13 },
        { name: 'Lightning Bolts', wins: 3, draws: 2, losses: 1, points: 11 },
        { name: 'Fire Dragons', wins: 3, draws: 1, losses: 2, points: 10 }
      ],
      matchStats: {
        averageGoalsPerMatch: 3.6,
        cleanSheets: 8,
        penalties: 5,
        yellowCards: 23,
        redCards: 2
      }
    },
    venues: {
      usage: [
        { venue: 'Main Field', matches: 10, utilization: 83.3 },
        { venue: 'Field 2', matches: 8, utilization: 66.7 },
        { venue: 'Field 3', matches: 6, utilization: 50.0 }
      ],
      attendance: [
        { venue: 'Main Field', avgAttendance: 185, capacity: 500 },
        { venue: 'Field 2', avgAttendance: 120, capacity: 300 },
        { venue: 'Field 3', avgAttendance: 85, capacity: 200 }
      ]
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [tournamentId, dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, change, icon: Icon, color = 'blue' }) => (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
          {change && (
            <div className="flex items-center mt-1">
              {change > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
              )}
              <span className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(change)}%
              </span>
            </div>
          )}
        </div>
        <div className={`bg-${color}-100 p-3 rounded-lg`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Matches"
          value={analytics.overview.totalMatches}
          change={12}
          icon={Trophy}
          color="blue"
        />
        <StatCard
          title="Participants"
          value={analytics.overview.totalParticipants}
          change={8}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Average Attendance"
          value={analytics.overview.averageAttendance}
          change={15}
          icon={Eye}
          color="purple"
        />
        <StatCard
          title="Goals Scored"
          value={analytics.overview.totalGoals}
          change={-3}
          icon={Target}
          color="orange"
        />
      </div>

      {/* Tournament Progress */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-200"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${(analytics.overview.completedMatches / analytics.overview.totalMatches) * 351.86} 351.86`}
                  className="text-blue-600"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">
                  {Math.round((analytics.overview.completedMatches / analytics.overview.totalMatches) * 100)}%
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600">Matches Completed</p>
            <p className="font-semibold">{analytics.overview.completedMatches}/{analytics.overview.totalMatches}</p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Team Registration</span>
                <span>100%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full w-full"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Venue Utilization</span>
                <span>66%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '66%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Officials Assigned</span>
                <span>92%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg Match Duration</span>
              <span className="font-semibold">{analytics.overview.averageMatchDuration} min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Peak Attendance</span>
              <span className="font-semibold">{analytics.overview.peakAttendance}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Teams</span>
              <span className="font-semibold">{analytics.overview.totalTeams}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Goals per Match</span>
              <span className="font-semibold">{analytics.performance.matchStats.averageGoalsPerMatch}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="bg-green-100 p-2 rounded-full">
              <Trophy className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Match Completed: Eagles FC vs Thunder Hawks</p>
              <p className="text-xs text-gray-600">Final Score: 3-2 • 15 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="bg-blue-100 p-2 rounded-full">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">New team registered: Storm Riders</p>
              <p className="text-xs text-gray-600">18 players • 2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="bg-purple-100 p-2 rounded-full">
              <Calendar className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Schedule updated for Quarter Finals</p>
              <p className="text-xs text-gray-600">4 matches rescheduled • 3 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ParticipationTab = () => (
    <div className="space-y-6">
      {/* Attendance Chart */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Attendance</h3>
        <div className="h-64 flex items-end justify-between space-x-2">
          {analytics.participation.attendance.map((day, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="bg-blue-600 w-full rounded-t"
                style={{
                  height: `${(day.count / Math.max(...analytics.participation.attendance.map(d => d.count))) * 200}px`
                }}
              ></div>
              <div className="mt-2 text-xs text-gray-600 text-center">
                <div>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div className="font-semibold">{day.count}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Age Distribution</h3>
          <div className="space-y-4">
            {analytics.participation.demographics.ageGroups.map((group, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium">{group.group} years</span>
                <div className="flex items-center space-x-3 flex-1 ml-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${group.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-12">{group.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">School Participation</h3>
          <div className="space-y-3">
            {analytics.participation.demographics.schools.map((school, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{school.name}</p>
                  <p className="text-sm text-gray-600">{school.teams} teams</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{school.players}</p>
                  <p className="text-sm text-gray-600">players</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const PerformanceTab = () => (
    <div className="space-y-6">
      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Scorers</h3>
          <div className="space-y-3">
            {analytics.performance.topScorers.map((player, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-yellow-100 p-2 rounded-full">
                    <Star className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium">{player.name}</p>
                    <p className="text-sm text-gray-600">{player.team}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{player.goals}</p>
                  <p className="text-sm text-gray-600">{player.matches} matches</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Standings</h3>
          <div className="space-y-3">
            {analytics.performance.topTeams.map((team, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Trophy className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{team.name}</p>
                    <p className="text-sm text-gray-600">
                      W:{team.wins} D:{team.draws} L:{team.losses}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{team.points}</p>
                  <p className="text-sm text-gray-600">points</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Match Statistics */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Match Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{analytics.performance.matchStats.averageGoalsPerMatch}</p>
            <p className="text-sm text-gray-600">Goals per Match</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{analytics.performance.matchStats.cleanSheets}</p>
            <p className="text-sm text-gray-600">Clean Sheets</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{analytics.performance.matchStats.penalties}</p>
            <p className="text-sm text-gray-600">Penalties</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{analytics.performance.matchStats.yellowCards}</p>
            <p className="text-sm text-gray-600">Yellow Cards</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{analytics.performance.matchStats.redCards}</p>
            <p className="text-sm text-gray-600">Red Cards</p>
          </div>
        </div>
      </div>
    </div>
  );

  const VenuesTab = () => (
    <div className="space-y-6">
      {/* Venue Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Venue Utilization</h3>
          <div className="space-y-4">
            {analytics.venues.usage.map((venue, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{venue.venue}</p>
                  <p className="text-sm text-gray-600">{venue.matches} matches</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${venue.utilization}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12">{venue.utilization}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Attendance by Venue</h3>
          <div className="space-y-4">
            {analytics.venues.attendance.map((venue, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{venue.venue}</p>
                  <p className="text-sm text-gray-600">Capacity: {venue.capacity}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${(venue.avgAttendance / venue.capacity) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12">{venue.avgAttendance}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tournament Analytics</h2>
          <p className="text-gray-600">Insights and statistics for {tournament?.name}</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="all">All time</option>
          </select>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'participation', label: 'Participation', icon: Users },
            { id: 'performance', label: 'Performance', icon: Trophy },
            { id: 'venues', label: 'Venues', icon: MapPin }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
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

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'participation' && <ParticipationTab />}
      {activeTab === 'performance' && <PerformanceTab />}
      {activeTab === 'venues' && <VenuesTab />}
    </div>
  );
};

export default AnalyticsDashboard;