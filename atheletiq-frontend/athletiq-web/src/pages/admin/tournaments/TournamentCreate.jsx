// src/pages/admin/tournaments/TournamentCreate.jsx

// 🧠 ATHLETIQ - Create Tournament Page (Modern UX Version)
// Multi-step tournament creation wizard with enhanced navigation and modern design

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Check, Trophy, Users, Settings, 
  FileText, Calendar, MapPin, Save, AlertCircle, Info, Star
} from "lucide-react";
import axios from "axios";

// Import the step components
import TournamentInfoStep from "../../../components/features/tournament/TournamentInfoStep";
import TournamentSportsStep from "../../../components/features/tournament/TournamentSportsStep";
import TournamentConfigStep from "../../../components/features/tournament/TournamentConfigStep";
import TournamentReviewStep from "../../../components/features/tournament/TournamentReviewStep";
import TournamentTemplateSelector from "../../../components/features/tournament/TournamentTemplateSelector";

// Import hooks and utilities
import { useToast } from "../../../components/common/ErrorHandling";
import { useAutoSave } from "../../../hooks/usePerformance";

// Step configuration
const STEPS = [
  { 
    id: 'info', 
    title: 'Tournament Info', 
    icon: FileText, 
    description: 'Basic tournament information' 
  },
  { 
    id: 'sports', 
    title: 'Sports & Format', 
    icon: Trophy, 
    description: 'Select sports and formats' 
  },
  { 
    id: 'config', 
    title: 'Configure & Fixtures', 
    icon: Settings, 
    description: 'Configure tournament settings' 
  },
  { 
    id: 'review', 
    title: 'Review & Create', 
    icon: Check, 
    description: 'Review and submit tournament' 
  }
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

const stepVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4 }
  },
  exit: {
    opacity: 0,
    x: -50,
    transition: { duration: 0.3 }
  }
};

