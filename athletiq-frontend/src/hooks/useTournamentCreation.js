// Enterprise Tournament Creation Hook
// Manages tournament creation state, validation, and API integration

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTournament, validateTournamentDates } from '../api/enterpriseTournamentApi';

// Tournament creation steps
const TOURNAMENT_STEPS = [
  { id: 'info', title: 'Tournament Information', required: ['name', 'sport', 'start_date'] },
  { id: 'sports', title: 'Sports & Format', required: ['tournament_type', 'format'] },
  { id: 'config', title: 'Configuration', required: ['max_teams'] },
  { id: 'review', title: 'Review & Create', required: [] }
];

// Default tournament data structure
const defaultTournamentData = {
  // Basic Information
  name: '',
  description: '',
  sport: '',
  tournament_code: '', // Auto-generated
  
  // Tournament Configuration
  tournament_type: 'knockout', // knockout, round-robin, group-stage
  format: 'single-elimination',
  max_teams: 8,
  min_teams: 4,
  
  // Dates and Location
  start_date: '',
  end_date: '',
  location: '',
  venue: '',
  
  // Additional Settings
  age_group: 'open',
  gender: 'mixed',
  category: 'regular',
  entry_fee: 0,
  prize_pool: 0,
  
  // System Settings
  status: 'draft',
  visibility: 'public',
  is_featured: false,
  
  // Media
  logo: null,
  logo_url: '',
  
  // Registration
  registration_start: '',
  registration_end: '',
  allow_late_registration: false,
  
  // Rules and Regulations
  rules: '',
  prizes: [],
  contacts: []
};

