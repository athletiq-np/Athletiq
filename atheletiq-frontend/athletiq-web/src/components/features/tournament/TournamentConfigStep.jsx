// src/components/features/tournament/TournamentConfigStep.jsx

// 🧠 ATHLETIQ - Tournament Configuration Step (Simplified)
// Modern, interactive sport configuration with essential settings

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Trophy, Settings, Target, Star, ChevronDown,
  ArrowRight, ArrowLeft, Hash, CheckCircle2
} from 'lucide-react';

const TournamentConfigStep = ({ form, updateForm, nextStep, prevStep }) => {
  const [expandedSports, setExpandedSports] = useState(new Set([0]));

  const updateSportConfig = (index, field, value) => {
    const updatedSports = [...form.sports_config];
    updatedSports[index] = { ...updatedSports[index], [field]: value };
    updateForm({ sports_config: updatedSports });
  };

  const toggleSportExpansion = (index) => {
    const newExpanded = new Set(expandedSports);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSports(newExpanded);
  };

  const SportConfigCard = ({ sport, index, isExpanded, onToggle }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden"
    >
      {/* Sport Header */}
      <div 
        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => onToggle(index)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-3xl">{sport.icon}</div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{sport.name}</h3>
              <p className="text-gray-600">{sport.type} Sport</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {sport.num_participating_teams && sport.tournament_type && (
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Configured
              </div>
            )}
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {/* Sport Configuration */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-200"
          >
            <div className="p-6 space-y-6">
              {/* Configuration Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <Users className="w-4 h-4 inline mr-2" />
                    Number of Teams
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="64"
                    value={sport.num_participating_teams || ''}
                    onChange={(e) => updateSportConfig(index, 'num_participating_teams', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number of teams"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <Trophy className="w-4 h-4 inline mr-2" />
                    Tournament Format
                  </label>
                  <select
                    value={sport.tournament_type || ''}
                    onChange={(e) => updateSportConfig(index, 'tournament_type', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select format</option>
                    <option value="knockout">Knockout</option>
                    <option value="league">League</option>
                    <option value="round-robin">Round Robin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <Star className="w-4 h-4 inline mr-2" />
                    Gender Category
                  </label>
                  <select
                    value={sport.gender || ''}
                    onChange={(e) => updateSportConfig(index, 'gender', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <Hash className="w-4 h-4 inline mr-2" />
                    Age Group
                  </label>
                  <select
                    value={sport.age_group || ''}
                    onChange={(e) => updateSportConfig(index, 'age_group', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select age group</option>
                    <option value="Under 12">Under 12</option>
                    <option value="Under 15">Under 15</option>
                    <option value="Under 18">Under 18</option>
                    <option value="Under 21">Under 21</option>
                    <option value="Open">Open</option>
                    <option value="Masters">Masters</option>
                  </select>
                </div>
              </div>

              {/* Configuration Summary */}
              {sport.num_participating_teams && sport.tournament_type && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200"
                >
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Configuration Summary</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>• {sport.num_participating_teams} teams participating</div>
                    <div>• {sport.tournament_type} format</div>
                    {sport.gender && <div>• {sport.gender} category</div>}
                    {sport.age_group && <div>• {sport.age_group} age group</div>}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto p-6"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="relative inline-block mb-4"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-lg opacity-20 animate-pulse"></div>
          <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-full">
            <Settings className="w-8 h-8 text-white" />
          </div>
        </motion.div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          Configure Tournament Sports
        </h2>
        <p className="text-gray-600 text-lg">Set up each sport with essential tournament details</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Step 3 of 4 - Sport Configuration</span>
          </div>
        </div>

        <div className="p-6">
          {form.sports_config && form.sports_config.length > 0 ? (
            <div className="space-y-6">
              {form.sports_config.map((sport, index) => (
                <SportConfigCard
                  key={sport.id}
                  sport={sport}
                  index={index}
                  isExpanded={expandedSports.has(index)}
                  onToggle={toggleSportExpansion}
                />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="text-gray-400 mb-4">
                <Settings className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sports Selected</h3>
              <p className="text-gray-600">Go back to the previous step to select sports for your tournament.</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <motion.button
          onClick={prevStep}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Previous
        </motion.button>

        <motion.button
          onClick={nextStep}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3"
        >
          Next: Review & Submit
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default TournamentConfigStep;