// Step Progress Component
function StepProgress({ currentStep, steps, onStepClick }) {
  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isAccessible = index <= currentStep;
          
          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex items-center">
                <button
                  onClick={() => isAccessible && onStepClick(index)}
                  disabled={!isAccessible}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                    transition-all duration-200 ${
                      isCompleted 
                        ? 'bg-green-500 text-white' 
                        : isActive 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-500'
                    } ${isAccessible ? 'hover:scale-105 cursor-pointer' : 'cursor-not-allowed'}
                  `}
                >
                  {isCompleted ? (
                    <Check size={16} />
                  ) : (
                    <step.icon size={16} />
                  )}
                </button>
                
                {/* Step Info */}
                <div className="ml-3">
                  <div className={`font-semibold text-sm ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {step.description}
                  </div>
                </div>
              </div>
              
              {/* Progress Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div className="h-0.5 bg-gray-200 relative">
                    <div 
                      className={`absolute top-0 left-0 h-full transition-all duration-300 ${
                        index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                      style={{ 
                        width: index < currentStep ? '100%' : '0%' 
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Auto-save indicator
function AutoSaveIndicator({ isVisible, status }) {
  if (!isVisible) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-center gap-2 text-sm ${
        status === 'saving' ? 'text-blue-600' : 'text-green-600'
      }`}
    >
      <Save size={14} />
      {status === 'saving' ? 'Saving...' : 'Saved'}
    </motion.div>
  );
}

// Main Component
export default function TournamentCreate() {
  const [showTemplateSelector, setShowTemplateSelector] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    description: "",
    logo_url: "",
    level: "",
    hosted_by: "",
    start_date: "",
    end_date: "",
    location: "",
    sports_config: [],
    code: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoSave, setAutoSave] = useState({ visible: false, status: 'saved' });
  
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const { success, error: toastError } = useToast();

  // Auto-save functionality with performance hook
  const { lastSaved, isSaving } = useAutoSave(
    form,
    async (data) => {
      localStorage.setItem('tournament_draft', JSON.stringify(data));
      return Promise.resolve();
    },
    3000
  );

  // Handle template selection
  const handleTemplateSelect = (templateData) => {
    setForm(prevForm => ({
      ...prevForm,
      ...templateData
    }));
    setShowTemplateSelector(false);
    success('Template applied successfully!');
  };

  const handleSkipTemplate = () => {
    setShowTemplateSelector(false);
  };

  // Auto-save functionality
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (currentStep > 0) { // Only auto-save after first step
        setAutoSave({ visible: true, status: 'saving' });
        // Simulate save to localStorage or API
        localStorage.setItem('tournament_draft', JSON.stringify(form));
        setTimeout(() => {
          setAutoSave({ visible: true, status: 'saved' });
          setTimeout(() => {
            setAutoSave({ visible: false, status: 'saved' });
          }, 2000);
        }, 1000);
      }
    }, 2000);

    return () => clearTimeout(saveTimeout);
  }, [form, currentStep]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('tournament_draft');
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        setForm(parsedDraft);
        setShowTemplateSelector(false);
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, []);

  // Form update function
  function updateForm(update) {
    setForm(prev => ({ ...prev, ...update }));
  }

  // Step navigation
  function nextStep() {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }

  function goToStep(stepIndex) {
    if (stepIndex >= 0 && stepIndex <= currentStep + 1) {
      setCurrentStep(stepIndex);
    }
  }

  // Form validation for each step
  const isStepValid = (stepIndex) => {
    switch (stepIndex) {
      case 0: // Info step
        return !!form.name && !!form.description;
      case 1: // Sports step
        return form.sports_config && form.sports_config.length > 0;
      case 2: // Config step
        return form.sports_config && form.sports_config.every(sport => 
          sport.format && sport.tournament_type
        );
      case 3: // Review step
        return isStepValid(0) && isStepValid(1) && isStepValid(2);
      default:
        return true;
    }
  };

  // Handle tournament creation
  async function handleSubmit() {
    if (isLoading) return;

    setIsLoading(true);
    setError("");

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (!form.name) {
        setError("Tournament Name is required.");
        setIsLoading(false);
        return;
      }

      const response = await axios.post("http://localhost:5000/api/tournaments", form, config);
      const newTournamentId = response.data.id;
      
      // Clear draft
      localStorage.removeItem('tournament_draft');
      
      navigate(`/admin/tournaments/${newTournamentId}/setup`);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      console.error("Failed to create tournament:", err);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle completion
  function handleComplete(tournament) {
    localStorage.removeItem('tournament_draft');
    navigate(`/admin/tournaments/${tournament.id}`);
  }

  return (
    <motion.div
      className="min-h-screen bg-gray-50 py-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Template Selector */}
        {showTemplateSelector && (
          <TournamentTemplateSelector
            onTemplateSelect={handleTemplateSelect}
            onSkip={handleSkipTemplate}
          />
        )}

        {/* Main Tournament Creation Flow */}
        {!showTemplateSelector && (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <motion.h1
                className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Trophy className="text-yellow-500" />
                Create New Tournament
              </motion.h1>
              <p className="text-gray-600 text-lg">
                Set up your tournament step by step
              </p>
              
              {/* Auto-save indicator */}
              <div className="mt-4 flex justify-center">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {isSaving ? (
                    <>
                      <Save size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : lastSaved ? (
                    <>
                      <Check size={14} className="text-green-600" />
                      Saved {lastSaved.toLocaleTimeString()}
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Step Progress */}
            <StepProgress
              currentStep={currentStep}
              steps={STEPS}
              onStepClick={goToStep}
            />

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step Content */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 mb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {currentStep === 0 && (
                <TournamentInfoStep 
                  form={form} 
                  updateForm={updateForm} 
                  nextStep={nextStep}
                />
              )}
              {currentStep === 1 && (
                <TournamentSportsStep 
                  form={form} 
                  updateForm={updateForm} 
                  nextStep={nextStep}
                  prevStep={prevStep}
                />
              )}
              {currentStep === 2 && (
                <TournamentConfigStep 
                  form={form} 
                  updateForm={updateForm} 
                  nextStep={nextStep}
                  prevStep={prevStep}
                />
              )}
              {currentStep === 3 && (
                <TournamentReviewStep 
                  form={form} 
                  onComplete={handleComplete}
                  prevStep={prevStep}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Footer */}
        <div className="flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-600 rounded-lg
                     hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed 
                     transition-colors duration-200"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Step {currentStep + 1} of {STEPS.length}</span>
            <div className="flex gap-1">
              {STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                    index === currentStep ? 'bg-blue-500' : 
                    index < currentStep ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          
          <button
            onClick={nextStep}
            disabled={currentStep === STEPS.length - 1 || !isStepValid(currentStep)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg
                     hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed 
                     transition-colors duration-200"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
