// src/components/tournament-steps/TournamentReviewStep.jsx

//// 🧠 ATHLETIQ - Tournament Review Step Component//// This is the final step in the tournament creation wizard. It presents a summary//// of all the information entered by the organizer across the previous steps.//// It also contains the final "Confirm & Create Tournament" button.//// --- MODULE IMPORTS ---import React from 'react';
import { motion } from 'framer-motion';

// --- COMPONENT DEFINITION ---
/**
 * Renders the review and confirmation step of the tournament creation wizard.
 * @param {object} props - The props passed from the parent component.
 * @param {object} props.form - The complete form state containing all tournament data.
 * @param {function} props.onConfirm - The function to call when the user confirms creation.
 * @param {boolean} props.isLoading - Indicates if the form submission is in progress.
 */
export default function TournamentReviewStep({ form, onConfirm, isLoading }) {

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-700">4. Review & Confirm Tournament</h2>

      {/* General Tournament Information */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Tournament Details</h3>
        <p><strong className="font-semibold">Name:</strong> {form.name}</p>
        <p><strong className="font-semibold">Organized By:</strong> {form.hosted_by}</p>
        <p><strong className="font-semibold">Logo URL:</strong> {form.logo_url || 'N/A'}</p>
      </div>

      {/* Selected Sports Configuration */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Sports & Configuration</h3>
        {form.sports_config && form.sports_config.length > 0 ? (
          <div className="space-y-4">
            {form.sports_config.map((sport, index) => (
              <div key={sport.instanceId} className="p-3 border rounded-md bg-white">
                <p className="font-semibold text-athletiq-blue mb-1">{sport.icon} {sport.name}</p>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  <li>Gender: {sport.gender || 'Not specified'}</li>
                  <li>Age Group: {sport.age_group || 'Not specified'}</li>
                  {sport.type === 'team' && (
                    <li>Players per Team: {sport.players_per_team || 'Not specified'}</li>
                  )}
                  {sport.type === 'individual' && (
                    <li>Match Format: {sport.match_format || 'Not specified'}</li>
                  )}
                  <li>Tournament Type: {sport.tournament_type || 'Not specified'}</li>
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No sports have been added to this tournament.</p>
        )}
      </div>

      {/* Confirmation Button */}
      <div className="mt-8">
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={`w-full px-6 py-3 rounded-md text-white font-bold text-lg transition-colors ${
            isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-athletiq-green hover:bg-green-700'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Tournament...
            </span>
          ) : (
            'Confirm & Create Tournament'
          )}
        </button>
      </div>
    </div>
  );
}