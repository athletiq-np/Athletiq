// src/components/features/admin/GlobalAdminDashboard.jsx

/**
 * 🏆 ATHLETIQ - Global Admin Dashboard
 * Enterprise-grade admin dashboard with comprehensive monitoring
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUserGraduate, FaCheckCircle, FaExclamationCircle, FaPlus, FaSchool, FaTrophy,
  FaChartLine, FaCogs, FaUsers, FaGraduationCap, FaHome, FaBell, FaSearch,
  FaGlobe, FaPalette, FaCalendarAlt, FaFilter, FaDownload, FaEye, FaEdit, FaTrash,
  FaSort, FaArrowUp, FaArrowDown, FaExpand, FaMoon, FaSun, FaLanguage
} from 'react-icons/fa';
import { HiOutlineCog, HiMenuAlt3, HiX } from 'react-icons/hi';
import { MdPending, MdDashboard, MdAnalytics, MdSettings, MdNotifications } from 'react-icons/md';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '@/utils/apiClient';
import { useAuth } from '@/hooks/useAuth';
import athletiqLogo from '@/assets/logos/athletiq-logo.png';
import { useTheme } from '@/contexts/ThemeContext';
import { authStorage } from '@/config/auth.config';

// Enhanced sidebar component
import GlobalSidebar from './GlobalSidebar';
import PremiumStatsCards from './PremiumStatsCards';
import DataTable from './DataTable';
import FilterBar from './FilterBar';
import NotificationPanel from './NotificationPanel';
import DashboardSettings from './DashboardSettings';

// Import existing tab components
import PlayersTab from '@/components/features/admin/PlayersTab';
import SchoolsTab from '@/components/features/admin/SchoolsTab';
import OrganizationsTab from '@/components/features/admin/OrganizationsTab';
import GuardiansTab from '@/components/features/admin/GuardiansTab';
import TournamentsTab from '@/components/features/admin/TournamentsTab';
import EnhancedStatsTab from '@/components/features/admin/EnhancedStatsTab';
import TournamentCreationCard from '@/components/features/tournament/TournamentCreationCard';
import TestModal from '@/components/TestModal';

/**
 * 🌍 ATHLETIQ - Global Admin Dashboard
 * Premium, production-ready admin dashboard with:
 * - Internationalization (i18n) support
 * - Responsive design for all devices
 * - Modern sidebar with collapsible sections
 * - Real-time data and notifications
 * - Advanced filtering and search
 * - Dark/Light mode toggle
 * - Timezone-aware date formatting
 * - Accessibility features
 * - Premium animations and transitions
 */
