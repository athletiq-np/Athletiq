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
  Building, Globe, Hash, FileText, Upload, Image, X
} from 'lucide-react';

const TournamentInfoStep = ({ form, updateForm, nextStep, currentUser }) => {
  const [errors, setErrors] = useState({});
  const [isValidating, setIsValidating] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(false);

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

  // Set current user as organizer by default
  useEffect(() => {
    const userToSet = currentUser || { id: 1, name: 'Test User', email: 'test@example.com' };
    if (userToSet && !form.organizer_id) {
      updateForm({ 
        organizer_id: userToSet.id,
        organizer_name: userToSet.name || `${userToSet.first_name || ''} ${userToSet.last_name || ''}`.trim() || userToSet.email
      });
    }
  }, [currentUser, form.organizer_id]);

  // Load schools for SuperAdmin
  useEffect(() => {
    if (currentUser?.role === 'super_admin') {
      fetchSchools();
    }
  }, [currentUser]);

  const fetchSchools = async () => {
    try {
      setLoadingSchools(true);
      // This would need to be implemented based on your schools API
      // const response = await fetch('/api/schools');
      // const data = await response.json();
      // setSchools(data);
      setSchools([]); // Placeholder for now
    } catch (error) {
      console.error('Failed to fetch schools:', error);
    } finally {
      setLoadingSchools(false);
    }
  };

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

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors({
          ...errors,
          logo: 'Please select a valid image file'
        });
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({
          ...errors,
          logo: 'Image must be smaller than 5MB'
        });
        return;
      }

      updateForm({ logo: file });
      // Clear any previous logo errors
      if (errors.logo) {
        setErrors({
          ...errors,
          logo: null
        });
      }
    }
  };

  const handleOrganizerChange = (selectedId) => {
    const userToSet = currentUser || { id: 1, name: 'Test User', email: 'test@example.com' };
    if (selectedId === userToSet?.id) {
      // Set current user as organizer
      updateForm({ 
        organizer_id: userToSet.id,
        organizer_name: userToSet.name || `${userToSet.first_name || ''} ${userToSet.last_name || ''}`.trim() || userToSet.email
      });
    } else {
      // Find the selected school
      const selectedSchool = schools.find(school => school.id === selectedId);
      if (selectedSchool) {
        updateForm({ 
          organizer_id: selectedSchool.id,
          organizer_name: selectedSchool.name
        });
      }
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

          {/* Organizer Selection (SuperAdmin only) */}
          {currentUser?.role === 'super_admin' && (
            <motion.div variants={inputVariants} className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <Building className="w-4 h-4 inline mr-2" />
                Tournament Organizer
              </label>
              <select
                value={form.organizer_id || ''}
                onChange={(e) => handleOrganizerChange(e.target.value)}
                className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
              >
                <option value={(currentUser || { id: 1 }).id}>Myself (SuperAdmin)</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500">
                Select who will organize this tournament. Leave as "Myself" if you want to organize it directly.
              </p>
            </motion.div>
          )}

          {/* Tournament Organizer (display only for non-SuperAdmin) */}
          {currentUser?.role !== 'super_admin' && (
            <motion.div variants={inputVariants} className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <Building className="w-4 h-4 inline mr-2" />
                Tournament Organizer
              </label>
              <div className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {currentUser?.name?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {currentUser?.name || currentUser?.email || 'Current User'}
                    </p>
                    <p className="text-sm text-gray-600">Tournament Organizer</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

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

          {/* Logo Upload */}
          <motion.div variants={inputVariants} className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <Image className="w-4 h-4 inline mr-2" />
              Tournament Logo
            </label>
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="logo-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
              </div>
              
              {/* Logo Preview */}
              {form.logo && form.logo instanceof File && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative"
                >
                  <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <img
                      src={URL.createObjectURL(form.logo)}
                      alt="Logo Preview"
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-green-800">{form.logo.name}</p>
                      <p className="text-sm text-green-600">
                        {(form.logo.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateForm({ logo: null })}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
              
              {/* Logo Error */}
              <AnimatePresence>
                {errors.logo && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-red-600 text-sm flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {errors.logo}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
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
