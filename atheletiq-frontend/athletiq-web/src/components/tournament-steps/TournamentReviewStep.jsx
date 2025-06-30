// src/components/tournament-steps/TournamentReviewStep.jsx

import React from "react";

/**
 * Final review + submit step for the tournament creation wizard.
 * @param {Object} props
 * @param {Object} props.form - Full tournament form data from parent
 * @param {Function} props.onConfirm - Function to call when "Submit" is clicked
 * @param {Boolean} props.isLoading - Flag to show loading state
 */
const TournamentReviewStep = ({ form, onConfirm, isLoading }) => {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Review Tournament Details</h2>

      {/* Show all form data */}
      <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto max-h-[400px]">
        {JSON.stringify(form, null, 2)}
      </pre>

      <button
        onClick={onConfirm}
        disabled={isLoading}
        className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition"
      >
        {isLoading ? "Submitting..." : "Submit Tournament"}
      </button>
    </div>
  );
};

export default TournamentReviewStep;
