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

  // Filter tournaments
  useEffect(() => {
    const filteredList = tournaments.filter((t) => {
      const matchesSearch = t.name.toLowerCase().includes(searchText.toLowerCase());
      const matchesSport = selectedSport ? t.sports?.includes(selectedSport) : true;
      return matchesSearch && matchesSport;
    });

    setFiltered(filteredList);
  }, [tournaments, searchText, selectedSport]);

  const allSports = Array.from(new Set(tournaments.flatMap((t) => t.sports || [])));

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

      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((tournament) => (
          <div
            key={tournament.id}
            onClick={() => setViewTournament(tournament)}
            className="bg-white shadow-md rounded-xl p-4 cursor-pointer hover:shadow-lg transition border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-athletiq-blue text-lg">{tournament.name}</h3>
              <span className="text-xs capitalize px-2 py-1 bg-athletiq-green text-white rounded">
                {tournament.status || "upcoming"}
              </span>
            </div>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>📍 Location:</strong> {tournament.location || "N/A"}</p>
              <p><strong>🏅 Sports:</strong> {tournament.sports?.join(", ")}</p>
              <p><strong>🗓 Start:</strong> {tournament.start_date ? 
                (tournament.start_date instanceof Date ? 
                  tournament.start_date.toISOString().slice(0, 10) : 
                  tournament.start_date.slice(0, 10)
                ) : "N/A"}</p>
              <p><strong>🏁 End:</strong> {tournament.end_date ? 
                (tournament.end_date instanceof Date ? 
                  tournament.end_date.toISOString().slice(0, 10) : 
                  tournament.end_date.slice(0, 10)
                ) : "N/A"}</p>
            </div>
          </div>
        ))}
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
