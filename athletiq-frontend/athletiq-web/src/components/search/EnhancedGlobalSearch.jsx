import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaSearch,
  FaTimes,
  FaHistory,
  FaTrophy,
  FaUsers,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaFire,
  FaClock,
  FaFilter,
  FaMicrophone,
  FaMicrophoneSlash
} from 'react-icons/fa';
import { apiClient } from '../../utils/apiClient';
import { logger } from '../../utils/logger';
import { usePWA } from '../../hooks/usePWA';

/**
 * 🔍 Enhanced Global Search Component
 * Advanced search functionality with voice input, filters, and real-time results
 * 
 * Features:
 * - Real-time search as you type
 * - Voice search with speech recognition
 * - Advanced filtering (tournaments, athletes, matches, venues)
 * - Search history with local storage
 * - Trending searches
 * - Offline search in cached data
 * - Search suggestions and autocomplete
 * - Mobile-optimized interface
 * - Search analytics tracking
 */
export default function EnhancedGlobalSearch({ onResultSelect, showModal = true, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchHistory, setSearchHistory] = useState([]);
  const [trendingSearches, setTrendingSearches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [recentResults, setRecentResults] = useState([]);
  
  const { isOnline, getCachedData, cacheData } = usePWA();

  // Search filters
  const searchFilters = [
    { id: 'all', label: 'All', icon: FaSearch },
    { id: 'tournaments', label: 'Tournaments', icon: FaTrophy },
    { id: 'athletes', label: 'Athletes', icon: FaUsers },
    { id: 'matches', label: 'Matches', icon: FaCalendarAlt },
    { id: 'venues', label: 'Venues', icon: FaMapMarkerAlt }
  ];

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
      };
      
      recognitionInstance.onerror = () => {
        setIsListening(false);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, []);

  // Load search history and trending searches
  useEffect(() => {
    loadSearchHistory();
    loadTrendingSearches();
  }, []);

  // Search when query changes
  useEffect(() => {
    if (query.trim().length > 2) {
      const timeoutId = setTimeout(() => {
        performSearch(query);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setResults([]);
      setSuggestions([]);
    }
  }, [query, activeFilter]);

  const loadSearchHistory = () => {
    try {
      const history = JSON.parse(localStorage.getItem('athletiq_search_history') || '[]');
      setSearchHistory(history.slice(0, 10)); // Keep only last 10 searches
    } catch (error) {
      logger.error('Failed to load search history', error);
    }
  };

  const loadTrendingSearches = async () => {
    try {
      // Load from cache first
      const cached = await getCachedData('trending_searches');
      if (cached) {
        setTrendingSearches(cached);
      }

      if (isOnline) {
        const response = await apiClient.get('/search/trending');
        setTrendingSearches(response.data.trending || []);
        await cacheData('trending_searches', response.data.trending || []);
      }
    } catch (error) {
      logger.error('Failed to load trending searches', error);
    }
  };

  const saveToSearchHistory = (searchQuery) => {
    try {
      const history = JSON.parse(localStorage.getItem('athletiq_search_history') || '[]');
      const updatedHistory = [
        searchQuery,
        ...history.filter(item => item !== searchQuery)
      ].slice(0, 10);
      
      localStorage.setItem('athletiq_search_history', JSON.stringify(updatedHistory));
      setSearchHistory(updatedHistory);
    } catch (error) {
      logger.error('Failed to save search history', error);
    }
  };

  const performSearch = async (searchQuery) => {
    setLoading(true);
    try {
      // Save to history
      if (searchQuery.trim().length > 2) {
        saveToSearchHistory(searchQuery);
      }

      // Try offline search first
      if (!isOnline) {
        const offlineResults = await searchOfflineData(searchQuery);
        setResults(offlineResults);
        setLoading(false);
        return;
      }

      // Online search
      const params = {
        q: searchQuery,
        type: activeFilter === 'all' ? undefined : activeFilter,
        limit: 20
      };

      const response = await apiClient.get('/search', { params });
      
      setResults(response.data.results || []);
      setSuggestions(response.data.suggestions || []);
      
      // Cache results for offline access
      await cacheData(`search_${searchQuery}_${activeFilter}`, response.data);
      
      // Track search analytics
      if (searchQuery.trim().length > 2) {
        trackSearchAnalytics(searchQuery, activeFilter, response.data.results?.length || 0);
      }

    } catch (error) {
      logger.error('Search failed', error);
      
      // Try cached results
      const cached = await getCachedData(`search_${searchQuery}_${activeFilter}`);
      if (cached) {
        setResults(cached.results || []);
        setSuggestions(cached.suggestions || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const searchOfflineData = async (searchQuery) => {
    // Search through cached data
    const offlineResults = [];
    
    try {
      // Search tournaments
      const tournamentCache = await getCachedData('tournaments');
      if (tournamentCache) {
        const tournaments = tournamentCache.filter(t => 
          t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.location?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        offlineResults.push(...tournaments.map(t => ({ ...t, type: 'tournament' })));
      }

      // Search athletes
      const athleteCache = await getCachedData('athletes');
      if (athleteCache) {
        const athletes = athleteCache.filter(a => 
          a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.team?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        offlineResults.push(...athletes.map(a => ({ ...a, type: 'athlete' })));
      }

      // Search matches
      const matchCache = await getCachedData('matches');
      if (matchCache) {
        const matches = matchCache.filter(m => 
          m.team1_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.team2_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.venue?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        offlineResults.push(...matches.map(m => ({ ...m, type: 'match' })));
      }

    } catch (error) {
      logger.error('Offline search failed', error);
    }

    return offlineResults.slice(0, 20);
  };

  const trackSearchAnalytics = async (searchQuery, filter, resultCount) => {
    try {
      if (isOnline) {
        await apiClient.post('/analytics/search', {
          query: searchQuery,
          filter,
          result_count: resultCount,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      // Analytics failures shouldn't break search
      logger.warn('Search analytics tracking failed', error);
    }
  };

  const startVoiceSearch = () => {
    if (recognition) {
      setIsListening(true);
      recognition.start();
    }
  };

  const stopVoiceSearch = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const handleResultClick = (result) => {
    // Track result click
    if (isOnline) {
      trackSearchAnalytics(query, activeFilter, 1);
    }
    
    // Save to recent results
    const recent = JSON.parse(localStorage.getItem('athletiq_recent_results') || '[]');
    const updatedRecent = [
      result,
      ...recent.filter(r => r.id !== result.id)
    ].slice(0, 5);
    localStorage.setItem('athletiq_recent_results', JSON.stringify(updatedRecent));
    
    if (onResultSelect) {
      onResultSelect(result);
    }
  };

  const clearSearchHistory = () => {
    localStorage.removeItem('athletiq_search_history');
    setSearchHistory([]);
  };

  const getResultIcon = (type) => {
    const icons = {
      tournament: FaTrophy,
      athlete: FaUsers,
      match: FaCalendarAlt,
      venue: FaMapMarkerAlt
    };
    return icons[type] || FaSearch;
  };

  const renderResult = (result, index) => {
    const Icon = getResultIcon(result.type);
    
    return (
      <motion.div
        key={`${result.type}-${result.id}-${index}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="p-4 hover:bg-gray-50 border-b border-gray-100 cursor-pointer transition-colors"
        onClick={() => handleResultClick(result)}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-athletiq-blue/10 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-athletiq-blue" />
          </div>
          
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">
              {result.name || result.team1_name || result.title}
            </h4>
            <p className="text-sm text-gray-600">
              {result.type === 'tournament' && result.location}
              {result.type === 'athlete' && result.team}
              {result.type === 'match' && `${result.team1_name} vs ${result.team2_name}`}
              {result.type === 'venue' && result.address}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600 capitalize">
                {result.type}
              </span>
              {result.status && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  result.status === 'live' ? 'bg-red-100 text-red-600' :
                  result.status === 'upcoming' ? 'bg-blue-100 text-blue-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {result.status}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const content = (
    <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl h-full sm:h-auto max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tournaments, athletes, matches..."
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-athletiq-blue focus:border-athletiq-blue"
              autoFocus
            />
            
            {/* Voice Search Button */}
            {recognition && (
              <button
                onClick={isListening ? stopVoiceSearch : startVoiceSearch}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                  isListening 
                    ? 'text-red-500 bg-red-50' 
                    : 'text-gray-400 hover:text-athletiq-blue hover:bg-gray-50'
                }`}
              >
                {isListening ? (
                  <FaMicrophoneSlash className="w-4 h-4" />
                ) : (
                  <FaMicrophone className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
          
          {showModal && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FaTimes className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex space-x-2 overflow-x-auto">
            {searchFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-full whitespace-nowrap transition-colors ${
                  activeFilter === filter.id
                    ? 'bg-athletiq-blue text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <filter.icon className="w-4 h-4" />
                <span className="text-sm">{filter.label}</span>
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="ml-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <FaFilter className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Voice Recognition Indicator */}
        {isListening && (
          <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-700">Listening... Speak now</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-athletiq-blue border-t-transparent rounded-full"></div>
            <span className="ml-3 text-gray-600">Searching...</span>
          </div>
        ) : query.trim().length > 2 ? (
          results.length > 0 ? (
            <div>
              {/* Search Results */}
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  Results ({results.length})
                </h3>
              </div>
              {results.map((result, index) => renderResult(result, index))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FaSearch className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">Try adjusting your search terms</p>
            </div>
          )
        ) : (
          <div className="p-4">
            {/* Trending Searches */}
            {trendingSearches.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <FaFire className="w-4 h-4 text-orange-500" />
                  <h3 className="font-medium text-gray-900">Trending</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trendingSearches.map((trend, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(trend)}
                      className="px-3 py-2 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      {trend}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search History */}
            {searchHistory.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <FaHistory className="w-4 h-4 text-gray-500" />
                    <h3 className="font-medium text-gray-900">Recent Searches</h3>
                  </div>
                  <button
                    onClick={clearSearchHistory}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-2">
                  {searchHistory.map((historyItem, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(historyItem)}
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <FaClock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{historyItem}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="p-3 bg-yellow-50 border-t border-yellow-200">
          <div className="flex items-center space-x-2 text-yellow-700">
            <FaClock className="w-4 h-4" />
            <span className="text-sm">Searching offline data only</span>
          </div>
        </div>
      )}
    </div>
  );

  if (!showModal) {
    return content;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
