import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTachometerAlt, FaUsers, FaCog, FaUpload, FaCalendarAlt,
  FaTrophy, FaFileAlt, FaChartBar, FaShieldAlt, FaBell,
  FaDownload, FaUserPlus, FaSchool, FaGraduationCap, FaMoon, FaSun
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiClient from '../../api/apiClient';
import { useTheme } from '../../contexts/ThemeContext';

// Import admin components
import UserManagement from './UserManagement';
import SchoolSettings from './SchoolSettings';
import StudentBulkImport from './StudentBulkImport';
import TournamentCalendar from '../features/tournament/TournamentCalendar';

/**
 * 🔧 Administrative Dashboard
 * Central hub for all administrative functions
 */
const AdminDashboard = () => {
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTournaments: 0,
    upcomingEvents: 0,
    totalTeams: 0,
    recentActivities: []
  });

  const adminSections = [
    {
      id: 'overview',
      label: 'Dashboard Overview',
      icon: FaTachometerAlt,
      color: 'blue',
      component: null
    },
    {
      id: 'users',
      label: 'User Management',
      icon: FaUsers,
      color: 'green',
      component: UserManagement
    },
    {
      id: 'settings',
      label: 'School Settings',
      icon: FaCog,
      color: 'purple',
      component: SchoolSettings
    },
    {
      id: 'import',
      label: 'Bulk Import',
      icon: FaUpload,
      color: 'orange',
      component: StudentBulkImport
    },
    {
      id: 'calendar',
      label: 'Tournament Calendar',
      icon: FaCalendarAlt,
      color: 'indigo',
      component: TournamentCalendar
    }
  ];

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const [usersRes, tournamentsRes, teamsRes, activitiesRes] = await Promise.all([
        apiClient.get('/schools/me/users/stats'),
        apiClient.get('/tournaments/stats'),
        apiClient.get('/schools/me/teams/stats'),
        apiClient.get('/schools/me/activities/recent')
      ]);

      setDashboardStats({
        totalUsers: usersRes.data.data?.total || 0,
        activeUsers: usersRes.data.data?.active || 0,
        totalTournaments: tournamentsRes.data.data?.total || 0,
        upcomingEvents: tournamentsRes.data.data?.upcoming || 0,
        totalTeams: teamsRes.data.data?.total || 0,
        recentActivities: activitiesRes.data.data || []
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-sm p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-full bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center`}>
          <Icon className={`text-${color}-600 dark:text-${color}-400 text-xl`} />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center">
          <span className={`text-sm ${trend > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-500 ml-1">vs last month</span>
        </div>
      )}
    </motion.div>
  );

  const QuickAction = ({ title, description, icon: Icon, color, onClick, disabled = false }) => (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`w-full p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 hover:shadow-md transition-all text-left ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-full bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center`}>
          <Icon className={`text-${color}-600 dark:text-${color}-400`} />
        </div>
        <div>
          <h3 className="font-medium text-gray-800 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>
    </motion.button>
  );

  const ActivityItem = ({ activity }) => (
    <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
        <FaBell className="text-blue-600 dark:text-blue-400 text-sm" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-800 dark:text-gray-200">{activity.description}</p>
        <p className="text-xs text-gray-500 dark:text-gray-500">{new Date(activity.createdAt).toLocaleString()}</p>
      </div>
    </div>
  );

  const OverviewSection = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={dashboardStats.totalUsers}
          icon={FaUsers}
          color="blue"
          trend={12}
          subtitle={`${dashboardStats.activeUsers} active`}
        />
        <StatCard
          title="Tournaments"
          value={dashboardStats.totalTournaments}
          icon={FaTrophy}
          color="green"
          trend={8}
          subtitle={`${dashboardStats.upcomingEvents} upcoming`}
        />
        <StatCard
          title="Teams"
          value={dashboardStats.totalTeams}
          icon={FaGraduationCap}
          color="purple"
          trend={5}
        />
        <StatCard
          title="System Health"
          value="99.9%"
          icon={FaShieldAlt}
          color="emerald"
          subtitle="Uptime"
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <QuickAction
              title="Add New User"
              description="Create student, teacher, or admin accounts"
              icon={FaUserPlus}
              color="blue"
              onClick={() => setActiveSection('users')}
            />
            <QuickAction
              title="Import Students"
              description="Bulk import from CSV or Excel files"
              icon={FaUpload}
              color="orange"
              onClick={() => setActiveSection('import')}
            />
            <QuickAction
              title="Schedule Tournament"
              description="Create and manage tournament events"
              icon={FaCalendarAlt}
              color="indigo"
              onClick={() => setActiveSection('calendar')}
            />
            <QuickAction
              title="Generate Reports"
              description="Export user and tournament data"
              icon={FaDownload}
              color="green"
              onClick={() => toast.info('Report generation coming soon!')}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Activity</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {dashboardStats.recentActivities.length > 0 ? (
              dashboardStats.recentActivities.map((activity, index) => (
                <ActivityItem key={index} activity={activity} />
              ))
            ) : (
              <div className="text-center py-8">
                <FaBell className="mx-auto text-gray-400 dark:text-gray-600 text-2xl mb-2" />
                <p className="text-gray-500 dark:text-gray-500 text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full mx-auto mb-2"></div>
            <p className="text-sm font-medium text-green-800 dark:text-green-400">Database</p>
            <p className="text-xs text-green-600 dark:text-green-500">Operational</p>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full mx-auto mb-2"></div>
            <p className="text-sm font-medium text-green-800 dark:text-green-400">API Services</p>
            <p className="text-xs text-green-600 dark:text-green-500">Operational</p>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full mx-auto mb-2"></div>
            <p className="text-sm font-medium text-green-800 dark:text-green-400">File Storage</p>
            <p className="text-xs text-green-600 dark:text-green-500">Operational</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activeComponent = adminSections.find(section => section.id === activeSection);
  const ActiveComponent = activeComponent?.component;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                <FaSchool className="mr-3 text-blue-600 dark:text-blue-400" />
                Administrative Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Manage your school's tournament system and users
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
              </button>
              
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Last updated</p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {new Date().toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 min-h-screen">
          <nav className="p-4">
            <div className="space-y-2">
              {adminSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                      activeSection === section.id
                        ? `bg-${section.color}-100 dark:bg-${section.color}-900/30 text-${section.color}-700 dark:text-${section.color}-400 border border-${section.color}-200 dark:border-${section.color}-700`
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    <Icon className="mr-3" />
                    <span className="font-medium">{section.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-gray-50 dark:bg-gray-900">
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {activeSection === 'overview' ? (
                  <OverviewSection />
                ) : ActiveComponent ? (
                  <ActiveComponent />
                ) : (
                  <div className="text-center py-12">
                    <FaCog className="mx-auto text-gray-400 dark:text-gray-600 text-4xl mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Section under development</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
