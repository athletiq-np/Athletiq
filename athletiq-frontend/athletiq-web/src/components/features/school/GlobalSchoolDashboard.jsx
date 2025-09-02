// src/components/features/school/GlobalSchoolDashboard.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUserGraduate, FaCheckCircle, FaExclamationCircle, FaPlus, FaSchool, FaTrophy,
  FaChartLine, FaCogs, FaUsers, FaGraduationCap, FaHome, FaBell, FaSearch,
  FaGlobe, FaPalette, FaCalendarAlt, FaFilter, FaDownload, FaEye, FaEdit, FaTrash,
  FaSort, FaArrowUp, FaArrowDown, FaExpand, FaMoon, FaSun, FaLanguage, FaUser,
  FaClipboardList, FaHandsHelping, FaBuilding, FaNewspaper, FaShieldAlt
} from 'react-icons/fa';
import { HiOutlineCog, HiMenuAlt3, HiX } from 'react-icons/hi';
import { MdPending, MdDashboard, MdAnalytics, MdSettings, MdNotifications, MdSports, MdGroup } from 'react-icons/md';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '@/api/apiClient';
import useUserStore from '@/store/userStore';
import { useTheme } from '@/contexts/ThemeContext';
import athletiqLogo from '@/assets/logos/athletiq-logo.png';

// Import/Create school-specific components
import SchoolSidebar from './SchoolSidebar';
import SchoolOverview from './SchoolOverview';
import StudentRoster from './StudentRoster';
import TeamsManagement from './TeamsManagement';
import HouseManagement from './HouseManagement';
import StaffManagement from './StaffManagement';
import TournamentManagement from './TournamentManagement';
import EnhancedTournamentDashboard from './EnhancedTournamentDashboard';
import SchoolProfile from './SchoolProfile';
import SchoolSettings from './SchoolSettings';

/**
 * 🏫 ATHLETIQ - Global School Dashboard
 * Comprehensive school management system with:
 * - Athlete roster management
 * - House and team management
 * - Tournament participation and creation
 * - Staff and coach management
 * - School profile and document management
 * - Analytics and reporting
 * - Responsive design for all devices
 * - Modern UI with smooth animations
 */
