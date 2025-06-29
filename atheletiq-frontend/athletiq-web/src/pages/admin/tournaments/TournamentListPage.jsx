// src/pages/admin/tournaments/TournamentListPage.jsx

// 🧠 ATHLETIQ - Tournament List Page
// This component displays a list of all tournaments for the Super Admin.
// It also provides navigation to create new tournaments or manage existing ones.

// --- MODULE IMPORTS ---
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function TournamentListPage() { // Renamed from TournamentList to TournamentListPage
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token"); // Get token from localStorage

  useEffect(() => {
    // Only fetch if token exists, otherwise set error and potentially redirect
    if (token) {
      fetchTournaments();
    } else {
      setLoading(false);
      setErr("Authentication required. Please log in.");
      // If a global Axios interceptor handles 401s, this might be redundant.
      // If not, consider adding explicit logout/redirect here:
      // localStorage.removeItem('token');
      // localStorage.removeItem('user');
      // navigate('/login');
    }
  }, [token]); // Dependency array includes token

  async function fetchTournaments() {
    setLoading(true);
    setErr(""); // Clear previous errors
    try {
      const res = await axios.get("http://localhost:5000/api/tournaments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Assuming backend returns an array of tournament objects directly, or a { data: [...] } structure
      setTournaments(Array.isArray(res.data) ? res.data : res.data.tournaments || []); // Adjusted to handle { tournaments: [...] } or direct array
    } catch (error) {
      // --- DEBUGGING LOGS ---
      console.error("TournamentListPage: Error fetching tournaments:", error);
      if (error.response) {
        console.error("  Status:", error.response.status);
        console.error("  Data:", error.response.data);
        console.error("  Headers:", error.response.headers);
        if (error.response.status === 401 || error.response.status === 403) {
            setErr("Session expired or unauthorized. Please log in again.");
        }
      } else if (error.request) {
        console.error("  No response received (network error or backend not running):", error.request);
        setErr("Network error or backend not reachable. Please try again.");
      } else {
        console.error("  Error setting up request:", error.message);
        setErr("An unexpected error occurred. Please try again.");
      }
      // --- END DEBUGGING ---
      
      setErr(error?.response?.data?.message || "Failed to load tournaments");
    } finally {
      setLoading(false); // Ensure loading is set to false in finally
    }
  }

  // --- Navigation Handlers ---
  function handleAddTournament() {
    navigate("/admin/tournaments/create"); // Navigate to the creation wizard
  }

  function handleEdit(tournamentId) {
    navigate(`/admin/tournaments/${tournamentId}/setup`); // Navigate to specific tournament setup page
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow p-6 w-full"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-athletiq-navy">Tournaments</h2>
        <button
          onClick={handleAddTournament}
          className="px-4 py-2 bg-athletiq-green text-white rounded hover:bg-green-700"
        >
          + Add Tournament
        </button>
      </div>

      {err && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-2">{err}</div>}

      {loading ? (
        <div className="flex justify-center items-center h-48">
            <div className="text-athletiq-blue text-lg">Loading tournaments...</div>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="text-gray-600 text-center p-4">No tournaments found. Click "+ Add Tournament" to create one!</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-athletiq-blue text-white">
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Sport(s)</th>
                <th className="p-2 text-left">Level</th>
                <th className="p-2 text-left">Start Date</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.map((t) => (
                <motion.tr
                  key={t.id}
                  whileHover={{ scale: 1.01 }}
                  className="border-b last:border-none"
                >
                  <td className="p-2 font-semibold">{t.name}</td>
                  <td className="p-2">
                    {/* Assuming t.sports_config is an array of objects from the backend */}
                    {Array.isArray(t.sports_config)
                      ? t.sports_config.map((s) => s.name || s.id).join(", ")
                      : "-"}
                  </td>
                  <td className="p-2">{t.level || '-'}</td>
                  <td className="p-2">{t.start_date ? t.start_date.slice(0, 10) : '-'}</td>
                  <td className="p-2">{t.status || "draft"}</td>
                  <td className="p-2">
                    <button
                      onClick={() => handleEdit(t.id)}
                      className="bg-athletiq-blue text-white px-3 py-1 rounded hover:bg-athletiq-navy"
                    >
                      Manage
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
