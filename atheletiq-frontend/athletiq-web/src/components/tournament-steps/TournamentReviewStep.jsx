import React, { useState } from 'react';
import { createTournament } from '../../api/tournamentApi'; // Import the new API function
import { FaPaperPlane, FaSpinner, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

// This is the final step in the tournament creation wizard.
export default function TournamentReviewStep({ tournamentData, onBack, onComplete }) {
  // 1. A more robust state to handle the submission lifecycle
  const [submission, setSubmission] = useState({
    status: 'idle', // 'idle' | 'submitting' | 'success' | 'error'
    message: '',
  });

  const handleCreateTournament = async () => {
    // 2. Set status to 'submitting' and disable the button
    setSubmission({ status: 'submitting', message: 'Creating your tournament...' });

    try {
      const newTournament = await createTournament(tournamentData);
      // 3. On success, update status and show a success message
      setSubmission({
        status: 'success',
        message: `Tournament "${newTournament.name}" created successfully!`,
      });
      // Optionally call a function to move to the new tournament's page after a delay
      setTimeout(() => onComplete(newTournament), 2000);
    } catch (error) {
      // 4. On failure, update status and show the specific error from the API
      setSubmission({ status: 'error', message: error.message });
    }
  };

  // Helper to render the submit button's content based on state
  const renderButtonContent = () => {
    switch (submission.status) {
      case 'submitting':
        return <><FaSpinner className="animate-spin" /> Submitting...</>;
      case 'success':
        return <><FaCheckCircle /> Success!</>;
      case 'error':
        return <><FaPaperPlane /> Try Again</>;
      default:
        return <><FaPaperPlane /> Create Tournament</>;
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md animate-fade-in">
      <h2 className="text-2xl font-bold text-athletiq-navy mb-4">Review & Submit</h2>
      <p className="text-gray-600 mb-6">Please review all the details below before creating the tournament.</p>

      {/* 5. Improved, clean data display for review */}
      <div className="space-y-4 p-4 border rounded-md bg-gray-50">
        <div>
          <h3 className="font-bold text-gray-700">Tournament Name:</h3>
          <p className="text-athletiq-green">{tournamentData.name}</p>
        </div>
        <div>
          <h3 className="font-bold text-gray-700">Sport:</h3>
          <p>{tournamentData.sport.name} ({tournamentData.sport.type})</p>
        </div>
        <div>
          <h3 className="font-bold text-gray-700">Dates:</h3>
          <p>{tournamentData.startDate} to {tournamentData.endDate}</p>
        </div>
        {/* Add more fields to review as needed */}
      </div>

      {/* Submission Feedback Area */}
      {submission.status === 'error' && (
        <div className="mt-4 p-3 flex items-center gap-2 text-red-700 bg-red-100 rounded-md">
           <FaExclamationCircle /> {submission.message}
        </div>
      )}
       {submission.status === 'success' && (
        <div className="mt-4 p-3 flex items-center gap-2 text-green-700 bg-green-100 rounded-md">
           <FaCheckCircle /> {submission.message}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={onBack}
          disabled={submission.status === 'submitting'}
          className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleCreateTournament}
          disabled={submission.status === 'submitting' || submission.status === 'success'}
          className="px-6 py-2 bg-athletiq-green text-white font-semibold rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {renderButtonContent()}
        </button>
      </div>
    </div>
  );
}