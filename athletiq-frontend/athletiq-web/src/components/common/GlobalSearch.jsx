import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, 
  FaUser, 
  FaSchool, 
  FaTrophy, 
  FaUserGraduate,
  FaFileAlt,
  FaCalendarAlt,
  FaTimes,
  FaSpinner,
  FaFilter
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../utils/apiClient';
import { logger } from '../../utils/logger';
import { useDebounce } from '../../hooks/useDebounce';

/**
 * 🔍 Global Search Component
 * Comprehensive search functionality across all Athletiq entities
 * 
 * Features:
 * - Real-time search with debouncing
 * - Multi-entity search (athletes, schools, tournaments, etc.)
 * - Advanced filtering
 * - Keyboard navigation
 * - Search history
 * - Quick actions
 * - Responsive design
 * - Accessibility compliant
 */
export default function GlobalSearch({ isOpen, onClose, initialQuery = '' }) {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchHistory, setSearchHistory] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    categories: {
      athletes: true,
      schools: true,
      tournaments: true,
      users: true,
      documents: true,
      events: true
    },
    dateRange: 'all',
    status: 'all',
    verification: 'all'
  });

  const debouncedQuery = useDebounce(query, 300);

  // Search categories configuration
  const searchCategories = [
    { 
      id: 'all', 
      label: 'All Results', 
      icon: FaSearch, 
      color: 'blue' 
    },
    { 
      id: 'athletes', 
      label: 'Athletes', 
      icon: FaUserGraduate, 
      color: 'green' 
    },
    { 
      id: 'schools', 
      label: 'Schools', 
      icon: FaSchool, 
      color: 'purple' 
    },
    { 
      id: 'tournaments', 
      label: 'Tournaments', 
      icon: FaTrophy, 
      color: 'yellow' 
    },
    { 
      id: 'users', 
      label: 'Users', 
      icon: FaUser, 
      color: 'indigo' 
    },
    { 
      id: 'documents', 
      label: 'Documents', 
      icon: FaFileAlt, 
      color: 'red' 
    },
    { 
      id: 'events', 
      label: 'Events', 
      icon: FaCalendarAlt, 
      color: 'pink' 
    }
  ];

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('athletiq-search-history');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      performSearch(debouncedQuery);
    } else {
      setResults({});
    }
  }, [debouncedQuery, filters]);

  const performSearch = useCallback(async (searchQuery) => {
    setLoading(true);
    try {
      logger.info('Performing global search', { query: searchQuery, filters });

      const response = await apiClient.post('/search/global', {
        query: searchQuery,
        filters: filters,
        limit: 50
      });

      setResults(response.data);
      setSelectedIndex(-1);
      
      logger.info('Global search completed', { 
        query: searchQuery, 
        resultCount: Object.values(response.data).reduce((acc, arr) => acc + (arr?.length || 0), 0)
      });

    } catch (error) {
      logger.error('Global search failed', error, { query: searchQuery });
      setResults({});
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const saveToHistory = (searchQuery) => {
    if (!searchQuery.trim()) return;
    
    const newHistory = [
      searchQuery,
      ...searchHistory.filter(item => item !== searchQuery)
    ].slice(0, 10); // Keep only last 10 searches
    
    setSearchHistory(newHistory);
    localStorage.setItem('athletiq-search-history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('athletiq-search-history');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      saveToHistory(query.trim());
      performSearch(query.trim());
    }
  };

  const handleResultClick = (result, category) => {
    saveToHistory(query.trim());
    
    // Navigate based on result type
    switch (category) {
      case 'athletes':
        navigate(`/admin?tab=players&id=${result.id}`);
        break;
      case 'schools':
        navigate(`/admin?tab=schools&id=${result.id}`);
        break;
      case 'tournaments':
        navigate(`/admin?tab=tournaments&id=${result.id}`);
        break;
      case 'users':
        navigate(`/admin?tab=users&id=${result.id}`);
        break;
      case 'documents':
        navigate(`/admin/documents/${result.id}`);
        break;
      case 'events':
        navigate(`/admin/events/${result.id}`);
        break;
      default:
        logger.warn('Unknown result category', { category, result });
    }
    
    onClose();
  };

  const handleKeyDown = (e) => {
    const allResults = Object.values(results).flat();
    
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && allResults[selectedIndex]) {
          const result = allResults[selectedIndex];
          const category = Object.keys(results).find(cat => 
            results[cat].includes(result)
          );
          handleResultClick(result, category);
        } else if (query.trim()) {
          handleSearch(e);
        }
        break;
    }
  };

  const renderResultItem = (result, category, index) => {
    const categoryConfig = searchCategories.find(cat => cat.id === category);
    const Icon = categoryConfig?.icon || FaSearch;
    const isSelected = index === selectedIndex;

    return (
      <motion.div
        key={`${category}-${result.id}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
          isSelected 
            ? 'bg-athletiq-blue text-white' 
            : 'hover:bg-gray-50'
        }`}
        onClick={() => handleResultClick(result, category)}
      >
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isSelected 
              ? 'bg-white/20' 
              : `bg-${categoryConfig?.color}-100`
          }`}>
            <Icon className={`w-4 h-4 ${
              isSelected 
                ? 'text-white' 
                : `text-${categoryConfig?.color}-600`
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium truncate ${
              isSelected ? 'text-white' : 'text-gray-900'
            }`}>
              {result.name || result.title || result.full_name}
            </h4>
            <p className={`text-sm truncate ${
              isSelected ? 'text-white/80' : 'text-gray-500'
            }`}>
              {result.description || result.email || result.school_name || 'No description'}
            </p>
          </div>
          <div className={`text-xs px-2 py-1 rounded-full ${
            isSelected 
              ? 'bg-white/20 text-white' 
              : `bg-${categoryConfig?.color}-100 text-${categoryConfig?.color}-700`
          }`}>
            {categoryConfig?.label}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderResults = () => {
    const allResults = Object.values(results).flat();
    
    if (loading) {
      return (
        <div className="p-8 text-center">
          <FaSpinner className="w-6 h-6 animate-spin mx-auto mb-4 text-athletiq-blue" />
          <p className="text-gray-500">Searching...</p>
        </div>
      );
    }

    if (query.trim().length < 2) {
      return (
        <div className="p-6">
          <h3 className="font-medium text-gray-900 mb-4">Recent Searches</h3>
          {searchHistory.length > 0 ? (
            <div className="space-y-2">
              {searchHistory.map((item, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(item)}
                  className="w-full text-left p-2 rounded-lg hover:bg-gray-50 text-gray-700 text-sm"
                >
                  <FaSearch className="w-3 h-3 inline mr-2 text-gray-400" />
                  {item}
                </button>
              ))}
              <button
                onClick={clearHistory}
                className="text-xs text-gray-500 hover:text-gray-700 mt-2"
              >
                Clear history
              </button>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recent searches</p>
          )}
        </div>
      );
    }

    if (allResults.length === 0) {
      return (
        <div className="p-8 text-center">
          <FaSearch className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-500">
            Try adjusting your search terms or filters
          </p>
        </div>
      );
    }

    let globalIndex = 0;
    
    return (
      <div className="max-h-96 overflow-y-auto">
        {Object.entries(results).map(([category, items]) => {
          if (!items || items.length === 0) return null;
          
          const categoryConfig = searchCategories.find(cat => cat.id === category);
          
          return (
            <div key={category} className="p-4 border-b border-gray-100 last:border-b-0">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <categoryConfig.icon className={`w-4 h-4 text-${categoryConfig.color}-600`} />
                <span>{categoryConfig.label}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {items.length}
                </span>
              </h3>
              <div className="space-y-1">
                {items.map((item) => renderResultItem(item, category, globalIndex++))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
        >
          {/* Search Header */}
          <div className="p-4 border-b border-gray-100">
            <form onSubmit={handleSearch} className="flex items-center space-x-3">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search athletes, schools, tournaments, and more..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-athletiq-blue focus:border-athletiq-blue"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 rounded-lg border transition-colors duration-200 ${
                  showFilters 
                    ? 'border-athletiq-blue bg-athletiq-blue text-white' 
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FaFilter className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b border-gray-100 overflow-hidden"
              >
                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {searchCategories.slice(1).map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setFilters(prev => ({
                            ...prev,
                            categories: {
                              ...prev.categories,
                              [category.id]: !prev.categories[category.id]
                            }
                          }))}
                          className={`px-3 py-1 rounded-full text-sm transition-colors duration-200 ${
                            filters.categories[category.id]
                              ? `bg-${category.color}-100 text-${category.color}-700`
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <category.icon className="w-3 h-3 inline mr-1" />
                          {category.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          {renderResults()}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
