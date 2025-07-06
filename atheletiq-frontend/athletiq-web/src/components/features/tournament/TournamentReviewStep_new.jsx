// src/components/features/tournament/TournamentReviewStep.jsx

// 🧠 ATHLETIQ - Tournament Review Step Component (Modern UX Version)
// Final review and submission step with comprehensive tournament summary and validation

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, AlertCircle, Calendar, MapPin, Users, Trophy,
  Clock, Tag, Settings, Star, Crown, Medal, Target, Zap,
  ArrowLeft, Send, Loader, Check, X, Edit, Eye, Info,
  FileText, Globe, Award, Shield, Hash, User
} from 'lucide-react';
import { createTournament } from '@api/tournamentApi';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3 }
  }
};

// Validation Component
function ValidationItem({ isValid, message, icon: Icon }) {
  return (
    <motion.div
      className={`flex items-center gap-3 p-3 rounded-lg border ${
        isValid 
          ? 'border-green-200 bg-green-50 text-green-700' 
          : 'border-red-200 bg-red-50 text-red-700'
      }`}
      variants={itemVariants}
    >
      <div className={`p-1 rounded-full ${
        isValid ? 'bg-green-100' : 'bg-red-100'
      }`}>
        {isValid ? (
          <CheckCircle2 size={16} className="text-green-600" />
        ) : (
          <AlertCircle size={16} className="text-red-600" />
        )}
      </div>
      <div className="flex-1">
        <p className="font-medium">{message}</p>
      </div>
      {Icon && (
        <Icon size={16} className="opacity-70" />
      )}
    </motion.div>
  );
}

