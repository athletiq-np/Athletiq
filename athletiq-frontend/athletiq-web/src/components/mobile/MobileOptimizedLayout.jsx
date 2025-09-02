import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSwipeable } from 'framer-motion';
import {
  FaHome,
  FaTrophy,
  FaCalendarAlt,
  FaUsers,
  FaUser,
  FaBell,
  FaSearch,
  FaBars,
  FaTimes,
  FaWifi,
  FaWifiSlash,
  FaArrowLeft,
  FaShare,
  FaHeartbeat,
  FaChevronUp
} from 'react-icons/fa';
import { usePWA } from '../../hooks/usePWA';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * 📱 Mobile-Optimized Layout Component
 * Provides responsive mobile navigation and layout structure
 * 
 * Features:
 * - Bottom navigation for easy thumb reach
 * - Swipe gestures for navigation
 * - Pull-to-refresh functionality
 * - Offline mode indicators
 * - PWA-optimized interactions
 * - Safe area handling for mobile devices
 * - Dynamic height adjustments
 * - Haptic feedback integration
 */
export default function MobileOptimizedLayout({ children, title, showBackButton = false, onRefresh = null }) {
  const [showMenu, setShowMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  const location = useLocation();
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const isPulling = useRef(false);
  
  const { isOnline, isInstalled, canInstall, installPWA, pendingUpdate, updateApp } = usePWA();

  // Navigation items for bottom nav
  const navItems = [
    { path: '/', icon: FaHome, label: 'Home' },
    { path: '/tournaments', icon: FaTrophy, label: 'Tournaments' },
    { path: '/matches', icon: FaCalendarAlt, label: 'Matches' },
    { path: '/athletes', icon: FaUsers, label: 'Athletes' },
    { path: '/profile', icon: FaUser, label: 'Profile' }
  ];

  // Handle scroll for showing/hiding scroll-to-top button
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setShowScrollTop(container.scrollTop > 300);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle pull-to-refresh
  const handleTouchStart = (e) => {
    if (scrollContainerRef.current?.scrollTop === 0 && onRefresh) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling.current || !onRefresh) return;

    touchCurrentY.current = e.touches[0].clientY;
    const distance = touchCurrentY.current - touchStartY.current;
    
    if (distance > 0 && distance < 150) {
      setPullDistance(distance);
      e.preventDefault(); // Prevent default scrolling
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling.current || !onRefresh) return;

    if (pullDistance > 80) {
      setRefreshing(true);
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setRefreshing(false);
      }
    }
    
    setPullDistance(0);
    isPulling.current = false;
  };

  // Swipe navigation handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      // Navigate to next tab
      const currentIndex = navItems.findIndex(item => item.path === location.pathname);
      if (currentIndex < navItems.length - 1) {
        navigate(navItems[currentIndex + 1].path);
      }
    },
    onSwipedRight: () => {
      // Navigate to previous tab or show menu
      if (showBackButton) {
        navigate(-1);
      } else {
        const currentIndex = navItems.findIndex(item => item.path === location.pathname);
        if (currentIndex > 0) {
          navigate(navItems[currentIndex - 1].path);
        } else {
          setShowMenu(true);
        }
      }
    },
    trackMouse: false,
    preventDefaultTouchmoveEvent: true
  });

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const isActivePath = (path) => {
    return location.pathname === path || 
           (path !== '/' && location.pathname.startsWith(path));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 relative overflow-hidden">
      {/* Status Bar Overlays */}
      {/* App Update Available */}
      {pendingUpdate && (
        <div className="absolute top-0 left-0 right-0 bg-green-500 text-white p-2 text-center z-50">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-sm">App update available</span>
            <button
              onClick={updateApp}
              className="bg-white/20 px-3 py-1 rounded text-sm font-medium"
            >
              Update
            </button>
          </div>
        </div>
      )}

      {/* PWA Install Banner */}
      {canInstall && !isInstalled && (
        <div className="absolute top-0 left-0 right-0 bg-athletiq-blue text-white p-3 text-center z-40">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-sm">Install for better experience</span>
            <button
              onClick={installPWA}
              className="bg-white/20 px-3 py-1 rounded text-sm font-medium"
            >
              Install
            </button>
          </div>
        </div>
      )}

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white p-2 text-center z-30">
          <div className="flex items-center justify-center space-x-1">
            <FaWifiSlash className="w-4 h-4" />
            <span className="text-sm">You're offline</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 px-4 py-3 flex items-center justify-between relative z-20">
        <div className="flex items-center space-x-3">
          {showBackButton ? (
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FaArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          ) : (
            <button
              onClick={() => setShowMenu(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
            >
              <FaBars className="w-5 h-5 text-gray-600" />
            </button>
          )}
          
          <div>
            <h1 className="font-semibold text-gray-900 text-lg">{title}</h1>
            {!isOnline && (
              <p className="text-xs text-red-500">Offline mode</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/search')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <FaSearch className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="relative">
            <button
              onClick={() => navigate('/notifications')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FaBell className="w-5 h-5 text-gray-600" />
              {notifications.length > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div 
        {...swipeHandlers}
        className="flex-1 overflow-hidden relative"
      >
        {/* Pull-to-refresh indicator */}
        {pullDistance > 0 && onRefresh && (
          <div 
            className="absolute top-0 left-0 right-0 flex items-center justify-center bg-white z-10 transition-all duration-200"
            style={{ 
              height: `${Math.min(pullDistance, 80)}px`,
              opacity: pullDistance / 80 
            }}
          >
            <div className="flex items-center space-x-2 text-athletiq-blue">
              <div className={`w-6 h-6 border-2 border-athletiq-blue border-t-transparent rounded-full ${
                pullDistance > 80 || refreshing ? 'animate-spin' : ''
              }`}></div>
              <span className="text-sm font-medium">
                {refreshing ? 'Refreshing...' : pullDistance > 80 ? 'Release to refresh' : 'Pull to refresh'}
              </span>
            </div>
          </div>
        )}

        <div
          ref={scrollContainerRef}
          className="h-full overflow-y-auto overscroll-behavior-y-contain"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            paddingTop: pullDistance ? `${pullDistance}px` : 0,
            transform: refreshing ? 'translateY(60px)' : 'none',
            transition: refreshing ? 'transform 0.3s ease' : 'none'
          }}
        >
          {children}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-gray-100 px-2 py-1 pb-safe">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = isActivePath(item.path);
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  // Haptic feedback
                  if (navigator.vibrate) {
                    navigator.vibrate(50);
                  }
                }}
                className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'text-athletiq-blue bg-athletiq-blue/10' 
                    : 'text-gray-600 hover:text-athletiq-blue hover:bg-gray-50'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-transform duration-200 ${
                  isActive ? 'scale-110' : ''
                }`} />
                <span className={`text-xs font-medium ${
                  isActive ? 'text-athletiq-blue' : 'text-gray-600'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-20 right-4 p-3 bg-athletiq-blue text-white rounded-full shadow-lg z-30 hover:bg-athletiq-blue-dark transition-colors"
          >
            <FaChevronUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Side Menu */}
      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowMenu(false)}
            />
            
            {/* Menu */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-80 max-w-[80vw] bg-white shadow-xl z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Menu</h2>
                  <button
                    onClick={() => setShowMenu(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <FaTimes className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <nav className="space-y-2">
                  {navItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setShowMenu(false);
                      }}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        isActivePath(item.path)
                          ? 'bg-athletiq-blue text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                </nav>

                {/* Menu Footer */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>{isOnline ? 'Online' : 'Offline'}</span>
                  </div>
                  
                  {isInstalled && (
                    <div className="flex items-center space-x-2 text-sm text-green-600 mt-2">
                      <FaHeartbeat className="w-4 h-4" />
                      <span>App installed</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