export const useTournamentCreation = (initialData = {}) => {
  const navigate = useNavigate();
  
  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [tournamentData, setTournamentData] = useState({
    ...defaultTournamentData,
    ...initialData
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  
  // Auto-save functionality
  useEffect(() => {
    if (autoSaveEnabled && Object.keys(tournamentData).length > 0) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem('tournament_draft', JSON.stringify(tournamentData));
        console.log('Tournament data auto-saved');
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [tournamentData, autoSaveEnabled]);
  
  // Load saved draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('tournament_draft');
    if (savedDraft && !initialData.id) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        setTournamentData(prev => ({ ...prev, ...parsedDraft }));
        console.log('Loaded tournament draft from localStorage');
      } catch (error) {
        console.error('Failed to load tournament draft:', error);
      }
    }
  }, [initialData.id]);
  
  // Validation function
  const validateCurrentStep = useCallback(() => {
    const currentStepConfig = TOURNAMENT_STEPS[currentStep];
    const stepErrors = {};
    
    // Check required fields for current step
    currentStepConfig.required.forEach(field => {
      if (!tournamentData[field] || tournamentData[field].toString().trim() === '') {
        stepErrors[field] = `${field.replace('_', ' ')} is required`;
      }
    });
    
    // Custom validations
    if (currentStep === 0) { // Info step
      if (tournamentData.start_date) {
        try {
          validateTournamentDates(tournamentData.start_date, tournamentData.end_date);
        } catch (error) {
          stepErrors.start_date = error.message;
        }
      }
      
      if (tournamentData.name && tournamentData.name.length < 3) {
        stepErrors.name = 'Tournament name must be at least 3 characters';
      }
    }
    
    if (currentStep === 2) { // Config step
      if (tournamentData.max_teams < tournamentData.min_teams) {
        stepErrors.max_teams = 'Maximum teams cannot be less than minimum teams';
      }
      
      if (tournamentData.entry_fee < 0) {
        stepErrors.entry_fee = 'Entry fee cannot be negative';
      }
    }
    
    setErrors(stepErrors);
    const valid = Object.keys(stepErrors).length === 0;
    setIsValid(valid);
    
    return valid;
  }, [currentStep, tournamentData]);
  
  // Run validation when step or data changes
  useEffect(() => {
    validateCurrentStep();
  }, [validateCurrentStep]);
  
  // Update tournament data
  const updateTournamentData = useCallback((updates) => {
    setTournamentData(prev => {
      const newData = { ...prev, ...updates };
      
      // Auto-generate tournament code if name changes
      if (updates.name && updates.name !== prev.name) {
        const codeBase = updates.name
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .toUpperCase()
          .substring(0, 8);
        newData.tournament_code = `${codeBase}-${Date.now().toString().slice(-4)}`;
      }
      
      return newData;
    });
  }, []);
  
  // Navigation functions
  const nextStep = useCallback(() => {
    if (validateCurrentStep() && currentStep < TOURNAMENT_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, validateCurrentStep]);
  
  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);
  
  const goToStep = useCallback((stepIndex) => {
    if (stepIndex >= 0 && stepIndex < TOURNAMENT_STEPS.length) {
      setCurrentStep(stepIndex);
    }
  }, []);
  
  // Submit tournament
  const submitTournament = useCallback(async () => {
    setIsLoading(true);
    setErrors({});
    
    try {
      // Final validation
      const allStepsValid = TOURNAMENT_STEPS.every((step, index) => {
        const tempCurrentStep = currentStep;
        setCurrentStep(index);
        const valid = validateCurrentStep();
        setCurrentStep(tempCurrentStep);
        return valid;
      });
      
      if (!allStepsValid) {
        throw new Error('Please fix all validation errors before submitting');
      }
      
      console.log('Submitting tournament:', tournamentData);
      
      // Create tournament via API
      const result = await createTournament(tournamentData);
      
      console.log('Tournament created successfully:', result);
      
      // Clear draft
      localStorage.removeItem('tournament_draft');
      
      // Navigate to tournament details or success page
      const tournamentId = result.data?.id || result.id;
      if (tournamentId) {
        navigate(`/admin/tournaments/${tournamentId}`, {
          state: { message: 'Tournament created successfully!' }
        });
      } else {
        navigate('/admin/tournaments', {
          state: { message: 'Tournament created successfully!' }
        });
      }
      
      return result;
      
    } catch (error) {
      console.error('Tournament creation failed:', error);
      setErrors({ submit: error.message });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [tournamentData, currentStep, validateCurrentStep, navigate]);
  
  // Reset form
  const resetForm = useCallback(() => {
    setTournamentData(defaultTournamentData);
    setCurrentStep(0);
    setErrors({});
    localStorage.removeItem('tournament_draft');
  }, []);
  
  // Clear draft
  const clearDraft = useCallback(() => {
    localStorage.removeItem('tournament_draft');
    console.log('Tournament draft cleared');
  }, []);
  
  // Save as draft
  const saveAsDraft = useCallback(async () => {
    try {
      const draftData = {
        ...tournamentData,
        status: 'draft',
        saved_at: new Date().toISOString()
      };
      
      const result = await createTournament(draftData);
      console.log('Tournament saved as draft:', result);
      
      localStorage.removeItem('tournament_draft');
      return result;
    } catch (error) {
      console.error('Failed to save draft:', error);
      throw error;
    }
  }, [tournamentData]);
  
  return {
    // State
    currentStep,
    tournamentData,
    isLoading,
    errors,
    isValid,
    autoSaveEnabled,
    
    // Actions
    updateTournamentData,
    nextStep,
    prevStep,
    goToStep,
    submitTournament,
    resetForm,
    clearDraft,
    saveAsDraft,
    validateCurrentStep,
    setAutoSaveEnabled,
    
    // Constants
    steps: TOURNAMENT_STEPS,
    totalSteps: TOURNAMENT_STEPS.length,
    
    // Computed
    canGoNext: isValid && currentStep < TOURNAMENT_STEPS.length - 1,
    canGoPrev: currentStep > 0,
    isLastStep: currentStep === TOURNAMENT_STEPS.length - 1,
    completionPercentage: Math.round(((currentStep + 1) / TOURNAMENT_STEPS.length) * 100)
  };
};
