import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaChild, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiClient from '@/api/apiClient';
import { useTranslation } from '../i18n/translations';
import SearchResultCard from './SearchResultCard';

const SmartChildSearch = ({ onMatchFound, onNoMatch }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    childName: '',
    dateOfBirth: '',
    schoolHint: ''
  });
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // Handle input changes with auto-save
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-save to localStorage for offline persistence
    const draftKey = 'guardian-child-search-draft';
    const currentDraft = JSON.parse(localStorage.getItem(draftKey) || '{}');
    localStorage.setItem(draftKey, JSON.stringify({
      ...currentDraft,
      [field]: value,
      lastUpdated: new Date().toISOString()
    }));
  }, []);

  // Smart search with typo tolerance and fuzzy matching
  const performSmartSearch = async () => {
    if (!formData.childName.trim() || !formData.dateOfBirth) {
      toast.error(t('search.fillRequired'));
      return;
    }

    setSearching(true);
    setShowResults(false);
    
    try {
      const response = await apiClient.post('/api/athletes/smart-search', {
        name: formData.childName.trim(),
        dateOfBirth: formData.dateOfBirth,
        schoolHint: formData.schoolHint.trim(),
        // Additional search parameters for smart matching
        fuzzyMatch: true,
        typoTolerance: 2,
        includePartialMatches: true
      });

      if (response.data.success) {
        const matches = response.data.matches || [];
        setResults(matches);
        setShowResults(true);
        
        if (matches.length === 0) {
          // No matches found - proceed to create new profile
          setTimeout(() => {
            onNoMatch?.(formData);
          }, 1500);
        } else {
          // Show results for user to select
          toast.success(`${matches.length} potential match${matches.length > 1 ? 'es' : ''} found`);
        }
      } else {
        throw new Error(response.data.message || 'Search failed');
      }
    } catch (error) {
      console.error('Smart search error:', error);
      toast.error(error.message || t('common.error'));
    } finally {
      setSearching(false);
    }
  };

  // Handle match selection
  const handleMatchSelect = (match) => {
    onMatchFound?.(match, formData);
  };

  // Load draft on mount
  React.useEffect(() => {
    const draftKey = 'guardian-child-search-draft';
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.lastUpdated && 
            new Date(draft.lastUpdated) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
          setFormData({
            childName: draft.childName || '',
            dateOfBirth: draft.dateOfBirth || '',
            schoolHint: draft.schoolHint || ''
          });
        }
      } catch (e) {
        // Ignore invalid draft
      }
    }
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <FaChild className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t('search.findChild')}
        </h2>
        <p className="text-gray-600">
          {t('search.helpText')}
        </p>
      </div>

      {/* Search Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6 mb-6"
      >
        <div className="space-y-6">
          {/* Child's Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('search.childName')} *
            </label>
            <input
              type="text"
              value={formData.childName}
              onChange={(e) => handleInputChange('childName', e.target.value)}
              placeholder="राम बहादुर शर्मा / Ram Bahadur Sharma"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              disabled={searching}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter full name as registered in school
            </p>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('search.dateOfBirth')} *
            </label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              disabled={searching}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* School Hint (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('search.schoolOptional')}
            </label>
            <input
              type="text"
              value={formData.schoolHint}
              onChange={(e) => handleInputChange('schoolHint', e.target.value)}
              placeholder="सरस्वती माध्यमिक विद्यालय / Saraswati Secondary School"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={searching}
            />
            <p className="text-xs text-gray-500 mt-1">
              Helps us find the right child if multiple matches
            </p>
          </div>

          {/* Search Button */}
          <button
            onClick={performSmartSearch}
            disabled={searching || !formData.childName.trim() || !formData.dateOfBirth}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-lg font-medium transition-colors"
          >
            {searching ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>{t('search.searching')}</span>
              </>
            ) : (
              <>
                <FaSearch />
                <span>{t('search.findChild')}</span>
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Search Results */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {results.length > 0 ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Found {results.length} potential match{results.length > 1 ? 'es' : ''}:
                </h3>
                {results.map((match) => (
                  <SearchResultCard
                    key={match.id}
                    match={match}
                    onSelect={() => handleMatchSelect(match)}
                    searchQuery={formData}
                  />
                ))}
                
                {/* No Match Option */}
                <div className="mt-6 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <FaExclamationTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-gray-600 mb-3">
                    None of these match your child?
                  </p>
                  <button
                    onClick={() => onNoMatch?.(formData)}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    {t('search.createProfile')}
                  </button>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <FaExclamationTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('search.noMatch')}
                </h3>
                <p className="text-gray-600 mb-6">
                  No existing records found. Let's create a new profile for your child.
                </p>
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <button
                    onClick={() => onNoMatch?.(formData)}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 mx-auto"
                  >
                    <FaCheckCircle />
                    <span>{t('search.createProfile')}</span>
                  </button>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartChildSearch;
