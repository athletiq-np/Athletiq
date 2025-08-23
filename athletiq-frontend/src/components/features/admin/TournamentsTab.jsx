// src/components/AdminDashboard/TournamentsTab.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaPlus, FaTrophy, FaCalendarPlus, FaCog, FaEye } from "react-icons/fa";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-athletiq-navy flex items-center gap-2">
          <FaTrophy className="text-yellow-500" />
          Tournaments
        </h2>

        <div className="flex gap-3 flex-wrap items-center">
          {/* Modern Create Tournament Button */}
          <motion.button
            onClick={() => setActiveView('create')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 
                     text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <FaPlus className="w-4 h-4" />
            Create Tournament
          </motion.button>
          
          <input
            type="text"
            placeholder="Search by name..."
            className="border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <select
            className="border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
          >
            <option value="">All Sports</option>
            {allSports.map((sport) => (
              <option key={sport} value={sport}>{sport}</option>
            ))}
          </select>
          <span className="text-sm text-gray-500 self-center">{filtered.length} shown</span>
        </div>
      </div>

      {/* Tournaments Table */}
      <div className="overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/20">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tournament</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sport</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.length > 0 ? (
                filtered.map((tournament) => (
                  <tr 
                    key={tournament.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                    onClick={() => setViewTournament(tournament)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {tournament.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {tournament.code || 'No code'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {new Date(tournament.start_date).toLocaleDateString()}
                      {tournament.end_date && ` - ${new Date(tournament.end_date).toLocaleDateString()}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {tournament.location || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {tournament.sport || 'Multiple'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          tournament.status === 'completed' 
                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' 
                            : tournament.status === 'ongoing'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        }`}
                      >
                        {tournament.status || 'upcoming'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewTournament(tournament);
                          }}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="View details"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FaTrophy className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                      <p>No tournaments found matching your search</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      <ViewTournamentModal
        open={!!viewTournament}
        tournament={viewTournament}
        onClose={() => setViewTournament(null)}
      />
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
