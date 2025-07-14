import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Trophy, 
  Calendar, 
  BarChart3, 
  Settings, 
  Plus,
  Award,
  Target,
  TrendingUp,
  Activity,
  Zap,
  UserPlus
} from 'lucide-react';
import AdvancedTeamBuilder from '@/components/AdvancedTeamBuilder';
import TournamentDashboard from '@/components/dashboard/TournamentDashboard';
import TournamentTeamIntegration from '@/components/tournament/TournamentTeamIntegration';
import apiClient from '@/api/apiClient';
import { toast } from 'react-toastify';

export default function EnhancedSchoolDashboard() {
  const [activeView, setActiveView] = useState('overview');
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalStudents: 0,
    activeTournaments: 0,
    recentMatches: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [teamsRes, studentsRes] = await Promise.all([
        apiClient.get('/schools/me/teams'),
        apiClient.get('/schools/me/students').catch(() => ({ data: { data: [] } }))
      ]);
      
      setStats({
        totalTeams: teamsRes.data.data?.length || 0,
        totalStudents: studentsRes.data.data?.length || 0,
        activeTournaments: 3, // Mock data
        recentMatches: 12 // Mock data
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3, color: 'blue' },
    { id: 'athletes', label: 'Athletes', icon: UserPlus, color: 'emerald' },
    { id: 'team-builder', label: 'Team Builder', icon: Users, color: 'purple' },
    { id: 'tournaments', label: 'Tournaments', icon: Trophy, color: 'yellow' },
    { id: 'tournament-hub', label: 'Tournament Hub', icon: Target, color: 'indigo' },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, color: 'green' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'gray' }
  ];

  const statCards = [
    {
      title: 'Total Teams',
      value: stats.totalTeams,
      icon: Users,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Active Students',
      value: stats.totalStudents,
      icon: Award,
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
      change: '+8%',
      trend: 'up'
    },
    {
      title: 'Tournaments',
      value: stats.activeTournaments,
      icon: Trophy,
      color: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      change: '+25%',
      trend: 'up'
    },
    {
      title: 'Recent Matches',
      value: stats.recentMatches,
      icon: Activity,
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      change: '+5%',
      trend: 'up'
    }
  ];

  const renderOverview = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-3xl font-bold mb-2">Welcome to Enhanced School Management</h1>
          <p className="text-blue-100 text-lg">Advanced tools for modern athletic administration</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 flex gap-4"
        >
          <button 
            onClick={() => setActiveView('team-builder')}
            className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition-all flex items-center gap-2"
          >
            <Zap size={20} />
            Advanced Team Builder
          </button>
          <button 
            onClick={() => setActiveView('tournaments')}
            className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            Create Tournament
          </button>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            <div className={`${stat.color} p-6 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <stat.icon size={32} className="text-white/80" />
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp size={16} className="text-green-500" />
                <span className="text-green-600 font-medium">{stat.change}</span>
                <span className="text-gray-500">vs last month</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Target className="text-blue-600" />
            Quick Actions
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Add New Team', action: () => setActiveView('team-builder') },
              { label: 'Schedule Match', action: () => toast.info('Coming soon!') },
              { label: 'Generate Report', action: () => toast.info('Coming soon!') },
              { label: 'Manage Students', action: () => toast.info('Coming soon!') }
            ].map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3 group"
              >
                <div className="w-2 h-2 bg-blue-600 rounded-full group-hover:scale-150 transition-transform"></div>
                <span className="text-gray-700 group-hover:text-blue-600 transition-colors">{item.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="text-green-600" />
            Recent Activity
          </h3>
          <div className="space-y-4">
            {[
              { event: 'New student enrolled', time: '2 hours ago', type: 'student' },
              { event: 'Team "Eagles" updated', time: '4 hours ago', type: 'team' },
              { event: 'Tournament scheduled', time: '1 day ago', type: 'tournament' },
              { event: 'Report generated', time: '2 days ago', type: 'report' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className={`w-3 h-3 rounded-full ${
                  activity.type === 'student' ? 'bg-blue-500' :
                  activity.type === 'team' ? 'bg-purple-500' :
                  activity.type === 'tournament' ? 'bg-yellow-500' : 'bg-green-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-gray-800 text-sm">{activity.event}</p>
                  <p className="text-gray-500 text-xs">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex">
        {/* Sidebar */}
        <motion.div
          initial={{ x: -100 }}
          animate={{ x: 0 }}
          className="w-64 bg-white shadow-2xl min-h-screen"
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">Athletic Hub</h2>
            <p className="text-gray-600 text-sm">Enhanced Management</p>
          </div>
          
          <nav className="p-4">
            {navigationItems.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ x: 5 }}
                onClick={() => setActiveView(item.id)}
                className={`w-full text-left p-4 rounded-xl mb-2 transition-all flex items-center gap-3 ${
                  activeView === item.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </motion.button>
            ))}
          </nav>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <AnimatePresence mode="wait">
            {activeView === 'overview' && (
              <motion.div key="overview">
                {renderOverview()}
              </motion.div>
            )}
            {activeView === 'team-builder' && (
              <motion.div
                key="team-builder"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <AdvancedTeamBuilder />
              </motion.div>
            )}
            {activeView === 'tournaments' && (
              <motion.div
                key="tournaments"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
              >
                <TournamentTeamIntegration />
              </motion.div>
            )}
            {activeView === 'tournament-hub' && (
              <motion.div
                key="tournament-hub"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
              >
                <TournamentDashboard />
              </motion.div>
            )}
            {activeView === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="bg-white rounded-2xl shadow-lg p-8 text-center"
              >
                <BarChart3 size={64} className="mx-auto text-green-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Analytics Dashboard</h2>
                <p className="text-gray-600 mb-6">Detailed performance insights and reports</p>
                <button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-lg font-semibold">
                  View Analytics
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
