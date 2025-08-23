// src/components/features/school/PremiumSchoolOverview.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaUserGraduate, FaBuilding, FaUsers, FaTrophy, FaExclamationCircle,
  FaCheckCircle, FaClipboardList, FaChartLine, FaCalendarAlt, FaBell,
  FaEye, FaEdit, FaPlus, FaDownload, FaSchool, FaNewspaper, FaAward,
  FaStar, FaGraduationCap, FaShieldAlt, FaGift, FaRocket, FaFire,
  FaLightbulb, FaHeartbeat, FaGlobe, FaMedal, FaCrown, FaThumbsUp
} from 'react-icons/fa';
import { 
  MdNotifications, MdTrendingUp, MdWarning, MdDashboard, MdInsights,
  MdAutoGraph, MdTimeline, MdBolt, MdFlash, MdStars, MdWorkspacePremium
} from 'react-icons/md';
import { HiSparkles, HiLightningBolt } from 'react-icons/hi';
import TournamentCreationCard from '@features/tournament/TournamentCreationCard';
import AddAthleteModal from '@features/athlete/AddAthleteModal';
import TournamentCreationModal from './TournamentCreationModal';
import apiClient from '@/api/apiClient';

/**
 * 🏫 Premium School Overview Component
 * Next-generation dashboard with premium UX/UI design
 */