export default function GlobalAdminDashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { theme, darkMode, toggleTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // UI State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Start collapsed by default, but remember user preference
    const savedPreference = localStorage.getItem('athletiq-sidebar-collapsed');
    return savedPreference ? JSON.parse(savedPreference) : true;
  });
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  
  // Data State
  const [summary, setSummary] = useState({
    registeredPlayers: 0,
    schools: 0,
    pendingVerifications: 0,
    missingDocs: 0,
    tournaments: 0,
    activeTournaments: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
  });
  const [players, setPlayers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [guardians, setGuardians] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]); // Added semicolon here
  const [analytics, setAnalytics] = useState(null); // Global analytics data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState({
    dashboard: true,
    players: true,
    schools: true,
    organizations: true,
    guardians: true,
    tournaments: true
  });
  const [errors, setErrors] = useState({
    dashboard: null,
    players: null,
    schools: null,
    organizations: null,
    guardians: null,
    tournaments: null
  });
  
  // Filter and Search State
  const [globalSearch, setGlobalSearch] = useState('');
  const [dateRange, setDateRange] = useState('30d');
  const [filters, setFilters] = useState({
    status: 'all',
    school: 'all',
    sport: 'all',
    region: 'all'
  });
  
  // Active tab
  const activeTab = searchParams.get('tab') || 'overview';

  // Enhanced data fetcher with retry logic
  const fetchWithRetry = async (url, options = {}, retries = 3, backoff = 300) => {
    try {
      const response = await apiClient.get(url, options);
      return response;
    } catch (error) {
      if (retries === 0) throw error;
      console.log(`Retrying ${url}... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
  };

  // Fetch dashboard data with enterprise real-time capabilities
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setIsLoading(prev => ({
        ...prev,
        dashboard: true,
        players: true,
        schools: true,
        organizations: true,
        guardians: true,
        tournaments: true
      }));
      
      setError(null);
      setErrors({
        dashboard: null,
        players: null,
        schools: null,
        organizations: null,
        guardians: null,
        tournaments: null
      });

      // Our unified apiClient automatically includes auth headers
      // No need to manually set Authorization header

      // Fetch data with error boundaries
      const fetchData = async () => {
        try {
          const [summaryRes, playersRes, schoolsRes, organizationsRes, guardiansRes, tournamentsRes, analyticsRes] = await Promise.all([
            fetchWithRetry('/health/stats/').catch(err => {
              console.error('Health stats fetch error:', err);
              return { data: { data: {} } };
            }),
            fetchWithRetry('/athletes/admin/list/').catch(err => {
              console.warn('Athletes admin endpoint not available:', err.message);
              // Fallback to regular endpoint
              return fetchWithRetry('/athletes/?select_related=school&exclude=guardian').catch(fallbackErr => {
                console.error('Athletes fetch error:', fallbackErr);
                setErrors(prev => ({ ...prev, players: 'Failed to load players' }));
                return { data: { data: [] } };
              });
            }),
            fetchWithRetry('/schools/').catch(err => {
              console.error('Schools fetch error:', err);
              setErrors(prev => ({ ...prev, schools: 'Failed to load schools' }));
              return { data: { data: [] } };
            }),
            fetchWithRetry('/organizations/admin/list/').catch(err => {
              console.warn('Organizations admin endpoint not available:', err.message);
              setErrors(prev => ({ ...prev, organizations: 'Organizations endpoint not available' }));
              return { data: { data: [] } };
            }),
            fetchWithRetry('/guardian/admin/list/').catch(err => {
              console.warn('Guardians endpoint not available:', err.message);
              // Don't set error - just return empty data and we'll use sample data in development
              return { data: { data: [] } };
            }),
            fetchWithRetry('/tournaments/').catch(err => {
              console.error('Tournaments fetch error:', err);
              setErrors(prev => ({ ...prev, tournaments: 'Failed to load tournaments' }));
              return { data: { data: [] } };
            }),
            fetchWithRetry('/health/analytics/global/').catch(err => {
              console.warn('Global analytics endpoint not available:', err.message);
              return { data: { data: null } };
            })
          ]);

          return { summaryRes, playersRes, schoolsRes, organizationsRes, guardiansRes, tournamentsRes, analyticsRes };
        } catch (error) {
          console.error('Error in parallel fetching:', error);
          throw error;
        }
      };

      const { summaryRes, playersRes, schoolsRes, organizationsRes, guardiansRes, tournamentsRes, analyticsRes } = await fetchData();
      
      console.log('📊 API Responses:', {
        summary: summaryRes.data,
        players: playersRes.data,
        schools: schoolsRes.data,
        organizations: organizationsRes.data,
        guardians: guardiansRes.data,
        tournaments: tournamentsRes.data,
        analytics: analyticsRes?.data
      });
      
      // Enhanced data extraction with validation
      const extractData = (response, type = 'unknown') => {
        try {
          if (!response?.data) {
            console.warn(`No data in ${type} response`);
            return [];
          }
          
          // Handle different response formats
          if (Array.isArray(response.data)) return response.data;
          if (response.data?.data) {
            // If the nested data is already an array, return it directly
            if (Array.isArray(response.data.data)) return response.data.data;
            // If nested data is an object, attempt to unwrap a single array-bearing property (e.g., { organizations: [...] })
            if (typeof response.data.data === 'object' && response.data.data !== null) {
              const arrayValues = Object.values(response.data.data).filter(v => Array.isArray(v));
              if (arrayValues.length === 1) {
                return arrayValues[0];
              }
            }
            return [response.data.data];
          }
          if (response.data?.results) {
            if (Array.isArray(response.data.results)) return response.data.results;
            return [response.data.results];
          }
          if (typeof response.data === 'object') return [response.data];
          
          return [];
        } catch (error) {
          console.error(`Error extracting ${type} data:`, error);
          return [];
        }
      };
      
      // Extract and validate data
      const summaryData = summaryRes?.data?.data || {};
      
      // Enhanced schools data extraction to handle various API response formats
      let schoolsData = [];
      const schoolsResponse = schoolsRes?.data;
      
      // Log raw response for debugging
      console.log('Raw schools response:', schoolsResponse);
      
      if (schoolsResponse) {
        // Case 1: Response has data.results array
        if (Array.isArray(schoolsResponse?.data?.results)) {
          schoolsData = schoolsResponse.data.results;
        }
        // Case 2: Response has results array directly
        else if (Array.isArray(schoolsResponse?.results)) {
          schoolsData = schoolsResponse.results;
        }
        // Case 3: Response has data array
        else if (Array.isArray(schoolsResponse?.data)) {
          schoolsData = schoolsResponse.data;
        }
        // Case 4: Response is an array
        else if (Array.isArray(schoolsResponse)) {
          schoolsData = schoolsResponse;
        }
        // Case 5: Single school object
        else if (typeof schoolsResponse === 'object' && schoolsResponse !== null) {
          schoolsData = [schoolsResponse];
        }
      }
      
      const playersData = extractData(playersRes, 'players');
      let organizationsData = extractData(organizationsRes, 'organizations');
      // Additional safeguard: if we still have a wrapper object with an organizations array, unwrap it
      if (organizationsData.length === 1 && organizationsData[0] && Array.isArray(organizationsData[0].organizations)) {
        organizationsData = organizationsData[0].organizations;
      }
      let guardiansData = extractData(guardiansRes, 'guardians');
      const tournamentsData = extractData(tournamentsRes, 'tournaments');

      // Log data for debugging
      console.log('📊 Extracted data:', {
        summary: summaryData,
        players: playersData,
        schools: schoolsData,
        organizations: organizationsData,
        guardians: guardiansData,
        tournaments: tournamentsData,
        schoolsRaw: schoolsRes?.data  // Log raw response for debugging
      });

      // Calculate stats with fallbacks
      const stats = {
        playerCount: summaryData.registered_players ?? playersData.length,
        schoolCount: summaryData.schools ?? schoolsData.length,
        organizationCount: summaryData.organizations ?? organizationsData.length,
        guardianCount: summaryData.guardians ?? guardiansData.length,
        tournamentCount: summaryData.tournaments ?? tournamentsData.length,
        pendingVerifications: summaryData.pending_verifications ?? 0,
        missingDocs: summaryData.missing_docs ?? 0,
        activeTournaments: summaryData.active_tournaments ?? 
          tournamentsData.filter(t => t?.status?.toLowerCase() === 'active').length,
        totalRevenue: summaryData.total_revenue ?? 0,
        monthlyGrowth: summaryData.monthly_growth ?? 0
      };

      // Update loading states - set to false when data fetch is complete
      const updateLoading = {
        players: false,
        schools: false,
        organizations: false,
        guardians: false,
        tournaments: false,
        dashboard: false
      };
      
      // Update state with new data - ensure we're using the processed data
      setPlayers(prev => {
        console.log('🔄 Comparing players data:');
        console.log('Previous players count:', prev.length);
        console.log('New players count:', playersData.length);
        console.log('Previous players IDs:', prev.map(p => p.id));
        console.log('New players IDs:', playersData.map(p => p.id));
        
        if (JSON.stringify(prev) !== JSON.stringify(playersData)) {
          console.log('✅ Players data changed, updating state');
          return playersData;
        }
        console.log('⚠️ Players data unchanged, keeping previous state');
        return prev;
      });
      
      setSchools(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(schoolsData)) {
          console.log('Updating schools state with:', schoolsData);
          return schoolsData;
        }
        return prev;
      });
      
      setOrganizations(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(organizationsData)) {
          console.log('Updating organizations state with:', organizationsData);
          return organizationsData;
        }
        return prev;
      });
      
      setGuardians(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(guardiansData)) {
          console.log('Updating guardians state with:', guardiansData);
          return guardiansData;
        }
        return prev;
      });
      
      setTournaments(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(tournamentsData)) {
          return tournamentsData;
        }
        return prev;
      });
      
      // Process and set analytics data
      const analyticsData = analyticsRes?.data?.data;
      if (analyticsData) {
        setAnalytics(analyticsData);
        console.log('Global analytics data loaded:', analyticsData);
      }
      
      // Log state updates for debugging
      console.log('Updated state with new data:', {
        players: playersData.length,
        schools: schoolsData.length,
        organizations: organizationsData.length,
        guardians: guardiansData.length,
        tournaments: tournamentsData.length,
        analytics: analyticsData ? 'loaded' : 'not available',
        schoolsSample: schoolsData.slice(0, 2) // Show first 2 schools for debugging
      });

      // Update summary with new stats
      setSummary(prev => {
        const newSummary = {
          registeredPlayers: stats.playerCount,
          schools: stats.schoolCount,
          organizations: stats.organizationCount,
          guardians: stats.guardianCount,
          pendingVerifications: stats.pendingVerifications,
          missingDocs: stats.missingDocs,
          tournaments: stats.tournamentCount,
          activeTournaments: stats.activeTournaments,
          totalRevenue: stats.totalRevenue,
          monthlyGrowth: stats.monthlyGrowth,
          systemHealth: prev.systemHealth || 'HEALTHY',
          responseTime: prev.responseTime || 0,
          errorRate: prev.errorRate || 0
        };
        
        return JSON.stringify(prev) !== JSON.stringify(newSummary) ? newSummary : prev;
      });
      
      // Load enterprise features if enabled
      const loadEnterpriseFeatures = async () => {
        const ENABLE_ENTERPRISE_FEATURES = process.env.NODE_ENV === 'production' || 
                                         process.env.REACT_APP_ENABLE_ENTERPRISE_FEATURES === 'true';
        
        if (!ENABLE_ENTERPRISE_FEATURES) return;

        try {
          const [systemHealth, businessMetrics, systemAlerts] = await Promise.allSettled([
            fetchWithRetry('/enterprise/health/'),
            fetchWithRetry('/enterprise/metrics/'),
            fetchWithRetry('/enterprise/alerts/')
          ]);

          const health = systemHealth.status === 'fulfilled' ? systemHealth.value?.data?.data : null;
          const metrics = businessMetrics.status === 'fulfilled' ? businessMetrics.value?.data?.data : null;
          const alerts = systemAlerts.status === 'fulfilled' ? systemAlerts.value?.data?.data?.alerts : [];

          if (health || metrics) {
            setSummary(prev => ({
              ...prev,
              systemHealth: health?.status || prev.systemHealth,
              responseTime: health?.performance?.responseTime || prev.responseTime,
              errorRate: health?.performance?.errorRate || prev.errorRate,
              totalRevenue: metrics?.revenue?.total || prev.totalRevenue,
              monthlyGrowth: metrics?.revenue?.growth_rate || prev.monthlyGrowth
            }));
          }

          if (alerts?.length > 0) {
            setNotifications(prev => [
              ...prev.filter(n => !n.isEnterprise),
              ...alerts.map(alert => ({
                id: `enterprise-${alert.id || Math.random().toString(36).substr(2, 9)}`,
                title: alert.title,
                message: alert.message,
                type: alert.level || 'info',
                timestamp: alert.timestamp || new Date().toISOString(),
                action: alert.action,
                isEnterprise: true
              }))
            ]);
          }
        } catch (error) {
          console.error('Enterprise features error:', error);
        }
      };

      // Load enterprise features in the background
      loadEnterpriseFeatures();
      
      // Add sample data for testing when no real data is available
      if (process.env.NODE_ENV === 'development' && organizationsData.length === 0) {
        const sampleOrganizations = [
          {
            id: 'sample-1',
            name: 'Nepal Sports Federation',
            type: 'Sports Federation',
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'sample-2', 
            name: 'Kathmandu Sports Club',
            type: 'Sports Club',
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        organizationsData = sampleOrganizations;
      }
      
      if (process.env.NODE_ENV === 'development' && guardiansData.length === 0) {
        const sampleGuardians = [
          {
            id: 'guardian-1',
            full_name: 'Ram Bahadur Gurung',
            email: 'ram.gurung@example.com',
            verification_status: 'verified',
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'guardian-2',
            full_name: 'Sita Devi Sharma',
            email: 'sita.sharma@example.com', 
            verification_status: 'pending',
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        guardiansData = sampleGuardians;
      }
      
      // Update loading states
      setIsLoading(prev => ({
        ...prev,
        ...updateLoading
      }));

      // Set recent activities with proper typing
      setRecentActivities([
        {
          id: 'activity-1',
          description: 'New player registration completed',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'activity-2',
          description: 'School verification approved',
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'activity-3',
          description: 'Tournament schedule updated',
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        }
      ]);

      console.log('✅ Dashboard data fetch completed successfully');
      
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      const errorMessage = error.message || 'Failed to load dashboard data';
      setError(errorMessage);
      setErrors({
        dashboard: errorMessage,
        players: errorMessage,
        schools: errorMessage,
        organizations: errorMessage,
        guardians: errorMessage,
        tournaments: errorMessage
      });
      toast.error(t('dashboard.error.loadFailed'));
      
      // Set default values on error
      setSummary({
        registeredPlayers: 0,
        schools: 0,
        organizations: 0,
        guardians: 0,
        pendingVerifications: 0,
        missingDocs: 0,
        tournaments: 0,
        activeTournaments: 0,
        totalRevenue: 0,
        monthlyGrowth: 0,
      });
      setPlayers([]);
      setSchools([]);
      setOrganizations([]);
      setGuardians([]);
      setTournaments([]);
    } finally {
      setLoading(false);
      setIsLoading(prev => ({
        ...prev,
        dashboard: false,
        players: false,
        schools: false,
        organizations: false,
        guardians: false,
        tournaments: false
      }));
    }
  }, [t]);

  // Initialize data on mount
  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time updates (every 5 minutes)
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Handle theme change
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('athletiq-sidebar-collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Tab definitions with i18n support
  const tabs = [
    { id: 'overview', label: t('dashboard.tabs.overview'), icon: MdDashboard },
    { id: 'players', label: t('dashboard.tabs.players'), icon: FaUserGraduate },
    { id: 'schools', label: t('dashboard.tabs.schools'), icon: FaSchool },
    { id: 'organizations', label: t('dashboard.tabs.organizations'), icon: FaUsers },
    { id: 'guardians', label: t('dashboard.tabs.guardians'), icon: FaUsers },
    { id: 'tournaments', label: t('dashboard.tabs.tournaments'), icon: FaTrophy },
    { id: 'analytics', label: t('dashboard.tabs.analytics'), icon: MdAnalytics },
    { id: 'settings', label: t('dashboard.tabs.settings'), icon: MdSettings },
  ];

  const setActiveTab = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  // Language change handler
  const handleLanguageChange = (language) => {
    i18n.changeLanguage(language);
    toast.success(t('dashboard.language.changed'));
  };

  // Timezone-aware date formatter
  const formatDate = (date) => {
    return new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }).format(new Date(date));
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300 ${fullScreen ? 'fixed inset-0' : ''} dark:text-gray-100`}>
      {/* Global Sidebar */}
      <GlobalSidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
        user={user}
        theme={theme}
        toggleTheme={toggleTheme}
        onLanguageChange={handleLanguageChange}
        currentLanguage={i18n.language}
        // Pass data for real-time badge counts
        summary={summary}
        players={players}
        schools={schools}
        organizations={organizations}
        guardians={guardians}
        tournaments={tournaments}
      />

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'} bg-gray-50 dark:bg-gray-900 min-h-screen`}>
        {/* Premium Header */}
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-30 transition-colors duration-300">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Sidebar Toggle Button */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors border border-gray-200 dark:border-gray-600 group"
                  title={sidebarCollapsed ? t('dashboard.sidebar.expand') : t('dashboard.sidebar.collapse')}
                >
                  {sidebarCollapsed ? (
                    <HiMenuAlt3 size={20} className="text-gray-600 dark:text-gray-300 group-hover:text-athletiq-green transition-colors" />
                  ) : (
                    <HiX size={20} className="text-gray-600 dark:text-gray-300 group-hover:text-athletiq-green transition-colors" />
                  )}
                </button>

                {/* Header title and breadcrumb */}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">
                    {t(`dashboard.tabs.${activeTab}`)}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">
                    {t('dashboard.welcome', { name: user?.name || user?.email })}
                  </p>
                </div>
              </div>

              {/* Header actions */}
              <div className="flex items-center space-x-3">
                {/* Global search */}
                <div className="relative hidden md:block">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder={t('dashboard.search.placeholder')}
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 w-64 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
                  />
                </div>

                {/* Language switcher */}
                <div className="relative">
                  <select
                    value={i18n.language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
                  >
                    <option value="en">🇺🇸 English</option>
                    <option value="ne">🇳🇵 नेपाली</option>
                    <option value="hi">🇮🇳 हिंदी</option>
                    <option value="es">🇪🇸 Español</option>
                  </select>
                  <FaLanguage className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                </div>

                {/* Notifications */}
                <button
                  onClick={() => setNotificationsPanelOpen(!notificationsPanelOpen)}
                  className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <FaBell className="text-gray-600 dark:text-gray-400" size={20} />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {/* Settings */}
                <button
                  onClick={() => setSettingsPanelOpen(!settingsPanelOpen)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <HiOutlineCog className="text-gray-600 dark:text-gray-400" size={20} />
                </button>

                {/* Full screen toggle */}
                <button
                  onClick={() => setFullScreen(!fullScreen)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <FaExpand className="text-gray-600 dark:text-gray-400" size={16} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          dateRange={dateRange}
          setDateRange={setDateRange}
          onRefresh={fetchDashboardData}
        />

        {/* Main Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center items-center h-64 bg-white/50 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm"
              >
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-athletiq-green/20 dark:border-athletiq-green/30 border-t-athletiq-green dark:border-t-athletiq-green/80 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-athletiq-green dark:bg-athletiq-green/80 rounded-full animate-pulse"></div>
                  </div>
                  <p className="mt-4 text-center text-gray-600 dark:text-gray-300">Loading dashboard data...</p>
                </div>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center"
              >
                <FaExclamationCircle className="mx-auto text-red-500 text-4xl mb-4" />
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                  {t('dashboard.error.title')}
                </h3>
                <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
                <button
                  onClick={fetchDashboardData}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {t('dashboard.error.retry')}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Premium Stats Cards */}
                    <PremiumStatsCards 
                      summary={summary} 
                      loading={loading}
                      formatDate={formatDate}
                    />

                    {/* Tournament Creation Card - Featured */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <TournamentCreationCard 
                        userRole="admin"
                        className="lg:col-span-1"
                      />
                      
                      {/* Quick Stats Summary */}
                      <div className="lg:col-span-2 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 transition-colors duration-300">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          {t('dashboard.quickStats.title')}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                          <div className="text-center bg-white/50 dark:bg-gray-800/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{players?.length || summary.registeredPlayers || 0}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">{t('dashboard.quickStats.players')}</div>
                          </div>
                          <div className="text-center bg-white/50 dark:bg-gray-800/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{schools?.length || summary.schools || 0}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">{t('dashboard.quickStats.schools')}</div>
                          </div>
                          <div className="text-center bg-white/50 dark:bg-gray-800/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50">
                            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{organizations?.length || summary.organizations || 0}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">{t('dashboard.quickStats.organizations')}</div>
                          </div>
                          <div className="text-center bg-white/50 dark:bg-gray-800/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50">
                            <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">{guardians?.length || summary.guardians || 0}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">{t('dashboard.quickStats.guardians')}</div>
                          </div>
                          <div className="text-center bg-white/50 dark:bg-gray-800/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50">
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{tournaments?.length || summary.tournaments || 0}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">{t('dashboard.quickStats.tournaments')}</div>
                          </div>
                          <div className="text-center bg-white/50 dark:bg-gray-800/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50">
                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{tournaments?.filter(t => t?.status?.toLowerCase() === 'active').length || summary.activeTournaments || 0}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">{t('dashboard.quickStats.active')}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Activities and Players */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Recent Activities
                        </h3>
                        <RecentActivitiesCard 
                          activities={recentActivities}
                          formatDate={formatDate}
                        />
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Recent Players
                        </h3>
                        <RecentPlayersCard 
                          players={players.slice(0, 5)}
                          setActiveTab={setActiveTab}
                          formatDate={formatDate}
                        />
                      </div>
                    </div>

                    {/* Organizations and Guardians Recent Data */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Organizations Card */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                            <FaUsers className="mr-2 text-indigo-500" />
                            {t('dashboard.recentOrganizations.title') || 'Recent Organizations'}
                          </h3>
                          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {organizations?.length || 0}
                          </span>
                        </div>
                        <RecentOrganizationsCard 
                          organizations={organizations?.slice(0, 5) || []}
                          setActiveTab={setActiveTab}
                          formatDate={formatDate}
                        />
                      </div>
                      
                      {/* Guardians Card */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                            <FaUsers className="mr-2 text-pink-500" />
                            {t('dashboard.recentGuardians.title') || 'Recent Guardians'}
                          </h3>
                          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {guardians?.length || 0}
                          </span>
                        </div>
                        <RecentGuardiansCard 
                          guardians={guardians?.slice(0, 5) || []}
                          setActiveTab={setActiveTab}
                          formatDate={formatDate}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Players Tab */}
                {activeTab === 'players' && (
                  <PlayersTab 
                    key="players-tab"  // Add key to prevent unwanted re-renders
                    players={players} 
                    schools={schools}
                    user={user}
                    refetchData={fetchDashboardData}
                    loading={isLoading.players}
                    error={errors.players}
                  />
                )}

                {/* Schools Tab */}
                {activeTab === 'schools' && (
                  <div className="space-y-6">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Schools Management</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {!isLoading.schools && `${schools.length} ${schools.length === 1 ? 'school' : 'schools'} found`}
                      </p>
                      <div className="w-full">
                        <SchoolsTab 
                          schools={schools} 
                          refetchData={fetchDashboardData} 
                          loading={isLoading.schools}
                          error={errors.schools}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Organizations Tab */}
                {activeTab === 'organizations' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Organizations Management</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {!isLoading.organizations && `${organizations.length} ${organizations.length === 1 ? 'organization' : 'organizations'} found`}
                        </p>
                      </div>
                    </div>
                    <OrganizationsTab 
                      key="organizations-tab"
                      refetchData={fetchDashboardData}
                    />
                  </div>
                )}

                {/* Guardians Tab */}
                {activeTab === 'guardians' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Guardians Management</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {!isLoading.guardians && `${guardians.length} ${guardians.length === 1 ? 'guardian' : 'guardians'} found`}
                        </p>
                      </div>
                    </div>
                    <GuardiansTab 
                      key="guardians-tab"
                      guardians={guardians} 
                      refetchData={fetchDashboardData}
                      loading={isLoading.guardians}
                    />
                  </div>
                )}

                {/* Tournaments Tab */}
                {activeTab === 'tournaments' && (
                  <TournamentsTab 
                    tournaments={tournaments} 
                    refetchData={fetchDashboardData}
                  />
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                  <EnhancedStatsTab 
                    summary={summary}
                    players={players}
                    schools={schools}
                    tournaments={tournaments}
                    organizations={organizations}
                    guardians={guardians}
                    analytics={analytics}
                  />
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                  <DashboardSettings 
                    user={user}
                    theme={theme}
                    toggleTheme={toggleTheme}
                    onLanguageChange={handleLanguageChange}
                    currentLanguage={i18n.language}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={notificationsPanelOpen}
        onClose={() => setNotificationsPanelOpen(false)}
        notifications={notifications}
        formatDate={formatDate}
      />

      {/* Mobile backdrop */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-20"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
    </div>
  );
}

// Quick Action Card Component
function QuickActionCard({ title, icon, onClick, gradient }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`group relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700 overflow-hidden`}
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
      
      <div className="relative flex items-center space-x-4">
        <div className={`p-3 rounded-lg bg-gradient-to-r ${gradient} text-white`}>
          {icon}
        </div>
        <div className="text-left">
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Click to navigate</p>
        </div>
      </div>
    </motion.button>
  );
}

// Recent Players Card Component
function RecentPlayersCard({ players, setActiveTab, formatDate }) {
  const { t } = useTranslation();
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <FaUsers className="mr-2 text-athletiq-green" />
          {t('dashboard.recentPlayers.title')}
        </h3>
        <button
          onClick={() => setActiveTab('players')}
          className="text-athletiq-green hover:text-athletiq-navy transition-colors text-sm font-medium"
        >
          {t('dashboard.recentPlayers.viewAll')}
        </button>
      </div>
      
      <div className="space-y-3">
        {players.slice(0, 5).map((player, index) => (
          <div key={player.id || index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-athletiq-green to-green-500 flex items-center justify-center">
              <FaUserGraduate className="text-white text-sm" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">{player.full_name || player.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{player.school_name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(player.created_at || new Date())}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Test Modal */}
      <TestModal />
    </div>
  );
}

// Recent Activities Card Component
function RecentActivitiesCard({ activities, formatDate }) {
  const { t } = useTranslation();
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <FaCalendarAlt className="mr-2 text-athletiq-green" />
          {t('dashboard.recentActivity.title')}
        </h3>
      </div>
      
      <div className="space-y-3">
        {activities.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            {t('dashboard.recentActivity.empty')}
          </p>
        ) : (
          activities.slice(0, 5).map((activity, index) => (
            <div key={activity.id || index} className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-athletiq-green/20 flex items-center justify-center flex-shrink-0">
                <div className="w-3 h-3 bg-athletiq-green rounded-full"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white">{activity.description}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatDate(activity.created_at || new Date())}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Test Modal */}
      <TestModal />
    </div>
  );
}

// Recent Organizations Card Component
function RecentOrganizationsCard({ organizations, setActiveTab, formatDate }) {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-3">
      {!organizations || organizations.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <FaUsers className="text-indigo-500 text-2xl" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-2 font-medium">
            No organizations yet
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Organizations will appear here once they register
          </p>
          <button
            onClick={() => setActiveTab('organizations')}
            className="mt-4 text-indigo-500 hover:text-indigo-600 transition-colors text-sm font-medium"
          >
            Manage Organizations →
          </button>
        </div>
      ) : (
        <>
          {organizations.slice(0, 5).map((org, index) => (
            <div key={org.id || index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                <FaUsers className="text-white text-sm" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">{org.name || org.organization_name || 'Unknown Organization'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{org.type || 'Organization'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(org.created_at || new Date())}
                </p>
              </div>
            </div>
          ))}
          <div className="mt-4">
            <button
              onClick={() => setActiveTab('organizations')}
              className="text-athletiq-green hover:text-athletiq-navy transition-colors text-sm font-medium"
            >
              {t('dashboard.recentOrganizations.viewAll')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Recent Guardians Card Component
function RecentGuardiansCard({ guardians, setActiveTab, formatDate }) {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-3">
      {!guardians || guardians.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
            <FaUsers className="text-pink-500 text-2xl" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-2 font-medium">
            No guardians yet
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Guardians will appear here once they register
          </p>
          <button
            onClick={() => setActiveTab('guardians')}
            className="mt-4 text-pink-500 hover:text-pink-600 transition-colors text-sm font-medium"
          >
            Manage Guardians →
          </button>
        </div>
      ) : (
        <>
          {guardians.slice(0, 5).map((guardian, index) => (
            <div key={guardian.id || index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                <FaUsers className="text-white text-sm" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">{guardian.full_name || guardian.name || 'Unknown Guardian'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{guardian.email || 'Guardian'}</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(guardian.created_at || new Date())}
                </div>
                {guardian.verification_status && (
                  <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                    guardian.verification_status === 'verified' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {guardian.verification_status}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div className="mt-4">
            <button
              onClick={() => setActiveTab('guardians')}
              className="text-athletiq-green hover:text-athletiq-navy transition-colors text-sm font-medium"
            >
              {t('dashboard.recentGuardians.viewAll')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
