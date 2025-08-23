// src/pages/admin/tournaments/TournamentCreate.jsx

// 🧠 ATHLETIQ - Enterprise Tournament Creation Page
// Multi-step tournament creation wizard with robust validation and API integration

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Check, Trophy, Users, Settings, 
  FileText, Calendar, MapPin, Save, AlertCircle, Info, Star,
  Clock, Shield, Database, ArrowLeft
} from "lucide-react";

// Import enterprise components and hooks
import TournamentInfoStep from "../../../components/features/tournament/TournamentInfoStep";
import TournamentSportsStep from "../../../components/features/tournament/TournamentSportsStep";
import TournamentConfigStep from "../../../components/features/tournament/TournamentConfigStep";
import TournamentReviewStep from "../../../components/features/tournament/TournamentReviewStep";
import { useTournamentCreation } from "../../../hooks/useTournamentCreation";

// Step configuration with enterprise features
const STEPS = [
  { 
    id: 'info', 
    title: 'Tournament Info', 
    icon: FileText, 
    description: 'Basic tournament information',
    color: 'blue'
  },
  { 
    id: 'sports', 
    title: 'Sports & Format', 
    icon: Trophy, 
    description: 'Select sports and formats',
    color: 'yellow' 
  },
  { 
    id: 'config', 
    title: 'Configuration', 
    icon: Settings, 
    description: 'Configure tournament settings',
    color: 'purple'
  },
  { 
    id: 'review', 
    title: 'Review & Create', 
    icon: Check, 
    description: 'Review and submit tournament',
    color: 'green'
  }
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, staggerChildren: 0.1 }
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

// Enterprise Status Indicator Component
function StatusIndicator({ isLoading, autoSaveEnabled, errors }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {isLoading && (
        <div className="flex items-center gap-2 text-blue-600">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Processing...</span>
        </div>
      )}
      
      {autoSaveEnabled && !isLoading && (
        <div className="flex items-center gap-2 text-green-600">
          <Database className="w-4 h-4" />
          <span>Auto-save enabled</span>
        </div>
      )}
      
      {Object.keys(errors).length > 0 && (
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>{Object.keys(errors).length} validation error(s)</span>
        </div>
      )}
    </div>
  );
}

// Enterprise Step Progress Component
function EnterpriseStepProgress({ currentStep, steps, onStepClick, completionPercentage, errors }) {
  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">Progress</span>
          <span className="text-sm font-bold text-gray-800">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
      
      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isAccessible = index <= currentStep;
          const hasErrors = errors[step.id];
          
          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex items-center">
                <button
                  onClick={() => isAccessible && onStepClick(index)}
                  disabled={!isAccessible}
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold
                    transition-all duration-300 relative ${
                      isCompleted 
                        ? 'bg-green-500 text-white shadow-lg' 
                        : isActive 
                        ? 'bg-blue-500 text-white shadow-lg' 
                        : 'bg-gray-200 text-gray-500'
                    } ${
                      isAccessible ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                  
                  {hasErrors && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              </div>
              
              {/* Step Info */}
              <div className="ml-4 flex-1">
                <div className={`font-semibold ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                  {step.title}
                </div>
                <div className="text-sm text-gray-500">{step.description}</div>
              </div>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className={`flex-1 h-px mx-4 ${
                  index < currentStep ? 'bg-green-400' : 'bg-gray-300'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Main Tournament Creation Component
export default function TournamentCreate() {
  const {
    currentStep,
    tournamentData,
    isLoading,
    errors,
    isValid,
    autoSaveEnabled,
    updateTournamentData,
    nextStep,
    prevStep,
    goToStep,
    submitTournament,
    resetForm,
    clearDraft,
    saveAsDraft,
    steps,
    canGoNext,
    canGoPrev,
    isLastStep,
    completionPercentage
  } = useTournamentCreation();

  // Handle form submission
  const handleSubmit = async () => {
    try {
      await submitTournament();
    } catch (error) {
      console.error('Tournament submission failed:', error);
    }
  };

  // Handle save as draft
  const handleSaveAsDraft = async () => {
    try {
      await saveAsDraft();
      alert('Tournament saved as draft successfully!');
    } catch (error) {
      console.error('Save as draft failed:', error);
      alert('Failed to save draft. Please try again.');
    }
  };

  // Render step content
  const renderStepContent = () => {
    const stepProps = {
      data: tournamentData,
      onUpdate: updateTournamentData,
      errors,
      isLoading
    };

    switch (currentStep) {
      case 0:
        return <TournamentInfoStep {...stepProps} />;
      case 1:
        return <TournamentSportsStep {...stepProps} />;
      case 2:
        return <TournamentConfigStep {...stepProps} />;
      case 3:
        return <TournamentReviewStep {...stepProps} />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gray-50 py-8 px-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-8"
          variants={containerVariants}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create Tournament</h1>
                <p className="text-gray-600 mt-1">Set up your tournament with our step-by-step wizard</p>
              </div>
            </div>
            
            {/* Status Indicator */}
            <StatusIndicator 
              isLoading={isLoading}
              autoSaveEnabled={autoSaveEnabled}
              errors={errors}
            />
          </div>

          {/* Step Progress */}
          <EnterpriseStepProgress
            currentStep={currentStep}
            steps={STEPS}
            onStepClick={goToStep}
            completionPercentage={completionPercentage}
            errors={errors}
          />
        </motion.div>

        {/* Step Content */}
        <motion.div
          className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8"
          variants={containerVariants}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="p-8"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Navigation */}
        <motion.div 
          className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
          variants={containerVariants}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={prevStep}
              disabled={!canGoPrev}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                ${canGoPrev 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <button
              onClick={clearDraft}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Clear Draft
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSaveAsDraft}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save as Draft
            </button>

            {isLastStep ? (
              <button
                onClick={handleSubmit}
                disabled={!isValid || isLoading}
                className={`
                  flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all
                  ${isValid && !isLoading
                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Trophy className="w-4 h-4" />
                    Create Tournament
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={nextStep}
                disabled={!canGoNext}
                className={`
                  flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all
                  ${canGoNext 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Error Display */}
        {errors.submit && (
          <motion.div 
            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Error creating tournament:</span>
            </div>
            <p className="text-red-700 mt-1">{errors.submit}</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
