// src/components/tournament/management/TournamentCreation.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, FaArrowLeft, FaArrowRight, FaCheck, FaPlus, FaTrash,
  FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaTrophy, FaFlag, FaEdit
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiClient from '@api/apiClient';

const TournamentCreation = ({ onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    level: '',
    hosted_by: '',
    code: '',
    sports_config: [],
    max_teams: 16,
    registration_deadline: '',
    entry_fee: 0,
    prize_pool: 0,
    rules: '',
    contact_email: '',
    contact_phone: '',
    public: true,
    allow_registration: true
  });

  const [loading, setLoading] = useState(false);

  const steps = [
    {
      id: 'basic',
      title: 'Basic Information',
      description: 'Tournament name, description, and basic details',
      icon: FaEdit
    },
    {
      id: 'schedule',
      title: 'Schedule & Location',
      description: 'Dates, times, and venue information',
      icon: FaCalendarAlt
    },
    {
      id: 'sports',
      title: 'Sports & Categories',
      description: 'Configure sports, categories, and formats',
      icon: FaTrophy
    },
    {
      id: 'settings',
      title: 'Settings & Rules',
      description: 'Additional settings and tournament rules',
      icon: FaFlag
    },
    {
      id: 'review',
      title: 'Review & Create',
      description: 'Review all information and create tournament',
      icon: FaCheck
    }
  ];

  const levelOptions = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'professional', label: 'Professional' },
    { value: 'mixed', label: 'Mixed Levels' }
  ];

  const sportsOptions = [
    { value: 'football', label: 'Football', icon: '⚽' },
    { value: 'basketball', label: 'Basketball', icon: '🏀' },
    { value: 'volleyball', label: 'Volleyball', icon: '🏐' },
    { value: 'tennis', label: 'Tennis', icon: '🎾' },
    { value: 'badminton', label: 'Badminton', icon: '🏸' },
    { value: 'cricket', label: 'Cricket', icon: '🏏' },
    { value: 'rugby', label: 'Rugby', icon: '🏉' },
    { value: 'swimming', label: 'Swimming', icon: '🏊' },
    { value: 'athletics', label: 'Athletics', icon: '🏃' },
    { value: 'other', label: 'Other', icon: '🏆' }
  ];

  const formatOptions = [
    { value: 'knockout', label: 'Knockout/Single Elimination' },
    { value: 'double_elimination', label: 'Double Elimination' },
    { value: 'round_robin', label: 'Round Robin' },
    { value: 'group_knockout', label: 'Group Stage + Knockout' },
    { value: 'custom_heats', label: 'Custom Heats/Time Trials' }
  ];

  const categoryOptions = [
    { value: 'junior', label: 'Junior (Under 16)' },
    { value: 'senior', label: 'Senior (16-18)' },
    { value: 'open', label: 'Open' },
    { value: 'staff', label: 'Staff' }
  ];

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'mixed', label: 'Mixed' },
    { value: 'open', label: 'Open' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addSport = () => {
    setFormData(prev => ({
      ...prev,
      sports_config: [
        ...prev.sports_config,
        {
          id: Date.now(),
          sport: '',
          category: '',
          gender: '',
          format: 'knockout',
          max_teams: 16,
          description: ''
        }
      ]
    }));
  };

  const removeSport = (index) => {
    setFormData(prev => ({
      ...prev,
      sports_config: prev.sports_config.filter((_, i) => i !== index)
    }));
  };

  const updateSport = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      sports_config: prev.sports_config.map((sport, i) =>
        i === index ? { ...sport, [field]: value } : sport
      )
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 0: // Basic Info
        return formData.name && formData.description && formData.level;
      case 1: // Schedule
        return formData.start_date && formData.end_date && formData.location;
      case 2: // Sports
        return formData.sports_config.length > 0 && 
               formData.sports_config.every(sport => sport.sport && sport.category && sport.gender);
      case 3: // Settings
        return formData.contact_email;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/tournaments', {
        ...formData,
        code: formData.code || Math.random().toString(36).substr(2, 8).toUpperCase()
      });
      
      if (response.data.success) {
        toast.success('Tournament created successfully!');
        onSuccess(response.data.data);
        onClose();
      } else {
        toast.error(response.data.message || 'Failed to create tournament');
      }
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast.error('Failed to create tournament. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const BasicInfoStep = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tournament Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter tournament name"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Describe your tournament"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Level *
          </label>
          <select
            value={formData.level}
            onChange={(e) => handleInputChange('level', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select level</option>
            {levelOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hosted By
          </label>
          <input
            type="text"
            value={formData.hosted_by}
            onChange={(e) => handleInputChange('hosted_by', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Organization name"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tournament Code
        </label>
        <input
          type="text"
          value={formData.code}
          onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Auto-generated if left empty"
        />
        <p className="text-sm text-gray-500 mt-1">
          Participants will use this code to join the tournament
        </p>
      </div>
    </div>
  );

  const ScheduleStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date *
          </label>
          <input
            type="date"
            value={formData.start_date}
            onChange={(e) => handleInputChange('start_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date *
          </label>
          <input
            type="date"
            value={formData.end_date}
            onChange={(e) => handleInputChange('end_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location *
        </label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => handleInputChange('location', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Tournament venue"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Registration Deadline
        </label>
        <input
          type="date"
          value={formData.registration_deadline}
          onChange={(e) => handleInputChange('registration_deadline', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Entry Fee ($)
          </label>
          <input
            type="number"
            value={formData.entry_fee}
            onChange={(e) => handleInputChange('entry_fee', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0"
            step="0.01"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prize Pool ($)
          </label>
          <input
            type="number"
            value={formData.prize_pool}
            onChange={(e) => handleInputChange('prize_pool', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0"
            step="0.01"
          />
        </div>
      </div>
    </div>
  );

  const SportsStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Sports Configuration</h3>
        <button
          onClick={addSport}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <FaPlus className="w-4 h-4" />
          Add Sport
        </button>
      </div>
      
      {formData.sports_config.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <FaTrophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No sports added yet. Click "Add Sport" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {formData.sports_config.map((sport, index) => (
            <div key={sport.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Sport {index + 1}</h4>
                <button
                  onClick={() => removeSport(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <FaTrash className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sport *
                  </label>
                  <select
                    value={sport.sport}
                    onChange={(e) => updateSport(index, 'sport', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select sport</option>
                    {sportsOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.icon} {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={sport.category}
                    onChange={(e) => updateSport(index, 'category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    {categoryOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    value={sport.gender}
                    onChange={(e) => updateSport(index, 'gender', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select gender</option>
                    {genderOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Format
                  </label>
                  <select
                    value={sport.format}
                    onChange={(e) => updateSport(index, 'format', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {formatOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Teams
                  </label>
                  <input
                    type="number"
                    value={sport.max_teams}
                    onChange={(e) => updateSport(index, 'max_teams', parseInt(e.target.value) || 16)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="2"
                    max="64"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={sport.description}
                    onChange={(e) => updateSport(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Optional description"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const SettingsStep = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contact Email *
        </label>
        <input
          type="email"
          value={formData.contact_email}
          onChange={(e) => handleInputChange('contact_email', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="contact@example.com"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contact Phone
        </label>
        <input
          type="tel"
          value={formData.contact_phone}
          onChange={(e) => handleInputChange('contact_phone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="+1 (555) 123-4567"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tournament Rules
        </label>
        <textarea
          value={formData.rules}
          onChange={(e) => handleInputChange('rules', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter tournament rules and regulations..."
        />
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="public"
            checked={formData.public}
            onChange={(e) => handleInputChange('public', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="public" className="ml-2 block text-sm text-gray-900">
            Make tournament public
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="allow_registration"
            checked={formData.allow_registration}
            onChange={(e) => handleInputChange('allow_registration', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="allow_registration" className="ml-2 block text-sm text-gray-900">
            Allow team registration
          </label>
        </div>
      </div>
    </div>
  );

  const ReviewStep = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tournament Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Tournament Name</p>
            <p className="font-medium">{formData.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Level</p>
            <p className="font-medium">{formData.level}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Start Date</p>
            <p className="font-medium">{new Date(formData.start_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">End Date</p>
            <p className="font-medium">{new Date(formData.end_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Location</p>
            <p className="font-medium">{formData.location}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Sports</p>
            <p className="font-medium">{formData.sports_config.length} configured</p>
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-gray-600">Description</p>
          <p className="font-medium">{formData.description}</p>
        </div>
      </div>
      
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Sports Configuration</h4>
        <div className="space-y-2">
          {formData.sports_config.map((sport, index) => (
            <div key={sport.id} className="flex items-center justify-between">
              <span className="text-sm text-blue-800">
                {sportsOptions.find(s => s.value === sport.sport)?.label} - {sport.category} ({sport.gender})
              </span>
              <span className="text-sm text-blue-600">{sport.format}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return <BasicInfoStep />;
      case 1: return <ScheduleStep />;
      case 2: return <SportsStep />;
      case 3: return <SettingsStep />;
      case 4: return <ReviewStep />;
      default: return <BasicInfoStep />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Create Tournament</h2>
              <p className="text-blue-100">Step {currentStep + 1} of {steps.length}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200"
            >
              <FaTimes className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-200 h-2">
          <div 
            className="bg-blue-600 h-2 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {steps[currentStep].title}
            </h3>
            <p className="text-gray-600">{steps[currentStep].description}</p>
          </div>
          
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 flex items-center justify-between border-t">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaArrowLeft className="w-4 h-4" />
            Previous
          </button>
          
          <div className="flex items-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index === currentStep ? 'bg-blue-600' : 
                  index < currentStep ? 'bg-green-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          {currentStep < steps.length - 1 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Next
              <FaArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Creating...
                </>
              ) : (
                <>
                  <FaCheck className="w-4 h-4" />
                  Create Tournament
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TournamentCreation;