// Info Card Component
function InfoCard({ title, icon: Icon, children, highlight = false }) {
  return (
    <motion.div
      className={`p-6 rounded-xl border-2 ${
        highlight 
          ? 'border-blue-200 bg-blue-50' 
          : 'border-gray-200 bg-white'
      } hover:shadow-lg transition-shadow duration-200`}
      variants={cardVariants}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${
          highlight ? 'bg-blue-100' : 'bg-gray-100'
        }`}>
          <Icon size={20} className={
            highlight ? 'text-blue-600' : 'text-gray-600'
          } />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

// Sport Summary Card
function SportSummaryCard({ sport, index }) {
  return (
    <motion.div
      className="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow"
      variants={itemVariants}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="text-2xl">{sport.icon}</div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{sport.name}</h4>
          <p className="text-sm text-gray-600 capitalize">{sport.type} Sport</p>
        </div>
        <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
          #{index + 1}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-600">Format:</p>
          <p className="font-medium">{sport.format || 'Not specified'}</p>
        </div>
        <div>
          <p className="text-gray-600">Tournament Type:</p>
          <p className="font-medium">{sport.tournament_type || 'Not specified'}</p>
        </div>
        {sport.type === 'team' && (
          <>
            <div>
              <p className="text-gray-600">Teams:</p>
              <p className="font-medium">{sport.num_participating_teams || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-gray-600">Team Size:</p>
              <p className="font-medium">{sport.team_members_total || 'Not specified'}</p>
            </div>
          </>
        )}
        {sport.gender && (
          <div>
            <p className="text-gray-600">Gender:</p>
            <p className="font-medium capitalize">{sport.gender}</p>
          </div>
        )}
        {sport.age_group && (
          <div>
            <p className="text-gray-600">Age Group:</p>
            <p className="font-medium">{sport.age_group}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Main Component
export default function TournamentReviewStep({ form, onBack, onComplete, prevStep }) {
  const [submission, setSubmission] = useState({
    status: 'idle', // 'idle' | 'submitting' | 'success' | 'error'
    message: '',
    progress: 0,
  });

  // Validation logic
  const validationResults = useMemo(() => {
    const results = [];
    
    // Basic info validation
    results.push({
      isValid: !!form.name,
      message: 'Tournament name is provided',
      icon: FileText
    });
    
    results.push({
      isValid: !!form.description,
      message: 'Tournament description is provided',
      icon: Info
    });
    
    results.push({
      isValid: !!form.start_date,
      message: 'Start date is set',
      icon: Calendar
    });
    
    results.push({
      isValid: !!form.end_date,
      message: 'End date is set',
      icon: Calendar
    });
    
    // Sports validation
    results.push({
      isValid: form.sports_config && form.sports_config.length > 0,
      message: `Sports selected (${form.sports_config?.length || 0})`,
      icon: Trophy
    });
    
    // Sports configuration validation
    if (form.sports_config && form.sports_config.length > 0) {
      const configuredSports = form.sports_config.filter(sport => 
        sport.format && sport.tournament_type
      );
      results.push({
        isValid: configuredSports.length === form.sports_config.length,
        message: `All sports are configured (${configuredSports.length}/${form.sports_config.length})`,
        icon: Settings
      });
    }
    
    return results;
  }, [form]);

  const isFormValid = validationResults.every(result => result.isValid);

  // Handle submission
  const handleSubmit = async () => {
    if (!isFormValid) return;
    
    setSubmission({ status: 'submitting', message: 'Creating tournament...', progress: 0 });
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setSubmission(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);
      
      const newTournament = await createTournament(form);
      
      clearInterval(progressInterval);
      setSubmission({
        status: 'success',
        message: `Tournament "${newTournament.name}" created successfully!`,
        progress: 100
      });
      
      setTimeout(() => {
        onComplete && onComplete(newTournament);
      }, 2000);
    } catch (error) {
      setSubmission({
        status: 'error',
        message: error.message || 'Failed to create tournament. Please try again.',
        progress: 0
      });
    }
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
          <Trophy className="text-yellow-500" />
          Review & Create Tournament
        </h2>
        <p className="text-gray-600 mt-2">
          Review all details before creating your tournament
        </p>
      </div>

      {/* Validation Status */}
      <motion.div
        className="space-y-3"
        variants={containerVariants}
      >
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Shield className="text-blue-500" />
          Validation Status
        </h3>
        <div className="grid gap-2">
          {validationResults.map((result, index) => (
            <ValidationItem
              key={index}
              isValid={result.isValid}
              message={result.message}
              icon={result.icon}
            />
          ))}
        </div>
      </motion.div>

      {/* Tournament Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <InfoCard title="Tournament Information" icon={Info} highlight>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Tournament Name</p>
              <p className="font-semibold text-lg text-gray-900">{form.name || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Description</p>
              <p className="text-gray-800">{form.description || 'No description provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tournament Code</p>
              <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {form.code || 'AUTO-GENERATED'}
              </p>
            </div>
            {form.level && (
              <div>
                <p className="text-sm text-gray-600">Level</p>
                <p className="font-medium capitalize">{form.level}</p>
              </div>
            )}
            {form.hosted_by && (
              <div>
                <p className="text-sm text-gray-600">Hosted By</p>
                <p className="font-medium">{form.hosted_by}</p>
              </div>
            )}
          </div>
        </InfoCard>

        {/* Date & Location */}
        <InfoCard title="Schedule & Location" icon={Calendar}>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Start Date</p>
              <p className="font-semibold flex items-center gap-2">
                <Calendar size={16} />
                {form.start_date || 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">End Date</p>
              <p className="font-semibold flex items-center gap-2">
                <Calendar size={16} />
                {form.end_date || 'Not specified'}
              </p>
            </div>
            {form.location && (
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium flex items-center gap-2">
                  <MapPin size={16} />
                  {form.location}
                </p>
              </div>
            )}
          </div>
        </InfoCard>
      </div>

      {/* Sports Configuration */}
      <InfoCard title="Sports Configuration" icon={Trophy}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              {form.sports_config?.length || 0} sport(s) selected
            </p>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-gray-500" />
              <span className="text-sm text-gray-600">
                {form.sports_config?.filter(s => s.type === 'team').length || 0} team sports
              </span>
              <User size={16} className="text-gray-500" />
              <span className="text-sm text-gray-600">
                {form.sports_config?.filter(s => s.type === 'individual').length || 0} individual sports
              </span>
            </div>
          </div>
          
          {form.sports_config && form.sports_config.length > 0 ? (
            <div className="grid gap-3">
              {form.sports_config.map((sport, index) => (
                <SportSummaryCard
                  key={sport.instanceId || index}
                  sport={sport}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="mx-auto mb-2 opacity-50" size={48} />
              <p>No sports configured yet</p>
            </div>
          )}
        </div>
      </InfoCard>

      {/* Submission Status */}
      <AnimatePresence>
        {submission.status !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-lg border-2 ${
              submission.status === 'success' ? 'border-green-200 bg-green-50' :
              submission.status === 'error' ? 'border-red-200 bg-red-50' :
              'border-blue-200 bg-blue-50'
            }`}
          >
            <div className="flex items-center gap-3">
              {submission.status === 'submitting' && (
                <Loader className="animate-spin text-blue-600" size={20} />
              )}
              {submission.status === 'success' && (
                <CheckCircle2 className="text-green-600" size={20} />
              )}
              {submission.status === 'error' && (
                <AlertCircle className="text-red-600" size={20} />
              )}
              <div className="flex-1">
                <p className={`font-medium ${
                  submission.status === 'success' ? 'text-green-800' :
                  submission.status === 'error' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                  {submission.message}
                </p>
                {submission.status === 'submitting' && (
                  <div className="mt-2 bg-white rounded-full overflow-hidden">
                    <div 
                      className="h-2 bg-blue-500 transition-all duration-300"
                      style={{ width: `${submission.progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <button
          onClick={prevStep || onBack}
          disabled={submission.status === 'submitting'}
          className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg
                   hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed 
                   transition-colors duration-200"
        >
          <ArrowLeft size={16} />
          Previous
        </button>
        
        <div className="text-sm text-gray-500">
          Step 4 of 4
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={!isFormValid || submission.status === 'submitting' || submission.status === 'success'}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg
                   hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed 
                   transition-colors duration-200"
        >
          {submission.status === 'submitting' ? (
            <>
              <Loader className="animate-spin" size={16} />
              Creating...
            </>
          ) : submission.status === 'success' ? (
            <>
              <Check size={16} />
              Created!
            </>
          ) : (
            <>
              <Send size={16} />
              Create Tournament
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
