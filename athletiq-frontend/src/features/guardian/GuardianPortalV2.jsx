import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, 
  FaPlus, 
  FaBell, 
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes
} from 'react-icons/fa';
import { useTranslation } from '../i18n/translations';
import LanguageToggle from '../i18n/LanguageToggle';
import SmartChildSearch from '../search/SmartChildSearch';
import StatusDrivenDashboard from '../dashboard/StatusDrivenDashboard';
import MultiProviderAuth from '../auth/MultiProviderAuth';
import OCRDocumentUpload from '../documents/OCRDocumentUpload';
import GoogleMapsSchoolPicker from '../school/GoogleMapsSchoolPicker';

const GuardianPortalV2 = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('search'); // search, dashboard, profile
  const [showAuth, setShowAuth] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showSchoolPicker, setShowSchoolPicker] = useState(false);
  const [pendingAthleteData, setPendingAthleteData] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [selectedAthlete, setSelectedAthlete] = useState(null);

  // Check authentication on mount
  useEffect(() => {
    checkAuthStatus();
    loadNotifications();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        
        // If user has athletes, show dashboard, otherwise search
        if (userData.user.athletes && userData.user.athletes.length > 0) {
          setCurrentView('dashboard');
        }
      } else {
        setShowAuth(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setShowAuth(true);
    }
  };

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/guardian/notifications', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleAuthSuccess = (authData) => {
    setUser(authData.user);
    setShowAuth(false);
    
    // Redirect based on user's current state
    if (authData.user.athletes && authData.user.athletes.length > 0) {
      setCurrentView('dashboard');
    } else {
      setCurrentView('search');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      setUser(null);
      setCurrentView('search');
      setShowAuth(true);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSearchResult = (result) => {
    if (result.action === 'claim') {
      // Start claim process
      setSelectedAthlete(result.athlete);
      setShowDocumentUpload(true);
    } else if (result.action === 'create') {
      // Start registration process
      setPendingAthleteData(result.searchData);
      setShowDocumentUpload(true);
    } else if (result.action === 'view') {
      // View existing athlete
      setSelectedAthlete(result.athlete);
      setCurrentView('dashboard');
    }
  };

  const handleDocumentProcessed = (documentData) => {
    setShowDocumentUpload(false);
    setPendingAthleteData({
      ...pendingAthleteData,
      ...documentData.extracted_data,
      document_url: documentData.document_url,
      ocr_confidence: documentData.confidence_scores
    });
    setShowSchoolPicker(true);
  };

  const handleSchoolSelected = async (schoolData) => {
    setShowSchoolPicker(false);
    
    const registrationData = {
      ...pendingAthleteData,
      school: schoolData,
      guardian_id: user.id
    };

    try {
      const response = await fetch('/api/guardian/athletes/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(registrationData)
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update user data
        setUser({
          ...user,
          athletes: [...(user.athletes || []), data.athlete]
        });
        
        // Show success and navigate to dashboard
        setCurrentView('dashboard');
        setPendingAthleteData(null);
        
        // Show success notification
        setNotifications([
          {
            id: Date.now(),
            type: 'success',
            title: t('notifications.registrationSuccess'),
            message: t('notifications.athleteRegistered'),
            timestamp: new Date().toISOString()
          },
          ...notifications
        ]);
      } else {
        const error = await response.json();
        // Handle error
        console.error('Registration failed:', error);
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const NavigationHeader = () => (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Athletiq</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => setCurrentView('search')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                currentView === 'search'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <FaSearch className="w-4 h-4" />
              <span>{t('nav.search')}</span>
            </button>
            
            {user && (
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'dashboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <FaUser className="w-4 h-4" />
                <span>{t('nav.dashboard')}</span>
              </button>
            )}
          </nav>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            <LanguageToggle />
            
            {user ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button className="p-2 text-gray-600 hover:text-gray-900 relative">
                    <FaBell className="w-5 h-5" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {notifications.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900"
                  >
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold">
                        {user.full_name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden sm:block text-sm font-medium">
                      {user.full_name}
                    </span>
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                {t('auth.signIn')}
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {isMobileMenuOpen ? <FaTimes className="w-5 h-5" /> : <FaBars className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-200 bg-white"
          >
            <div className="px-4 py-2 space-y-1">
              <button
                onClick={() => {
                  setCurrentView('search');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'search'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <FaSearch className="w-4 h-4" />
                <span>{t('nav.search')}</span>
              </button>
              
              {user && (
                <>
                  <button
                    onClick={() => {
                      setCurrentView('dashboard');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                      currentView === 'dashboard'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <FaUser className="w-4 h-4" />
                    <span>{t('nav.dashboard')}</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setCurrentView('profile');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    <FaCog className="w-4 h-4" />
                    <span>{t('nav.settings')}</span>
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    <FaSignOutAlt className="w-4 h-4" />
                    <span>{t('auth.signOut')}</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );

  const MainContent = () => {
    if (!user && showAuth) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <MultiProviderAuth
            mode="signup"
            onAuthSuccess={handleAuthSuccess}
            onModeSwitch={(mode) => {/* Handle mode switch */}}
          />
        </div>
      );
    }

    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {currentView === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    {t('search.title')}
                  </h2>
                  <p className="text-lg text-gray-600">
                    {t('search.subtitle')}
                  </p>
                </div>
                <SmartChildSearch onResult={handleSearchResult} />
              </div>
            </motion.div>
          )}

          {currentView === 'dashboard' && user && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <StatusDrivenDashboard 
                user={user}
                onAddChild={() => setCurrentView('search')}
              />
            </motion.div>
          )}

          {currentView === 'profile' && user && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {t('profile.settings')}
                </h2>
                {/* Profile settings content */}
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-gray-600">Profile settings coming soon...</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader />
      <MainContent />

      {/* Modals */}
      <AnimatePresence>
        {showDocumentUpload && (
          <OCRDocumentUpload
            onDocumentProcessed={handleDocumentProcessed}
            onClose={() => {
              setShowDocumentUpload(false);
              setPendingAthleteData(null);
            }}
            existingData={pendingAthleteData}
          />
        )}

        {showSchoolPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">{t('school.selectSchool')}</h2>
                  <button
                    onClick={() => setShowSchoolPicker(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {t('school.selectSchoolDescription')}
                </p>
              </div>
              <div className="p-6">
                <GoogleMapsSchoolPicker
                  onSchoolSelected={handleSchoolSelected}
                  district={pendingAthleteData?.district}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Toast */}
      <AnimatePresence>
        {notifications.length > 0 && (
          <div className="fixed top-20 right-4 z-50 space-y-2">
            {notifications.slice(0, 3).map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                className={`max-w-sm w-full shadow-lg rounded-lg pointer-events-auto ${
                  notification.type === 'success' ? 'bg-green-50 border-green-200' :
                  notification.type === 'error' ? 'bg-red-50 border-red-200' :
                  'bg-blue-50 border-blue-200'
                } border`}
              >
                <div className="p-4">
                  <div className="flex items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {notification.message}
                      </p>
                    </div>
                    <button
                      onClick={() => setNotifications(notifications.filter(n => n.id !== notification.id))}
                      className="ml-4 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GuardianPortalV2;