export default function PremiumSchoolOverview({ school, summary, recentActivities, initialNotifications }) {
  const navigate = useNavigate();
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [animationKey, setAnimationKey] = useState(0);
  const [notifications, setNotifications] = useState(initialNotifications || []);
  const [systemStatus, setSystemStatus] = useState({
    online: true,
    lastUpdate: new Date(),
    activeUsers: 1,
    performance: 'excellent'
  });
  const [loadingStates, setLoadingStates] = useState({
    export: false,
    studentModal: false,
    tournamentModal: false,
    dataRefresh: false
  });

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Animation refresh trigger - Reduced frequency
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationKey(prev => prev + 1);
    }, 120000); // Refresh animations every 2 minutes instead of 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Real-time system status updates - Reduced frequency
  useEffect(() => {
    const statusTimer = setInterval(() => {
      setSystemStatus(prev => ({
        ...prev,
        lastUpdate: new Date(),
        activeUsers: Math.floor(Math.random() * 5) + 1,
        performance: ['excellent', 'good', 'fair'][Math.floor(Math.random() * 3)]
      }));
    }, 60000); // Update every 60 seconds instead of 30

    return () => clearInterval(statusTimer);
  }, []);

  // Simulate real-time notifications - Reduced frequency
  useEffect(() => {
    const notificationTimer = setInterval(() => {
      const mockNotifications = [
        'New student registration completed',
        'Tournament bracket updated',
        'House points calculation finished',
        'Weekly report generated',
        'System backup completed'
      ];
      
      const randomNotification = mockNotifications[Math.floor(Math.random() * mockNotifications.length)];
      setNotifications(prev => [
        {
          id: Date.now(),
          message: randomNotification,
          timestamp: new Date().toLocaleTimeString(),
          type: 'info'
        },
        ...prev.slice(0, 4) // Keep only latest 5
      ]);
    }, 300000); // Add notification every 5 minutes instead of 45 seconds

    return () => clearInterval(notificationTimer);
  }, []);

  // Handle navigation
  const handleManageHouses = () => {
    const url = new URL(window.location);
    url.searchParams.set('tab', 'houses');
    window.history.pushState({}, '', url);
    window.location.reload();
  };

  const handleTaskClick = (tab) => {
    const url = new URL(window.location);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url);
    window.location.reload();
  };

  // Enhanced export with progress tracking and better error handling
  const handleExportDataEnhanced = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, export: true }));
      
      // Simulate progress steps
      toast.info('Preparing data export...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.info('Generating report...');
      const response = await apiClient.get('/schools/me/export');
      
      if (response.data && response.data.success) {
        const jsonData = JSON.stringify(response.data.data, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${school?.name || 'school'}_data_export_${Date.now()}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        toast.success('📊 School data exported successfully!');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Export error:', error);
      
      // Better error handling with specific messages
      let errorMessage = 'Failed to export data';
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to export data.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Export endpoint not found. Please contact support.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, export: false }));
    }
  };

  // Enhanced modal submission handlers with proper API calls and error handling
  const handleAddStudentSubmit = async (data) => {
    try {
      setLoadingStates(prev => ({ ...prev, studentModal: true }));
      
      const response = await apiClient.post('/athletes/register', data);
      if (response.data.success) {
        setShowAddStudentModal(false);
        toast.success('Student registered successfully!');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error('Failed to register student: ' + response.data.message);
      }
    } catch (error) {
      console.error('Student registration error:', error);
      
      // Better error handling
      let errorMessage = 'Failed to register student';
      if (error.response?.status === 400) {
        errorMessage = 'Invalid student information. Please check your input.';
      } else if (error.response?.status === 409) {
        errorMessage = 'A student with this information already exists.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, studentModal: false }));
    }
  };

  const handleTournamentSubmit = async (data) => {
    try {
      setLoadingStates(prev => ({ ...prev, tournamentModal: true }));
      
      const response = await apiClient.post('/tournaments', data);
      if (response.data.success) {
        setShowTournamentModal(false);
        toast.success('Tournament created successfully!');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error('Failed to create tournament: ' + response.data.message);
      }
    } catch (error) {
      console.error('Tournament creation error:', error);
      
      // Better error handling
      let errorMessage = 'Failed to create tournament';
      if (error.response?.status === 400) {
        errorMessage = 'Invalid tournament information. Please check your input.';
      } else if (error.response?.status === 409) {
        errorMessage = 'A tournament with this name already exists.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, tournamentModal: false }));
    }
  };

  // Enhanced navigation handlers
  const handleAnalyticsView = () => {
    const url = new URL(window.location);
    url.searchParams.set('tab', 'analytics');
    window.history.pushState({}, '', url);
    window.location.reload();
  };

  // Premium Quick Actions with enhanced functionality
  const premiumActions = [
    {
      title: 'Add Student',
      description: 'Register new students instantly',
      icon: FaPlus,
      gradient: 'from-blue-400 via-blue-500 to-blue-600',
      shadowColor: 'shadow-blue-500/25',
      onClick: () => setShowAddStudentModal(true),
      shortcut: 'Ctrl+N'
    },
    {
      title: 'Create Tournament',
      description: 'Launch competitive events',
      icon: FaTrophy,
      gradient: 'from-amber-400 via-orange-500 to-red-500',
      shadowColor: 'shadow-orange-500/25',
      onClick: () => setShowTournamentModal(true),
      shortcut: 'Ctrl+T'
    },
    {
      title: 'Manage Houses',
      description: 'Organize team competitions',
      icon: FaShieldAlt,
      gradient: 'from-purple-400 via-purple-500 to-indigo-600',
      shadowColor: 'shadow-purple-500/25',
      onClick: handleManageHouses,
      shortcut: 'Ctrl+H'
    },
    {
      title: 'Analytics Hub',
      description: 'View detailed insights & reports',
      icon: MdInsights,
      gradient: 'from-pink-400 via-rose-500 to-red-600',
      shadowColor: 'shadow-pink-500/25',
      onClick: handleAnalyticsView,
      shortcut: 'Ctrl+A'
    },
    {
      title: 'Export Data',
      description: 'Download comprehensive reports',
      icon: FaDownload,
      gradient: 'from-emerald-400 via-teal-500 to-cyan-600',
      shadowColor: 'shadow-teal-500/25',
      onClick: handleExportDataEnhanced,
      shortcut: 'Ctrl+E',
      loading: exportLoading
    }
  ];

  // Enhanced stats cards with interactive features
  const statsCards = [
    {
      title: 'Total Students',
      value: summary?.registeredStudents || 0,
      change: '+12%',
      trend: 'up',
      icon: FaUserGraduate,
      gradient: 'from-blue-400 to-cyan-500',
      description: 'Active learners',
      target: 500,
      drillDown: () => handleTaskClick('students'),
      subStats: [
        { label: 'Active', value: Math.floor((summary?.registeredStudents || 0) * 0.95) },
        { label: 'Pending', value: Math.floor((summary?.registeredStudents || 0) * 0.05) }
      ]
    },
    {
      title: 'Active Houses',
      value: summary?.houses || 0,
      change: '+5%',
      trend: 'up',
      icon: FaBuilding,
      gradient: 'from-purple-400 to-pink-500',
      description: 'Competition ready',
      target: 8,
      drillDown: () => handleTaskClick('houses'),
      subStats: [
        { label: 'Leading', value: 1 },
        { label: 'Competing', value: (summary?.houses || 0) - 1 }
      ]
    },
    {
      title: 'Staff Members',
      value: summary?.staff || 0,
      change: '+8%',
      trend: 'up',
      icon: FaUsers,
      gradient: 'from-green-400 to-emerald-500',
      description: 'Dedicated educators',
      target: 50,
      drillDown: () => handleTaskClick('staff'),
      subStats: [
        { label: 'Teachers', value: Math.floor((summary?.staff || 0) * 0.7) },
        { label: 'Coaches', value: Math.floor((summary?.staff || 0) * 0.3) }
      ]
    },
    {
      title: 'Tournaments',
      value: summary?.tournaments || 0,
      change: '+25%',
      trend: 'up',
      icon: FaTrophy,
      gradient: 'from-yellow-400 to-orange-500',
      description: 'Events organized',
      target: 20,
      drillDown: () => handleTaskClick('tournaments'),
      subStats: [
        { label: 'Active', value: Math.floor((summary?.tournaments || 0) * 0.6) },
        { label: 'Completed', value: Math.floor((summary?.tournaments || 0) * 0.4) }
      ]
    }
  ];

  // Enhanced onboarding with gamification
  const onboardingTasks = [
    {
      title: 'Complete School Profile',
      description: 'Add school details, logo, and contact information',
      completed: !!school?.name && !!school?.address,
      icon: FaSchool,
      tab: 'profile',
      points: 100,
      difficulty: 'Easy',
      estimatedTime: '5 min'
    },
    {
      title: 'Add Students',
      description: 'Register students to your school roster',
      completed: (summary?.registeredStudents || 0) > 0,
      icon: FaUserGraduate,
      tab: 'students',
      points: 150,
      difficulty: 'Easy',
      estimatedTime: '10 min'
    },
    {
      title: 'Create Houses',
      description: 'Organize students into houses for competitions',
      completed: (summary?.houses || 0) > 0,
      icon: FaShieldAlt,
      tab: 'houses',
      points: 200,
      difficulty: 'Medium',
      estimatedTime: '15 min'
    },
    {
      title: 'Add Staff',
      description: 'Register teachers and coaches',
      completed: (summary?.staff || 0) > 0,
      icon: FaUsers,
      tab: 'staff',
      points: 120,
      difficulty: 'Easy',
      estimatedTime: '8 min'
    },
    {
      title: 'Launch Tournament',
      description: 'Organize your first competitive event',
      completed: (summary?.tournaments || 0) > 0,
      icon: FaTrophy,
      tab: 'tournaments',
      points: 300,
      difficulty: 'Hard',
      estimatedTime: '25 min'
    }
  ];

  const completedTasks = onboardingTasks.filter(task => task.completed).length;
  const totalPoints = onboardingTasks.reduce((sum, task) => task.completed ? sum + task.points : sum, 0);
  const maxPoints = onboardingTasks.reduce((sum, task) => sum + task.points, 0);
  const completionPercentage = Math.round((completedTasks / onboardingTasks.length) * 100);

  // Enhanced keyboard shortcuts with loading state checks
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle shortcuts when Ctrl is pressed and no input is focused
      if (event.ctrlKey && !event.target.matches('input, textarea, select')) {
        event.preventDefault();
        
        switch (event.key.toLowerCase()) {
          case 'n':
            if (!loadingStates.studentModal) {
              setShowAddStudentModal(true);
              toast.info('🎓 Opening student registration...');
            }
            break;
          case 't':
            if (!loadingStates.tournamentModal) {
              setShowTournamentModal(true);
              toast.info('🏆 Opening tournament creation...');
            }
            break;
          case 'h':
            handleManageHouses();
            toast.info('🏠 Navigating to houses...');
            break;
          case 'a':
            handleAnalyticsView();
            toast.info('📊 Opening analytics...');
            break;
          case 'e':
            if (!loadingStates.export) {
              handleExportDataEnhanced();
            }
            break;
          default:
            return; // Don't prevent default for other keys
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [loadingStates]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 p-6">
      {/* Premium Hero Section */}
      <motion.div
        key={animationKey}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative overflow-hidden mb-8"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-amber-400/10 to-orange-600/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        {/* Hero Content */}
        <div className="relative bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center space-x-4 mb-6"
              >
                <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                  <FaSchool className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                    {school?.name || 'Your School'} Dashboard
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 text-lg">
                    Welcome back! Here's what's happening today.
                  </p>
                </div>
              </motion.div>

              {/* Live Stats Row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center space-x-8"
              >
                {[
                  { label: 'Students', value: summary?.registeredStudents || 0, icon: FaUserGraduate, color: 'text-blue-600' },
                  { label: 'Houses', value: summary?.houses || 0, icon: FaBuilding, color: 'text-purple-600' },
                  { label: 'Staff', value: summary?.staff || 0, icon: FaUsers, color: 'text-green-600' },
                  { label: 'Events', value: summary?.tournaments || 0, icon: FaTrophy, color: 'text-orange-600' }
                ].map((stat, index) => (
                  <motion.div 
                    key={stat.label} 
                    className="flex items-center space-x-3"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className={`p-3 rounded-xl bg-white/50 dark:bg-gray-800/50 ${stat.color} shadow-lg`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Right Side - Time & Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="text-right"
            >
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${
                    systemStatus.online ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className={`text-sm font-medium ${
                    systemStatus.online ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {systemStatus.online ? 'System Online' : 'System Offline'}
                  </span>
                </div>
                <div className="mt-2 text-center space-y-1">
                  <div className="text-xs text-gray-500">
                    {systemStatus.activeUsers} active user{systemStatus.activeUsers !== 1 ? 's' : ''}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    systemStatus.performance === 'excellent' ? 'bg-green-100 text-green-800' :
                    systemStatus.performance === 'good' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {systemStatus.performance} performance
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{completionPercentage}%</span>
                  <div className="text-xs text-gray-500">Setup Complete</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <motion.div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                      style={{ width: `${completionPercentage}%` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${completionPercentage}%` }}
                      transition={{ duration: 1, delay: 0.8 }}
                    ></motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Premium Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {statsCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            whileHover={{ 
              scale: 1.02, 
              rotateY: 5,
              transformPerspective: 1000 
            }}
            className="group relative cursor-pointer"
            onClick={card.drillDown}
          >
            <div className="relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/30 overflow-hidden transition-all duration-300 group-hover:shadow-2xl">
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                    card.trend === 'up' ? 'bg-green-100 text-green-800 group-hover:bg-green-200' : 'bg-red-100 text-red-800 group-hover:bg-red-200'
                  }`}>
                    <MdTrendingUp className="h-3 w-3" />
                    <span>{card.change}</span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-gray-900 group-hover:to-blue-600 group-hover:bg-clip-text transition-all duration-300">
                    {card.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{card.title}</div>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      className={`bg-gradient-to-r ${card.gradient} h-2 rounded-full`}
                      style={{ width: `${Math.min((card.value / card.target) * 100, 100)}%` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((card.value / card.target) * 100, 100)}%` }}
                      transition={{ duration: 1, delay: 0.8 + index * 0.1 }}
                    ></motion.div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {card.value} / {card.target} {card.description}
                  </div>
                </div>

                {/* Sub-stats */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {card.subStats.map((subStat, subIndex) => (
                    <div key={subStat.label} className="bg-white/40 dark:bg-gray-700/40 rounded-lg p-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400">{subStat.label}</div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{subStat.value}</div>
                    </div>
                  ))}
                </div>

                {/* Drill-down indicator */}
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="p-1 bg-white/20 rounded-full">
                    <FaEye className="h-3 w-3 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions - Premium Style */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="lg:col-span-1"
        >
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/30">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <HiLightningBolt className="h-6 w-6 mr-3 text-yellow-500" />
              Quick Actions
            </h3>
            <div className="space-y-4">
              {premiumActions.map((action, index) => (
                <motion.button
                  key={action.title}
                  onClick={action.onClick}
                  disabled={action.loading}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full group relative overflow-hidden"
                >
                  <div className={`w-full bg-gradient-to-r ${action.gradient} rounded-xl p-4 shadow-lg ${action.shadowColor} border border-white/20 transition-all duration-300 group-hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed`}>
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        {action.loading ? (
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                          <action.icon className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-white">{action.title}</div>
                        <div className="text-sm text-white/80">{action.description}</div>
                      </div>
                      <div className="text-xs text-white/60 font-mono">
                        {action.shortcut}
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Gamified Onboarding Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="lg:col-span-1"
        >
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <FaRocket className="h-6 w-6 mr-3 text-purple-500" />
                Setup Progress
              </h3>
              <div className="flex items-center space-x-2">
                <FaStar className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-bold text-yellow-600">{totalPoints} / {maxPoints} pts</span>
              </div>
            </div>
            
            {/* Progress Ring */}
            <div className="flex justify-center mb-6">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="url(#progressGradient)"
                    strokeWidth="8"
                    fill="transparent"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "0 283" }}
                    animate={{ strokeDasharray: `${(completionPercentage / 100) * 283} 283` }}
                    transition={{ duration: 1, delay: 1 }}
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{completionPercentage}%</span>
                </div>
              </div>
            </div>

            {/* Task List */}
            <div className="space-y-3">
              {onboardingTasks.map((task, index) => (
                <motion.button
                  key={task.title}
                  onClick={() => handleTaskClick(task.tab)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1 + index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  className={`w-full p-4 rounded-xl transition-all duration-300 border text-left ${
                    task.completed 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${
                      task.completed ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}>
                      <task.icon className={`h-4 w-4 ${
                        task.completed ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${
                        task.completed ? 'text-green-800 dark:text-green-200' : 'text-gray-900 dark:text-white'
                      }`}>
                        {task.title}
                      </div>
                      <div className={`text-sm ${
                        task.completed ? 'text-green-600 dark:text-green-300' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {task.description}
                      </div>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          task.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                          task.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {task.difficulty}
                        </span>
                        <span className="text-xs text-gray-500">{task.estimatedTime}</span>
                        <span className="text-xs font-bold text-purple-600">+{task.points} pts</span>
                      </div>
                    </div>
                    {task.completed && (
                      <FaCheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Activity Feed & Notifications */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="lg:col-span-1"
        >
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/30">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <FaBell className="h-6 w-6 mr-3 text-blue-500" />
              Recent Activity
            </h3>
            
            <div className="space-y-4">
              {recentActivities && recentActivities.length > 0 ? (
                recentActivities.slice(0, 5).map((activity, index) => (
                  <motion.div 
                    key={index} 
                    className="flex items-start space-x-3 p-3 rounded-lg bg-white/40 dark:bg-gray-700/40"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 + index * 0.1 }}
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 animate-pulse"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white font-medium">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.timestamp}</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaNewspaper className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No recent activities</p>
                  <p className="text-xs text-gray-400">Activities will appear here as you use the system</p>
                </div>
              )}
            </div>

            {/* Notifications */}
            {notifications && notifications.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <MdNotifications className="h-4 w-4 mr-2 text-yellow-500" />
                  Notifications
                </h4>
                <div className="space-y-3">
                  {notifications.slice(0, 3).map((notification, index) => (
                    <motion.div 
                      key={index} 
                      className="flex items-start space-x-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.4 + index * 0.1 }}
                    >
                      <MdNotifications className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">{notification.title}</p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-300">{notification.message}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Success/Warning Alerts */}
      <AnimatePresence>
        {(summary?.pendingDocuments > 0 || summary?.completionRate < 50) && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.5, delay: 1.5 }}
            className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-center">
              <div className="p-3 bg-amber-500 rounded-xl mr-4">
                <MdWarning className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-amber-800 dark:text-amber-200">Action Required</h4>
                <div className="text-sm text-amber-700 dark:text-amber-300 mt-1 space-y-1">
                  {summary?.pendingDocuments > 0 && (
                    <p>• {summary.pendingDocuments} documents pending verification</p>
                  )}
                  {summary?.completionRate < 50 && (
                    <p>• School setup is incomplete ({summary.completionRate}% complete)</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      {showAddStudentModal && (
        <AddAthleteModal
          isOpen={showAddStudentModal}
          onClose={() => setShowAddStudentModal(false)}
          onSubmit={handleAddStudentSubmit}
        />
      )}

      {showTournamentModal && (
        <TournamentCreationModal
          isOpen={showTournamentModal}
          onClose={() => setShowTournamentModal(false)}
          onSubmit={handleTournamentSubmit}
        />
      )}

      {/* Floating Action Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2, type: "spring", stiffness: 200 }}
        className="fixed bottom-8 right-8 z-50"
      >
        <div className="relative group">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:shadow-3xl transition-all duration-300"
            onClick={() => setShowAddStudentModal(true)}
          >
            <FaPlus className="h-6 w-6" />
          </motion.button>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
              Quick Add Student
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
