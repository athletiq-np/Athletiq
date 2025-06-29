// src/pages/admin/tournaments/TournamentSetup.jsx

// 🧠 ATHLETIQ - Tournament Setup Page
// This component serves as the dedicated page for a specific tournament
// after it has been created. It will display tournament details and
// provide functionality for managing the tournament further, such as:
// - Viewing general tournament information
// - Managing registered teams/players
// - Accessing bracket/fixture details
// - Setting up venues, schedules, etc.

// --- MODULE IMPORTS ---
import React, { useEffect, useState } from 'react'; // <--- FIX: Added useState and useEffect here
import { useParams } from 'react-router-dom';
import axios from 'axios';

// --- COMPONENT DEFINITION ---
/**
 * Renders the setup page for a specific tournament.
 * This page retrieves tournament details based on the URL parameter (tournament ID).
 */
export default function TournamentSetup() {
  // Use useParams hook to extract the 'id' (tournament ID) from the URL
  const { id: tournamentId } = useParams();

  // State to hold the fetched tournament data
  const [tournament, setTournament] = useState(null);
  // State to manage loading status while fetching data
  const [isLoading, setIsLoading] = useState(true);
  // State to hold any error messages during data fetching
  const [error, setError] = useState('');

  // useEffect hook to fetch tournament data when the component mounts or tournamentId changes
  useEffect(() => {
    async function fetchTournamentDetails() {
      setIsLoading(true); // Set loading to true before fetch
      setError('');        // Clear any previous errors

      try {
        const token = localStorage.getItem('token'); // Get auth token from local storage
        if (!token) {
          setError('Authentication token not found. Please log in.');
          setIsLoading(false);
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        // Make API call to fetch tournament details using the ID from the URL
        const response = await axios.get(`http://localhost:5000/api/tournaments/${tournamentId}`, config);
        setTournament(response.data); // Set the fetched tournament data

      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to fetch tournament details. Please try again.';
        setError(errorMessage);
        console.error("Error fetching tournament details:", err);
      } finally {
        setIsLoading(false); // Set loading to false after fetch completes (success or error)
      }
    }

    if (tournamentId) {
      fetchTournamentDetails();
    }
  }, [tournamentId]); // Dependency array: re-run effect if tournamentId changes

  // --- RENDER LOGIC ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-athletiq-blue text-xl">Loading tournament details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-gray-600 text-xl">Tournament not found.</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        {tournament.name} - Tournament Setup
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Basic Tournament Info Card */}
        <div className="bg-gray-50 p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Overview</h2>
          <p><strong className="font-medium">Organized By:</strong> {tournament.hosted_by}</p>
          <p><strong className="font-medium">Level:</strong> {tournament.level}</p>
          <p><strong className="font-medium">Starts:</strong> {tournament.start_date ? new Date(tournament.start_date).toLocaleDateString() : 'N/A'}</p>
          <p><strong className="font-medium">Ends:</strong> {tournament.end_date ? new Date(tournament.end_date).toLocaleDateString() : 'N/A'}</p>
          {tournament.description && <p className="mt-2"><strong className="font-medium">Description:</strong> {tournament.description}</p>}
          {tournament.logo_url && (
            <div className="mt-4">
              <strong className="font-medium">Logo:</strong>
              <img src={tournament.logo_url} alt="Tournament Logo" className="mt-2 h-20 w-auto rounded-md object-contain" />
            </div>
          )}
        </div>

        {/* Sports Configuration Card */}
        <div className="bg-gray-50 p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Configured Sports</h2>
          {tournament.sports_config && tournament.sports_config.length > 0 ? (
            <div className="space-y-4">
              {tournament.sports_config.map((sport, index) => (
                <div key={sport.instanceId || index} className="p-3 border rounded-md bg-white">
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
            <p className="text-gray-600">No sports configured for this tournament.</p>
          )}
        </div>
      </div>

      {/* Future sections for teams, fixtures, etc. */}
      <div className="mt-8 p-6 bg-white rounded-lg border shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Next Steps for Tournament Management</h2>
        <p className="text-gray-600">
          This section will be expanded to include:
        </p>
        <ul className="list-disc list-inside text-gray-600 ml-4 mt-2">
          <li>Managing registered teams/players</li>
          <li>Viewing and updating match schedules and results</li>
          <li>Generating and managing QR codes</li>
          <li>More detailed bracket management tools</li>
        </ul>
        <button
          onClick={() => alert('Future development: Go to Team Registration')}
          className="mt-6 bg-athletiq-blue hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-md transition-colors"
        >
          Manage Teams (Coming Soon)
        </button>
      </div>
    </div>
  );
}
