// src/components/tournament/bracket/components/BracketSettings.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCog, FaUsers, FaSort, FaRandom, FaSave, FaTimes,
  FaInfoCircle, FaToggleOn, FaToggleOff
} from 'react-icons/fa';
import { BRACKET_TYPES, BRACKET_TYPE_CONFIG } from '../BracketTypes';

const BracketSettings = ({ 
  isOpen, 
  onClose, 
  onSave, 
  bracketType, 
  settings = {},
  teams = [] 
}) => {
  const [formData, setFormData] = useState({
    bracketType: bracketType || BRACKET_TYPES.SINGLE_ELIMINATION,
    teamAssignmentMode: settings.teamAssignmentMode || 'random',
    seedingMethod: settings.seedingMethod || 'manual',
    allowThirdPlace: settings.allowThirdPlace || false,
    byeHandling: settings.byeHandling || 'auto',
    matchDuration: settings.matchDuration || 90,
    breakDuration: settings.breakDuration || 15,
    ...settings
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const BracketTypeOption = ({ type, config }) => (
    <div 
      className={`p-4 border rounded-lg cursor-pointer transition-all ${
        formData.bracketType === type 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => handleInputChange('bracketType', type)}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${
          formData.bracketType === type ? 'bg-blue-100' : 'bg-gray-100'
        }`}>
          <config.icon className={`w-5 h-5 ${
            formData.bracketType === type ? 'text-blue-600' : 'text-gray-600'
          }`} />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{config.name}</h3>
          <p className="text-sm text-gray-500">{config.description}</p>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FaCog className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Bracket Settings</h2>
              <p className="text-gray-600">Configure your tournament bracket</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Bracket Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Bracket Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(BRACKET_TYPE_CONFIG).map(([type, config]) => (
                <BracketTypeOption key={type} type={type} config={config} />
              ))}
            </div>
          </div>

          {/* Team Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Team Assignment
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  formData.teamAssignmentMode === 'random' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleInputChange('teamAssignmentMode', 'random')}
              >
                <div className="flex items-center space-x-3">
                  <FaRandom className="w-5 h-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium">Random Assignment</h4>
                    <p className="text-sm text-gray-500">Randomly assign teams to brackets</p>
                  </div>
                </div>
              </div>
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  formData.teamAssignmentMode === 'manual' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleInputChange('teamAssignmentMode', 'manual')}
              >
                <div className="flex items-center space-x-3">
                  <FaUsers className="w-5 h-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium">Manual Assignment</h4>
                    <p className="text-sm text-gray-500">Manually assign teams to positions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seeding Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Seeding Method
            </label>
            <select
              value={formData.seedingMethod}
              onChange={(e) => handleInputChange('seedingMethod', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="manual">Manual Seeding</option>
              <option value="random">Random Seeding</option>
              <option value="ranking">Based on Ranking</option>
              <option value="performance">Based on Performance</option>
            </select>
          </div>

          {/* Additional Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Third Place Match */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Third Place Match</h4>
                <p className="text-sm text-gray-500">Include a third place playoff</p>
              </div>
              <button
                type="button"
                onClick={() => handleInputChange('allowThirdPlace', !formData.allowThirdPlace)}
                className="ml-3"
              >
                {formData.allowThirdPlace ? (
                  <FaToggleOn className="w-8 h-8 text-blue-600" />
                ) : (
                  <FaToggleOff className="w-8 h-8 text-gray-400" />
                )}
              </button>
            </div>

            {/* Bye Handling */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bye Handling
              </label>
              <select
                value={formData.byeHandling}
                onChange={(e) => handleInputChange('byeHandling', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="auto">Automatic Distribution</option>
                <option value="top_seeds">Give to Top Seeds</option>
                <option value="bottom_seeds">Give to Bottom Seeds</option>
                <option value="random">Random Distribution</option>
              </select>
            </div>

            {/* Match Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Match Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.matchDuration}
                onChange={(e) => handleInputChange('matchDuration', parseInt(e.target.value))}
                min="1"
                max="180"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Break Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Break Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.breakDuration}
                onChange={(e) => handleInputChange('breakDuration', parseInt(e.target.value))}
                min="0"
                max="60"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FaInfoCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Tournament Information</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Teams: {teams.length} | 
                  Selected Format: {BRACKET_TYPE_CONFIG[formData.bracketType]?.name || 'Unknown'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <FaSave className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default BracketSettings;
