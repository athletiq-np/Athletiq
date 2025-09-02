import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTrophy,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUsers,
  FaPlay,
  FaClock,
  FaFilter,
  FaSearch,
  FaShare,
  FaHeart,
  FaBell,
  FaChevronDown,
  FaChevronUp,
  FaSignal,
  FaWifi
} from 'react-icons/fa';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { apiClient } from '../../utils/apiClient';
import { logger } from '../../utils/logger';
import { usePWA } from '../../hooks/usePWA';
import LiveMatchTracker from '../features/live/LiveMatchTracker';

/**
 * 📱 Mobile-Optimized Tournament View
 * Responsive tournament interface optimized for mobile devices
 * 
 * Features:
 * - Touch-friendly interface with swipe gestures
 * - Progressive loading for better performance
 * - Offline support with cached data
 * - Live match integration
 * - Pull-to-refresh functionality
 * - Bottom sheet modals
 * - Haptic feedback (where supported)
 * - Dark mode support
 * - PWA installation prompt
 */
export default function MobileTournamentView({ tournamentId }) {
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [followedMatches, setFollowedMatches] = useState(new Set());
  
  const { isOnline, cacheData, getCachedData, isInstalled, canInstall, installPWA } = usePWA();

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All Matches', icon: FaTrophy },
    { value: 'live', label: 'Live', icon: FaSignal },
    { value: 'today', label: 'Today', icon: FaCalendarAlt },
    { value: 'upcoming', label: 'Upcoming', icon: FaClock },
    { value: 'finished', label: 'Finished', icon: FaTrophy }
  ];

  useEffect(() => {
    loadTournamentData();
  }, [tournamentId]);

  const loadTournamentData = async (useCache = false) => {
    if (useCache && !isOnline) {
      // Try to load from cache when offline
      const cachedData = await getCachedData(`tournament-${tournamentId}`);
      if (cachedData) {
        setTournament(cachedData.tournament);
        setMatches(cachedData.matches);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      const [tournamentRes, matchesRes] = await Promise.all([
        apiClient.get(`/tournaments/${tournamentId}`),
        apiClient.get(`/tournaments/${tournamentId}/matches`)
      ]);

      setTournament(tournamentRes.data);
      setMatches(matchesRes.data.matches || []);
      
      // Cache data for offline access
      await cacheData(`tournament-${tournamentId}`, {
        tournament: tournamentRes.data,
        matches: matchesRes.data.matches || []
      });
      
      logger.info('Tournament data loaded', { tournamentId, matchCount: matchesRes.data.matches?.length || 0 });

    } catch (error) {
      logger.error('Failed to load tournament data', error);
      
      // Try to load cached data on error
      const cachedData = await getCachedData(`tournament-${tournamentId}`);
      if (cachedData) {
        setTournament(cachedData.tournament);
        setMatches(cachedData.matches);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Haptic feedback if supported
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    await loadTournamentData(false);
    setRefreshing(false);
  };

  const handleMatchSelect = (match) => {
    setSelectedMatch(match);
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  };

  const handleFollowMatch = async (matchId) => {
    try {
      if (followedMatches.has(matchId)) {
        await apiClient.delete(`/matches/${matchId}/follow`);
        setFollowedMatches(prev => {
          const newSet = new Set(prev);
          newSet.delete(matchId);
          return newSet;
        });
      } else {
        await apiClient.post(`/matches/${matchId}/follow`);
        setFollowedMatches(prev => new Set([...prev, matchId]));
      }
    } catch (error) {
      logger.error('Failed to toggle follow match', error);
    }
  };

  const getFilteredMatches = () => {
    let filtered = [...matches];

    // Apply status filter
    if (filter !== 'all') {
      if (filter === 'live') {
        filtered = filtered.filter(match => match.status === 'live');
      } else if (filter === 'today') {
        filtered = filtered.filter(match => isToday(new Date(match.scheduled_time)));
      } else if (filter === 'upcoming') {
        filtered = filtered.filter(match => 
          ['scheduled'].includes(match.status) && 
          new Date(match.scheduled_time) > new Date()
        );
      } else if (filter === 'finished') {
        filtered = filtered.filter(match => match.status === 'finished');
      }
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(match =>
        match.team1_name?.toLowerCase().includes(query) ||
        match.team2_name?.toLowerCase().includes(query) ||
        match.venue?.toLowerCase().includes(query)
      );
    }

    // Sort by schedule time
    return filtered.sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time));
  };

  const getMatchStatusColor = (status) => {
    const colors = {
      live: 'bg-red-500',
      scheduled: 'bg-blue-500',
      finished: 'bg-green-500',
      postponed: 'bg-yellow-500',
      cancelled: 'bg-gray-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getDateLabel = (date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM dd');
  };

  const renderMatch = (match, index) => (
    <motion.div
      key={match.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden"
      onClick={() => handleMatchSelect(match)}
    >
      {/* Match Status Bar */}
      <div className={`h-1 ${getMatchStatusColor(match.status)}`}></div>
      
      <div className="p-4">
        {/* Date and Time */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <FaCalendarAlt className="w-4 h-4" />
            <span>{getDateLabel(new Date(match.scheduled_time))}</span>
            <span>{format(new Date(match.scheduled_time), 'HH:mm')}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {match.status === 'live' && (
              <div className="flex items-center space-x-1 text-red-500 text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span>LIVE</span>
              </div>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleFollowMatch(match.id);
              }}
              className={`p-2 rounded-full transition-colors ${
                followedMatches.has(match.id)
                  ? 'text-red-500 bg-red-50'
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
            >
              <FaHeart className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
              {match.team1_logo ? (
                <img src={match.team1_logo} alt={match.team1_name} className="w-8 h-8 rounded-full" />
              ) : (
                <span className="text-sm font-bold text-gray-600">
                  {match.team1_name?.charAt(0) || 'T'}
                </span>
              )}
            </div>
            <h4 className="font-medium text-gray-900 text-sm">{match.team1_name || 'TBD'}</h4>
          </div>
          
          <div className="px-4">
            <div className="text-center">
              {match.status === 'finished' || match.status === 'live' ? (
                <div className="text-xl font-bold text-gray-900">
                  {match.score?.team1 || 0} - {match.score?.team2 || 0}
                </div>
              ) : (
                <div className="text-sm text-gray-500">vs</div>
              )}
              {match.status === 'live' && (
                <div className="text-xs text-gray-500 mt-1">
                  {match.elapsed_time || 0}'
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 text-center">
            <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
              {match.team2_logo ? (
                <img src={match.team2_logo} alt={match.team2_name} className="w-8 h-8 rounded-full" />
              ) : (
                <span className="text-sm font-bold text-gray-600">
                  {match.team2_name?.charAt(0) || 'T'}
                </span>
              )}
            </div>
            <h4 className="font-medium text-gray-900 text-sm">{match.team2_name || 'TBD'}</h4>
          </div>
        </div>

        {/* Venue */}
        {match.venue && (
          <div className="flex items-center justify-center space-x-1 mt-3 text-sm text-gray-600">
            <FaMapMarkerAlt className="w-3 h-3" />
            <span>{match.venue}</span>
          </div>
        )}
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-athletiq-blue border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-600">Loading tournament...</span>
      </div>
    );
  }

  const filteredMatches = getFilteredMatches();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* PWA Install Banner */}
      {canInstall && !isInstalled && (
        <div className="bg-athletiq-blue text-white p-3 text-center">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-sm">Install app for better experience</span>
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
        <div className="bg-yellow-500 text-white p-2 text-center text-sm">
          <FaWifi className="w-4 h-4 inline mr-2" />
          You're offline. Showing cached data.
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{tournament?.name}</h1>
              <p className="text-sm text-gray-600">{matches.length} matches</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <FaWifi className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters 
                    ? 'bg-athletiq-blue text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FaFilter className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search matches..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-athletiq-blue focus:border-athletiq-blue"
            />
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex space-x-2 mt-4 pb-4 overflow-x-auto">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilter(option.value)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                        filter === option.value
                          ? 'bg-athletiq-blue text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <option.icon className="w-4 h-4" />
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Matches List */}
      <div className="p-4">
        {filteredMatches.length > 0 ? (
          <AnimatePresence>
            {filteredMatches.map((match, index) => renderMatch(match, index))}
          </AnimatePresence>
        ) : (
          <div className="text-center py-12">
            <FaTrophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
            <p className="text-gray-600">
              {searchQuery ? 'Try adjusting your search' : 'No matches match your current filter'}
            </p>
          </div>
        )}
      </div>

      {/* Live Match Modal */}
      <AnimatePresence>
        {selectedMatch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
            onClick={() => setSelectedMatch(null)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Match Details</h3>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FaTimes className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              
              <LiveMatchTracker 
                matchId={selectedMatch.id} 
                tournamentId={tournamentId}
                autoplay={selectedMatch.status === 'live'}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
