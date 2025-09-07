// src/components/AdminDashboard/TournamentsTab.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaPlus, FaTrophy, FaCalendarPlus, FaCog, FaEye, FaSearch, FaSpinner, FaEdit, FaTrash } from "react-icons/fa";
import ViewTournamentModal from "@features/tournament/ViewTournamentModal";

// Import tournament creation step components
import TournamentInfoStep from '../tournament/TournamentInfoStep';
import TournamentSportsStep from '../tournament/TournamentSportsStep';
import TournamentConfigStep from '../tournament/TournamentConfigStep';
import TournamentReviewStep from '../tournament/TournamentReviewStep';

export default function TournamentsTab({ tournaments = [], refetchData }) {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [selectedSport, setSelectedSport] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [viewTournament, setViewTournament] = useState(null);
  
  // Tournament creation state
  const [activeView, setActiveView] = useState('list'); // 'list' | 'create'
  const [createStep, setCreateStep] = useState(0);
  const [tournamentForm, setTournamentForm] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    level: '',
    hosted_by: '',
    code: '',
    sports_config: []
  });

  // Tournament creation steps
  const CREATE_STEPS = [
    { id: 'info', title: 'Tournament Info', description: 'Basic tournament information' },
    { id: 'sports', title: 'Sports & Format', description: 'Select sports and formats' },
    { id: 'config', title: 'Configure & Fixtures', description: 'Configure tournament settings' },
    { id: 'review', title: 'Review & Create', description: 'Review and submit tournament' }
  ];

  // Extract unique sports from tournaments
  const allSports = React.useMemo(() => {
    const sports = new Set();
    tournaments.forEach(t => {
      if (Array.isArray(t.sports)) {
        t.sports.forEach(sport => sports.add(sport));
      } else if (t.sport) {
        sports.add(t.sport);
      }
    });
    return Array.from(sports);
  }, [tournaments]);

  // Filter tournaments
  useEffect(() => {
    const filteredList = tournaments.filter((t) => {
      const matchesSearch = t.name?.toLowerCase().includes(searchText.toLowerCase()) || false;
      
      let matchesSport = true;
      if (selectedSport) {
        if (Array.isArray(t.sports)) {
          matchesSport = t.sports.includes(selectedSport);
        } else if (t.sport) {
          matchesSport = t.sport === selectedSport;
        } else {
          matchesSport = false;
        }
      }
      
      return matchesSearch && matchesSport;
    });

    setFiltered(filteredList);
  }, [tournaments, searchText, selectedSport]);

  // Tournament creation handlers
  const handleTournamentCreated = (newTournament) => {
    setActiveView('list');
    setCreateStep(0);
    setTournamentForm({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      location: '',
      level: '',
      hosted_by: '',
      code: '',
      sports_config: []
    });
    if (refetchData) {
      refetchData();
    }
  };

  const handleFormUpdate = (updates) => {
    if (typeof updates === 'function') {
      setTournamentForm(updates);
    } else {
      setTournamentForm(prev => ({
        ...prev,
        ...updates
      }));
    }
  };

  // Render tournament creation workflow
  if (activeView === 'create') {
    return (
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveView('list')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ← Back to Tournaments
            </button>
            <h2 className="text-2xl font-bold text-athletiq-navy flex items-center gap-2">
              <FaCalendarPlus className="text-blue-500" />
              Create Tournament
            </h2>
          </div>
          <span className="text-sm text-gray-500">
            Step {createStep + 1} of {CREATE_STEPS.length}
          </span>
        </div>

        <AdminTournamentCreateTab
          step={createStep}
          form={tournamentForm}
          steps={CREATE_STEPS}
          onNext={() => setCreateStep(prev => Math.min(prev + 1, CREATE_STEPS.length - 1))}
          onBack={() => setCreateStep(prev => Math.max(prev - 1, 0))}
          onFormUpdate={handleFormUpdate}
          onComplete={handleTournamentCreated}
        />
      </div>
    );
  }

  return (
    <div className="tournaments-tab">
      <div>
        <div className="space-y-6">
          {/* Enhanced Header with Modern Styling */}
          <div className="relative">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-2xl"></div>

            <div className="relative p-8">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                      <FaTrophy className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Tournament Management</h2>
                      <p className="text-gray-600 dark:text-gray-300 mt-1">Organize and manage competitive events</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-white/20 dark:border-gray-700/30">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {tournaments.length}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-300 ml-2">
                        {tournaments.length === 1 ? 'Tournament' : 'Tournaments'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveView('create')}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <FaPlus className="w-4 h-4" />
                    Create Tournament
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Search and Filter Section */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {/* Search */}
              <div className="lg:col-span-2 relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tournaments..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/90 dark:bg-gray-700/90 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 transition-all duration-200 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white"
                />
              </div>

              {/* Sport Filter */}
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="px-4 py-3 bg-white/90 dark:bg-gray-700/90 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white"
              >
                <option value="">All Sports</option>
                {allSports.map((sport) => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>

              {/* Results count */}
              <div className="flex items-center justify-center px-4 py-3 bg-gray-50/80 dark:bg-gray-700/50 rounded-xl lg:col-span-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {filtered.length} of {tournaments.length}
                </span>
              </div>
            </div>
          </div>

          {/* Enhanced Table */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-700/30">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Tournament</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Location</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Sport</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                  {filtered.length > 0 ? (
                    filtered.map((tournament, index) => (
                      <motion.tr
                        key={tournament.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-all duration-200"
                        onClick={() => setViewTournament(tournament)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
                                <FaTrophy className="w-5 h-5 text-white" />
                              </div>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white">{tournament.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{tournament.code || 'No code'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-700 dark:text-gray-300">{new Date(tournament.start_date).toLocaleDateString()}</div>
                            {tournament.end_date && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">to {new Date(tournament.end_date).toLocaleDateString()}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {tournament.location || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            {tournament.sport || 'Multiple'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span 
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              tournament.status === 'completed' 
                                ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' 
                                : tournament.status === 'ongoing'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            }`}
                          >
                            {tournament.status || 'upcoming'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewTournament(tournament);
                              }}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200 group"
                              title="View Tournament"
                            >
                              <FaEye className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                // Add edit functionality here
                              }}
                              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-all duration-200 group"
                              title="Edit Tournament"
                            >
                              <FaEdit className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                // Add delete functionality here
                              }}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200 group"
                              title="Delete Tournament"
                            >
                              <FaTrash className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-16">
                        <div className="text-center">
                          <FaTrophy className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No tournaments found</h3>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try adjusting your search criteria or create a new tournament</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
            
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveView('create')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <FaPlus className="w-4 h-4" />
            Create Tournament
          </motion.button>
        </div>
      </div>

      {/* View Modal */}
      {viewTournament && (
        <ViewTournamentModal
          open={true}
          tournament={viewTournament}
          onClose={() => setViewTournament(null)}
        />
      )}
    </div>
  );
}

// Admin Tournament Create Tab Component
function AdminTournamentCreateTab({ step, form, steps, onNext, onBack, onFormUpdate, onComplete }) {
  // Step navigation handlers
  const handleNext = () => {
    if (step < steps.length - 1) {
      onNext();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      onBack();
    }
  };

  const handleFormChange = (updates) => {
    onFormUpdate(prev => ({
      ...prev,
      ...updates
    }));
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Admin Tournament Creation</h3>
          <div className="text-sm text-gray-500 bg-blue-50 px-3 py-1 rounded-full">
            Step {step + 1} of {steps.length}
          </div>
        </div>
        
        {/* Enhanced Step Progress Bar */}
        <div className="flex items-center space-x-4 mb-6">
          {steps.map((stepInfo, index) => (
            <div key={stepInfo.id} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                index < step ? 'bg-green-500 text-white shadow-lg' :
                index === step ? 'bg-blue-500 text-white shadow-lg ring-4 ring-blue-200' :
                'bg-gray-200 text-gray-500'
              }`}>
                {index < step ? '✓' : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-2 mx-3 rounded-full transition-all duration-300 ${
                  index < step ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <h4 className="font-semibold text-gray-900">{steps[step].title}</h4>
          <p className="text-sm text-gray-600">{steps[step].description}</p>
        </div>
      </div>

      {/* Enhanced Step Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-lg">
        {step === 0 && (
          <TournamentInfoStep
            form={form}
            updateForm={handleFormChange}
            nextStep={handleNext}
          />
        )}
        
        {step === 1 && (
          <TournamentSportsStep
            form={form}
            updateForm={handleFormChange}
            nextStep={handleNext}
            prevStep={handleBack}
          />
        )}
        
        {step === 2 && (
          <TournamentConfigStep
            form={form}
            updateForm={handleFormChange}
            nextStep={handleNext}
            prevStep={handleBack}
          />
        )}
        
        {step === 3 && (
          <TournamentReviewStep
            form={form}
            prevStep={handleBack}
            onComplete={onComplete}
          />
        )}
      </div>
    </div>
  );
}