export default function GlobalSchoolDashboard() {
  const { user } = useUserStore();
  const { theme, toggleTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // UI State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const savedPreference = localStorage.getItem('athletiq-school-sidebar-collapsed');
    return savedPreference ? JSON.parse(savedPreference) : true;
  });
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  
  // Data State
  const [school, setSchool] = useState(null);
  const [summary, setSummary] = useState({
    registeredStudents: 0,
    houses: 0,
    activeTeams: 0,
    staff: 0,
    tournaments: 0,
    activeTournaments: 0,
    pendingDocuments: 0,
    completionRate: 0,
  });
  const [students, setStudents] = useState([]);
  const [houses, setHouses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter and Search State
  const [globalSearch, setGlobalSearch] = useState('');
  const [filters, setFilters] = useState({
    grade: 'all',
    house: 'all',
    sport: 'all',
    status: 'all'
  });
  
  // Active tab
  const activeTab = searchParams.get('tab') || 'overview';

  // Fetch school dashboard data
  const fetchSchoolData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [
        schoolRes,
        summaryRes,
        studentsRes,
        housesRes,
        staffRes,
        tournamentsRes,
        notificationsRes,
        activitiesRes
      ] = await Promise.all([
        apiClient.get('/schools/me'),
        apiClient.get('/schools/me/tournament-stats').catch(() => ({ data: { data: {} } })),
        apiClient.get('/schools/me/athletes?limit=100&page=1').catch(() => ({ data: { data: [] } })),
        apiClient.get('/schools/houses').catch(() => ({ data: { data: [] } })),
        apiClient.get('/schools/staff').catch(() => ({ data: { data: [] } })),
        apiClient.get('/schools/me/tournaments?limit=100&page=1').catch(() => ({ data: { data: [] } })),
        apiClient.get('/schools/notifications?limit=20').catch(() => ({ data: { data: [] } })),
        apiClient.get('/schools/activities?limit=50').catch(() => ({ data: { data: [] } })),
      ]);
      
      // Set school data
      setSchool(schoolRes.data.data || schoolRes.data);
      
      // Process summary data
      const stats = summaryRes.data.data || summaryRes.data;
      const tournamentsData = Array.isArray(tournamentsRes.data?.data) ? tournamentsRes.data.data : [];
      setSummary({
        registeredStudents: stats.studentCount || studentsRes.data?.data?.length || 0,
        houses: stats.houseCount || housesRes.data?.data?.length || 0,
        activeTeams: stats.activeTeams || 0,
        staff: stats.staffCount || staffRes.data?.data?.length || 0,
        tournaments: stats.tournamentCount || tournamentsData.length || 0,
        activeTournaments: tournamentsData.filter(t => t.status === 'active').length || 0,
        pendingDocuments: stats.pendingDocuments || 0,
        completionRate: stats.completionRate || 0,
      });
      
      setStudents(studentsRes.data?.data || []);
      setHouses(housesRes.data?.data || []);
      setStaff(staffRes.data?.data || []);
      setTournaments(tournamentsData);
      setNotifications(notificationsRes.data?.data || []);
      setRecentActivities(activitiesRes.data?.data || []);
      
    } catch (error) {
      console.error('Error fetching school data:', error);
      setError(error.message || 'Failed to load school data');
      toast.error('Failed to load school dashboard data');
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        navigate('/login');
        return;
      }
      
      // Set default values on error
      setSummary({
        registeredStudents: 0,
        houses: 0,
        activeTeams: 0,
        staff: 0,
        tournaments: 0,
        activeTournaments: 0,
        pendingDocuments: 0,
        completionRate: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Initialize data on mount
  useEffect(() => {
    fetchSchoolData();
    
    // Set up periodic refresh (every 5 minutes)
    const interval = setInterval(fetchSchoolData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchSchoolData]);

  // Handle theme change - managed by ThemeContext now
  // Remove the old darkMode useEffect since ThemeContext handles this

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('athletiq-school-sidebar-collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Tab definitions for school dashboard
  const tabs = [
    { id: 'overview', label: 'Overview', icon: MdDashboard },
    { id: 'students', label: 'Student Roster', icon: FaUserGraduate },
    { id: 'teams', label: 'Teams', icon: MdSports },
    { id: 'houses', label: 'Houses & Teams', icon: FaBuilding },
    { id: 'staff', label: 'Staff & Coaches', icon: FaUsers },
    { id: 'tournaments', label: 'Tournaments', icon: FaTrophy },
    { id: 'profile', label: 'School Profile', icon: FaSchool },
    { id: 'settings', label: 'Settings', icon: MdSettings },
  ];

  const setActiveTab = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-athletiq-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Loading school dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !school) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchSchoolData}
            className="bg-athletiq-blue text-white px-4 py-2 rounded hover:bg-athletiq-navy"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render the appropriate tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <SchoolOverview
            school={school}
            summary={summary}
            recentActivities={recentActivities}
            notifications={notifications}
          />
        );
      case 'students':
        return (
          <StudentRoster
            students={students}
            houses={houses}
            onRefresh={fetchSchoolData}
            filters={filters}
            setFilters={setFilters}
            globalSearch={globalSearch}
          />
        );
      case 'teams':
        return (
          <TeamsManagement
            students={students}
            school={school}
            onRefresh={fetchSchoolData}
          />
        );
      case 'houses':
        return (
          <HouseManagement
            houses={houses}
            students={students}
            onRefresh={fetchSchoolData}
          />
        );
      case 'staff':
        return (
          <StaffManagement
            staff={staff}
            onRefresh={fetchSchoolData}
          />
        );
      case 'tournaments':
        return (
          <EnhancedTournamentDashboard
            tournaments={tournaments}
            school={school}
            onRefresh={fetchSchoolData}
          />
        );
      case 'profile':
        return (
          <SchoolProfile
            school={school}
            onUpdate={fetchSchoolData}
          />
        );
      case 'settings':
        return (
          <SchoolSettings
            school={school}
            onUpdate={fetchSchoolData}
          />
        );
      default:
        return (
          <SchoolOverview
            school={school}
            summary={summary}
            recentActivities={recentActivities}
            notifications={notifications}
          />
        );
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="flex">
        {/* Sidebar */}
        <SchoolSidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabs={tabs}
          user={user}
          school={school}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                >
                  <HiMenuAlt3 className="h-6 w-6" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {school?.name || 'School Dashboard'}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {tabs.find(tab => tab.id === activeTab)?.label}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Global Search */}
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-athletiq-blue focus:border-transparent"
                  />
                </div>

                {/* Notifications */}
                <button
                  onClick={() => setNotificationsPanelOpen(!notificationsPanelOpen)}
                  className="relative p-2 rounded-lg hover:bg-gray-100"
                >
                  <FaBell className="h-5 w-5 text-gray-600" />
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                  )}
                </button>

                {/* User Profile */}
                <div className="flex items-center space-x-2">
                  <FaUser className="h-6 w-6 text-gray-600" />
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{user?.full_name}</p>
                    <p className="text-gray-600">{user?.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
