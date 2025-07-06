//
// 🧠 ATHLETIQ - Tournament Info Step Component (Enhanced Version)
//
// Modern, UX-friendly tournament information collection with validation,
// auto-suggestions, and smooth animations
//

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, MapPin, Trophy, Users, Info, CheckCircle2, 
  Clock, Star, Sparkles, AlertCircle, ArrowRight,
  Building, Globe, Hash, FileText
} from 'lucide-react';

const TournamentInfoStep = ({ form, updateForm, nextStep }) => {
  const [errors, setErrors] = useState({});
  const [isValidating, setIsValidating] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  // Auto-generate tournament code based on name
  useEffect(() => {
    if (form.name) {
      const code = form.name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 6) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      
      if (!form.tournament_code) {
        updateForm({ tournament_code: code });
      }
    }
  }, [form.name]);

  // Location suggestions for Nepal
  const locationSuggestions = [
    'Kathmandu', 'Pokhara', 'Chitwan', 'Lalitpur', 'Bhaktapur',
    'Biratnagar', 'Birgunj', 'Dharan', 'Butwal', 'Nepalgunj'
  ];

  const handleInputChange = (field, value) => {
    updateForm({ [field]: value });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: null
      });
    }

    // Show location suggestions
    if (field === 'location' && value.length > 0) {
      const filtered = locationSuggestions.filter(loc => 
        loc.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const validateAndNext = async () => {
    setIsValidating(true);
    const newErrors = {};
    
    if (!form.name?.trim()) {
      newErrors.name = 'Tournament name is required';
    } else if (form.name.length < 3) {
      newErrors.name = 'Tournament name must be at least 3 characters';
    }
    
    if (!form.description?.trim()) {
      newErrors.description = 'Tournament description is required';
    } else if (form.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    
    if (!form.location?.trim()) {
      newErrors.location = 'Tournament location is required';
    }
    
    if (!form.start_date) {
      newErrors.start_date = 'Start date is required';
    } else if (new Date(form.start_date) < new Date()) {
      newErrors.start_date = 'Start date cannot be in the past';
    }
    
    if (!form.end_date) {
      newErrors.end_date = 'End date is required';
    }
    
    if (form.start_date && form.end_date && new Date(form.start_date) > new Date(form.end_date)) {
      newErrors.end_date = 'End date must be after start date';
    }
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate validation
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsValidating(false);
      return;
    }
    
    setIsValidating(false);
    nextStep();
  };

  const inputVariants = {
    focus: { scale: 1.02, transition: { duration: 0.2 } },
    blur: { scale: 1, transition: { duration: 0.2 } }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6"
    >
      {/* Enhanced Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="relative inline-block mb-4"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-lg opacity-20 animate-pulse"></div>
          <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full">
            <Trophy className="w-8 h-8 text-white" />
          </div>
        </motion.div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Tournament Information
        </h2>
        <p className="text-gray-600 text-lg">Create something amazing - let's start with the basics</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Step 1 of 4 - Basic Information</span>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Tournament Name */}
          <motion.div variants={inputVariants} whileFocus="focus" className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <Trophy className="w-4 h-4 inline mr-2" />
              Tournament Name *
            </label>
            <div className="relative">
              <input
                type="text"
                value={form.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-6 py-4 text-lg border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                  errors.name ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                placeholder="Enter an exciting tournament name..."
              />
              {form.name && !errors.name && (
                <CheckCircle2 className="absolute right-4 top-4 w-6 h-6 text-green-500" />
              )}
            </div>
            <AnimatePresence>
              {errors.name && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-red-600 text-sm flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.name}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Hosted By */}
          <motion.div variants={inputVariants} className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <Building className="w-4 h-4 inline mr-2" />
              Organized By
            </label>
            <input
              type="text"
              value={form.hosted_by || ''}
              onChange={(e) => handleInputChange('hosted_by', e.target.value)}
              className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
              placeholder="Organization or school name..."
            />
          </motion.div>

          {/* Description */}
          <motion.div variants={inputVariants} className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <FileText className="w-4 h-4 inline mr-2" />
              Tournament Description *
            </label>
            <textarea
              value={form.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className={`w-full px-6 py-4 text-lg border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none ${
                errors.description ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              placeholder="Describe your tournament - what makes it special?"
            />
            <div className="flex justify-between items-center">
              <AnimatePresence>
                {errors.description && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-red-600 text-sm flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {errors.description}
                  </motion.p>
                )}
              </AnimatePresence>
              <span className="text-sm text-gray-500">
                {form.description?.length || 0} characters
              </span>
            </div>
          </motion.div>

          {/* Tournament Level */}
          <motion.div variants={inputVariants} className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <Star className="w-4 h-4 inline mr-2" />
              Tournament Level
            </label>
            <select
              value={form.level || ''}
              onChange={(e) => handleInputChange('level', e.target.value)}
              className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
            >
              <option value="">Select tournament level</option>
              <option value="School">School Level</option>
              <option value="District">District Level</option>
              <option value="Province">Province Level</option>
              <option value="National">National Level</option>
              <option value="International">International Level</option>
            </select>
          </motion.div>

          {/* Location with Suggestions */}
          <motion.div variants={inputVariants} className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <MapPin className="w-4 h-4 inline mr-2" />
              Tournament Location *
            </label>
            <div className="relative">
              <input
                type="text"
                value={form.location || ''}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className={`w-full px-6 py-4 text-lg border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                  errors.location ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                placeholder="Enter city or venue name..."
              />
              <Globe className="absolute right-4 top-4 w-5 h-5 text-gray-400" />
            </div>
            
            {/* Location Suggestions */}
            <AnimatePresence>
              {suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto"
                >
                  {suggestions.map((suggestion, index) => (
                    <motion.button
                      key={suggestion}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        handleInputChange('location', suggestion);
                        setSuggestions([]);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <MapPin className="w-4 h-4 inline mr-2 text-gray-400" />
                      {suggestion}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {errors.location && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-red-600 text-sm flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.location}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div variants={inputVariants} className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <Calendar className="w-4 h-4 inline mr-2" />
                Start Date *
              </label>
              <input
                type="date"
                value={form.start_date || ''}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-6 py-4 text-lg border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                  errors.start_date ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              />
              <AnimatePresence>
                {errors.start_date && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-red-600 text-sm flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {errors.start_date}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div variants={inputVariants} className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <Calendar className="w-4 h-4 inline mr-2" />
                End Date *
              </label>
              <input
                type="date"
                value={form.end_date || ''}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                min={form.start_date || new Date().toISOString().split('T')[0]}
                className={`w-full px-6 py-4 text-lg border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                  errors.end_date ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              />
              <AnimatePresence>
                {errors.end_date && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-red-600 text-sm flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {errors.end_date}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Tournament Duration Preview */}
          {form.start_date && form.end_date && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Tournament Duration</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {Math.ceil((new Date(form.end_date) - new Date(form.start_date)) / (1000 * 60 * 60 * 24)) + 1} days
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Logo URL */}
          <motion.div variants={inputVariants} className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <Sparkles className="w-4 h-4 inline mr-2" />
              Logo URL (Optional)
            </label>
            <input
              type="url"
              value={form.logo_url || ''}
              onChange={(e) => handleInputChange('logo_url', e.target.value)}
              className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
              placeholder="https://example.com/logo.png"
            />
          </motion.div>
        </div>

        {/* Enhanced Action Button */}
        <div className="bg-gray-50 p-6 border-t border-gray-100">
          <div className="flex justify-end">
            <motion.button
              onClick={validateAndNext}
              disabled={isValidating}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
            >
              {isValidating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Validating...
                </>
              ) : (
                <>
                  Next: Select Sports
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TournamentInfoStep;
